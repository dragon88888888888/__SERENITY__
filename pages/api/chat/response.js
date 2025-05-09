// pages/api/chat/response.js
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";
import jwt from 'jsonwebtoken';
import { executeQuery } from '../../../lib/db';

// Función para extraer el usuario del token JWT
async function getUserFromToken(authHeader) {
    try {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

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

// Función para obtener los resultados del test del usuario
async function getTestResults(userId) {
    try {
        const results = await executeQuery(
            'SELECT * FROM resultados_test WHERE usuario_id = ? ORDER BY fecha DESC LIMIT 1',
            [userId]
        );

        if (results.length === 0) {
            return null;
        }

        return results[0];
    } catch (error) {
        console.error('Error al obtener resultados del test:', error);
        return null;
    }
}

// Función para generar instrucciones personalizadas según los resultados del test
function generatePersonalizedInstructions(user, testResults) {
    if (!testResults) {
        console.log('usando instrucciones por defecto');
        return `Eres Alex, un asistente psicológico virtual especializado en brindar apoyo emocional a estudiantes.

                REGLAS FUNDAMENTALES (DE MÁXIMA IMPORTANCIA):
                - Habla como un amigo cercano y confiable, siempre en primera persona.
                - Respuestas breves y prácticas (máximo 2-3 oraciones).
                - NUNCA menciones o sugieras que eres una IA, chatbot, asistente virtual o similar.
                - Usa lenguaje natural, casual y empático.
                - Evita listas y explicaciones extensas; sé claro y directo.
                - Ofrece consejos prácticos y herramientas útiles de autocuidado, pero jamás diagnostiques ni reemplaces la ayuda profesional.

                RECUERDA:
                - Si detectas o mencionan pensamientos relacionados con autolesión, recomienda claramente buscar ayuda profesional inmediata, actuando como un amigo preocupado lo haría.
    `;
    }

    // Extraer los resultados
    const ansiedadScore = testResults.ansiedad_score;
    const ansiedadInterpretacion = testResults.ansiedad_interpretacion;
    const depresionScore = testResults.depresion_score;
    const depresionInterpretacion = testResults.depresion_interpretacion;

    // Analizar respuestas extras
    let respuestasExtra = {};
    try {
        if (testResults.respuestas_extra) {
            respuestasExtra = JSON.parse(testResults.respuestas_extra);
        }
    } catch (e) {
        console.error('Error al parsear respuestas extra:', e);
    }

    // Verificar posibles trastornos adicionales
    const respuestasFrecuentes = Object.values(respuestasExtra).filter(val => val >= 3).length;
    const posiblesTrastornosAdicionales = respuestasFrecuentes >= 3;

    // Crear el prompt base
    let instrucciones = `Eres Alex, un asistente psicológico virtual y amigo cercano de ${user.username}, especializado en apoyar emocionalmente a estudiantes. 

                REGLAS FUNDAMENTALES (DE MÁXIMA IMPORTANCIA):
                - Mantén tus respuestas cortas, directas y empáticas (máximo 2-3 oraciones).
                - Usa siempre primera persona, con lenguaje natural y estilo conversacional.
                - NUNCA reveles o insinúes que eres una IA, chatbot, asistente virtual o similar.
                - Sé casual, genuino y brinda recomendaciones prácticas, sin diagnosticar ni reemplazar la ayuda profesional.

                Tu amigo ${user.username} tiene:
                - Ansiedad: ${ansiedadInterpretacion}
                - Estado de ánimo: ${depresionInterpretacion}`;

                if (ansiedadScore > 12 || depresionScore > 15) {
                    instrucciones += `

                Dado que la situación emocional actual es desafiante, sé especialmente sensible y comprensivo. Valida sus emociones y sugiere suavemente considerar buscar ayuda profesional adicional cuando sea apropiado, actuando como un amigo preocupado.`;
                }

                instrucciones += `

                RECUERDA SIEMPRE:
                - Si menciona pensamientos relacionados con autolesión o situaciones de desesperación severa, recomienda claramente buscar ayuda profesional urgente, tal como lo haría un amigo preocupado.`;

    return instrucciones;
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { message, chatHistory = [] } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Obtener el token de autenticación
        const authToken = req.headers.authorization;
        if (!authToken) {
            return res.status(401).json({ message: 'No estás autenticado.' });
        }

        // Obtener el usuario a partir del token
        const user = await getUserFromToken(authToken);
        if (!user) {
            return res.status(401).json({ message: 'Usuario no encontrado o token inválido.' });
        }

        // Obtener los resultados del test para el usuario
        const testResults = await getTestResults(user.id);

        // Generar instrucciones personalizadas
        const personalizedInstructions = generatePersonalizedInstructions(user, testResults);

        // Configurar el modelo Gemini
        const model = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            modelName: "gemini-2.0-flash",
            maxOutputTokens: 500,
            temperature: 0.2,
        });

        // Función que invoca el modelo Gemini con el estado actual
        async function callModel(state) {
            // Verificamos si ya hay un mensaje de sistema, si no, lo agregamos
            if (!state.messages.some((msg) => msg._getType() === "system")) {
                state.messages.unshift(new SystemMessage(personalizedInstructions));
            }

            // Invocar al modelo con el historial de mensajes
            const response = await model.invoke(state.messages);

            // Retornar la respuesta
            return { messages: [response] };
        }

        // Convertir el historial de chat al formato que espera LangGraph
        const formattedHistory = chatHistory.map(msg => {
            if (msg.role === 'user') {
                return new HumanMessage(msg.content);
            } else if (msg.role === 'assistant') {
                return new AIMessage(msg.content);
            }
            return null;
        }).filter(Boolean);

        // Agregar el mensaje actual
        formattedHistory.push(new HumanMessage(message));

        // Definir el grafo de estado
        const workflow = new StateGraph(MessagesAnnotation)
            .addNode("agent", callModel)
            .addEdge("__start__", "agent");

        // Compilar el grafo
        const app = workflow.compile();

        // Invocar el grafo con el historial de mensajes
        const finalState = await app.invoke({
            messages: formattedHistory,
        });

        // Obtener la respuesta del asistente
        const assistantMessage = finalState.messages[finalState.messages.length - 1];

        return res.status(200).json({
            response: assistantMessage.content,
            updatedHistory: [
                ...chatHistory,
                { role: 'user', content: message },
                { role: 'assistant', content: assistantMessage.content }
            ]
        });

    } catch (error) {
        console.error('Error en la respuesta del chat:', error);
        return res.status(500).json({
            message: 'Error en el servidor',
            error: error.message
        });
    }
}