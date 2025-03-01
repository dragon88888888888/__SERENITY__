import { useState } from 'react';
import Head from 'next/head';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import styles from '../styles/Semana.module.css';

export default function Semana() {
    const [currentView, setCurrentView] = useState('main');

    const showView = (view) => {
        setCurrentView(view);
    };

    const showMainView = () => {
        setCurrentView('main');
    };

    return (
        <div className={styles.container}>
            <Head>
                <title>Serenity - Resumen de la Semana</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>

            <div className={styles.header}>
                <FontAwesomeIcon icon={faCalendarAlt} />
                <h1>Resumen de la semana</h1>
            </div>

            {/* Vista principal con botones de selección */}
            {currentView === 'main' && (
                <div className={styles.viewSelector}>
                    <div className={styles.buttonsGroup}>
                        <button onClick={() => showView('day')}>Por día</button>
                        <button onClick={() => showView('week')}>Por semana</button>
                        <button onClick={() => showView('month')}>Por mes</button>
                    </div>
                    <div className={styles.gifPlaceholder}>GIF</div>
                </div>
            )}

            {/* Vista de días */}
            {currentView === 'day' && (
                <div className={styles.calendarView}>
                    <button className={styles.backButton} onClick={showMainView}>
                        ← Volver
                    </button>
                    <div className={styles.calendarGrid}>
                        <button style={{ transform: 'rotate(-2deg)' }}>Lunes</button>
                        <button style={{ transform: 'rotate(1deg)' }}>Martes</button>
                        <button style={{ transform: 'rotate(-1deg)' }}>Miercoles</button>
                        <button style={{ transform: 'rotate(2deg)' }}>Jueves</button>
                        <button style={{ transform: 'rotate(-2deg)' }}>Viernes</button>
                        <button style={{ transform: 'rotate(1deg)' }}>Sábado</button>
                        <button style={{ transform: 'rotate(-1deg)' }}>Domingo</button>
                    </div>
                </div>
            )}

            {/* Vista de semanas */}
            {currentView === 'week' && (
                <div className={styles.calendarView}>
                    <button className={styles.backButton} onClick={showMainView}>
                        ← Volver
                    </button>
                    <div className={styles.calendarGrid}>
                        <button style={{ transform: 'rotate(-2deg)' }}>Semana 1</button>
                        <button style={{ transform: 'rotate(1deg)' }}>Semana 2</button>
                        <button style={{ transform: 'rotate(-1deg)' }}>Semana 3</button>
                        <button style={{ transform: 'rotate(2deg)' }}>Semana 4</button>
                        <button style={{ transform: 'rotate(-2deg)' }}>Semana 5</button>
                        <button style={{ transform: 'rotate(1deg)' }}>Semana 6</button>
                        <button style={{ transform: 'rotate(-1deg)' }}>Semana 7</button>
                    </div>
                </div>
            )}

            {/* Vista de meses */}
            {currentView === 'month' && (
                <div className={styles.calendarView}>
                    <button className={styles.backButton} onClick={showMainView}>
                        ← Volver
                    </button>
                    <div className={styles.calendarGrid}>
                        <button style={{ transform: 'rotate(-2deg)' }}>Enero</button>
                        <button style={{ transform: 'rotate(1deg)' }}>Febrero</button>
                        <button style={{ transform: 'rotate(-1deg)' }}>Marzo</button>
                        <button style={{ transform: 'rotate(2deg)' }}>Abril</button>
                        <button style={{ transform: 'rotate(-2deg)' }}>Mayo</button>
                        <button style={{ transform: 'rotate(1deg)' }}>Junio</button>
                        <button style={{ transform: 'rotate(-1deg)' }}>Julio</button>
                        <button style={{ transform: 'rotate(2deg)' }}>Agosto</button>
                        <button style={{ transform: 'rotate(-2deg)' }}>Septiembre</button>
                        <button style={{ transform: 'rotate(1deg)' }}>Octubre</button>
                        <button style={{ transform: 'rotate(-1deg)' }}>Noviembre</button>
                        <button style={{ transform: 'rotate(2deg)' }}>Diciembre</button>
                    </div>
                </div>
            )}
        </div>
    );
}