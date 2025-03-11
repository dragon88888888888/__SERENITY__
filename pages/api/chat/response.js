import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { message, chatHistory = [] } = req.body;

        if (!message) {
            return res.status(400).json({ message: 'Message is required' });
        }

        // Configurar el modelo Gemini
        const model = new ChatGoogleGenerativeAI({
            apiKey: process.env.GOOGLE_API_KEY,
            modelName: "gemini-2.0-flash",
            maxOutputTokens: 1024,
            temperature: 0.2,
        });

        // Función que invoca el modelo Gemini con el estado actual
        async function callModel(state) {
            // Verificamos si ya hay un mensaje de sistema, si no, lo agregamos
            if (!state.messages.some((msg) => msg._getType() === "system")) {
                state.messages.unshift(
                    new SystemMessage(
                        "Eres un asistente psicologico virtual especializado en el apoyo emocional para estudiantes.tu objetivo es brindar orientacion y apoyo emocional a quienes enfrentan ansiedad,"+
                        "estres, depresion, y otros problemas relacionados con la vida academica y personal.Tu papel es proporcionar consejos practicos, herramientas de auto cuidado,"+
                        "y recomendaciones generales para ayudar a los estudiantes a manejar sus emociones de forma saludable.sin embargo, no realizaras diagnosticos, tratamientos,"+
                        "ni reemplazaras la ayuda de un profecional de la salud mental."
                    )
                );
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