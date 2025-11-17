const db = require('../config/db');
const logger = require('./logger');

/**
 * Helper para crear notificaciones y emitirlas por Socket.io
 */
class NotificationHelper {
    constructor(io) {
        this.io = io;
    }

    /**
     * Crear notificación en la base de datos y emitir por Socket.io
     */
    async crearNotificacion(usuarioId, tipo, titulo, contenido, idReferencia = null, tipoReferencia = null) {
        try {
            const result = await db.query(
                `INSERT INTO notificacion (id_usuario, tipo_notificacion, titulo, contenido, id_referencia, tipo_referencia)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 RETURNING *`,
                [usuarioId, tipo, titulo, contenido, idReferencia, tipoReferencia]
            );

            const notificacion = result.rows[0];

            // Emitir notificación en tiempo real por Socket.io
            if (this.io) {
                this.io.to(`usuario_${usuarioId}`).emit('nueva_notificacion', notificacion);
                logger.debug('Notificación emitida por Socket.io', { 
                    usuarioId, 
                    tipo, 
                    socketId: `usuario_${usuarioId}` 
                });
            }

            return notificacion;
        } catch (error) {
            logger.error('Error al crear notificación', error);
            throw error;
        }
    }

    /**
     * Notificar cuando alguien reacciona a un post
     */
    async notificarReaccionPost(postId, usuarioQueReacciona) {
        try {
            const post = await db.query('SELECT id_usuario FROM post WHERE id_post = $1', [postId]);
            if (post.rows.length === 0 || post.rows[0].id_usuario === usuarioQueReacciona) {
                return; // No notificar si es el propio autor
            }

            const usuario = await db.query('SELECT username FROM usuario WHERE id_usuario = $1', [usuarioQueReacciona]);
            const username = usuario.rows[0]?.username || 'Un usuario';

            await this.crearNotificacion(
                post.rows[0].id_usuario,
                'nuevo_like',
                'Nueva reacción en tu post',
                `${username} reaccionó a tu post`,
                postId,
                'post'
            );
        } catch (error) {
            logger.error('Error al notificar reacción de post', error);
        }
    }

    /**
     * Notificar cuando alguien comenta un post
     */
    async notificarComentarioPost(postId, usuarioQueComenta) {
        try {
            const post = await db.query('SELECT id_usuario FROM post WHERE id_post = $1', [postId]);
            if (post.rows.length === 0 || post.rows[0].id_usuario === usuarioQueComenta) {
                return;
            }

            const usuario = await db.query('SELECT username FROM usuario WHERE id_usuario = $1', [usuarioQueComenta]);
            const username = usuario.rows[0]?.username || 'Un usuario';

            await this.crearNotificacion(
                post.rows[0].id_usuario,
                'nuevo_comentario',
                'Nuevo comentario en tu post',
                `${username} comentó tu post`,
                postId,
                'post'
            );
        } catch (error) {
            logger.error('Error al notificar comentario de post', error);
        }
    }

    /**
     * Notificar cuando alguien comparte un post
     */
    async notificarCompartidoPost(postId, usuarioQueComparte) {
        try {
            const post = await db.query('SELECT id_usuario FROM post WHERE id_post = $1', [postId]);
            if (post.rows.length === 0 || post.rows[0].id_usuario === usuarioQueComparte) {
                return;
            }

            const usuario = await db.query('SELECT username FROM usuario WHERE id_usuario = $1', [usuarioQueComparte]);
            const username = usuario.rows[0]?.username || 'Un usuario';

            await this.crearNotificacion(
                post.rows[0].id_usuario,
                'nuevo_compartido',
                'Tu post fue compartido',
                `${username} compartió tu post`,
                postId,
                'post'
            );
        } catch (error) {
            logger.error('Error al notificar compartido de post', error);
        }
    }

    /**
     * Notificar cuando alguien sigue a un usuario
     */
    async notificarNuevoSeguidor(usuarioSeguido, usuarioSeguidor) {
        try {
            if (usuarioSeguido === usuarioSeguidor) {
                return;
            }

            const usuario = await db.query('SELECT username FROM usuario WHERE id_usuario = $1', [usuarioSeguidor]);
            const username = usuario.rows[0]?.username || 'Un usuario';

            await this.crearNotificacion(
                usuarioSeguido,
                'nuevo_seguidor',
                'Nuevo seguidor',
                `${username} comenzó a seguirte`,
                usuarioSeguidor,
                'usuario'
            );
        } catch (error) {
            logger.error('Error al notificar nuevo seguidor', error);
        }
    }

    /**
     * Notificar cuando alguien comenta en una rutina
     */
    async notificarComentarioRutina(rutinaId, usuarioQueComenta) {
        try {
            const rutina = await db.query('SELECT id_usuario FROM rutina WHERE id_rutina = $1', [rutinaId]);
            if (rutina.rows.length === 0 || rutina.rows[0].id_usuario === usuarioQueComenta) {
                return;
            }

            const usuario = await db.query('SELECT username FROM usuario WHERE id_usuario = $1', [usuarioQueComenta]);
            const username = usuario.rows[0]?.username || 'Un usuario';

            await this.crearNotificacion(
                rutina.rows[0].id_usuario,
                'nuevo_comentario_rutina',
                'Nuevo comentario en tu rutina',
                `${username} comentó tu rutina`,
                rutinaId,
                'rutina'
            );
        } catch (error) {
            logger.error('Error al notificar comentario de rutina', error);
        }
    }

