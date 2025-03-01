/**
 * Clase para gestionar la reproducción de audio en la aplicación
 * Implementa un singleton para asegurar que solo exista una instancia
 */
class AudioManager {
    constructor() {
        if (AudioManager.instance) {
            return AudioManager.instance;
        }

        this.activeAudio = null;
        this.activeWavesurfer = null;
        this.activeMessageId = null;
        this.isPlaying = false;

        AudioManager.instance = this;
    }

    /**
     * Detiene cualquier reproducción de audio activa
     */
    stopAll() {
        if (this.activeAudio) {
            this.activeAudio.pause();

            if (this.activeAudio.currentTime) {
                this.activeAudio.currentTime = 0;
            }

            if (this.activeWavesurfer) {
                this.activeWavesurfer.stop();
            }

            this.activeAudio = null;
            this.activeWavesurfer = null;
            this.activeMessageId = null;
            this.isPlaying = false;
        }
    }

    /**
     * Reproduce un audio
     * @param {string} messageId - ID del mensaje
     * @param {string} audioUrl - URL del audio a reproducir
     * @param {object} wavesurfer - Instancia de WaveSurfer asociada
     * @param {function} onPlayStateChange - Función callback para estado de reproducción
     * @returns {Promise} - Promesa que se resuelve cuando termina la reproducción
     */
    play(messageId, audioUrl, wavesurfer, onPlayStateChange) {
        // Si ya está reproduciendo este audio, no hagas nada
        if (this.isPlaying && this.activeMessageId === messageId) {
            return;
        }

        // Detener cualquier audio que se esté reproduciendo
        this.stopAll();

        // Crear un nuevo elemento de audio
        const audio = new Audio();

        // Establecer listener para cuando termine
        audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.activeAudio = null;
            this.activeMessageId = null;

            if (wavesurfer) {
                wavesurfer.stop();
                this.activeWavesurfer = null;
            }

            if (onPlayStateChange) {
                onPlayStateChange(false, null);
            }
        });

        // Configurar el audio
        audio.src = audioUrl;
        this.activeAudio = audio;
        this.activeMessageId = messageId;
        this.activeWavesurfer = wavesurfer;

        // Reproducir audio y wavesurfer
        const playPromise = audio.play();

        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    this.isPlaying = true;

                    if (wavesurfer) {
                        wavesurfer.play();
                    }

                    if (onPlayStateChange) {
                        onPlayStateChange(true, messageId);
                    }
                })
                .catch(error => {
                    console.error('Error reproduciendo audio:', error);
                    this.stopAll();

                    if (onPlayStateChange) {
                        onPlayStateChange(false, null);
                    }
                });
        }
    }

    /**
     * Pausa la reproducción actual
     * @param {function} onPlayStateChange - Función callback para estado de reproducción
     */
    pause(onPlayStateChange) {
        if (this.activeAudio && this.isPlaying) {
            this.activeAudio.pause();

            if (this.activeWavesurfer) {
                this.activeWavesurfer.pause();
            }

            this.isPlaying = false;

            if (onPlayStateChange) {
                onPlayStateChange(false, null);
            }
        }
    }

    /**
     * Verifica si un mensaje específico se está reproduciendo
     * @param {string} messageId - ID del mensaje a verificar
     * @returns {boolean} - true si el mensaje se está reproduciendo
     */
    isMessagePlaying(messageId) {
        return this.isPlaying && this.activeMessageId === messageId;
    }

    /**
     * Limpia todos los recursos
     */
    dispose() {
        this.stopAll();
        AudioManager.instance = null;
    }
}

// Exportar una única instancia
export default new AudioManager();