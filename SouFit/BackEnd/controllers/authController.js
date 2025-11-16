
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendRecoveryEmail, sendVerificationEmail } = require('../services/emailService');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// FUNCIÓN DE REGISTRO 
exports.register = async (req, res) => {
    
    const { username, email, password, nombre, apellido, fecha_nacimiento, id_region, id_comuna } = req.body;
    
    // Validar que fecha_nacimiento sea obligatoria
    if (!fecha_nacimiento || !fecha_nacimiento.trim()) {
        return res.status(400).json({ msg: 'La fecha de nacimiento es obligatoria' });
    }
    
    // Validar formato de fecha (YYYY-MM-DD)
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha_nacimiento)) {
        return res.status(400).json({ msg: 'Formato de fecha inválido. Use YYYY-MM-DD' });
    }
    
    // Validar que la fecha no sea futura
    const fechaNac = new Date(fecha_nacimiento);
    const hoy = new Date();
    if (fechaNac > hoy) {
        return res.status(400).json({ msg: 'La fecha de nacimiento no puede ser futura' });
    }
    
    // Validar edad mínima (por ejemplo, 13 años)
    const edadMinima = new Date();
    edadMinima.setFullYear(edadMinima.getFullYear() - 13);
    if (fechaNac > edadMinima) {
        return res.status(400).json({ msg: 'Debes tener al menos 13 años para registrarte' });
    }

    try {
        // Verificar si el email ya está registrado
        const emailExists = await db.query('SELECT * FROM usuario WHERE email = $1', [email]);
        if (emailExists.rows.length > 0) {
            return res.status(400).json({ msg: 'El correo electrónico ya está registrado' });
        }
        
        // Verificar si hay un código de verificación pendiente para este email
        const codigoPendiente = await db.query(
            'SELECT * FROM email_verification_codes WHERE email = $1 AND usado = FALSE AND fecha_expiracion > NOW()',
            [email]
        );
        if (codigoPendiente.rows.length > 0) {
            return res.status(400).json({ msg: 'Ya existe un código de verificación pendiente para este email. Por favor, verifica tu correo o espera a que expire.' });
        }
        
        // Verificar si el username ya está en uso
        const usernameExists = await db.query('SELECT * FROM usuario WHERE username = $1', [username]);
        if (usernameExists.rows.length > 0) {
            return res.status(400).json({ msg: 'El nombre de usuario ya está en uso' });
        }

        // Generar código de verificación de 6 dígitos
        const codigoVerificacion = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Hashear contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // CREAR LA CUENTA INMEDIATAMENTE (con email_verificado = FALSE)
        const newUser = await db.query(
            `INSERT INTO usuario (username, email, password_hash, nombre, apellido, fecha_nacimiento, id_region, id_comuna, email_verificado) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, FALSE) 
             RETURNING id_usuario, username, nombre, apellido, email`,
            [username, email, hashedPassword, nombre, apellido, fecha_nacimiento, id_region, id_comuna]
        );
        
        // Crear tabla de códigos de verificación si no existe
        await db.query(`
            CREATE TABLE IF NOT EXISTS email_verification_codes (
                id SERIAL PRIMARY KEY,
                email VARCHAR(100) NOT NULL,
                codigo VARCHAR(6) NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT NOW(),
                fecha_expiracion TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours'),
                usado BOOLEAN DEFAULT FALSE
            )
        `);
        
        // Eliminar códigos expirados o usados para este email
        await db.query('DELETE FROM email_verification_codes WHERE email = $1 AND (fecha_expiracion < NOW() OR usado = TRUE)', [email]);
        
        // Guardar código de verificación
        await db.query(
            'INSERT INTO email_verification_codes (email, codigo) VALUES ($1, $2)',
            [email, codigoVerificacion]
        );
        
        // Enviar correo de verificación
        const emailEnviado = await sendVerificationEmail(
            email,
            username,
            nombre || username,
            codigoVerificacion
        );
        
        if (!emailEnviado) {
            logger.warn('No se pudo enviar el correo de verificación', { email });
            // Si no se puede enviar el email, eliminar el código (pero mantener la cuenta)
            await db.query('DELETE FROM email_verification_codes WHERE email = $1 AND codigo = $2', [email, codigoVerificacion]);
            return res.status(500).json({ 
                msg: 'No se pudo enviar el correo de verificación. Por favor, verifica la configuración del servidor de correo.' 
            });
        }

        // Devolver éxito con el email para la verificación
        res.status(201).json({ 
            message: 'Cuenta creada exitosamente. Se ha enviado un código de verificación a tu correo electrónico.',
            email: email
        });

    } catch (error) {
        logger.error('Error en registro', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};

//FUNCIÓN DE LOGIN 
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.query(
            'SELECT id_usuario, username, email, password_hash, nombre, apellido, email_verificado FROM usuario WHERE email = $1', 
            [email]
        );
        
        if (user.rows.length === 0) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }
        
        // Verificar que el email esté verificado
        if (!user.rows[0].email_verificado) {
            return res.status(403).json({ 
                msg: 'Por favor, verifica tu correo electrónico antes de iniciar sesión',
                emailNoVerificado: true
            });
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

// Solicitar código de recuperación de contraseña
exports.solicitarRecuperacionPassword = async (req, res) => {
    const { email } = req.body;
    
    try {
        if (!email) {
            return res.status(400).json({ error: 'El correo electrónico es requerido' });
        }
        
        // Verificar que el usuario existe y obtener datos
        const user = await db.query('SELECT id_usuario, email, nombre, username FROM usuario WHERE email = $1', [email]);
        
        // IMPORTANTE: Solo continuar si el usuario existe
        if (user.rows.length === 0) {
            // Por seguridad, no revelar si el email existe o no
            // Pero NO guardar código ni intentar enviar correo
            logger.info('Intento de recuperación de contraseña para email no registrado', { email });
            return res.json({ 
                message: 'Si el correo existe, se enviará un código de recuperación',
                emailExists: false // Indicador interno para el frontend
            });
        }
        
        const usuario = user.rows[0];
        
        // Generar código de 6 dígitos
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Crear tabla si no existe
        await db.query(`
            CREATE TABLE IF NOT EXISTS password_reset_codes (
                id SERIAL PRIMARY KEY,
                email VARCHAR(100) NOT NULL,
                codigo VARCHAR(6) NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT NOW(),
                fecha_expiracion TIMESTAMP DEFAULT (NOW() + INTERVAL '15 minutes'),
                usado BOOLEAN DEFAULT FALSE
            )
        `);
        
        // Eliminar códigos expirados o usados para este email
        await db.query('DELETE FROM password_reset_codes WHERE email = $1 AND (fecha_expiracion < NOW() OR usado = TRUE)', [email]);
        
        // Guardar nuevo código SOLO si el usuario existe
        await db.query(
            'INSERT INTO password_reset_codes (email, codigo) VALUES ($1, $2)',
            [email, codigo]
        );
        
        // Enviar correo de recuperación personalizado
        const emailEnviado = await sendRecoveryEmail(
            email,
            usuario.username,
            usuario.nombre || usuario.username,
            codigo
        );
        
        if (!emailEnviado) {
            // Si falla el envío, eliminar el código guardado
            await db.query('DELETE FROM password_reset_codes WHERE email = $1 AND codigo = $2', [email, codigo]);
            logger.error('No se pudo enviar el correo de recuperación', { email });
            return res.status(500).json({ 
                error: 'No se pudo enviar el correo de recuperación. Por favor, verifica la configuración del servidor de correo.' 
            });
        }
        
        logger.info('Código de recuperación enviado exitosamente', { email });
        
        // Por seguridad, siempre devolver el mismo mensaje público
        // Pero incluir indicador interno para el frontend
        res.json({ 
            message: 'Si el correo existe, se enviará un código de recuperación',
            emailExists: true // Indicador interno para el frontend
        });
        
    } catch (err) {
        logger.error('Error al solicitar recuperación de contraseña', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Verificar código de verificación de email y activar cuenta
exports.verificarEmail = async (req, res) => {
    const { email, codigo } = req.body;
    
    try {
        if (!email || !codigo) {
            return res.status(400).json({ error: 'Email y código son requeridos' });
        }
        
        // Buscar código válido
        const codigoValido = await db.query(
            `SELECT * FROM email_verification_codes 
             WHERE email = $1 AND codigo = $2 AND usado = FALSE AND fecha_expiracion > NOW()`,
            [email, codigo]
        );
        
        if (codigoValido.rows.length === 0) {
            return res.status(400).json({ error: 'Código inválido o expirado' });
        }
        
        // Verificar que el usuario existe (debe existir porque se creó en el registro)
        const usuario = await db.query('SELECT * FROM usuario WHERE email = $1', [email]);
        if (usuario.rows.length === 0) {
            await db.query('UPDATE email_verification_codes SET usado = TRUE WHERE email = $1', [email]);
            return res.status(400).json({ error: 'Usuario no encontrado. Por favor, regístrate nuevamente.' });
        }
        
        // Verificar si el email ya está verificado
        if (usuario.rows[0].email_verificado) {
            await db.query('UPDATE email_verification_codes SET usado = TRUE WHERE email = $1 AND codigo = $2', [email, codigo]);
            return res.status(400).json({ error: 'Este correo electrónico ya está verificado' });
        }
        
        // ACTUALIZAR el usuario para marcar el email como verificado
        const updatedUser = await db.query(
            `UPDATE usuario SET email_verificado = TRUE 
             WHERE email = $1 
             RETURNING id_usuario, username, nombre, apellido, email`,
            [email]
        );
        
        // Marcar código como usado
        await db.query('UPDATE email_verification_codes SET usado = TRUE WHERE email = $1 AND codigo = $2', [email, codigo]);
        
        const userData = {
            id: updatedUser.rows[0].id_usuario,
            username: updatedUser.rows[0].username,
            nombre: updatedUser.rows[0].nombre,
            apellido: updatedUser.rows[0].apellido,
            email: updatedUser.rows[0].email
        };
        
        // Generar token JWT ahora que el email está verificado
        const payload = { user: userData };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) {
                logger.error('Error al generar token JWT', err);
                return res.status(500).json({ error: 'Error al generar token' });
            }
            
            res.json({
                message: 'Email verificado exitosamente. Tu cuenta ha sido activada.',
                token,
                user: userData
            });
        });
        
    } catch (err) {
        logger.error('Error al verificar email', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Reenviar código de verificación
exports.reenviarCodigoVerificacion = async (req, res) => {
    const { email } = req.body;
    
    try {
        if (!email) {
            return res.status(400).json({ error: 'El correo electrónico es requerido' });
        }
        
        // Verificar que el usuario existe (la cuenta ya debe estar creada)
        const usuario = await db.query('SELECT * FROM usuario WHERE email = $1', [email]);
        if (usuario.rows.length === 0) {
            return res.status(400).json({ error: 'No existe una cuenta asociada a este correo electrónico' });
        }
        
        // Verificar si el email ya está verificado
        if (usuario.rows[0].email_verificado) {
            return res.status(400).json({ error: 'Este correo electrónico ya está verificado' });
        }
        
        const userData = usuario.rows[0];
        
        // Buscar código pendiente o crear uno nuevo
        const codigoPendiente = await db.query(
            'SELECT * FROM email_verification_codes WHERE email = $1 AND usado = FALSE AND fecha_expiracion > NOW()',
            [email]
        );
        
        // Generar nuevo código
        const codigoVerificacion = Math.floor(100000 + Math.random() * 900000).toString();
        
        if (codigoPendiente.rows.length > 0) {
            // Actualizar código existente
            await db.query(
                'UPDATE email_verification_codes SET codigo = $1, fecha_expiracion = NOW() + INTERVAL \'24 hours\' WHERE email = $2',
                [codigoVerificacion, email]
            );
        } else {
            // Crear nuevo código
            await db.query(
                'INSERT INTO email_verification_codes (email, codigo) VALUES ($1, $2)',
                [email, codigoVerificacion]
            );
        }
        
        // Enviar correo
        const emailEnviado = await sendVerificationEmail(
            email,
            userData.username,
            userData.nombre || userData.username,
            codigoVerificacion
        );
        
        if (!emailEnviado) {
            logger.warn('No se pudo enviar el correo de verificación', { email });
            return res.status(500).json({ 
                error: 'No se pudo enviar el correo de verificación. Por favor, verifica la configuración del servidor.' 
            });
        }
        
        res.json({ 
            message: 'Se ha enviado un nuevo código de verificación a tu correo electrónico'
        });
        
    } catch (err) {
        logger.error('Error al reenviar código de verificación', err);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Validar código y resetear contraseña
exports.resetearPassword = async (req, res) => {
    const { email, codigo, nuevaPassword } = req.body;
    
    try {
        if (!email || !codigo || !nuevaPassword) {
            return res.status(400).json({ error: 'Email, código y nueva contraseña son requeridos' });
        }
        
        if (nuevaPassword.length < 6) {
            return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
        }
        
        // Verificar código
        const codigoValido = await db.query(
            `SELECT * FROM password_reset_codes 
             WHERE email = $1 AND codigo = $2 AND usado = FALSE AND fecha_expiracion > NOW() 
             ORDER BY fecha_creacion DESC LIMIT 1`,
            [email, codigo]
        );
        
        if (codigoValido.rows.length === 0) {
            return res.status(400).json({ error: 'Código inválido o expirado' });
        }
        
        // Verificar que el usuario existe
        const user = await db.query('SELECT id_usuario FROM usuario WHERE email = $1', [email]);
        
        if (user.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Hashear nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(nuevaPassword, salt);
        
        // Actualizar contraseña
        await db.query('UPDATE usuario SET password_hash = $1 WHERE email = $2', [hashedPassword, email]);
        
        // Marcar código como usado
        await db.query('UPDATE password_reset_codes SET usado = TRUE WHERE id = $1', [codigoValido.rows[0].id]);
        
        res.json({ message: 'Contraseña restablecida correctamente' });
        
    } catch (err) {
        console.error('Error al resetear contraseña:', err.message);
        res.status(500).json({ error: 'Error del servidor' });
    }
};