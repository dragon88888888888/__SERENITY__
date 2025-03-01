import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ message: 'Text is required' });
        }

        // Configurar el servicio de voz de Azure
        const speechConfig = sdk.SpeechConfig.fromSubscription(
            process.env.AZURE_SPEECH_KEY,
            process.env.AZURE_SPEECH_REGION
        );

        // Configurar voz en español
        speechConfig.speechSynthesisVoiceName = "es-ES-ElviraNeural";

        // Usar síntesis de voz a un archivo de audio en memoria
        // En lugar de streams, usaremos el resultado como un ArrayBuffer
        const synthesizer = new sdk.SpeechSynthesizer(speechConfig);

        // Realizar la síntesis y obtener el resultado como AudioDataStream
        const result = await new Promise((resolve, reject) => {
            synthesizer.speakTextAsync(
                text,
                result => {
                    synthesizer.close();
                    resolve(result);
                },
                error => {
                    synthesizer.close();
                    reject(error);
                }
            );
        });

        // Verificar si la síntesis fue exitosa
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
            // Obtener los datos de audio como un ArrayBuffer
            const audioData = result.audioData;

            // Convertir el ArrayBuffer a Base64 para enviarlo al cliente
            const base64Audio = Buffer.from(audioData).toString('base64');
            const audioDataUrl = `data:audio/wav;base64,${base64Audio}`;

            return res.status(200).json({ audioData: audioDataUrl });
        } else {
            return res.status(400).json({
                message: 'Error en la síntesis de voz',
                details: result.errorDetails || 'Razón desconocida'
            });
        }

    } catch (error) {
        console.error('Error en la síntesis de voz:', error);
        return res.status(500).json({
            message: 'Error en el servidor',
            error: error.message
        });
    }
}