const db = require('../config/db');

// Obtener notificaciones del usuario
exports.getNotificaciones = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50, offset = 0, solo_no_leidas = false } = req.query;
        
        let query = `
            SELECT 
                n.*,
                u.username as remitente_username,
                u.avatar as remitente_avatar
            FROM notificacion n
            LEFT JOIN usuario u ON n.id_referencia = u.id_usuario
            WHERE n.id_usuario = $1
        `;
        
        const params = [userId];
        let paramCount = 2;
        
        if (solo_no_leidas === 'true') {
            query += ` AND n.leida = FALSE`;
        }
        
        query += ` ORDER BY n.fecha_notificacion DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener notificaciones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Marcar notificación como leída
exports.marcarLeida = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const query = `
            UPDATE notificacion 
            SET leida = TRUE 
            WHERE id_notificacion = $1 AND id_usuario = $2
            RETURNING *
        `;
        
        const result = await db.query(query, [id, userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al marcar notificación como leída:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Marcar todas las notificaciones como leídas
exports.marcarTodasLeidas = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = `
            UPDATE notificacion 
            SET leida = TRUE 
            WHERE id_usuario = $1 AND leida = FALSE
        `;
        
        await db.query(query, [userId]);
        res.json({ message: 'Todas las notificaciones fueron marcadas como leídas' });
    } catch (error) {
        console.error('Error al marcar todas las notificaciones como leídas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener contador de notificaciones no leídas
exports.getContadorNoLeidas = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = `
            SELECT COUNT(*) as total
            FROM notificacion
            WHERE id_usuario = $1 AND leida = FALSE
        `;
        
        const result = await db.query(query, [userId]);
        res.json({ total: parseInt(result.rows[0].total) });
    } catch (error) {
        console.error('Error al obtener contador de notificaciones:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Eliminar una notificación
exports.deleteNotificacion = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const query = `
            DELETE FROM notificacion 
            WHERE id_notificacion = $1 AND id_usuario = $2
        `;
        
        const result = await db.query(query, [id, userId]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }
        
        res.json({ message: 'Notificación eliminada' });
    } catch (error) {
        console.error('Error al eliminar notificación:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

