// pages/api/user/profile.js
import authMiddleware, { runMiddleware } from '../../../middleware/auth';
import { executeQuery } from '../../../lib/db';

export default async function handler(req, res) {
    // Solo permitir método GET
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        // Aplicar middleware de autenticación
        await runMiddleware(req, res, authMiddleware);

        // Si llegamos aquí, el usuario está autenticado
        const userId = req.user.id;

        // Obtener información del usuario
        const userData = await executeQuery(
            'SELECT id, username, email, age, gender, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (userData.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Devolver perfil del usuario
        return res.status(200).json({
            user: userData[0]
        });
    } catch (error) {
        console.error('Error al obtener perfil:', error);

        // Si el error es de autenticación, ya habrá sido manejado por el middleware
        if (error.statusCode === 401) {
            return;
        }

        return res.status(500).json({ message: 'Error del servidor' });
    }
}