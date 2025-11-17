
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// FUNCIÓN DE REGISTRO 
exports.register = async (req, res) => {
    try {
        const { username, email, password, nombre, apellido, fecha_nacimiento, id_region, id_comuna } = req.body;
        
        logger.info('📝 Intento de registro recibido', { 
            email, 
            username, 
            hasPassword: !!password,
            hasNombre: !!nombre,
            hasApellido: !!apellido,
            hasFechaNacimiento: !!fecha_nacimiento,
            hasRegion: !!id_region,
            hasComuna: !!id_comuna,
            bodyKeys: Object.keys(req.body)
        });
        
        // Validaciones básicas
        if (!username || !username.trim()) {
            return res.status(400).json({ msg: 'El nombre de usuario es obligatorio' });
        }
        
        if (!email || !email.trim()) {
            return res.status(400).json({ msg: 'El correo electrónico es obligatorio' });
        }
        
        if (!password || password.length < 6) {
            return res.status(400).json({ msg: 'La contraseña debe tener al menos 6 caracteres' });
        }
        
        if (!nombre || !nombre.trim()) {
            return res.status(400).json({ msg: 'El nombre es obligatorio' });
        }
        
        if (!apellido || !apellido.trim()) {
            return res.status(400).json({ msg: 'El apellido es obligatorio' });
        }
        
        // Validar que fecha_nacimiento sea obligatoria
        if (!fecha_nacimiento || (typeof fecha_nacimiento === 'string' && !fecha_nacimiento.trim())) {
            return res.status(400).json({ msg: 'La fecha de nacimiento es obligatoria' });
        }
        
        // Validar formato de fecha (YYYY-MM-DD)
        const fechaStr = String(fecha_nacimiento).trim();
        const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!fechaRegex.test(fechaStr)) {
            return res.status(400).json({ msg: 'Formato de fecha inválido. Use YYYY-MM-DD' });
        }
        
        // Validar que la fecha no sea futura
        const fechaNac = new Date(fechaStr);
        const hoy = new Date();
        hoy.setHours(23, 59, 59, 999); // Permitir hasta el final del día de hoy
        if (fechaNac > hoy) {
            return res.status(400).json({ msg: 'La fecha de nacimiento no puede ser futura' });
        }
        
        // Validar edad mínima (13 años)
        const edadMinima = new Date();
        edadMinima.setFullYear(edadMinima.getFullYear() - 13);
        if (fechaNac > edadMinima) {
            return res.status(400).json({ msg: 'Debes tener al menos 13 años para registrarte' });
        }
        
        // Validar región y comuna
        if (!id_region || !id_comuna) {
            return res.status(400).json({ msg: 'Debes seleccionar región y comuna' });
        }

        // Verificar si el email ya está registrado
        const emailExists = await db.query('SELECT id_usuario FROM usuario WHERE email = $1', [email]);
        if (emailExists.rows.length > 0) {
            return res.status(400).json({ msg: 'El correo electrónico ya está registrado' });
        }
        
        // Verificar si el username ya está en uso
        const usernameExists = await db.query('SELECT id_usuario FROM usuario WHERE username = $1', [username]);
        if (usernameExists.rows.length > 0) {
            return res.status(400).json({ msg: 'El nombre de usuario ya está en uso' });
        }

        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        logger.info('Creando usuario en la base de datos...', { username, email });
        
        // CREAR LA CUENTA DIRECTAMENTE (sin verificación de email)
        const newUser = await db.query(
            `INSERT INTO usuario (username, email, password_hash, nombre, apellido, fecha_nacimiento, id_region, id_comuna, email_verificado) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE) 
             RETURNING id_usuario, username, nombre, apellido, email`,
            [username.trim(), email.trim(), hashedPassword, nombre.trim(), apellido.trim(), fechaStr, parseInt(id_region), parseInt(id_comuna)]
        );
        
        if (!newUser.rows || newUser.rows.length === 0) {
            logger.error('Error: No se creó el usuario en la base de datos');
            return res.status(500).json({ error: 'Error al crear el usuario en la base de datos' });
        }
        
        logger.info('✅ Usuario creado exitosamente', { id_usuario: newUser.rows[0].id_usuario });
        
        const userData = {
            id: newUser.rows[0].id_usuario,
            username: newUser.rows[0].username,
            nombre: newUser.rows[0].nombre,
            apellido: newUser.rows[0].apellido,
            email: newUser.rows[0].email
        };
        
        // Generar token JWT inmediatamente
        const payload = { user: userData };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) {
                logger.error('Error al generar token JWT en registro', err);
                return res.status(500).json({ error: 'Error al generar token' });
            }
            
            logger.info('✅ Token generado, enviando respuesta al cliente');
            
            // Devolver éxito con token para login automático
            res.status(201).json({ 
                message: 'Cuenta creada exitosamente',
                token,
                user: userData
            });
        });

    } catch (error) {
        logger.error('Error en registro', { 
            error: error.message, 
            stack: error.stack,
            code: error.code,
            detail: error.detail
        });
        
        // Mensaje de error más específico
        let errorMessage = 'Error en el servidor';
        if (error.code === '23505') { // Violación de constraint único
            if (error.detail && error.detail.includes('email')) {
                errorMessage = 'El correo electrónico ya está registrado';
            } else if (error.detail && error.detail.includes('username')) {
                errorMessage = 'El nombre de usuario ya está en uso';
            }
        } else if (error.code === '23503') { // Violación de foreign key
            errorMessage = 'La región o comuna seleccionada no es válida';
        }
        
        res.status(500).json({ error: errorMessage, details: process.env.NODE_ENV === 'development' ? error.message : undefined });
    }
};

