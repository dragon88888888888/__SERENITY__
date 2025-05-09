// pages/api/chat/message.js
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

        const { chatId, content, audioData, isBot } = req.body;

        if (!chatId || !content || !audioData) {
            return res.status(400).json({ message: 'Datos incompletos' });
        }

        // Verificar que el chat pertenezca al usuario
        const checkResult = await executeQuery(
            'SELECT id FROM chats WHERE id = ? AND user_id = ?',
            [chatId, userId]
        );

        if (checkResult.length === 0) {
            return res.status(404).json({ message: 'Chat no encontrado' });
        }

        // Guardar el mensaje
        const result = await executeQuery(
            'INSERT INTO chat_messages (chat_id, content, audio_url, is_bot) VALUES (?, ?, ?, ?)',
            [chatId, content, audioData, isBot || false]
        );

        // Actualizar la fecha de última modificación del chat
        await executeQuery(
            'UPDATE chats SET updated_at = NOW() WHERE id = ?',
            [chatId]
        );

        return res.status(201).json({ messageId: result.insertId });
    } catch (error) {
        console.error('Error al guardar mensaje:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}