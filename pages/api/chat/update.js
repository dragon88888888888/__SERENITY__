// pages/api/chat/update.js
import { verifyToken } from '../../../utils/auth';
import { executeQuery } from '../../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'PUT') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        // Verificar token
        const userId = await verifyToken(req);
        if (!userId) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const { chatId, name } = req.body;

        if (!chatId || !name || typeof name !== 'string' || name.trim() === '') {
            return res.status(400).json({ message: 'Datos inválidos' });
        }

        // Verificar que el chat pertenezca al usuario
        const checkResult = await executeQuery(
            'SELECT id FROM chats WHERE id = ? AND user_id = ?',
            [chatId, userId]
        );

        if (checkResult.length === 0) {
            return res.status(404).json({ message: 'Chat no encontrado' });
        }

        // Actualizar el nombre del chat
        await executeQuery(
            'UPDATE chats SET name = ? WHERE id = ? AND user_id = ?',
            [name.trim(), chatId, userId]
        );

        // Obtener el chat actualizado
        const updatedChat = await executeQuery(
            'SELECT id, name, updated_at FROM chats WHERE id = ?',
            [chatId]
        );

        return res.status(200).json({
            chat: updatedChat[0]
        });
    } catch (error) {
        console.error('Error al actualizar chat:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}