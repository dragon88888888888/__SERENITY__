import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
    return (
        <div className={styles.container}>
            <Head>
                <title>SERENITY</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </Head>

            <div className={styles.header}>
                <Link href="/login">
                    <button className={styles.buttonMark}>iniciar sesion</button>
                </Link>
                <Link href="/signup">
                    <button className={styles.buttonMark}>Registrarme</button>
                </Link>
            </div>

            <div className={styles.contenido}>
                <div className={styles.title}>Serenity</div>
                <div className={styles.subtitle}>
                    Herramienta de ayuda contra la Ansiedad y Depresión
                </div>
                <div className={styles.description}>
                    Antes que nada este proyecto surgió de experiencias propias con la
                    ansiedad de la creadora y autora de esta investigación, ya que se esta
                    tomando un poco mas de importancia a la salud mental, además de que
                    algunos amigos cercanos de la autora han tenido percances con estos
                    problemas, así que la autora decidió ayudar a las personas a mejorar la
                    ansiedad y depresión.
                </div>
            </div>
        </div>
    );
}