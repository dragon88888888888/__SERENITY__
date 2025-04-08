// pages/api/auth/register.js
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
        const { usuario, password, email, edad, genero } = req.body;

        // Validación básica
        if (!usuario || !password || !email) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }

        // Verificar si el usuario o correo ya existen
        const existingUser = await executeQuery(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [usuario, email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({ message: 'El usuario o correo ya está registrado' });
        }

        // Generar hash de la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insertar nuevo usuario en la base de datos
        const result = await executeQuery(
            'INSERT INTO users (username, email, password_hash, age, gender) VALUES (?, ?, ?, ?, ?)',
            [usuario, email, hashedPassword, edad || null, genero || null]
        );

        // Generar token JWT para el usuario recién registrado
        const token = jwt.sign(
            { id: result.insertId, username: usuario },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Guardar la sesión en la base de datos (opcional, igual que en login)
        const sessionId = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 días de validez

        await executeQuery(
            'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
            [sessionId, result.insertId, token, expiresAt]
        );

        // Respuesta exitosa con token incluido
        return res.status(201).json({
            message: 'Usuario registrado exitosamente',
            user: {
                id: result.insertId,
                username: usuario,
                email
            },
            token // Incluir el token en la respuesta
        });
    } catch (error) {
        console.error('Error en registro:', error);
        return res.status(500).json({ message: 'Error del servidor' });
    }
}