    /**
     * Notificar cuando alguien guarda una rutina
     */
    async notificarRutinaGuardada(rutinaId, usuarioQueGuarda) {
        try {
            const rutina = await db.query('SELECT id_usuario FROM rutina WHERE id_rutina = $1', [rutinaId]);
            if (rutina.rows.length === 0 || rutina.rows[0].id_usuario === usuarioQueGuarda) {
                return;
            }

            const usuario = await db.query('SELECT username FROM usuario WHERE id_usuario = $1', [usuarioQueGuarda]);
            const username = usuario.rows[0]?.username || 'Un usuario';

            await this.crearNotificacion(
                rutina.rows[0].id_usuario,
                'rutina_guardada',
                'Tu rutina fue guardada',
                `${username} guardó tu rutina`,
                rutinaId,
                'rutina'
            );
        } catch (error) {
            logger.error('Error al notificar rutina guardada', error);
        }
    }

    /**
     * Verificar y otorgar logros automáticamente
     */
    async verificarYOtorgarLogros(usuarioId) {
        try {
            // Crear tablas si no existen
            await db.query(`
                CREATE TABLE IF NOT EXISTS logro (
                    id_logro SERIAL PRIMARY KEY,
                    nombre_logro VARCHAR(100) NOT NULL,
                    descripcion TEXT,
                    icono VARCHAR(50),
                    categoria VARCHAR(50),
                    requisito_valor INTEGER,
                    fecha_creacion TIMESTAMP DEFAULT NOW()
                )
            `);
            
            await db.query(`
                CREATE TABLE IF NOT EXISTS usuario_logro (
                    id_usuario_logro SERIAL PRIMARY KEY,
                    id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
                    id_logro INT NOT NULL REFERENCES logro(id_logro) ON DELETE CASCADE,
                    fecha_obtenido TIMESTAMP DEFAULT NOW(),
                    UNIQUE(id_usuario, id_logro)
                )
            `);
            
            // Inicializar logros básicos si no existen
            await db.query(`
                INSERT INTO logro (nombre_logro, descripcion, icono, categoria, requisito_valor)
                VALUES 
                    ('Primer Post', 'Publica tu primer post', 'document-text', 'Publicaciones', 1),
                    ('Social', 'Consigue 10 seguidores', 'people', 'Social', 10),
                    ('Popular', 'Consigue 50 likes en tus posts', 'heart', 'Interacción', 50),
                    ('Creador', 'Crea 5 rutinas', 'barbell', 'Rutinas', 5),
                    ('Activo', 'Publica 20 posts', 'document-text', 'Publicaciones', 20),
                    ('Influencer', 'Consigue 100 seguidores', 'people', 'Social', 100),
                    ('Maestro', 'Consigue 500 likes en tus posts', 'heart', 'Interacción', 500)
                ON CONFLICT DO NOTHING
            `);
            
            // Obtener estadísticas del usuario
            const stats = await db.query(`
                SELECT 
                    (SELECT COUNT(*) FROM post WHERE id_usuario = $1) as total_posts,
                    (SELECT COUNT(*) FROM seguimiento WHERE id_seguido = $1) as total_seguidores,
                    (SELECT COUNT(*) FROM reaccion re JOIN post p ON re.id_post = p.id_post WHERE p.id_usuario = $1) as total_likes,
                    (SELECT COUNT(*) FROM rutina WHERE id_usuario = $1) as total_rutinas
            `, [usuarioId]);
            
            const estadisticas = stats.rows[0];
            const logrosOtorgados = [];
            
            // Verificar cada logro
            const logros = await db.query('SELECT * FROM logro');
            
            for (const logro of logros.rows) {
                // Verificar si ya lo tiene
                const tieneLogro = await db.query(
                    'SELECT * FROM usuario_logro WHERE id_usuario = $1 AND id_logro = $2',
                    [usuarioId, logro.id_logro]
                );
                
                if (tieneLogro.rows.length > 0) continue;
                
                let cumpleRequisito = false;
                
                switch (logro.nombre_logro) {
                    case 'Primer Post':
                        cumpleRequisito = parseInt(estadisticas.total_posts) >= 1;
                        break;
                    case 'Social':
                        cumpleRequisito = parseInt(estadisticas.total_seguidores) >= 10;
                        break;
                    case 'Popular':
                        cumpleRequisito = parseInt(estadisticas.total_likes) >= 50;
                        break;
                    case 'Creador':
                        cumpleRequisito = parseInt(estadisticas.total_rutinas) >= 5;
                        break;
                    case 'Activo':
                        cumpleRequisito = parseInt(estadisticas.total_posts) >= 20;
                        break;
                    case 'Influencer':
                        cumpleRequisito = parseInt(estadisticas.total_seguidores) >= 100;
                        break;
                    case 'Maestro':
                        cumpleRequisito = parseInt(estadisticas.total_likes) >= 500;
                        break;
                }
                
                if (cumpleRequisito) {
                    await db.query(
                        'INSERT INTO usuario_logro (id_usuario, id_logro) VALUES ($1, $2)',
                        [usuarioId, logro.id_logro]
                    );
                    
                    // Notificar al usuario sobre el logro obtenido
                    await this.crearNotificacion(
                        usuarioId,
                        'logro_obtenido',
                        '¡Logro desbloqueado!',
                        `Has obtenido el logro: ${logro.nombre_logro}`,
                        logro.id_logro,
                        'logro'
                    );
                    
                    logrosOtorgados.push(logro);
                }
            }
            
            return logrosOtorgados;
        } catch (error) {
            logger.error('Error al verificar logros', error);
            return [];
        }
    }
}

module.exports = NotificationHelper;

