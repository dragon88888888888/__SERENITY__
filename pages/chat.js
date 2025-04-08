import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faPlay, faPause, faVolumeMute, faTrash, faRobot, faUser } from '@fortawesome/free-solid-svg-icons';
import WaveSurfer from 'wavesurfer.js';
import styles from '../styles/Chat.module.css';
import { useRouter } from 'next/router';
// Dentro del componente Chat, añade:


export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [chatHistory, setChatHistory] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [playingAudio, setPlayingAudio] = useState(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const wavesurferRefs = useRef({});
    const messageEndRef = useRef(null);
    const router = useRouter();

    // Verificar la autenticación al cargar el componente
    useEffect(() => {
        // Verificar si hay un token en localStorage
        const token = localStorage.getItem('authToken');
        const username = localStorage.getItem('username');

        if (!token || !username) {
            alert('No hay una sesión activa. Por favor, inicia sesión.');
            router.push('/login');
        }
    }, [router]);


    // Cargar mensajes al iniciar
    useEffect(() => {
        // Scroll hacia abajo cuando se añaden mensajes
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Función para iniciar la grabación
    const startRecording = async () => {
        try {
            // Detener cualquier audio que se esté reproduciendo
            stopAllAudio();

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(audioBlob);

                // Procesar el audio grabado
                await processRecordedAudio(audioBlob);

                // Liberar la pista de audio
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('No se pudo acceder al micrófono. Por favor, verifica los permisos.');
        }
    };

    // Función para detener la grabación
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    // Función para reproducir un audio (usando solo WaveSurfer)
    const playAudio = (messageId, audioUrl) => {
        // Primero detener cualquier reproducción activa
        Object.entries(wavesurferRefs.current).forEach(([id, wavesurfer]) => {
            if (wavesurfer.isPlaying()) {
                wavesurfer.pause();
            }
        });

        // Resetear estado
        setPlayingAudio(null);

        // Obtener el wavesurfer para este mensaje
        const wavesurfer = wavesurferRefs.current[messageId];
        if (!wavesurfer) {
            console.error(`No se encontró wavesurfer para mensaje ${messageId}`);
            return;
        }

        // Establecer nueva reproducción
        setPlayingAudio({ id: messageId, audioUrl });

        // Usar solo WaveSurfer para reproducción
        wavesurfer.play();

        // Configurar evento para cuando termine
        wavesurfer.once('finish', () => {
            setPlayingAudio(null);
        });
    };

    // Función para pausar un audio (usando solo WaveSurfer)
    const pauseAudio = () => {
        if (playingAudio && playingAudio.id) {
            const wavesurfer = wavesurferRefs.current[playingAudio.id];
            if (wavesurfer) {
                wavesurfer.pause();
            }
        }
        setPlayingAudio(null);
    };

    // Función para detener todos los audios
    const stopAllAudio = () => {
        // Detener todas las instancias de WaveSurfer
        Object.values(wavesurferRefs.current).forEach(wavesurfer => {
            if (wavesurfer && wavesurfer.isPlaying()) {
                wavesurfer.pause();
            }
        });

        // Resetear estado
        setPlayingAudio(null);
    };
    // Modifica la función processRecordedAudio para incluir el token en la solicitud
    const processRecordedAudio = async (audioBlob) => {
        setIsLoading(true);

        try {
            // Obtener el token de autenticación del localStorage
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
            }

            // Convertir el blob a base64
            const base64Audio = await blobToBase64(audioBlob);

            // 1. Transcribir el audio a texto
            const transcribeResponse = await fetch('/api/speech/transcribe', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Añadir token de autorización
                },
                body: JSON.stringify({
                    audioData: base64Audio,
                    mimeType: 'audio/webm',
                }),
            });

            if (!transcribeResponse.ok) {
                throw new Error('Error en la transcripción');
            }

            const { transcript } = await transcribeResponse.json();

            // Añadir el mensaje del usuario con el audio
            const userAudioURL = URL.createObjectURL(audioBlob);
            const userMessageId = Date.now();

            // Actualizar los mensajes con la intervención del usuario
            setMessages(prevMessages => [
                ...prevMessages,
                {
                    id: userMessageId,
                    sender: 'Usuario',
                    isBot: false,
                    audioUrl: userAudioURL,
                    duration: '...',  // Duración temporal, se actualizará cuando el audio esté cargado
                    timestamp: new Date().toISOString()
                }
            ]);

            // 2. Obtener respuesta del chatbot
            const chatResponse = await fetch('/api/chat/response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Añadir token de autorización
                },
                body: JSON.stringify({
                    message: transcript,
                    chatHistory: chatHistory,
                }),
            });

            if (!chatResponse.ok) {
                throw new Error(`Error en la respuesta del chat: ${chatResponse.status} ${chatResponse.statusText}`);
            }

            const { response, updatedHistory } = await chatResponse.json();
            setChatHistory(updatedHistory);

            // 3. Convertir la respuesta a voz
            const synthesizeResponse = await fetch('/api/speech/synthesize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // Añadir token de autorización
                },
                body: JSON.stringify({
                    text: response,
                }),
            });

            if (!synthesizeResponse.ok) {
                throw new Error('Error en la síntesis de voz');
            }

            const { audioData } = await synthesizeResponse.json();

            // Actualizar los mensajes con la respuesta del bot
            const botMessageId = Date.now() + 100; // Un offset mayor para garantizar unicidad
            setMessages(prevMessages => {
                const newMessages = [
                    ...prevMessages,
                    {
                        id: botMessageId,
                        sender: 'Serenity',
                        isBot: true,
                        audioUrl: audioData,
                        duration: '...',  // Duración temporal, se actualizará cuando el audio esté cargado
                        timestamp: new Date().toISOString()
                    }
                ];

                // Solo intentar reproducir después de un tiempo para asegurar que todo esté cargado
                setTimeout(() => {
                    if (wavesurferRefs.current[botMessageId]) {
                        playAudio(botMessageId, audioData);
                    }
                }, 2000);

                return newMessages;
            });

        } catch (error) {
            console.error('Error procesando el audio:', error);
            alert(`Ocurrió un error al procesar tu mensaje: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Función auxiliar para convertir Blob a base64
    const blobToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    // Función para formatear la duración en formato mm:ss
    const formatDuration = (seconds) => {
        if (!seconds || isNaN(seconds)) {
            return '0:00';
        }

        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        // Asegurar que los segundos tengan dos dígitos
        const formattedSeconds = remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds;

        return `${minutes}:${formattedSeconds}`;
    };

    // Función para limpiar la conversación
    const clearConversation = () => {
        // Detener cualquier audio que se esté reproduciendo
        stopAllAudio();

        // Limpiar wavesurfers
        Object.values(wavesurferRefs.current).forEach(wavesurfer => {
            try {
                wavesurfer.destroy();
            } catch (e) {
                console.error('Error al destruir wavesurfer:', e);
            }
        });
        wavesurferRefs.current = {};

        // Liberar URLs de objetos
        messages.forEach(message => {
            if (message.audioUrl && message.audioUrl.startsWith('blob:')) {
                URL.revokeObjectURL(message.audioUrl);
            }
        });

        // Limpiar mensajes y historial
        setMessages([]);
        setChatHistory([]);
    };

    // Inicializar WaveSurfer de manera más controlada
    useEffect(() => {
        // Conjunto para rastrear nuevos mensajes procesados
        const processedIds = new Set();

        messages.forEach(message => {
            if (!wavesurferRefs.current[message.id] && !processedIds.has(message.id)) {
                processedIds.add(message.id);

                const container = document.getElementById(`waveform-${message.id}`);
                if (container) {
                    // Verificar si hay un wavesurfer existente para este contenedor
                    let containerHasWavesurfer = false;
                    Object.entries(wavesurferRefs.current).forEach(([id, ws]) => {
                        if (ws.container === container) {
                            containerHasWavesurfer = true;
                            // No lo destruimos, solo lo marcamos para saltar
                        }
                    });

                    if (containerHasWavesurfer) {
                        console.log(`Contenedor ya tiene un wavesurfer asignado: ${message.id}`);
                        return;
                    }

                    try {
                        // Colores según el tipo de mensaje
                        const waveColor = message.isBot ? '#3B82F6' : '#10B981';
                        const progressColor = message.isBot ? '#1E40AF' : '#047857';

                        console.log(`Creando nuevo wavesurfer para mensaje ${message.id}`);
                        const wavesurfer = WaveSurfer.create({
                            container,
                            waveColor: waveColor,
                            progressColor: progressColor,
                            cursorColor: 'transparent',
                            barWidth: 2,
                            barGap: 3,
                            height: 40,
                            barRadius: 3,
                            normalize: true,
                            minPxPerSec: 50,
                            fillParent: true
                        });

                        // Cargar audio
                        wavesurfer.load(message.audioUrl);

                        // Guardar referencia
                        wavesurferRefs.current[message.id] = wavesurfer;

                        // Evitar que reproduzca automáticamente
                        // Cuando el audio esté listo, actualizar la duración
                        wavesurfer.once('ready', () => {
                            console.log(`Wavesurfer ready for ${message.id}`);
                            // Obtener la duración real del audio
                            const duration = wavesurfer.getDuration();
                            // Formatear la duración
                            const formattedDuration = formatDuration(duration);
                            // Actualizar el estado de mensajes con la duración real
                            setMessages(prevMessages =>
                                prevMessages.map(msg =>
                                    msg.id === message.id
                                        ? { ...msg, duration: formattedDuration }
                                        : msg
                                )
                            );
                        });
                    } catch (error) {
                        console.error(`Error al crear wavesurfer para ${message.id}:`, error);
                    }
                }
            }
        });



    }, [messages]);

    return (
        <div className={styles.appContainer}>
            <Head>
                <title>Serenity - Chat de voz</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>

            <div
                className={styles.hoverArea}
                onMouseEnter={() => setSidebarOpen(true)}
                onTouchStart={() => setSidebarOpen(true)}
            ></div>

            <div
                className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}
                onMouseLeave={() => setSidebarOpen(false)}
            >
                <div className={styles.chatHistory}>
                    <div className={styles.chatItem}>Chat #1 - 20/11/2024</div>
                    <div className={styles.chatItem}>Chat #2 - 19/11/2024</div>
                    <div className={styles.chatItem}>Chat #3 - 18/11/2024</div>
                </div>
            </div>

            <div className={styles.chatContainer}>
                <div className={styles.chatHeader}>
                    <FontAwesomeIcon icon={faMicrophone} />
                    <h2>Chat de voz</h2>
                </div>

                <div className={styles.chatMessages}>
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={`${styles.message} ${!message.isBot ? styles.user : ''}`}
                        >
                            <div className={styles.avatarContainer}>
                                <div className={styles.avatar}>
                                    <FontAwesomeIcon icon={message.isBot ? faRobot : faUser} />
                                </div>
                                <span className={styles.avatarName}>{message.sender}</span>
                            </div>

                            <div className={styles.audioMessage}>
                                <div className={styles.audioControls}>
                                    <button
                                        className={styles.playButton}
                                        onClick={() => {
                                            if (playingAudio && playingAudio.id === message.id) {
                                                pauseAudio();
                                            } else {
                                                playAudio(message.id, message.audioUrl);
                                            }
                                        }}
                                    >
                                        <FontAwesomeIcon
                                            icon={playingAudio && playingAudio.id === message.id ? faPause : faPlay}
                                        />
                                    </button>
                                </div>
                                <div
                                    id={`waveform-${message.id}`}
                                    className={styles.waveform}
                                ></div>
                                <span className={styles.time}>{message.duration}</span>
                            </div>
                        </div>
                    ))}
                    <div ref={messageEndRef} />
                </div>

                <div className={styles.chatFooter}>
                    <button
                        className={`${styles.footerButton} ${isRecording ? styles.recording : ''}`}
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isLoading}
                    >
                        <FontAwesomeIcon icon={faMicrophone} />
                    </button>

                    <button
                        className={styles.footerButton}
                        onClick={pauseAudio}
                        disabled={!playingAudio}
                    >
                        <FontAwesomeIcon icon={faVolumeMute} />
                    </button>

                    <button
                        className={styles.footerButton}
                        onClick={clearConversation}
                        disabled={messages.length === 0}
                    >
                        <FontAwesomeIcon icon={faTrash} />
                    </button>
                </div>

                {isLoading && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.spinner}></div>
                        <p>Procesando tu mensaje...</p>
                    </div>
                )}
            </div>
        </div>
    );
}