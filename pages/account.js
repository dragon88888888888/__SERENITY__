import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faEdit, faUsers, faLock, faShieldAlt, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import styles from '../styles/Account.module.css';

export default function Account() {
    const router = useRouter();

    const handleLogout = () => {
        // Lógica para cerrar sesión (eliminar tokens, etc.)
        console.log("Cerrando sesión...");
        // Redirigir al inicio de sesión
        router.push('/login');
    };

    return (
        <div className={styles.container}>
            <Head>
                <title>Serenity - Tu cuenta</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>

            <div className={styles.header}>
                <FontAwesomeIcon icon={faUser} className={styles.headerIcon} />
                <h1>Tu cuenta</h1>
            </div>

            <div className={styles.content}>
                <div className={styles.optionItem}>
                    <FontAwesomeIcon icon={faEdit} className={styles.optionIcon} />
                    <button className={styles.optionButton} onClick={() => router.push('/profile-edit')}>
                        Editar Perfil
                    </button>
                </div>

                <div className={styles.optionItem}>
                    <FontAwesomeIcon icon={faUsers} className={styles.optionIcon} />
                    <button className={styles.optionButton} onClick={() => router.push('/account-management')}>
                        Administración de cuenta y agregar cuentas
                    </button>
                </div>

                <div className={styles.securityRow}>
                    <div className={styles.optionItem}>
                        <FontAwesomeIcon icon={faLock} className={styles.optionIcon} />
                        <button className={styles.optionButton} onClick={() => router.push('/security')}>
                            Seguridad
                        </button>
                    </div>

                    <div className={styles.optionItem}>
                        <FontAwesomeIcon icon={faShieldAlt} className={styles.optionIcon} />
                        <button className={styles.optionButton} onClick={() => router.push('/privacy')}>
                            Políticas de privacidad
                        </button>
                    </div>
                </div>

                <div className={styles.optionItem}>
                    <FontAwesomeIcon icon={faSignOutAlt} className={styles.optionIcon} />
                    <button className={styles.optionButton} onClick={handleLogout}>
                        Cerrar Sesión
                    </button>
                </div>
            </div>

            <div className={styles.backButton}>
                <button onClick={() => router.push('/main')}>
                    Volver al inicio
                </button>
            </div>
        </div>
    );
}