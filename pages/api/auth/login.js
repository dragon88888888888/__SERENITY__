// API endpoint para autenticación de usuarios
export default function handler(req, res) {
    // Solo permitir método POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        const { usuario, password } = req.body;

        // Aquí implementarías la lógica real de autenticación
        // Esto es solo un ejemplo simplificado
        if (usuario === 'demo' && password === 'password') {
            // En un caso real, generarías un token JWT
            return res.status(200).json({
                message: 'Inicio de sesión exitoso',
                user: { id: 1, username: usuario },
                token: 'token-simulado-12345'
            });
        } else {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }
    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({ message: 'Error del servidor' });
    }
}