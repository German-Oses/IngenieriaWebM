
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
        // Verificar que el username no esté en uso por otro usuario
        if (username) {
            const existingUser = await db.query(
                'SELECT id_usuario FROM usuario WHERE username = $1 AND id_usuario != $2',
                [username, userId]
            );
            if (existingUser.rows.length > 0) {
                return res.status(400).json({ msg: 'Ese nombre de usuario ya está en uso' });
            }
        }
        
        // Verificar que el email no esté en uso por otro usuario
        if (email) {
            const existingEmail = await db.query(
                'SELECT id_usuario FROM usuario WHERE email = $1 AND id_usuario != $2',
                [email, userId]
            );
            if (existingEmail.rows.length > 0) {
                return res.status(400).json({ msg: 'Ese correo electrónico ya está en uso' });
            }
        }
        
        const query = `
            UPDATE usuario SET
                username = COALESCE($1, username),
                nombre = COALESCE($2, nombre),
                apellido = COALESCE($3, apellido),
                email = COALESCE($4, email),
                bio = COALESCE($5, bio),
                avatar = COALESCE($6, avatar),
                fecha_nacimiento = COALESCE($7, fecha_nacimiento),
                id_region = COALESCE($8, id_region),
                id_comuna = COALESCE($9, id_comuna)
            WHERE id_usuario = $10
            RETURNING id_usuario, username, nombre, apellido, email, bio, avatar, fecha_nacimiento, id_region, id_comuna
        `;
        
        const result = await db.query(query, [
            username, nombre, apellido, email, bio, avatar, fecha_nacimiento, id_region, id_comuna, userId
        ]);
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
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