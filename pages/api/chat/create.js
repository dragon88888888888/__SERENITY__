// pages/api/chat/create.js
import { verifyToken } from '../../../utils/auth';
import { executeQuery } from '../../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        // Verificar token
        const userId = await verifyToken(req);
        if (!userId) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const { name } = req.body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'Nombre de chat inválido' });
        }

        // Crear un nuevo chat
        const result = await executeQuery(
            'INSERT INTO chats (user_id, name) VALUES (?, ?)',
            [userId, name.trim()]
        );

        // Obtener el chat recién creado
        const newChat = await executeQuery(
            'SELECT id, name, created_at FROM chats WHERE id = ?',
            [result.insertId]
        );

        return res.status(201).json({
            chatId: newChat[0].id,
            name: newChat[0].name,
            created_at: newChat[0].created_at
        });
    } catch (error) {
        console.error('Error al crear chat:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}