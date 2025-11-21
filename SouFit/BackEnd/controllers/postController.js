const db = require('../config/db');
let notificationHelper = null;

// Función para establecer el helper de notificaciones
exports.setNotificationHelper = (helper) => {
    notificationHelper = helper;
};

// Obtener feed comunitario (posts de usuarios seguidos y públicos)
exports.getFeed = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 20, offset = 0 } = req.query;
        
        const query = `
            SELECT 
                p.id_post,
                p.tipo_post,
                p.contenido,
                p.url_media,
                p.fecha_publicacion,
                p.fecha_actualizacion,
                u.id_usuario as autor_id,
                u.username as autor_username,
                u.nombre || ' ' || u.apellido as autor_nombre,
                u.avatar as autor_avatar,
                e.id_ejercicio,
                e.nombre_ejercicio,
                r.id_rutina,
                r.nombre_rutina,
                CAST(COUNT(DISTINCT re.id_reaccion) AS INTEGER) as total_likes,
                CAST(COUNT(DISTINCT c.id_comentario) AS INTEGER) as total_comentarios,
                CAST(COUNT(DISTINCT co.id_compartido) AS INTEGER) as total_compartidos,
                CASE WHEN re2.id_reaccion IS NOT NULL THEN true ELSE false END as me_gusta,
                CASE WHEN s.id_seguido IS NOT NULL THEN true ELSE false END as sigo_autor
            FROM post p
            JOIN usuario u ON p.id_usuario = u.id_usuario
            LEFT JOIN ejercicio e ON p.id_ejercicio = e.id_ejercicio
            LEFT JOIN rutina r ON p.id_rutina = r.id_rutina
            LEFT JOIN reaccion re ON re.id_post = p.id_post
            LEFT JOIN comentario c ON c.id_post = p.id_post
            LEFT JOIN compartido co ON co.id_post = p.id_post
            LEFT JOIN reaccion re2 ON re2.id_post = p.id_post AND re2.id_usuario = $1
            LEFT JOIN seguimiento s ON s.id_seguidor = $1 AND s.id_seguido = u.id_usuario
            WHERE p.id_usuario = $1 OR s.id_seguido IS NOT NULL
            GROUP BY p.id_post, u.id_usuario, u.username, u.nombre, u.apellido, u.avatar, 
                     e.id_ejercicio, e.nombre_ejercicio, r.id_rutina, r.nombre_rutina,
                     re2.id_reaccion, s.id_seguido
            ORDER BY p.fecha_publicacion DESC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await db.query(query, [userId, parseInt(limit), parseInt(offset)]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener feed:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener posts de un usuario específico
exports.getPostsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const currentUserId = req.user?.id;
        const { limit = 20, offset = 0 } = req.query;
        
        const query = `
            SELECT 
                p.*,
                u.username as autor_username,
                u.nombre || ' ' || u.apellido as autor_nombre,
                u.avatar as autor_avatar,
                CAST(COUNT(DISTINCT re.id_reaccion) AS INTEGER) as total_likes,
                CAST(COUNT(DISTINCT c.id_comentario) AS INTEGER) as total_comentarios,
                CASE WHEN re2.id_reaccion IS NOT NULL THEN true ELSE false END as me_gusta
            FROM post p
            JOIN usuario u ON p.id_usuario = u.id_usuario
            LEFT JOIN reaccion re ON re.id_post = p.id_post
            LEFT JOIN comentario c ON c.id_post = p.id_post
            LEFT JOIN reaccion re2 ON re2.id_post = p.id_post AND re2.id_usuario = $2
            WHERE p.id_usuario = $1
            GROUP BY p.id_post, u.username, u.nombre, u.apellido, u.avatar, re2.id_reaccion
            ORDER BY p.fecha_publicacion DESC
            LIMIT $3 OFFSET $4
        `;
        
        const result = await db.query(query, [userId, currentUserId || null, parseInt(limit), parseInt(offset)]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener posts del usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Crear un nuevo post
exports.createPost = async (req, res) => {
    try {
        // Validar que el usuario esté autenticado
        if (!req.user || !req.user.id) {
            // Si se subió un archivo pero hay error, eliminarlo
            if (req.file) {
                const fs = require('fs');
                try {
                    fs.unlinkSync(req.file.path);
                } catch (err) {
                    console.error('Error al eliminar archivo:', err);
                }
            }
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        
        const userId = req.user.id;
        
        // Validar que userId sea válido
        if (isNaN(userId) || userId <= 0) {
            // Si se subió un archivo pero hay error, eliminarlo
            if (req.file) {
                const fs = require('fs');
                try {
                    fs.unlinkSync(req.file.path);
                } catch (err) {
                    console.error('Error al eliminar archivo:', err);
                }
            }
            return res.status(400).json({ error: 'ID de usuario inválido' });
        }
        
        // Log para debugging
        console.log('=== CREAR POST ===');
        console.log('User ID:', userId);
        console.log('Body:', req.body);
        console.log('File:', req.file ? {
            filename: req.file.filename,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
        } : 'No hay archivo');
        
        const { tipo_post, contenido, url_media, id_ejercicio, id_rutina } = req.body;
        
        // Validar campos requeridos
        if (!tipo_post) {
            // Si se subió un archivo pero hay error, eliminarlo
            if (req.file) {
                const fs = require('fs');
                try {
                    fs.unlinkSync(req.file.path);
                    console.log('Archivo eliminado por error de validación');
                } catch (err) {
                    console.error('Error al eliminar archivo:', err);
                }
            }
            return res.status(400).json({ error: 'Tipo de post es requerido' });
        }
        
        // El contenido puede ser opcional si hay una imagen o URL de media
        const tieneContenido = contenido && contenido.trim().length > 0;
        const tieneMedia = req.file || (url_media && url_media.trim().length > 0);
        
        if (!tieneContenido && !tieneMedia) {
            // Si se subió un archivo pero hay error, eliminarlo
            if (req.file) {
                const fs = require('fs');
                try {
                    fs.unlinkSync(req.file.path);
                    console.log('Archivo eliminado por error de validación');
                } catch (err) {
                    console.error('Error al eliminar archivo:', err);
                }
            }
            return res.status(400).json({ error: 'El post debe tener contenido o una imagen' });
        }
        
        // Si hay contenido, validar longitud
        if (tieneContenido && contenido.trim().length > 1000) {
            if (req.file) {
                const fs = require('fs');
                try {
                    fs.unlinkSync(req.file.path);
                } catch (err) {
                    console.error('Error al eliminar archivo:', err);
                }
            }
            return res.status(400).json({ error: 'El contenido no puede exceder 1000 caracteres' });
        }
        
        // Si se subió un archivo, usar su URL en lugar de url_media del body
        let mediaUrl = null;
        if (req.file) {
            // Construir URL del archivo subido
            mediaUrl = `/uploads/posts/${req.file.filename}`;
            console.log('✅ Archivo subido correctamente:', {
                filename: req.file.filename,
                url: mediaUrl,
                path: req.file.path
            });
        } else if (url_media && url_media.trim()) {
            // Si no hay archivo pero hay URL en el body, usarla
            mediaUrl = url_media.trim();
            console.log('📎 Usando URL de media del body:', mediaUrl);
        } else {
            console.log('ℹ️ No hay media para este post');
        }
        
        // Convertir id_ejercicio e id_rutina a números o null
        const ejercicioId = id_ejercicio ? parseInt(id_ejercicio) : null;
        const rutinaId = id_rutina ? parseInt(id_rutina) : null;
        
        const query = `
            INSERT INTO post (id_usuario, tipo_post, contenido, url_media, id_ejercicio, id_rutina)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;
        
        const contenidoFinal = tieneContenido ? contenido.trim() : '';
        
        console.log('💾 Insertando post en BD:', {
            userId,
            tipo_post,
            contenido: contenidoFinal ? contenidoFinal.substring(0, 50) + '...' : '(vacío)',
            mediaUrl: mediaUrl || 'null',
            ejercicioId: ejercicioId || 'null',
            rutinaId: rutinaId || 'null'
        });
        
        const result = await db.query(query, [
            userId, 
            tipo_post,
            contenidoFinal, 
            mediaUrl, 
            ejercicioId, 
            rutinaId
        ]);
        
        console.log('✅ Post insertado en BD:', {
            id: result.rows[0].id_post,
            url_media_en_bd: result.rows[0].url_media,
            tiene_url: !!result.rows[0].url_media
        });
        
        // Obtener el post completo con información del autor y estadísticas
        const postQuery = `
            SELECT 
                p.*,
                u.username as autor_username,
                u.nombre || ' ' || u.apellido as autor_nombre,
                u.avatar as autor_avatar,
                u.id_usuario as autor_id,
                CAST(COUNT(DISTINCT re.id_reaccion) AS INTEGER) as total_likes,
                CAST(COUNT(DISTINCT c.id_comentario) AS INTEGER) as total_comentarios,
                CAST(COUNT(DISTINCT co.id_compartido) AS INTEGER) as total_compartidos,
                CASE WHEN re2.id_reaccion IS NOT NULL THEN true ELSE false END as me_gusta
            FROM post p
            JOIN usuario u ON p.id_usuario = u.id_usuario
            LEFT JOIN reaccion re ON re.id_post = p.id_post
            LEFT JOIN comentario c ON c.id_post = p.id_post
            LEFT JOIN compartido co ON co.id_post = p.id_post
            LEFT JOIN reaccion re2 ON re2.id_post = p.id_post AND re2.id_usuario = $1
            WHERE p.id_post = $2
            GROUP BY p.id_post, u.id_usuario, u.username, u.nombre, u.apellido, u.avatar, re2.id_reaccion
        `;
        
        const postResult = await db.query(postQuery, [userId, result.rows[0].id_post]);
        
        console.log('Post completo obtenido:', {
            id: postResult.rows[0].id_post,
            url_media: postResult.rows[0].url_media,
            tiene_media: !!postResult.rows[0].url_media
        });
        
        // Verificar logros después de crear un post
        if (notificationHelper) {
            notificationHelper.verificarYOtorgarLogros(userId).catch(err => {
                console.error('Error al verificar logros:', err);
            });
        }
        
        res.status(201).json(postResult.rows[0]);
    } catch (error) {
        console.error('Error al crear post:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Actualizar un post
exports.updatePost = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { contenido, url_media } = req.body;
        
        // Verificar que el post pertenece al usuario
        const post = await db.query('SELECT id_usuario FROM post WHERE id_post = $1', [id]);
        
        if (post.rows.length === 0) {
            return res.status(404).json({ error: 'Post no encontrado' });
        }
        
        if (post.rows[0].id_usuario !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para modificar este post' });
        }
        
        const query = `
            UPDATE post SET
                contenido = COALESCE($1, contenido),
                url_media = COALESCE($2, url_media),
                fecha_actualizacion = NOW()
            WHERE id_post = $3
            RETURNING *
        `;
        
        const result = await db.query(query, [contenido, url_media, id]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar post:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Eliminar un post
exports.deletePost = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const post = await db.query('SELECT id_usuario FROM post WHERE id_post = $1', [id]);
        
        if (post.rows.length === 0) {
            return res.status(404).json({ error: 'Post no encontrado' });
        }
        
        if (post.rows[0].id_usuario !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este post' });
        }
        
        await db.query('DELETE FROM post WHERE id_post = $1', [id]);
        res.json({ message: 'Post eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar post:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Reaccionar a un post (like)
exports.reaccionarPost = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { tipo_reaccion = 'like' } = req.body;
        
        // Verificar si ya existe la reacción
        const existe = await db.query(
            'SELECT id_reaccion FROM reaccion WHERE id_usuario = $1 AND id_post = $2',
            [userId, id]
        );
        
        if (existe.rows.length > 0) {
            // Eliminar reacción (toggle)
            await db.query('DELETE FROM reaccion WHERE id_usuario = $1 AND id_post = $2', [userId, id]);
            
            // Crear notificación de eliminación (opcional)
            res.json({ message: 'Reacción eliminada', reaccion: false });
        } else {
            // Crear reacción
            await db.query(
                'INSERT INTO reaccion (id_usuario, id_post, tipo_reaccion) VALUES ($1, $2, $3)',
                [userId, id, tipo_reaccion]
            );
            
            // Crear notificación para el autor del post usando el helper
            if (notificationHelper) {
                await notificationHelper.notificarReaccionPost(id, userId);
            } else {
                // Fallback: crear notificación directamente
                const post = await db.query('SELECT id_usuario FROM post WHERE id_post = $1', [id]);
                if (post.rows.length > 0 && post.rows[0].id_usuario !== userId) {
                    const usuario = await db.query('SELECT username FROM usuario WHERE id_usuario = $1', [userId]);
                    await db.query(
                        'INSERT INTO notificacion (id_usuario, tipo_notificacion, titulo, contenido, id_referencia, tipo_referencia) VALUES ($1, $2, $3, $4, $5, $6)',
                        [
                            post.rows[0].id_usuario,
                            'nuevo_like',
                            'Nueva reacción en tu post',
                            `${usuario.rows[0]?.username || 'Un usuario'} reaccionó a tu post`,
                            id,
                            'post'
                        ]
                    );
                }
            }
            
            res.json({ message: 'Reacción agregada', reaccion: true });
        }
    } catch (error) {
        console.error('Error al reaccionar post:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Comentar un post
exports.comentarPost = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { contenido } = req.body;
        
        if (!contenido) {
            return res.status(400).json({ error: 'El contenido del comentario es requerido' });
        }
        
        const query = `
            INSERT INTO comentario (id_usuario, id_post, contenido)
            VALUES ($1, $2, $3)
            RETURNING *
        `;
        
        const result = await db.query(query, [userId, id, contenido]);
        
        // Obtener comentario completo con información del usuario
        const comentarioQuery = `
            SELECT 
                c.*,
                u.username as autor_username,
                u.nombre || ' ' || u.apellido as autor_nombre,
                u.avatar as autor_avatar
            FROM comentario c
            JOIN usuario u ON c.id_usuario = u.id_usuario
            WHERE c.id_comentario = $1
        `;
        
        const comentarioResult = await db.query(comentarioQuery, [result.rows[0].id_comentario]);
        
        // Crear notificación para el autor del post usando el helper
        if (notificationHelper) {
            await notificationHelper.notificarComentarioPost(id, userId);
        } else {
            // Fallback: crear notificación directamente
            const post = await db.query('SELECT id_usuario FROM post WHERE id_post = $1', [id]);
            if (post.rows.length > 0 && post.rows[0].id_usuario !== userId) {
                const usuario = await db.query('SELECT username FROM usuario WHERE id_usuario = $1', [userId]);
                await db.query(
                    'INSERT INTO notificacion (id_usuario, tipo_notificacion, titulo, contenido, id_referencia, tipo_referencia) VALUES ($1, $2, $3, $4, $5, $6)',
                    [
                        post.rows[0].id_usuario,
                        'nuevo_comentario',
                        'Nuevo comentario en tu post',
                        `${usuario.rows[0]?.username || 'Un usuario'} comentó tu post`,
                        id,
                        'post'
                    ]
                );
            }
        }
        
        res.status(201).json(comentarioResult.rows[0]);
    } catch (error) {
        console.error('Error al comentar post:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener comentarios de un post
exports.getComentarios = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 50, offset = 0 } = req.query;
        
        const query = `
            SELECT 
                c.*,
                u.username as autor_username,
                u.nombre || ' ' || u.apellido as autor_nombre,
                u.avatar as autor_avatar
            FROM comentario c
            JOIN usuario u ON c.id_usuario = u.id_usuario
            WHERE c.id_post = $1
            ORDER BY c.fecha_comentario ASC
            LIMIT $2 OFFSET $3
        `;
        
        const result = await db.query(query, [id, parseInt(limit), parseInt(offset)]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener comentarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Compartir un post
exports.compartirPost = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const query = `
            INSERT INTO compartido (id_usuario, id_post)
            VALUES ($1, $2)
            RETURNING *
        `;
        
        const result = await db.query(query, [userId, id]);
        
        // Crear notificación para el autor del post usando el helper
        if (notificationHelper) {
            await notificationHelper.notificarCompartidoPost(id, userId);
        } else {
            // Fallback: crear notificación directamente
            const post = await db.query('SELECT id_usuario FROM post WHERE id_post = $1', [id]);
            if (post.rows.length > 0 && post.rows[0].id_usuario !== userId) {
                const usuario = await db.query('SELECT username FROM usuario WHERE id_usuario = $1', [userId]);
                await db.query(
                    'INSERT INTO notificacion (id_usuario, tipo_notificacion, titulo, contenido, id_referencia, tipo_referencia) VALUES ($1, $2, $3, $4, $5, $6)',
                    [
                        post.rows[0].id_usuario,
                        'nuevo_compartido',
                        'Tu post fue compartido',
                        `${usuario.rows[0]?.username || 'Un usuario'} compartió tu post`,
                        id,
                        'post'
                    ]
                );
            }
        }
        
        res.json({ message: 'Post compartido', compartido: true });
    } catch (error) {
        console.error('Error al compartir post:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

