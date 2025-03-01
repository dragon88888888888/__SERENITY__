import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import styles from '../styles/Settings.module.css';

export default function Settings() {
    const router = useRouter();
    const [settings, setSettings] = useState({
        language: 'es',
        notifications: false,
        emailNotifications: false
    });

    const toggleSetting = (setting) => {
        setSettings(prev => ({
            ...prev,
            [setting]: !prev[setting]
        }));
    };

    const changeLanguage = (lang) => {
        setSettings(prev => ({
            ...prev,
            language: lang
        }));
    };

    const saveSettings = () => {
        // Aquí iría la lógica para guardar en backend
        console.log("Guardando configuración:", settings);
        alert("Configuración guardada con éxito");
    };

    return (
        <div className={styles.container}>
            <Head>
                <title>Serenity - Configuración</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>

            <div className={styles.header}>
                <FontAwesomeIcon icon={faCog} className={styles.headerIcon} />
                <h1>Configuración</h1>
            </div>

            <div className={styles.settingsContainer}>
                <div className={styles.settingSection}>
                    <div className={styles.settingHeader}>Idioma</div>

                    <div className={styles.languageOptions}>
                        <div className={styles.languageOption}>
                            <span>Español</span>
                            <div
                                className={`${styles.toggle} ${settings.language === 'es' ? styles.active : ''}`}
                                onClick={() => changeLanguage('es')}
                            >
                                <div className={styles.toggleHandle}></div>
                            </div>
                        </div>

                        <div className={styles.languageOption}>
                            <span>Inglés</span>
                            <div
                                className={`${styles.toggle} ${settings.language === 'en' ? styles.active : ''}`}
                                onClick={() => changeLanguage('en')}
                            >
                                <div className={styles.toggleHandle}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.settingSection}>
                    <div className={styles.settingHeader}>Silenciar notificaciones</div>

                    <div className={styles.toggleOptions}>
                        <div className={styles.toggleOption}>
                            <span>Sí</span>
                            <div
                                className={`${styles.toggle} ${settings.notifications ? styles.active : ''}`}
                                onClick={() => toggleSetting('notifications')}
                            >
                                <div className={styles.toggleHandle}></div>
                            </div>
                        </div>

                        <div className={styles.toggleOption}>
                            <span>No</span>
                            <div
                                className={`${styles.toggle} ${!settings.notifications ? styles.active : ''}`}
                                onClick={() => toggleSetting('notifications')}
                            >
                                <div className={styles.toggleHandle}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.settingSection}>
                    <div className={styles.settingHeader}>Notificaciones por correo</div>

                    <div className={styles.toggleOptions}>
                        <div className={styles.toggleOption}>
                            <span>Desactivar</span>
                            <div
                                className={`${styles.toggle} ${!settings.emailNotifications ? styles.active : ''}`}
                                onClick={() => toggleSetting('emailNotifications')}
                            >
                                <div className={styles.toggleHandle}></div>
                            </div>
                        </div>

                        <div className={styles.toggleOption}>
                            <span>No Desactivar</span>
                            <div
                                className={`${styles.toggle} ${settings.emailNotifications ? styles.active : ''}`}
                                onClick={() => toggleSetting('emailNotifications')}
                            >
                                <div className={styles.toggleHandle}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    className={styles.saveButton}
                    onClick={saveSettings}
                >
                    Guardar cambios
                </button>
            </div>

            <button
                className={styles.backButton}
                onClick={() => router.push('/main')}
            >
                <FontAwesomeIcon icon={faArrowLeft} /> Volver al inicio
            </button>
        </div>
    );
}