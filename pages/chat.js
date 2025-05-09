import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMicrophone, faPlay, faPause, faVolumeMute, faTrash,
    faRobot, faUser, faPlus, faList, faEdit, faCheck
} from '@fortawesome/free-solid-svg-icons';
import WaveSurfer from 'wavesurfer.js';
import styles from '../styles/Chat.module.css';
import { useRouter } from 'next/router';

export default function Chat() {
    const [messages, setMessages] = useState([]);
    const [chatHistory, setChatHistory] = useState([]);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [playingAudio, setPlayingAudio] = useState(null);

    // Estados para el manejo de múltiples chats
    const [userChats, setUserChats] = useState([]);
    const [currentChatId, setCurrentChatId] = useState(null);
    const [newChatName, setNewChatName] = useState('');
    const [isCreatingChat, setIsCreatingChat] = useState(false);
    const [isEditingChat, setIsEditingChat] = useState(false);
    const [editChatId, setEditChatId] = useState(null);

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
            return;
        }

        // Cargar los chats del usuario al iniciar
        loadUserChats();
    }, [router]);

    // Cargar los chats del usuario desde la base de datos
    const loadUserChats = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No hay sesión activa');
            }

            const response = await fetch('/api/chat/list', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar los chats');
            }

            const { chats } = await response.json();
            setUserChats(chats);

            // Si hay chats, seleccionar el primero por defecto
            if (chats.length > 0) {
                loadChat(chats[0].id);
            }
        } catch (error) {
            console.error('Error al cargar los chats:', error);
            alert(`Error al cargar los chats: ${error.message}`);
        }
    };

    // Crear un nuevo chat
    const createNewChat = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No hay sesión activa');
            }

            // Nombre por defecto si no se proporciona uno
            const chatName = newChatName.trim() || `Chat del ${new Date().toLocaleDateString()}`;

            const response = await fetch('/api/chat/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: chatName })
            });

            if (!response.ok) {
                throw new Error('Error al crear el chat');
            }

            const { chatId } = await response.json();

            // Actualizar la lista de chats
            await loadUserChats();

            // Seleccionar el nuevo chat
            loadChat(chatId);

            // Limpiar el estado
            setNewChatName('');
            setIsCreatingChat(false);
        } catch (error) {
            console.error('Error al crear nuevo chat:', error);
            alert(`Error al crear nuevo chat: ${error.message}`);
        }
    };

    // Editar el nombre de un chat
    const updateChatName = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token || !editChatId) {
                throw new Error('No hay sesión activa o chat seleccionado');
            }

            const chatName = newChatName.trim();
            if (!chatName) {
                throw new Error('El nombre del chat no puede estar vacío');
            }

            const response = await fetch('/api/chat/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    chatId: editChatId,
                    name: chatName
                })
            });

            if (!response.ok) {
                throw new Error('Error al actualizar el chat');
            }

            // Actualizar la lista de chats
            await loadUserChats();

            // Limpiar el estado
            setNewChatName('');
            setIsEditingChat(false);
            setEditChatId(null);
        } catch (error) {
            console.error('Error al actualizar chat:', error);
            alert(`Error al actualizar chat: ${error.message}`);
        }
    };

    // Cargar un chat específico
    const loadChat = async (chatId) => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                throw new Error('No hay sesión activa');
            }

            // Detener cualquier audio que se esté reproduciendo
            stopAllAudio();

            // Limpiar los wavesurfers existentes
            Object.values(wavesurferRefs.current).forEach(wavesurfer => {
                try {
                    wavesurfer.destroy();
                } catch (e) {
                    console.error('Error al destruir wavesurfer:', e);
                }
            });
            wavesurferRefs.current = {};

            const response = await fetch(`/api/chat/${chatId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar el chat');
            }

            const { messages: chatMessages, history } = await response.json();

            // Establecer el chat actual y sus mensajes
            setCurrentChatId(chatId);
            setMessages(chatMessages);
            setChatHistory(history || []);
        } catch (error) {
            console.error('Error al cargar chat:', error);
            alert(`Error al cargar chat: ${error.message}`);
        }
    };

    // Cargar mensajes al iniciar
    useEffect(() => {
        // Scroll hacia abajo cuando se añaden mensajes
        messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Función para iniciar la grabación
    const startRecording = async () => {
        try {
            // Verificar si hay un chat activo
            if (!currentChatId) {
                throw new Error('No hay un chat activo. Por favor, crea o selecciona un chat.');
            }

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
            alert(`Error: ${error.message}`);
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

    // Procesar el audio grabado
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
                    'Authorization': `Bearer ${token}`
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

            // Guardar el mensaje del usuario en la base de datos
            const saveUserMessageResponse = await fetch('/api/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    chatId: currentChatId,
                    content: transcript,
                    audioData: base64Audio,
                    isBot: false
                }),
            });

            if (!saveUserMessageResponse.ok) {
                throw new Error('Error al guardar el mensaje del usuario');
            }

            const { messageId: dbUserMessageId } = await saveUserMessageResponse.json();

            // Actualizar los mensajes con la intervención del usuario
            setMessages(prevMessages => [
                ...prevMessages,
                {
                    id: dbUserMessageId, // Usar el ID de la base de datos
                    clientId: userMessageId, // ID temporal para el cliente
                    sender: 'Usuario',
                    isBot: false,
                    audioUrl: userAudioURL,
                    content: transcript,
                    duration: '...',  // Duración temporal, se actualizará cuando el audio esté cargado
                    timestamp: new Date().toISOString()
                }
            ]);

            // 2. Obtener respuesta del chatbot
            const chatResponse = await fetch('/api/chat/response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    chatId: currentChatId,
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
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    text: response,
                }),
            });

            if (!synthesizeResponse.ok) {
                throw new Error('Error en la síntesis de voz');
            }

            const { audioData } = await synthesizeResponse.json();

            // Guardar el mensaje del bot en la base de datos
            const saveBotMessageResponse = await fetch('/api/chat/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    chatId: currentChatId,
                    content: response,
                    audioData: audioData,
                    isBot: true
                }),
            });

            if (!saveBotMessageResponse.ok) {
                throw new Error('Error al guardar el mensaje del bot');
            }

            const { messageId: dbBotMessageId } = await saveBotMessageResponse.json();

            // Actualizar los mensajes con la respuesta del bot
            const botMessageId = Date.now() + 100; // Un offset mayor para garantizar unicidad
            setMessages(prevMessages => {
                const newMessages = [
                    ...prevMessages,
                    {
                        id: dbBotMessageId, // Usar el ID de la base de datos
                        clientId: botMessageId, // ID temporal para el cliente
                        sender: 'Serenity',
                        isBot: true,
                        audioUrl: audioData,
                        content: response,
                        duration: '...',  // Duración temporal, se actualizará cuando el audio esté cargado
                        timestamp: new Date().toISOString()
                    }
                ];

                // Solo intentar reproducir después de un tiempo para asegurar que todo esté cargado
                setTimeout(() => {
                    if (wavesurferRefs.current[dbBotMessageId]) {
                        playAudio(dbBotMessageId, audioData);
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

    // Función para limpiar la conversación actual (no elimina de la base de datos)
    const clearConversation = () => {
        // Confirmar la acción
        if (!confirm('¿Estás seguro de que deseas limpiar esta conversación? Esta acción no se puede deshacer.')) {
            return;
        }

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

        // Limpiar mensajes y historial de la UI
        setMessages([]);
        setChatHistory([]);

        // Solicitar borrado en la base de datos
        deleteCurrentChatMessages();
    };

    // Función para eliminar los mensajes del chat actual
    const deleteCurrentChatMessages = async () => {
        try {
            const token = localStorage.getItem('authToken');
            if (!token || !currentChatId) {
                throw new Error('No hay sesión activa o chat seleccionado');
            }

            const response = await fetch(`/api/chat/${currentChatId}/messages`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al eliminar los mensajes');
            }

            // No es necesario hacer nada más, ya limpiamos la UI
        } catch (error) {
            console.error('Error al eliminar mensajes:', error);
            alert(`Error al eliminar mensajes: ${error.message}`);
        }
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

    // Formatear fecha para mostrar en la lista de chats
    const formatChatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Renderizar el componente de chat
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
                <div className={styles.sidebarHeader}>
                    <h3>Mis conversaciones</h3>
                    <button
                        className={styles.newChatButton}
                        onClick={() => {
                            setIsCreatingChat(true);
                            setIsEditingChat(false);
                            setNewChatName('');
                        }}
                    >
                        <FontAwesomeIcon icon={faPlus} /> Nuevo chat
                    </button>
                </div>

                {isCreatingChat && (
                    <div className={styles.chatFormContainer}>
                        <input
                            type="text"
                            value={newChatName}
                            onChange={(e) => setNewChatName(e.target.value)}
                            placeholder="Nombre del chat"
                            className={styles.chatNameInput}
                        />
                        <div className={styles.chatFormButtons}>
                            <button
                                onClick={createNewChat}
                                className={styles.confirmButton}
                            >
                                <FontAwesomeIcon icon={faCheck} />
                            </button>
                            <button
                                onClick={() => setIsCreatingChat(false)}
                                className={styles.cancelButton}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {isEditingChat && (
                    <div className={styles.chatFormContainer}>
                        <input
                            type="text"
                            value={newChatName}
                            onChange={(e) => setNewChatName(e.target.value)}
                            placeholder="Nuevo nombre"
                            className={styles.chatNameInput}
                        />
                        <div className={styles.chatFormButtons}>
                            <button
                                onClick={updateChatName}
                                className={styles.confirmButton}
                            >
                                <FontAwesomeIcon icon={faCheck} />
                            </button>
                            <button
                                onClick={() => {
                                    setIsEditingChat(false);
                                    setEditChatId(null);
                                    setNewChatName('');
                                }}
                                className={styles.cancelButton}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                <div className={styles.chatHistory}>
                    {userChats.length === 0 ? (
                        <div className={styles.noChats}>
                            No tienes conversaciones. ¡Crea tu primer chat!
                        </div>
                    ) : (
                        userChats.map(chat => (
                            <div
                                key={chat.id}
                                className={`${styles.chatItem} ${currentChatId === chat.id ? styles.activeChat : ''}`}
                                onClick={() => loadChat(chat.id)}
                            >
                                <div className={styles.chatItemContent}>
                                    <FontAwesomeIcon icon={faList} className={styles.chatIcon} />
                                    <div>
                                        <div className={styles.chatName}>{chat.name}</div>
                                        <div className={styles.chatDate}>
                                            {formatChatDate(chat.created_at)}
                                        </div>
                                    </div>
                                </div>
                                <button
                                    className={styles.editChatButton}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditingChat(true);
                                        setIsCreatingChat(false);
                                        setEditChatId(chat.id);
                                        setNewChatName(chat.name);
                                    }}
                                >
                                    <FontAwesomeIcon icon={faEdit} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className={styles.chatContainer}>
                <div className={styles.chatHeader}>
                    <FontAwesomeIcon icon={faMicrophone} />
                    <h2>
                        {currentChatId ? (
                            userChats.find(chat => chat.id === currentChatId)?.name || 'Chat de voz'
                        ) : (
                            'Chat de voz'
                        )}
                    </h2>
                </div>

                <div className={styles.chatMessages}>
                    {!currentChatId ? (
                        <div className={styles.noChatSelected}>
                            <p>Selecciona un chat existente o crea uno nuevo para comenzar.</p>
                            <button
                                className={styles.createChatPrompt}
                                onClick={() => {
                                    setIsCreatingChat(true);
                                    setIsEditingChat(false);
                                    setNewChatName('');
                                    setSidebarOpen(true);
                                }}
                            >
                                <FontAwesomeIcon icon={faPlus} /> Crear nuevo chat
                            </button>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className={styles.emptyChat}>
                            <p>No hay mensajes en este chat.</p>
                            <p>Presiona el botón del micrófono para comenzar a hablar.</p>
                        </div>
                    ) : (
                        messages.map((message) => (
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

                                    {/* Mostrar el contenido/transcripción del mensaje */}
                                    {message.content && (
                                        <div className={styles.messageContent}>
                                            <p>{message.content}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messageEndRef} />
                </div>

                <div className={styles.chatFooter}>
                    <button
                        className={`${styles.footerButton} ${isRecording ? styles.recording : ''}`}
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isLoading || !currentChatId}
                        title={!currentChatId ? "Selecciona o crea un chat primero" : (isRecording ? "Detener grabación" : "Iniciar grabación")}
                    >
                        <FontAwesomeIcon icon={faMicrophone} />
                    </button>

                    <button
                        className={styles.footerButton}
                        onClick={pauseAudio}
                        disabled={!playingAudio}
                        title="Silenciar reproducción"
                    >
                        <FontAwesomeIcon icon={faVolumeMute} />
                    </button>

                    <button
                        className={styles.footerButton}
                        onClick={clearConversation}
                        disabled={!currentChatId || messages.length === 0}
                        title="Limpiar conversación"
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