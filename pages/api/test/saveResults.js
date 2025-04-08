// pages/api/test/saveResults.js
import { executeQuery } from '../../../lib/db';
import jwt from 'jsonwebtoken';

// Función para extraer el usuario del token JWT
async function getUserFromToken(authHeader) {
    try {
        // Extraer el token de la cabecera de autorización
        // El formato típico es "Bearer [token]"
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.split(' ')[1];

        // Verificar y decodificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Buscar el usuario en la base de datos para confirmar que existe
        const users = await executeQuery(
            'SELECT id, username, email FROM users WHERE id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return null;
        }

        return users[0];
    } catch (error) {
        console.error('Error al verificar el token:', error);
        return null;
    }
}

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { usuario, ansiedadScore, ansiedadInterpretacion, depresionScore, depresionInterpretacion, extraAnswers } = req.body;

        // Obtener el token de autenticación
        const authToken = req.headers.authorization;
        if (!authToken) {
            return res.status(401).json({ message: 'No estás autenticado.' });
        }

        // Obtén el usuario desde el token
        const user = await getUserFromToken(authToken);

        if (!user) {
            return res.status(401).json({ message: 'Usuario no encontrado o token inválido.' });
        }

        try {
            // Insertamos los resultados en la base de datos
            const result = await executeQuery(
                'INSERT INTO resultados_test (usuario_id, ansiedad_score, ansiedad_interpretacion, depresion_score, depresion_interpretacion, respuestas_extra) VALUES (?, ?, ?, ?, ?, ?)',
                [
                    user.id, // ID del usuario
                    ansiedadScore,
                    ansiedadInterpretacion,
                    depresionScore,
                    depresionInterpretacion,
                    JSON.stringify(extraAnswers) // Guardamos las respuestas extra en formato JSON
                ]
            );

            return res.status(200).json({
                message: 'Resultados guardados exitosamente',
                resultId: result.insertId
            });
        } catch (error) {
            console.error('Error al guardar resultados:', error);
            return res.status(500).json({ message: 'Error interno del servidor' });
        }
    } else {
        return res.status(405).json({ message: 'Método no permitido' });
    }
}