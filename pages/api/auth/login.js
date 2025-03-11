// pages/api/auth/login.js
import { executeQuery } from '../../../lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export default async function handler(req, res) {
    // Solo permitir método POST
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Método no permitido' });
    }

    try {
        const { usuario, password } = req.body;

        // Validación básica
        if (!usuario || !password) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }

        // Buscar usuario en la base de datos
        const users = await executeQuery(
            'SELECT id, username, email, password_hash FROM users WHERE username = ?',
            [usuario]
        );

        // Si no se encuentra el usuario
        if (users.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const user = users[0];

        // Verificar la contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Generar token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        // Guardar la sesión en la base de datos
        const sessionId = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 días de validez

        await executeQuery(
            'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
            [sessionId, user.id, token, expiresAt]
        );

        // Respuesta exitosa
        return res.status(200).json({
            message: 'Inicio de sesión exitoso',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            },
            token
        });
    } catch (error) {
        console.error('Error en login:', error);
        return res.status(500).json({ message: 'Error del servidor' });
    }
}