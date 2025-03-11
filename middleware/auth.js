// middleware/auth.js
import jwt from 'jsonwebtoken';
import { executeQuery } from '../lib/db';

// Helper para ejecutar middleware en API routes de Next.js
export const runMiddleware = (req, res, fn) => {
    return new Promise((resolve, reject) => {
        fn(req, res, (result) => {
            if (result instanceof Error) {
                return reject(result);
            }
            return resolve(result);
        });
    });
};

// Middleware para verificar autenticación
export default async function authMiddleware(req, res, next) {
    try {
        // Verificar si existe el encabezado de autorización
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        // Extraer el token
        const token = authHeader.split(' ')[1];

        try {
            // Verificar el token JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Verificar si el token existe en la base de datos y no ha expirado
            const sessions = await executeQuery(
                'SELECT * FROM sessions WHERE user_id = ? AND token = ? AND expires_at > NOW()',
                [decoded.id, token]
            );

            if (sessions.length === 0) {
                return res.status(401).json({ message: 'Sesión inválida o expirada' });
            }

            // Añadir la información del usuario al objeto de solicitud
            req.user = decoded;

            // Continuar con la siguiente función
            return next();
        } catch (error) {
            return res.status(401).json({ message: 'Token inválido' });
        }
    } catch (error) {
        console.error('Error en autenticación:', error);
        return res.status(500).json({ message: 'Error del servidor' });
    }
}