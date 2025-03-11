// components/RouteGuard.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { isAuthenticated } from '../services/auth';

// Lista de rutas públicas que no requieren autenticación
const publicPaths = ['/login', '/signup', '/'];

export default function RouteGuard({ children }) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // Función para verificar si la ruta requiere autenticación
        const authCheck = (url) => {
            // Ruta actual es pública o el usuario está autenticado
            const path = url.split('?')[0];
            if (publicPaths.includes(path) || isAuthenticated()) {
                setAuthorized(true);
            } else {
                setAuthorized(false);
                router.push({
                    pathname: '/login',
                    query: { returnUrl: router.asPath }
                });
            }
        };

        // Verificar autenticación en la carga inicial
        authCheck(router.asPath);

        // Verificar autenticación en cambio de ruta
        const hideContent = () => setAuthorized(false);
        router.events.on('routeChangeStart', hideContent);
        router.events.on('routeChangeComplete', authCheck);

        // Limpiar eventos al desmontar
        return () => {
            router.events.off('routeChangeStart', hideContent);
            router.events.off('routeChangeComplete', authCheck);
        };
    }, [router]);

    return authorized && children;
}