
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// FUNCIÓN DE REGISTRO 
exports.register = async (req, res) => {
    
    const { username, email, password, id_region, id_comuna } = req.body;

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
            'INSERT INTO usuario (username, email, password_hash, id_region, id_comuna) VALUES ($1, $2, $3, $4, $5) RETURNING id_usuario',
            [username, email, hashedPassword, id_region, id_comuna]
        );

        const payload = { user: { id: newUser.rows[0].id_usuario } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.status(201).json({ token });
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
        
        
            const user = await db.query('SELECT * FROM usuario WHERE email = $1', [email]);
            if (user.rows.length === 0) {
                return res.status(400).json({ msg: 'Credenciales inválidas' }); // <--- PROBABLEMENTE ESTO
            }

            
            const isMatch = await bcrypt.compare(password, user.rows[0].password_hash);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Credenciales inválidas' }); // <--- O ESTO
            }

      
        const payload = { user: { id: user.rows[0].id_usuario } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
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