// Verificar disponibilidad de username
exports.checkUsername = async (req, res) => {
    try {
        const { username } = req.params;
        
        if (!username || !username.trim()) {
            return res.status(400).json({ available: false, message: 'El nombre de usuario es requerido' });
        }
        
        // Validar formato de username (solo letras, números, guiones y guiones bajos, 3-20 caracteres)
        const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
        if (!usernameRegex.test(username.trim())) {
            return res.status(400).json({ 
                available: false, 
                message: 'El nombre de usuario debe tener entre 3 y 20 caracteres y solo puede contener letras, números, guiones y guiones bajos' 
            });
        }
        
        const usernameExists = await db.query('SELECT id_usuario FROM usuario WHERE LOWER(username) = LOWER($1)', [username.trim()]);
        
        if (usernameExists.rows.length > 0) {
            return res.json({ available: false, message: 'Este nombre de usuario ya está en uso' });
        }
        
        res.json({ available: true, message: 'Nombre de usuario disponible' });
    } catch (error) {
        logger.error('Error al verificar username', error);
        res.status(500).json({ available: false, message: 'Error al verificar disponibilidad' });
    }
};

//FUNCIÓN DE LOGIN 
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.query(
            'SELECT id_usuario, username, email, password_hash, nombre, apellido FROM usuario WHERE email = $1', 
            [email]
        );
        
        if (user.rows.length === 0) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

      
        const userData = {
            id: user.rows[0].id_usuario,
            username: user.rows[0].username,
            nombre: user.rows[0].nombre,
            apellido: user.rows[0].apellido,
            email: user.rows[0].email
        };

        const payload = { user: userData };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ 
                token,
                user: userData
            });
        });

    } catch (error) {
        logger.error('Error en registro', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};


exports.getAuthenticatedUser = async (req, res) => {
    try {

        const user = await db.query(
            `SELECT 
                u.id_usuario, u.username, u.email, u.fecha_registro,
                u.nombre, u.apellido, u.bio, u.avatar, u.fecha_nacimiento,
                u.id_region, u.id_comuna,
                r.nombre_region,
                c.nombre_comuna
             FROM usuario u
             LEFT JOIN region r ON u.id_region = r.id_region
             LEFT JOIN comuna c ON u.id_comuna = c.id_comuna
             WHERE u.id_usuario = $1`, 
            [req.user.id]
        );
        
        if (user.rows.length === 0) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }
        
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del Servidor');
    }
};

exports.updateUsername = async (req, res) => {
    const { username } = req.body;
    const userId = req.user.id;
    try {
        const existingUser = await db.query('SELECT id_usuario FROM usuario WHERE username = $1 AND id_usuario != $2', [username, userId]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ msg: 'Ese nombre de usuario ya está en uso' });
        }
        
        const updatedUser = await db.query(
            'UPDATE usuario SET username = $1 WHERE id_usuario = $2 RETURNING id_usuario, username, email',
            [username, userId]
        );
        res.json(updatedUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del Servidor');
    }
};

