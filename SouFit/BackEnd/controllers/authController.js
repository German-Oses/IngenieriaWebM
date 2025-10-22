// controllers/authController.js
const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. FUNCIÓN DE REGISTRO
exports.register = async (req, res) => {
    const { username, email, region, comuna, password } = req.body;
    try {
        const emailExists = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (emailExists.rows.length > 0) {
            return res.status(400).json({ msg: 'El correo electrónico ya está registrado' });
        }

        const usernameExists = await db.query('SELECT * FROM usuarios WHERE username = $1', [username]);
        if (usernameExists.rows.length > 0) {
            return res.status(400).json({ msg: 'El nombre de usuario ya está en uso' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await db.query(
            'INSERT INTO usuarios (username, email, password, region, comuna) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [username, email, hashedPassword, region, comuna]
        );

        const payload = { user: { id: newUser.rows[0].id } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
            if (err) throw err;
            res.status(201).json({ token });
        });

    } catch (error) {
        console.error(error.message);
        res.status(500).send('Error en el servidor');
    }
};


exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (user.rows.length === 0) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        const isMatch = await bcrypt.compare(password, user.rows[0].password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Credenciales inválidas' });
        }

        const payload = { user: { id: user.rows[0].id } };
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

        const user = await db.query('SELECT id, username, email, region, comuna FROM usuarios WHERE id = $1', [req.user.id]);
        
        if (user.rows.length === 0) {
            return res.status(404).json({ msg: 'Usuario no encontrado' });
        }
        
        res.json(user.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error del Servidor');
    }
};