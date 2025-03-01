import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Main.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faUser, faClipboardCheck, faCog, faBell, faQuestionCircle, faUserCircle } from '@fortawesome/free-solid-svg-icons';
export default function Main() {
    const router = useRouter();

    return (
        <div className={styles.container}>
            <Head>
                <title>Serenity - Menú Principal</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>

            <div className={styles.imagePlaceholder}>
                <img
                    alt="Serenity Logo"
                    height="200"
                    src="/serenity.jpeg"
                    width="200"
                />
            </div>

            <div className={styles.title}>
                <h1>Serenity</h1>
                <h2>Menú Principal</h2>
            </div>

            <div className={styles.mainContent}>
                <div className={styles.voiceChat}>
                    <button onClick={() => router.push('/chat')}>
                        <FontAwesomeIcon icon={faMicrophone} /> chat por voz
                    </button>
                </div>

                <div className={styles.options}>
                    <button>
                        <FontAwesomeIcon icon={faUser} /> contactos
                    </button>
                    <button onClick={() => router.push('/semana')}>
                        <FontAwesomeIcon icon={faClipboardCheck} /> resumen de la semana
                    </button>
                </div>
            </div>

            <div className={styles.sidebar}>
                <div className={styles.icon}>
                    <button>
                        <FontAwesomeIcon icon={faCog} /> configuración
                    </button>
                </div>
                <div className={styles.icon}>
                    <button>
                        <FontAwesomeIcon icon={faBell} /> Notificaciones
                    </button>
                </div>
                <div className={styles.icon}>
                    <button>
                        <FontAwesomeIcon icon={faQuestionCircle} /> Soporte Técnico
                    </button>
                </div>
                <div className={styles.icon}>
                    <button>
                        <FontAwesomeIcon icon={faUserCircle} /> Cuenta
                    </button>
                </div>
            </div>
        </div>
    );
}