import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQuestionCircle, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import styles from '../styles/Support.module.css';

export default function Support() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        issue: '',
        details: '',
        contact: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Simulamos envío - aquí irá la lógica real de envío
            console.log("Enviando solicitud de soporte:", formData);

            // Simular tiempo de procesamiento
            await new Promise(resolve => setTimeout(resolve, 1500));

            setSubmitted(true);
            setFormData({ issue: '', details: '', contact: '' });
        } catch (error) {
            console.error("Error al enviar solicitud de soporte:", error);
            alert("Hubo un error al enviar tu solicitud. Por favor, intenta de nuevo.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.container}>
            <Head>
                <title>Serenity - Soporte técnico</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>

            <div className={styles.header}>
                <FontAwesomeIcon icon={faQuestionCircle} className={styles.headerIcon} />
                <h1>Soporte técnico</h1>
            </div>

            {submitted ? (
                <div className={styles.successMessage}>
                    <h2>¡Solicitud enviada con éxito!</h2>
                    <p>Nos pondremos en contacto contigo lo antes posible.</p>
                    <button
                        className={styles.backButton}
                        onClick={() => setSubmitted(false)}
                    >
                        Enviar otra solicitud
                    </button>
                </div>
            ) : (
                <form className={styles.supportForm} onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="issue" className={styles.label}>¿Problema con qué?</label>
                        <input
                            type="text"
                            id="issue"
                            name="issue"
                            value={formData.issue}
                            onChange={handleChange}
                            className={styles.input}
                            required
                            placeholder="Ej. Problemas con el chat, audio, etc."
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="details" className={styles.label}>¿En qué podemos ayudarte?</label>
                        <textarea
                            id="details"
                            name="details"
                            value={formData.details}
                            onChange={handleChange}
                            className={styles.textarea}
                            required
                            placeholder="Describe tu problema lo más detalladamente posible"
                            rows={5}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="contact" className={styles.label}>Información de contacto</label>
                        <input
                            type="text"
                            id="contact"
                            name="contact"
                            value={formData.contact}
                            onChange={handleChange}
                            className={styles.input}
                            required
                            placeholder="Correo electrónico o número de teléfono"
                        />
                    </div>

                    <button
                        type="submit"
                        className={styles.submitButton}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Enviando...' : 'Enviar solicitud'}
                    </button>
                </form>
            )}

            <button
                className={styles.backLink}
                onClick={() => router.push('/main')}
            >
                <FontAwesomeIcon icon={faArrowLeft} /> Volver al inicio
            </button>
        </div>
    );
}