// Actualizar perfil completo
exports.updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { username, nombre, apellido, email, bio, avatar, fecha_nacimiento, id_region, id_comuna } = req.body;
    
    try {
        // Verificar que el username no esté en uso por otro usuario (solo si se está actualizando)
        if (username !== undefined && username !== null && username !== '') {
            const existingUser = await db.query(
                'SELECT id_usuario FROM usuario WHERE username = $1 AND id_usuario != $2',
                [username, userId]
            );
            if (existingUser.rows.length > 0) {
                return res.status(400).json({ msg: 'Ese nombre de usuario ya está en uso' });
            }
        }
        
        // Verificar que el email no esté en uso por otro usuario (solo si se está actualizando)
        if (email !== undefined && email !== null && email !== '') {
            const existingEmail = await db.query(
                'SELECT id_usuario FROM usuario WHERE email = $1 AND id_usuario != $2',
                [email, userId]
            );
            if (existingEmail.rows.length > 0) {
                return res.status(400).json({ msg: 'Ese correo electrónico ya está en uso' });
            }
        }
        
        // Construir query dinámicamente solo con los campos que se quieren actualizar
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (username !== undefined && username !== null && username !== '') {
            updates.push(`username = $${paramCount++}`);
            values.push(username);
        }
        if (nombre !== undefined && nombre !== null && nombre !== '') {
            updates.push(`nombre = $${paramCount++}`);
            values.push(nombre);
        }
        if (apellido !== undefined && apellido !== null && apellido !== '') {
            updates.push(`apellido = $${paramCount++}`);
            values.push(apellido);
        }
        if (email !== undefined && email !== null && email !== '') {
            updates.push(`email = $${paramCount++}`);
            values.push(email);
        }
        if (bio !== undefined) {
            updates.push(`bio = $${paramCount++}`);
            values.push(bio || null); // Permite borrar bio enviando string vacío
        }
        if (avatar !== undefined && avatar !== null && avatar !== '') {
            updates.push(`avatar = $${paramCount++}`);
            values.push(avatar);
        }
        if (fecha_nacimiento !== undefined && fecha_nacimiento !== null && fecha_nacimiento !== '') {
            updates.push(`fecha_nacimiento = $${paramCount++}`);
            values.push(fecha_nacimiento);
        }
        if (id_region !== undefined && id_region !== null) {
            updates.push(`id_region = $${paramCount++}`);
            values.push(id_region);
        }
        if (id_comuna !== undefined && id_comuna !== null) {
            updates.push(`id_comuna = $${paramCount++}`);
            values.push(id_comuna);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }
        
        values.push(userId);
        
        const query = `
            UPDATE usuario SET
                ${updates.join(', ')}
            WHERE id_usuario = $${paramCount}
            RETURNING id_usuario, username, nombre, apellido, email, bio, avatar, fecha_nacimiento, id_region, id_comuna
        `;
        
        const result = await db.query(query, values);
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Subir avatar
exports.uploadAvatar = async (req, res) => {
    const userId = req.user.id;
    
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
        }
        
        // Construir URL del avatar
        const avatarUrl = `/uploads/avatares/${req.file.filename}`;
        
        // Actualizar avatar en la base de datos
        const result = await db.query(
            'UPDATE usuario SET avatar = $1 WHERE id_usuario = $2 RETURNING id_usuario, avatar',
            [avatarUrl, userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json({ 
            message: 'Avatar actualizado correctamente',
            avatar: result.rows[0].avatar
        });
    } catch (err) {
        console.error('Error al subir avatar:', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Cambiar contraseña
exports.changePassword = async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    try {
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Contraseña actual y nueva contraseña son requeridas' });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
        }
        
        // Obtener usuario actual
        const user = await db.query('SELECT password_hash FROM usuario WHERE id_usuario = $1', [userId]);
        
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Verificar contraseña actual
        const isMatch = await bcrypt.compare(currentPassword, user.rows[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Contraseña actual incorrecta' });
        }
        
        // Hashear nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Actualizar contraseña
        await db.query('UPDATE usuario SET password_hash = $1 WHERE id_usuario = $2', [hashedPassword, userId]);
        
        res.json({ message: 'Contraseña actualizada correctamente' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error del servidor' });
    }
};
