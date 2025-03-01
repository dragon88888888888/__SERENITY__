import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import styles from '../styles/Notifications.module.css';

export default function Notifications() {
    const router = useRouter();
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            text: 'Envíaste un mensaje al contacto ********',
            read: false
        },
        {
            id: 2,
            text: 'El contacto ******** te envió un correo electrónico',
            read: false
        },
        {
            id: 3,
            text: 'Nuevas actualizaciones',
            read: false
        },
        {
            id: 4,
            text: 'Datos curiosos sobre la depresión',
            read: false
        },
        {
            id: 5,
            text: 'Datos curiosos sobre la ansiedad',
            read: false
        },
        {
            id: 6,
            text: 'Análisis semanal disponible',
            read: true
        },
        {
            id: 7,
            text: 'Recordatorio de ejercicios',
            read: true
        }
    ]);

    const toggleNotificationState = (id) => {
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === id
                    ? { ...notification, read: !notification.read }
                    : notification
            )
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev =>
            prev.map(notification => ({ ...notification, read: true }))
        );
    };

    return (
        <div className={styles.container}>
            <Head>
                <title>Serenity - Notificaciones</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>

            <div className={styles.header}>
                <FontAwesomeIcon icon={faBell} className={styles.headerIcon} />
                <h1>Notificaciones</h1>
            </div>

            <div className={styles.controls}>
                <button
                    className={styles.markAllButton}
                    onClick={markAllAsRead}
                >
                    Marcar todas como leídas
                </button>
            </div>

            <div className={styles.notificationsList}>
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`${styles.notificationItem} ${notification.read ? styles.read : ''}`}
                        onClick={() => toggleNotificationState(notification.id)}
                    >
                        <div className={styles.notificationCircle}>
                            {!notification.read && <div className={styles.unreadDot}></div>}
                        </div>
                        <div className={styles.notificationText}>
                            {notification.text}
                        </div>
                    </div>
                ))}

                {notifications.length === 0 && (
                    <div className={styles.emptyState}>
                        No tienes notificaciones
                    </div>
                )}
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