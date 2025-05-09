// pages/api/chat/list.js
import { verifyToken } from '../../../utils/auth';
import { executeQuery } from '../../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        // Verificar token
        const userId = await verifyToken(req);
        if (!userId) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        // Consultar los chats del usuario
        const chats = await executeQuery(
            `SELECT id, name, created_at, updated_at 
       FROM chats 
       WHERE user_id = ? 
       ORDER BY updated_at DESC`,
            [userId]
        );

        return res.status(200).json({ chats });
    } catch (error) {
        console.error('Error al listar chats:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}