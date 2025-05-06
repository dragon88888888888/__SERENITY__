import { ElevenLabsClient } from "elevenlabs";
import { Readable } from 'stream';

// Función auxiliar para convertir un ReadableStream a Buffer
async function streamToBuffer(stream) {
    const chunks = [];
    
    // Si es un Readable de Node.js
    if (stream instanceof Readable) {
        return new Promise((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });
    }
    
    // Si es un ReadableStream web
    const reader = stream.getReader();
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }
    
    return Buffer.concat(chunks);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ message: 'Text is required' });
        }

        // Configurar el cliente de ElevenLabs
        const elevenlabs = new ElevenLabsClient({
            apiKey: process.env.ELEVENLABS_API_KEY,
        });

        // Realizar la síntesis de voz con ElevenLabs
        // Usamos el método textToSpeech.convert para obtener el audio
        const audioStream = await elevenlabs.textToSpeech.convert(
            process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL", // ID de voz en español
            {
                text: text,
                model_id: "eleven_multilingual_v2", // Modelo multilingüe para soporte en español
                output_format: "mp3_44100_128", // Formato de alta calidad similar a Azure
            }
        );
        
        // Convertir el stream a buffer
        const audioBuffer = await streamToBuffer(audioStream);

        // Convertir el buffer a base64
        const base64Audio = audioBuffer.toString('base64');
        const audioDataUrl = `data:audio/mp3;base64,${base64Audio}`;

        return res.status(200).json({ audioData: audioDataUrl });

    } catch (error) {
        console.error('Error en la síntesis de voz:', error);
        return res.status(500).json({
            message: 'Error en el servidor',
            error: error.message
        });
    }
}