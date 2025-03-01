import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faStar, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarOutline } from '@fortawesome/free-regular-svg-icons';
import styles from '../styles/Contacts.module.css';

export default function Contacts() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('popular');

    // Datos simulados de contactos
    const contacts = [
        {
            id: 1,
            name: 'Dr. ****** Terapeuta',
            description: 'Especialista en terapia cognitivo-conductual para ansiedad y depresión.',
            rating: 4,
            type: 'professional'
        },
        {
            id: 2,
            name: 'Dr. ****** Terapeuta',
            description: 'Psicólogo especializado en terapias de mindfulness y gestión del estrés.',
            rating: 4,
            type: 'professional'
        },
        {
            id: 3,
            name: 'Grupo de Apoyo',
            description: 'Comunidad de personas que comparten experiencias sobre ansiedad.',
            rating: 5,
            type: 'group'
        },
        {
            id: 4,
            name: 'Centro de Salud Mental',
            description: 'Institución con servicios completos de atención psicológica.',
            rating: 3,
            type: 'institution'
        }
    ];

    // Filtrar contactos según la pestaña activa
    const filteredContacts = activeTab === 'popular'
        ? contacts.filter(contact => contact.rating >= 4)
        : contacts;

    // Renderizar estrellas para la calificación
    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            if (i <= rating) {
                stars.push(<FontAwesomeIcon key={i} icon={faStar} className={styles.starFilled} />);
            } else {
                stars.push(<FontAwesomeIcon key={i} icon={faStarOutline} className={styles.starEmpty} />);
            }
        }
        return stars;
    };

    return (
        <div className={styles.container}>
            <Head>
                <title>Serenity - Contactos</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>

            <div className={styles.header}>
                <FontAwesomeIcon icon={faUser} className={styles.headerIcon} />
                <h1>Contactos</h1>
            </div>

            <div className={styles.categoryHeader}>
                Expertos en salud mental
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tabButton} ${activeTab === 'popular' ? styles.active : ''}`}
                    onClick={() => setActiveTab('popular')}
                >
                    Populares
                </button>
                <button
                    className={`${styles.tabButton} ${activeTab === 'new' ? styles.active : ''}`}
                    onClick={() => setActiveTab('new')}
                >
                    Nuevos
                </button>
            </div>

            <div className={styles.contactsList}>
                {filteredContacts.map((contact) => (
                    <div key={contact.id} className={styles.contactCard}>
                        <div className={styles.contactHeader}>
                            <div className={styles.contactAvatar}>
                                <FontAwesomeIcon icon={faUser} />
                            </div>
                            <div className={styles.contactInfo}>
                                <div className={styles.contactName}>{contact.name}</div>
                                <div className={styles.contactRating}>
                                    {renderStars(contact.rating)}
                                </div>
                            </div>
                        </div>
                        <div className={styles.contactDescription}>
                            {contact.description}
                        </div>
                    </div>
                ))}

                {filteredContacts.length === 0 && (
                    <div className={styles.emptyState}>
                        No se encontraron contactos
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