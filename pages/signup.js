import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../styles/Signup.module.css';

export default function Signup() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        usuario: '',
        password: '',
        email: '',
        edad: '',
        genero: ''
    });
    const [otroGenero, setOtroGenero] = useState('');
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

    const handleGeneroChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            genero: value === 'otro' ? otroGenero : value
        }));
    };

    const handleOtroGeneroChange = (e) => {
        const value = e.target.value;
        setOtroGenero(value);
        if (formData.genero === 'otro' || formData.genero === '') {
            setFormData(prev => ({
                ...prev,
                genero: value
            }));
        }
    };

    // Modificación en el handleSubmit de Signup.js
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            // Realizar la petición a la API de registro
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                // Guardar el nombre de usuario y el token en localStorage
                localStorage.setItem('username', formData.usuario);

                // Guardar el token que ahora devuelve la API de registro
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                    console.log('Token guardado:', data.token); // Para depuración
                } else {
                    console.warn('No se recibió token del servidor');
                }

                // Registro exitoso, redirigir a la página de test
                router.push('/test_full');
            } else {
                // Mostrar mensaje de error
                setError(data.message || 'Error al registrar usuario');
            }
        } catch (error) {
            console.error('Error al registrar:', error);
            setError('Error al conectar con el servidor');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <Head>
                <title>SERENITY - Registro</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>

            <div className={styles.header}>Registro de cuenta</div>

            <div className={styles.leftColumn}>
                <img
                    alt="Logo de Serenity"
                    className={styles.profilePic}
                    height="150"
                    src="/serenity.jpeg"
                    width="150"
                />
            </div>

            <div className={styles.rightColumn}>
                <div className={styles.title}>Serenity</div>

                <form onSubmit={handleSubmit}>
                    {error && <div className={styles.errorMessage}>{error}</div>}

                    <div className={styles.label}>Usuario</div>
                    <input
                        className={styles.inputBox}
                        type="text"
                        id="usuario"
                        value={formData.usuario}
                        onChange={handleChange}
                        required
                    />

                    <div className={styles.label}>Contraseña</div>
                    <div className={styles.passwordContainer}>
                        <input
                            className={`${styles.inputBox} ${showPassword ? styles.textVisible : ''}`}
                            type={showPassword ? "text" : "password"}
                            id="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className={styles.checkboxContainer}>
                        <input
                            type="checkbox"
                            id="showPassword"
                            checked={showPassword}
                            onChange={togglePassword}
                        />
                        <label htmlFor="showPassword">Mostrar contraseña</label>
                    </div>

                    <div className={styles.label}>Correo</div>
                    <input
                        className={styles.inputBox}
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />

                    <div className={styles.twoInputs}>
                        <div>
                            <label className={styles.label}>Edad</label>
                            <input
                                className={`${styles.inputBox} ${styles.smallBox}`}
                                type="number"
                                id="edad"
                                value={formData.edad}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div>
                            <label className={styles.label}>Género</label>
                            <select
                                className={`${styles.inputBox} ${styles.smallBox}`}
                                id="genero-select"
                                value={formData.genero === 'Hombre' || formData.genero === 'Mujer' ? formData.genero : 'otro'}
                                onChange={handleGeneroChange}
                                required
                            >
                                <option value="" disabled>Seleccionar</option>
                                <option value="Hombre">Hombre</option>
                                <option value="Mujer">Mujer</option>
                                <option value="otro">Otro</option>
                            </select>

                            {/* Campo adicional que aparece cuando se selecciona "Otro" */}
                            {(formData.genero !== 'Hombre' && formData.genero !== 'Mujer') && (
                                <input
                                    className={`${styles.inputBox} ${styles.smallBox}`}
                                    type="text"
                                    id="otro-genero"
                                    placeholder="Especificar género"
                                    value={otroGenero}
                                    onChange={handleOtroGeneroChange}
                                    style={{ marginTop: '0.5rem' }}
                                    required
                                />
                            )}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={styles.buttonMark}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Registrando...' : 'Registrarme'}
                    </button>
                </form>
            </div>
        </div>
    );
}