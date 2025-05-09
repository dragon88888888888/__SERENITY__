// pages/api/chat/[id].js
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

        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ message: 'ID de chat no proporcionado' });
        }

        // Verificar que el chat pertenezca al usuario
        const checkResult = await executeQuery(
            'SELECT id, name, created_at, updated_at FROM chats WHERE id = ? AND user_id = ?',
            [id, userId]
        );

        if (checkResult.length === 0) {
            return res.status(404).json({ message: 'Chat no encontrado' });
        }

        // Obtener los mensajes del chat
        const messages = await executeQuery(
            `SELECT 
        id, chat_id, content, audio_url, is_bot as isBot, 
        created_at as timestamp
      FROM chat_messages
      WHERE chat_id = ?
      ORDER BY created_at ASC`,
            [id]
        );

        // Obtener el historial de chat para el modelo (puede ser almacenado de manera separada o construido desde los mensajes)
        // Aquí construiremos un historial simple basado en los mensajes
        const history = messages.map(msg => ({
            role: msg.isBot ? 'assistant' : 'user',
            content: msg.content
        }));

        // Procesar los mensajes para el formato de la UI
        const formattedMessages = messages.map(msg => ({
            id: msg.id,
            sender: msg.isBot ? 'Serenity' : 'Usuario',
            isBot: msg.isBot,
            audioUrl: msg.audio_url,
            content: msg.content,
            duration: '...', // Se calculará en el frontend
            timestamp: msg.timestamp
        }));

        return res.status(200).json({
            chat: checkResult[0],
            messages: formattedMessages,
            history
        });
    } catch (error) {
        console.error('Error al obtener chat:', error);
        return res.status(500).json({ message: 'Error interno del servidor' });
    }
}