// API endpoint para registro de usuarios
export default function handler(req, res) {
    // Solo permitir método POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        const { usuario, password, email, edad, genero } = req.body;

        // Validaciones básicas
        if (!usuario || !password || !email) {
            return res.status(400).json({
                message: 'Faltan campos obligatorios'
            });
        }

        // Aquí implementarías la lógica real de registro
        // Como guardar en base de datos, verificar que el usuario no exista, etc.

        // Respuesta de éxito simulada
        return res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: { id: Date.now(), username: usuario, email }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        return res.status(500).json({ message: 'Error del servidor' });
    }
}