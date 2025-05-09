// pages/api/chat/[id]/messages.js
import { verifyToken } from '../../../../utils/auth';
import { executeQuery } from '../../../../lib/db';

export default async function handler(req, res) {
    if (req.method !== 'DELETE') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        // Verificar token
        const userId = await verifyToken(req);
        if (!userId) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ message: 'ID de chat no proporcionado' });
        }

        // Verificar que el chat pertenezca al usuario
        const checkResult = await executeQuery(
            'SELECT id FROM chats WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (checkResult.length === 0) {
            return res.status(404).json({ message: 'Chat no encontrado' });
        }

        // Eliminar todos los mensajes del chat
        await executeQuery(
            'DELETE FROM chat_messages WHERE chat_id = ?',
            [id]
        );

        // Actualizar la fecha de modificación del chat
        await executeQuery(
            'UPDATE chats SET updated_at = NOW() WHERE id = ?',
            [id]
        );

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error al eliminar mensajes:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}