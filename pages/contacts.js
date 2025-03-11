import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faStar, faArrowLeft, faHospital, faUserMd } from '@fortawesome/free-solid-svg-icons';
import { faStar as faStarOutline } from '@fortawesome/free-regular-svg-icons';
import * as XLSX from 'xlsx';
import styles from '../styles/Contacts.module.css';

export default function Contacts() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('popular');
    const [contacts, setContacts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Cargar los datos del Excel automáticamente al iniciar el componente
    useEffect(() => {
        const loadExcelData = async () => {
            setIsLoading(true);
            try {
                // Ruta relativa al archivo Excel en la carpeta pública o assets de tu proyecto
                const response = await fetch('/data/Base de datos_Serenity.xlsx');
                const excelData = await response.arrayBuffer();

                const data = new Uint8Array(excelData);
                const workbook = XLSX.read(data, { type: 'array' });

                // Procesar ambas hojas (instituciones y psicólogos)
                const allContacts = [];

                // Leer datos de instituciones
                if (workbook.SheetNames.includes('Instituciones Psicologicas')) {
                    const institucionesSheet = workbook.Sheets['Instituciones Psicologicas'];
                    const institucionesData = XLSX.utils.sheet_to_json(institucionesSheet);

                    const institucionesContacts = institucionesData.map((row, index) => ({
                        id: row.Id || `inst-${index + 1}`,
                        name: row.Nombres || '',
                        description: `${row.Costos || 'Consulta gratuita'} | ${row.Direccion || ''} | Tel: ${row.Telefonos || 'No disponible'} | Horario: ${row.Horarios || 'Consultar'}`,
                        rating: 4, // Valor predeterminado
                        type: 'institution',
                    }));

                    allContacts.push(...institucionesContacts);
                }

                // Leer datos de psicólogos
                if (workbook.SheetNames.includes('Psicologos')) {
                    const psicologosSheet = workbook.Sheets['Psicologos'];
                    const psicologosData = XLSX.utils.sheet_to_json(psicologosSheet);

                    const psicologosContacts = psicologosData.map((row, index) => ({
                        id: row.Id || `psic-${index + 1}`,
                        name: row.Nombres || '',
                        description: `${row.Especialidad ? 'Especialidad: ' + row.Especialidad : ''} | ${row.Costos || 'Consulta: Preguntar precio'} | ${row.Direccion || ''} | Tel: ${row.Telefono || 'No disponible'}`,
                        rating: 4, // Valor predeterminado
                        type: 'professional',
                    }));

                    allContacts.push(...psicologosContacts);
                }

                setContacts(allContacts);
                setIsLoading(false);
            } catch (err) {
                console.error("Error al cargar el archivo Excel:", err);
                setError("Error al cargar los datos. Por favor, intenta más tarde.");
                setIsLoading(false);
            }
        };

        loadExcelData();
    }, []);

    // Filtrar contactos según la pestaña activa
    const filteredContacts = activeTab === 'popular'
        ? contacts.filter(contact => contact.rating >= 4)
        : contacts;

    // Ordenar contactos (por calificación descendente)
    const sortedContacts = [...filteredContacts].sort((a, b) => b.rating - a.rating);

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
                    className={`${styles.tabButton} ${activeTab === 'all' ? styles.active : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    Todos
                </button>
            </div>

            {isLoading ? (
                <div className={styles.emptyState}>
                    Cargando contactos...
                </div>
            ) : error ? (
                <div className={styles.emptyState}>
                    {error}
                </div>
            ) : (
                <div className={styles.contactsList}>
                    {sortedContacts.length > 0 ? (
                        sortedContacts.map((contact) => (
                            <div key={contact.id} className={styles.contactCard}>
                                <div className={styles.contactHeader}>
                                    <div className={styles.contactAvatar}>
                                        <FontAwesomeIcon icon={contact.type === 'institution' ? faHospital : faUserMd} />
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
                        ))
                    ) : (
                        <div className={styles.emptyState}>
                            No se encontraron contactos con los filtros seleccionados
                        </div>
                    )}
                </div>
            )}

            <button
                className={styles.backButton}
                onClick={() => router.push('/main')}
            >
                <FontAwesomeIcon icon={faArrowLeft} /> Volver al inicio
            </button>
        </div>
    );
}