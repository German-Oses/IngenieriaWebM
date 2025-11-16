const db = require('../config/db');

// Obtener estadísticas del usuario
exports.getEstadisticas = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Obtener estadísticas generales
        const stats = await db.query(`
            SELECT 
                (SELECT COUNT(*) FROM post WHERE id_usuario = $1) as total_posts,
                (SELECT COUNT(*) FROM rutina WHERE id_usuario = $1) as total_rutinas,
                (SELECT COUNT(*) FROM seguimiento WHERE id_seguidor = $1) as total_siguiendo,
                (SELECT COUNT(*) FROM seguimiento WHERE id_seguido = $1) as total_seguidores,
                (SELECT COUNT(*) FROM reaccion re 
                 JOIN post p ON re.id_post = p.id_post 
                 WHERE p.id_usuario = $1) as total_likes_posts,
                (SELECT COUNT(*) FROM comentario c 
                 JOIN post p ON c.id_post = p.id_post 
                 WHERE p.id_usuario = $1) as total_comentarios_posts,
                (SELECT COUNT(*) FROM rutina_guardada rg 
                 JOIN rutina r ON rg.id_rutina = r.id_rutina 
                 WHERE r.id_usuario = $1) as total_rutinas_guardadas
        `, [userId]);
        
        // Obtener actividad reciente (últimos 30 días)
        const actividad = await db.query(`
            SELECT 
                DATE(fecha_publicacion) as fecha,
                COUNT(*) as cantidad
            FROM post
            WHERE id_usuario = $1 
            AND fecha_publicacion >= NOW() - INTERVAL '30 days'
            GROUP BY DATE(fecha_publicacion)
            ORDER BY fecha DESC
        `, [userId]);
        
        res.json({
            estadisticas: stats.rows[0],
            actividad_reciente: actividad.rows
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener progreso de rutinas
exports.getProgresoRutinas = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const progreso = await db.query(`
            SELECT 
                r.id_rutina,
                r.nombre_rutina,
                r.duracion_semanas,
                r.fecha_creacion,
                COUNT(DISTINCT p.id_post) as posts_completados,
                (SELECT COUNT(*) FROM rutina_dia rd WHERE rd.id_rutina = r.id_rutina) as total_dias
            FROM rutina r
            LEFT JOIN post p ON p.id_rutina = r.id_rutina AND p.id_usuario = $1
            WHERE r.id_usuario = $1
            GROUP BY r.id_rutina, r.nombre_rutina, r.duracion_semanas, r.fecha_creacion
            ORDER BY r.fecha_creacion DESC
        `, [userId]);
        
        res.json(progreso.rows);
    } catch (error) {
        console.error('Error al obtener progreso de rutinas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

