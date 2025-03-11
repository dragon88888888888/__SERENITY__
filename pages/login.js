import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../styles/Login.module.css';

export default function Login() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        usuario: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
        // Limpiar mensaje de error cuando el usuario empieza a escribir
        if (error) setError('');
    };

    const togglePassword = () => {
        setShowPassword(prev => !prev);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Realizar la petición a la API de login
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                // Guardar token e información del usuario
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                // Redireccionar a la página principal
                router.push('/main');
            } else {
                // Mostrar mensaje de error
                setError(data.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            setError('Error al conectar con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <Head>
                <title>SERENITY - Inicio de sesión</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>

            <div className={styles.header}>Inicio de sesión</div>

            <div className={styles.formContainer}>
                <div className={styles.title}>Serenity</div>

                <img
                    alt="Logo de Serenity"
                    className={styles.profilePic}
                    height="150"
                    src="/serenity.jpeg"
                    width="150"
                />

                <form onSubmit={handleSubmit}>
                    {error && <div className={styles.errorMessage}>{error}</div>}

                    <div className={styles.label}>usuario</div>
                    <input
                        className={styles.inputBox}
                        type="text"
                        id="usuario"
                        value={formData.usuario}
                        onChange={handleChange}
                        required
                    />

                    <div className={styles.label} style={{ marginBottom: '1rem' }}>contraseña</div>
                    <input
                        className={`${styles.inputBox} ${showPassword ? styles.textVisible : ''}`}
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <div className={styles.checkboxContainer}>
                        <input
                            type="checkbox"
                            id="showPassword"
                            checked={showPassword}
                            onChange={togglePassword}
                        />
                        <label htmlFor="showPassword">Mostrar contraseña</label>
                    </div>

                    <button
                        type="submit"
                        className={styles.buttonMark}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Iniciando sesión...' : 'iniciar sesion'}
                    </button>
                </form>
            </div>
        </div>
    );
}