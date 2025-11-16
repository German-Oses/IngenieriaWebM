
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// FUNCIÓN DE REGISTRO 
exports.register = async (req, res) => {
    
    const { username, email, password, nombre, apellido, id_region, id_comuna } = req.body;

    try {
     
        const emailExists = await db.query('SELECT * FROM usuario WHERE email = $1', [email]);
        if (emailExists.rows.length > 0) {
            return res.status(400).json({ msg: 'El correo electrónico ya está registrado' });
        }
        
        const usernameExists = await db.query('SELECT * FROM usuario WHERE username = $1', [username]);
        if (usernameExists.rows.length > 0) {
            return res.status(400).json({ msg: 'El nombre de usuario ya está en uso' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt); 


        const newUser = await db.query(
            'INSERT INTO usuario (username, email, password_hash, nombre, apellido, id_region, id_comuna) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id_usuario, username, nombre, apellido, email',
            [username, email, hashedPassword, nombre, apellido, id_region, id_comuna]
        );

        const userData = {
            id: newUser.rows[0].id_usuario,
            username: newUser.rows[0].username,
            nombre: newUser.rows[0].nombre,
            apellido: newUser.rows[0].apellido,
            email: newUser.rows[0].email
        };

        const payload = { user: userData };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.status(201).json({ 
                token,
                user: userData
            });
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
};

//FUNCIÓN DE LOGIN 
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        
        
            const user = await db.query('SELECT id_usuario, username, email, password_hash, nombre, apellido FROM usuario WHERE email = $1', [email]);
            if (user.rows.length === 0) {
                return res.status(400).json({ msg: 'Credenciales inválidas' }); // <--- PROBABLEMENTE ESTO
            }

            
            const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Credenciales inválidas' }); // <--- O ESTO
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
        console.error(error.message);
        res.status(500).send('Error en el servidor');
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
        
        // Verificar que el usuario existe
        const user = await db.query('SELECT id_usuario, email, nombre FROM usuario WHERE email = $1', [email]);
        
        if (user.rows.length === 0) {
            // Por seguridad, no revelar si el email existe o no
            return res.json({ 
                message: 'Si el correo existe, se enviará un código de recuperación',
                // En producción, siempre devolver este mensaje
            });
        }
        
        // Generar código de 6 dígitos
        const codigo = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Guardar código en base de datos (crear tabla si no existe)
        // Por ahora, usar una tabla temporal o almacenar en memoria (no recomendado para producción)
        // En producción, crear tabla: password_reset_codes (email, codigo, fecha_expiracion)
        
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
        
        // Eliminar códigos expirados
        await db.query('DELETE FROM password_reset_codes WHERE fecha_expiracion < NOW() OR usado = TRUE');
        
        // Guardar nuevo código
        await db.query(
            'INSERT INTO password_reset_codes (email, codigo) VALUES ($1, $2)',
            [email, codigo]
        );
        
        // En producción, aquí enviarías el correo con nodemailer
        // Por ahora, solo loguear (en desarrollo)
        console.log('========================================');
        console.log(`CÓDIGO DE RECUPERACIÓN PARA ${email}:`);
        console.log(`Código: ${codigo}`);
        console.log('========================================');
        
        // En producción, usar nodemailer:
        // const transporter = nodemailer.createTransport({...});
        // await transporter.sendMail({
        //   to: email,
        //   subject: 'Código de recuperación - SouFit',
        //   html: `<p>Tu código de recuperación es: <strong>${codigo}</strong></p><p>Válido por 15 minutos.</p>`
        // });
        
        res.json({ 
            message: 'Si el correo existe, se enviará un código de recuperación',
            // En desarrollo, también devolver el código (solo para testing)
            ...(process.env.NODE_ENV === 'development' && { codigo: codigo })
        });
        
    } catch (err) {
        console.error('Error al solicitar recuperación:', err.message);
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