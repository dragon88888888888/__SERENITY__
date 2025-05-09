// utils/auth.js
import jwt from 'jsonwebtoken';
import { executeQuery } from '../lib/db';

// Verificar token JWT y devolver el ID del usuario
export async function verifyToken(req) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Verificar en la base de datos que la sesión sea válida
        const sessions = await executeQuery(
            'SELECT * FROM sessions WHERE user_id = ? AND token = ? AND expires_at > NOW()',
            [decoded.id, token]
        );

        if (sessions.length === 0) {
            return null;
        }

        // Verificar que el usuario exista
        const users = await executeQuery(
            'SELECT id FROM users WHERE id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return null;
        }

        // Devolver el ID del usuario
        return decoded.id;
    } catch (error) {
        console.error('Error al verificar el token:', error);
        return null;
    }
}