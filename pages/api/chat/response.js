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
        return `Eres un asistente psicológico virtual especializado en el apoyo emocional para estudiantes. 
    Tu objetivo es brindar orientación y apoyo emocional a quienes enfrentan ansiedad, estrés, depresión, 
    y otros problemas relacionados con la vida académica y personal. Tu papel es proporcionar consejos prácticos, 
    herramientas de auto cuidado, y recomendaciones generales para ayudar a los estudiantes a manejar sus emociones 
    de forma saludable. Sin embargo, no realizarás diagnósticos, tratamientos, ni reemplazarás la ayuda de un 
    profesional de la salud mental.`;
    }

    // Extraer los resultados de ansiedad y depresión
    const ansiedadScore = testResults.ansiedad_score;
    const ansiedadInterpretacion = testResults.ansiedad_interpretacion;
    const depresionScore = testResults.depresion_score;
    const depresionInterpretacion = testResults.depresion_interpretacion;

    // Analizar las respuestas extras (si existen)
    let respuestasExtra = {};
    try {
        if (testResults.respuestas_extra) {
            respuestasExtra = JSON.parse(testResults.respuestas_extra);
        }
    } catch (e) {
        console.error('Error al parsear respuestas extra:', e);
    }

    // Contar respuestas frecuentes/siempre en las preguntas extras
    const respuestasFrecuentes = Object.values(respuestasExtra).filter(val => val >= 3).length;
    const posiblesTrastornosAdicionales = respuestasFrecuentes >= 3;

    // Crear instrucciones personalizadas
    let instrucciones = `Eres un asistente psicológico virtual especializado en el apoyo emocional para estudiantes.
  Estás hablando con ${user.username}, quien ha completado una evaluación previa que muestra:
  
  - Nivel de ansiedad: ${ansiedadScore}/24 (${ansiedadInterpretacion})
  - Nivel de depresión: ${depresionScore}/33 (${depresionInterpretacion})
  `;

    // Personalizar según nivel de ansiedad
    if (ansiedadScore <= 6) {
        instrucciones += `
    En cuanto a la ansiedad, ${user.username} muestra síntomas leves o mínimos. Puedes ofrecer técnicas sencillas 
    de manejo del estrés para situaciones cotidianas de la vida estudiantil.
    `;
    } else if (ansiedadScore <= 12) {
        instrucciones += `
    En cuanto a la ansiedad, ${user.username} muestra síntomas moderados. Ofrece estrategias prácticas para manejar 
    la ansiedad académica, técnicas de respiración y ejercicios de atención plena.
    `;
    } else if (ansiedadScore <= 18) {
        instrucciones += `
    En cuanto a la ansiedad, ${user.username} muestra síntomas graves. Proporciona un apoyo empático, enfatiza la 
    importancia de buscar ayuda profesional mientras ofreces técnicas de autoayuda para momentos de crisis.
    `;
    } else {
        instrucciones += `
    En cuanto a la ansiedad, ${user.username} muestra síntomas muy graves. Adopta un tono especialmente compasivo, 
    valida sus sentimientos, y enfatiza repetidamente la importancia de buscar ayuda profesional. Ofrece estrategias 
    para reducir la ansiedad inmediata y herramientas para manejar situaciones críticas.
    `;
    }

    // Personalizar según nivel de depresión
    if (depresionScore <= 8) {
        instrucciones += `
    En cuanto a la depresión, ${user.username} no muestra síntomas significativos. Puedes enfocarte en mantener 
    el bienestar emocional y desarrollar resiliencia.
    `;
    } else if (depresionScore <= 15) {
        instrucciones += `
    En cuanto a la depresión, ${user.username} muestra síntomas leves. Ofrece consejos sobre activación conductual, 
    establecimiento de rutinas saludables y técnicas para mejorar el estado de ánimo.
    `;
    } else if (depresionScore <= 23) {
        instrucciones += `
    En cuanto a la depresión, ${user.username} muestra síntomas moderados. Proporciona un apoyo empático, estrategias 
    de afrontamiento para días difíciles, y enfatiza la importancia de la conexión social y el autocuidado.
    `;
    } else {
        instrucciones += `
    En cuanto a la depresión, ${user.username} muestra síntomas graves. Adopta un tono especialmente compasivo, 
    valida sus sentimientos, y enfatiza repetidamente la importancia de buscar ayuda profesional. Ofrece estrategias 
    sencillas y alcanzables para el día a día, teniendo en cuenta que puede resultarle difícil implementar cambios complejos.
    `;
    }

    // Consideraciones adicionales según las respuestas extras
    if (posiblesTrastornosAdicionales) {
        instrucciones += `
    Las respuestas adicionales sugieren que ${user.username} podría estar experimentando síntomas que se solapan 
    con otros trastornos. Mantente abierto a la posibilidad de que sus experiencias puedan ser complejas y 
    multifacéticas. No intentes diagnosticar, pero reconoce la naturaleza única de sus experiencias.
    `;
    }

    // Instrucciones finales
    instrucciones += `
  Adapta tu comunicación según estos niveles, pero recuerda que no debes realizar diagnósticos, ofrecer tratamientos 
  específicos, ni reemplazar la ayuda de un profesional de la salud mental. Tu papel es proporcionar apoyo empático, 
  escucha activa, y herramientas generales de afrontamiento para la vida académica.
  
  Si ${user.username} menciona pensamientos de hacerse daño a sí mismo o a otros, crisis agudas, o situaciones que 
  requieren intervención inmediata, enfatiza amablemente la importancia de contactar servicios de emergencia o 
  líneas de crisis.
  `;

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