// services/auth.js

// Iniciar sesión
export const login = async (usuario, password) => {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ usuario, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Error en inicio de sesión');
    }

    // Guardar información en localStorage
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
};

// Registrar usuario
export const register = async (userData) => {
    const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Error en registro');
    }

    return data;
};

// Cerrar sesión
export const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
};

// Obtener token de autenticación
export const getAuthToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('authToken');
    }
    return null;
};

// Obtener usuario actual
export const getCurrentUser = () => {
    if (typeof window !== 'undefined') {
        const userJson = localStorage.getItem('user');
        if (userJson) {
            return JSON.parse(userJson);
        }
    }
    return null;
};

// Verificar si el usuario está autenticado
export const isAuthenticated = () => {
    return !!getAuthToken();
};

// Obtener encabezados de autenticación
export const getAuthHeaders = () => {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

// Obtener perfil del usuario
export const getUserProfile = async () => {
    const headers = getAuthHeaders();

    const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
            ...headers,
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Error al obtener perfil');
    }

    return data.user;
};