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

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const togglePassword = () => {
        setShowPassword(prev => !prev);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // En una implementación real, aquí harías una petición a tu API
            // const response = await fetch('/api/auth/login', {
            //   method: 'POST',
            //   headers: {
            //     'Content-Type': 'application/json',
            //   },
            //   body: JSON.stringify(formData),
            // });

            // if (response.ok) {
            //   const data = await response.json();
            //   // Guardar token o información de usuario si es necesario
            //   router.push('/main');
            // } else {
            //   alert('Credenciales incorrectas');
            // }

            // Por ahora, simulamos un inicio de sesión exitoso
            console.log('Iniciando sesión con:', formData);
            router.push('/main');

        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            alert('Error al conectar con el servidor');
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
                    alt="Placeholder image of a smiling face"
                    className={styles.profilePic}
                    height="150"
                    src="/serenity.jpeg"
                    width="150"
                />

                <form onSubmit={handleSubmit}>
                    <div className={styles.label}>usuario</div>
                    <input
                        className={styles.inputBox}
                        type="text"
                        id="usuario"
                        value={formData.usuario}
                        onChange={handleChange}
                    />

                    <div className={styles.label} style={{ marginBottom: '1rem' }}>contraseña</div>
                    <input
                        className={`${styles.inputBox} ${showPassword ? styles.textVisible : ''}`}
                        type={showPassword ? "text" : "password"}
                        id="password"
                        value={formData.password}
                        onChange={handleChange}
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

                    <button type="submit" className={styles.buttonMark}>
                        iniciar sesion
                    </button>
                </form>
            </div>
        </div>
    );
}