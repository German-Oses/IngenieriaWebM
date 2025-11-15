const express = require('express');
const pool = require('../config/db');
const auth = require('../middleware/authmiddleware');
const router = express.Router();

// Obtener lista de chats del usuario actual
router.get('/chats', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Obtener todos los usuarios con los que el usuario actual ha tenido conversaciones
        const query = `
            SELECT DISTINCT 
                CASE 
                    WHEN m.id_remitente = $1 THEN m.id_destinatario
                    ELSE m.id_remitente
                END as id_usuario,
                u.nombre,
                u.apellido,
                u.avatar,
                MAX(m.fecha_envio) as fecha_ultimo_mensaje,
                (
                    SELECT contenido 
                    FROM mensaje m2 
                    WHERE (m2.id_remitente = $1 AND m2.id_destinatario = 
                        CASE 
                            WHEN m.id_remitente = $1 THEN m.id_destinatario
                            ELSE m.id_remitente
                        END)
                    OR (m2.id_destinatario = $1 AND m2.id_remitente = 
                        CASE 
                            WHEN m.id_remitente = $1 THEN m.id_destinatario
                            ELSE m.id_remitente
                        END)
                    ORDER BY m2.fecha_envio DESC 
                    LIMIT 1
                ) as ultimo_mensaje
            FROM mensaje m
            JOIN usuario u ON u.id = CASE 
                WHEN m.id_remitente = $1 THEN m.id_destinatario
                ELSE m.id_remitente
            END
            WHERE m.id_remitente = $1 OR m.id_destinatario = $1
            GROUP BY 
                CASE 
                    WHEN m.id_remitente = $1 THEN m.id_destinatario
                    ELSE m.id_remitente
                END, u.nombre, u.apellido, u.avatar
            ORDER BY MAX(m.fecha_envio) DESC
        `;
        
        const result = await pool.query(query, [userId]);
        
        // Formatear los resultados
        const chats = result.rows.map(row => ({
            id_usuario: row.id_usuario,
            nombre: `${row.nombre} ${row.apellido}`,
            ultimo_mensaje: row.ultimo_mensaje,
            fecha_ultimo_mensaje: row.fecha_ultimo_mensaje,
            avatar: row.avatar,
            en_linea: false // Esto se puede implementar más adelante con Socket.IO
        }));
        
        res.json(chats);
    } catch (error) {
        console.error('Error al obtener chats:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener historial de mensajes con un usuario específico
router.get('/mensajes/:otroUsuarioId', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const otroUsuarioId = req.params.otroUsuarioId;
        
        const query = `
            SELECT 
                id,
                id_remitente,
                id_destinatario,
                contenido,
                fecha_envio,
                leido
            FROM mensaje 
            WHERE (id_remitente = $1 AND id_destinatario = $2) 
               OR (id_remitente = $2 AND id_destinatario = $1)
            ORDER BY fecha_envio ASC
        `;
        
        const result = await pool.query(query, [userId, otroUsuarioId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener mensajes:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Marcar mensajes como leídos
router.put('/mensajes/marcar-leidos/:otroUsuarioId', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const otroUsuarioId = req.params.otroUsuarioId;
        
        const query = `
            UPDATE mensaje 
            SET leido = true 
            WHERE id_remitente = $1 AND id_destinatario = $2 AND leido = false
        `;
        
        await pool.query(query, [otroUsuarioId, userId]);
        res.json({ message: 'Mensajes marcados como leídos' });
    } catch (error) {
        console.error('Error al marcar mensajes como leídos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener todos los usuarios disponibles para chatear
router.get('/usuarios-disponibles', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = `
            SELECT id, nombre, apellido, email, avatar, username
            FROM usuario 
            WHERE id != $1
            ORDER BY nombre, apellido
        `;
        
        const result = await pool.query(query, [userId]);
        
        const usuarios = result.rows.map(row => ({
            id_usuario: row.id,
            nombre: `${row.nombre} ${row.apellido}`,
            username: row.username,
            email: row.email,
            avatar: row.avatar
        }));
        
        res.json(usuarios);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Buscar usuarios por username
router.get('/buscar-usuario/:username', auth, async (req, res) => {
    try {
        const username = req.params.username.toLowerCase();
        const userId = req.user.id;
        
        const query = `
            SELECT 
                u.id, 
                u.nombre, 
                u.apellido, 
                u.email, 
                u.avatar, 
                u.username,
                CASE WHEN s.id_seguido IS NOT NULL THEN true ELSE false END as siguiendo
            FROM usuario u
            LEFT JOIN seguimiento s ON u.id = s.id_seguido AND s.id_seguidor = $1
            WHERE LOWER(u.username) LIKE $2 AND u.id != $1
            ORDER BY u.username
            LIMIT 20
        `;
        
        const result = await pool.query(query, [userId, `%${username}%`]);
        
        const usuarios = result.rows.map(row => ({
            id_usuario: row.id,
            nombre: `${row.nombre} ${row.apellido}`,
            username: row.username,
            email: row.email,
            avatar: row.avatar,
            siguiendo: row.siguiendo
        }));
        
        res.json(usuarios);
    } catch (error) {
        console.error('Error al buscar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Seguir a un usuario
router.post('/seguir/:userId', auth, async (req, res) => {
    try {
        const seguidorId = req.user.id;
        const seguidoId = req.params.userId;
        
        if (seguidorId == seguidoId) {
            return res.status(400).json({ error: 'No puedes seguirte a ti mismo' });
        }
        
        // Verificar que el usuario a seguir existe
        const userExists = await pool.query('SELECT id FROM usuario WHERE id = $1', [seguidoId]);
        if (userExists.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        // Insertar el seguimiento
        const query = `
            INSERT INTO seguimiento (id_seguidor, id_seguido) 
            VALUES ($1, $2) 
            ON CONFLICT (id_seguidor, id_seguido) DO NOTHING
            RETURNING *
        `;
        
        const result = await pool.query(query, [seguidorId, seguidoId]);
        
        if (result.rows.length > 0) {
            res.json({ message: 'Usuario seguido correctamente', siguiendo: true });
        } else {
            res.json({ message: 'Ya sigues a este usuario', siguiendo: true });
        }
    } catch (error) {
        console.error('Error al seguir usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Dejar de seguir a un usuario
router.delete('/seguir/:userId', auth, async (req, res) => {
    try {
        const seguidorId = req.user.id;
        const seguidoId = req.params.userId;
        
        const query = 'DELETE FROM seguimiento WHERE id_seguidor = $1 AND id_seguido = $2';
        await pool.query(query, [seguidorId, seguidoId]);
        
        res.json({ message: 'Has dejado de seguir a este usuario', siguiendo: false });
    } catch (error) {
        console.error('Error al dejar de seguir:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener usuarios que sigo
router.get('/siguiendo', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = `
            SELECT 
                u.id,
                u.nombre,
                u.apellido, 
                u.username,
                u.avatar,
                s.fecha_seguimiento
            FROM seguimiento s
            JOIN usuario u ON s.id_seguido = u.id
            WHERE s.id_seguidor = $1
            ORDER BY s.fecha_seguimiento DESC
        `;
        
        const result = await pool.query(query, [userId]);
        
        const siguiendo = result.rows.map(row => ({
            id_usuario: row.id,
            nombre: `${row.nombre} ${row.apellido}`,
            username: row.username,
            avatar: row.avatar,
            fecha_seguimiento: row.fecha_seguimiento,
            siguiendo: true
        }));
        
        res.json(siguiendo);
    } catch (error) {
        console.error('Error al obtener usuarios seguidos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;