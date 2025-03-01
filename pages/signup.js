import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../styles/Signup.module.css';

export default function Signup() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        usuario: '',
        password: '',
        email: '',
        edad: '',
        genero: ''
    });

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // En una implementación real, aquí harías una petición a tu API
            // const response = await fetch('/api/auth/register', {
            //   method: 'POST',
            //   headers: {
            //     'Content-Type': 'application/json',
            //   },
            //   body: JSON.stringify(formData),
            // });

            // if (response.ok) {
            //   const data = await response.json();
            //   router.push('/login');
            // } else {
            //   alert('Error al registrar usuario');
            // }

            // Por ahora, simulamos un registro exitoso
            console.log('Registrando usuario:', formData);
            router.push('/login');

        } catch (error) {
            console.error('Error al registrar:', error);
            alert('Error al conectar con el servidor');
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
                    alt="Placeholder image of a smiling face"
                    className={styles.profilePic}
                    height="150"
                    src="/serenity.jpeg"
                    width="150"
                />
            </div>

            <div className={styles.rightColumn}>
                <div className={styles.title}>Serenity</div>

                <form onSubmit={handleSubmit}>
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
                    <input
                        className={styles.inputBox}
                        type="password"
                        id="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

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
                            <input
                                className={`${styles.inputBox} ${styles.smallBox}`}
                                type="text"
                                id="genero"
                                value={formData.genero}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className={styles.buttonMark}>
                        Registrarme
                    </button>
                </form>
            </div>
        </div>
    );
}