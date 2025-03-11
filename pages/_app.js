import '../styles/globals.css';
import RouteGuard from '../components/RouteGuard';

function MyApp({ Component, pageProps }) {
    return (
        <RouteGuard>
            <Component {...pageProps} />
        </RouteGuard>
    );
}

export default MyApp;