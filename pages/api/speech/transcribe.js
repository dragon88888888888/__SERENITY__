import { GoogleGenerativeAI } from "@google/generative-ai";

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '10mb', // Permitir archivos de hasta 10MB
        },
    },
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { audioData, mimeType } = req.body;

        if (!audioData || !mimeType) {
            return res.status(400).json({ message: 'Missing audio data or mime type' });
        }

        // Inicializar la API de Gemini
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Extraer el contenido base64 (eliminar el prefijo "data:audio/webm;base64,")
        const base64Content = audioData.split(',')[1];

        const prompt = "Por favor transcribe el siguiente audio. Si está en español, mantén la transcripción en español.";
        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: base64Content
                            }
                        }
                    ]
                }
            ]
        });

        const transcript = result.response.text();
        return res.status(200).json({ transcript });
    } catch (error) {
        console.error('Error en la transcripción:', error);
        return res.status(500).json({
            message: 'Error en el servidor',
            error: error.message
        });
    }
}