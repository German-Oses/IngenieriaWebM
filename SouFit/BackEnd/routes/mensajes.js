const express = require('express');
const db = require('../config/db');
const auth = require('../middleware/authmiddleware');
const upload = require('../middleware/upload');
const router = express.Router();

// Variable para almacenar la instancia de io (se establecerá desde index.js)
let ioInstance = null;

// Función para establecer la instancia de io
router.setIO = (io) => {
  ioInstance = io;
};

// Obtener lista de chats del usuario actual (solo con personas que sigo o con las que chateé)
router.get('/chats', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = `
            SELECT 
                t.id_usuario,
                u.nombre,
                u.apellido,
                u.username,
                u.avatar,
                MAX(t.fecha_envio) as fecha_ultimo_mensaje,
                (
                    -- Subconsulta para obtener el último mensaje para este chat_id
                    SELECT contenido 
                    FROM mensaje m2 
                    WHERE 
                        (m2.id_remitente = $1 AND m2.id_destinatario = t.id_usuario)
                        OR (m2.id_destinatario = $1 AND m2.id_remitente = t.id_usuario)
                    ORDER BY m2.fecha_envio DESC 
                    LIMIT 1
                ) as ultimo_mensaje
            FROM (
                -- Subconsulta (t) para identificar el ID del "otro usuario" (id_usuario)
                SELECT 
                    id_remitente,
                    id_destinatario,
                    fecha_envio,
                    CASE 
                        WHEN id_remitente = $1 THEN id_destinatario
                        ELSE id_remitente
                    END as id_usuario
                FROM mensaje 
                WHERE id_remitente = $1 OR id_destinatario = $1
            ) t
            JOIN usuario u ON u.id_usuario = t.id_usuario
            WHERE EXISTS (
                -- Solo mostrar chats con usuarios que sigo
                SELECT 1 FROM seguimiento s 
                WHERE s.id_seguidor = $1 AND s.id_seguido = t.id_usuario
            )
            OR EXISTS (
                -- O con los que he chateado (aunque no los siga)
                SELECT 1 FROM mensaje m
                WHERE (m.id_remitente = $1 AND m.id_destinatario = t.id_usuario)
                   OR (m.id_destinatario = $1 AND m.id_remitente = t.id_usuario)
            )
            GROUP BY 
                t.id_usuario, u.nombre, u.apellido, u.username, u.avatar
            ORDER BY MAX(t.fecha_envio) DESC
        `;
        
        const result = await db.query(query, [userId]);
        
        // Formatear los resultados
        const chats = result.rows.map(row => ({
            id_usuario: row.id_usuario,
            nombre: `${row.nombre || ''} ${row.apellido || ''}`.trim() || row.username,
            ultimo_mensaje: row.ultimo_mensaje,
            fecha_ultimo_mensaje: row.fecha_ultimo_mensaje,
            avatar: row.avatar,
            en_linea: false 
        }));
        
        res.json(chats);
    } catch (error) {
        console.error('Error al obtener chats:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener usuarios que sigo (ANTES de rutas con parámetros)
router.get('/siguiendo', auth, async (req, res) => {
    try {
        const userId = req.user.id; 
        
        const query = `
            SELECT 
                u.id_usuario,
                u.nombre,
                u.apellido, 
                u.username,
                u.avatar,
                s.fecha_seguimiento
            FROM seguimiento s
            JOIN usuario u ON s.id_seguido = u.id_usuario 
            WHERE s.id_seguidor = $1
            ORDER BY s.fecha_seguimiento DESC
        `;
        
        const result = await db.query(query, [userId]);
        
        const siguiendo = result.rows.map(row => ({
            id_usuario: row.id_usuario,
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

// Obtener seguidores del usuario actual (ANTES de rutas con parámetros)
router.get('/seguidores', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = `
            SELECT 
                u.id_usuario,
                u.nombre,
                u.apellido, 
                u.username,
                u.avatar,
                s.fecha_seguimiento
            FROM seguimiento s
            JOIN usuario u ON s.id_seguidor = u.id_usuario 
            WHERE s.id_seguido = $1
            ORDER BY s.fecha_seguimiento DESC
        `;
        
        const result = await db.query(query, [userId]);
        
        const seguidores = result.rows.map(row => ({
            id_usuario: row.id_usuario,
            nombre: `${row.nombre || ''} ${row.apellido || ''}`.trim() || row.username,
            username: row.username,
            avatar: row.avatar,
            fecha_seguimiento: row.fecha_seguimiento
        }));
        
        res.json(seguidores);
    } catch (error) {
        console.error('Error al obtener seguidores:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener historial de mensajes con un usuario específico (DESPUÉS de rutas específicas)
router.get('/mensajes/:otroUsuarioId', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const otroUsuarioId = parseInt(req.params.otroUsuarioId);
        
        if (isNaN(otroUsuarioId)) {
            return res.status(400).json({ error: 'ID de usuario inválido' });
        }
        
        const query = `
            SELECT 
                id_mensaje,
                id_remitente,
                id_destinatario,
                contenido,
                tipo_archivo,
                url_archivo,
                nombre_archivo,
                fecha_envio,
                leido
            FROM mensaje 
            WHERE (id_remitente = $1 AND id_destinatario = $2) 
                OR (id_remitente = $2 AND id_destinatario = $1)
            ORDER BY fecha_envio ASC
        `;
        
        const result = await db.query(query, [userId, otroUsuarioId]);
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
        
        await db.query(query, [otroUsuarioId, userId]);
        res.json({ message: 'Mensajes marcados como leídos' });
    } catch (error) {
        console.error('Error al marcar mensajes como leídos:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener contador de mensajes no leídos
router.get('/mensajes/contador-no-leidos', auth, async (req, res) => {
    try {
        // Validar que el usuario esté autenticado
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        
        const userId = req.user.id;
        
        // Validar que userId sea un número válido
        if (isNaN(userId) || userId <= 0) {
            return res.status(400).json({ error: 'ID de usuario inválido' });
        }
        
        const query = `
            SELECT COUNT(*) as total
            FROM mensaje
            WHERE id_destinatario = $1 AND (leido = false OR leido IS NULL)
        `;
        
        const result = await db.query(query, [userId]);
        
        // Validar que el resultado sea válido
        if (!result || !result.rows || result.rows.length === 0) {
            return res.json({ total: 0 });
        }
        
        const total = parseInt(result.rows[0].total) || 0;
        res.json({ total });
    } catch (error) {
        console.error('Error al obtener contador de mensajes no leídos:', error);
        // Si es un error de base de datos, devolver 500
        // Si es un error de validación, devolver 400
        if (error.code === '23505' || error.code === '23503') {
            res.status(400).json({ error: 'Error de validación en la base de datos' });
        } else {
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
});

// Obtener todos los usuarios disponibles para chatear (solo los que sigo o con los que chateé)
router.get('/usuarios-disponibles', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = `
            SELECT DISTINCT
                u.id_usuario, 
                u.nombre, 
                u.apellido, 
                u.avatar, 
                u.username,
                CASE WHEN s.id_seguido IS NOT NULL THEN true ELSE false END as siguiendo
            FROM usuario u
            LEFT JOIN seguimiento s ON u.id_usuario = s.id_seguido AND s.id_seguidor = $1
            WHERE u.id_usuario != $1
            AND (
                -- Usuarios que sigo
                s.id_seguido IS NOT NULL
                OR
                -- Usuarios con los que he chateado
                EXISTS (
                    SELECT 1 FROM mensaje m 
                    WHERE (m.id_remitente = $1 AND m.id_destinatario = u.id_usuario)
                       OR (m.id_destinatario = $1 AND m.id_remitente = u.id_usuario)
                )
            )
            ORDER BY siguiendo DESC, u.nombre, u.apellido
        `;
        
        const result = await db.query(query, [userId]);
        
        const usuarios = result.rows.map(row => ({
            id_usuario: row.id_usuario,
            nombre: `${row.nombre || ''} ${row.apellido || ''}`.trim() || row.username,
            username: row.username,
            avatar: row.avatar,
            siguiendo: row.siguiendo
        }));
        
        res.json(usuarios);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Buscar usuarios (mejorado con filtros)
router.get('/buscar-usuario', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, nombre, id_region, limit = 20, offset = 0 } = req.query;
        
        if (!username && !nombre) {
            return res.status(400).json({ error: 'Debe proporcionar username o nombre para buscar' });
        }
        
        let query = `
            SELECT 
                u.id_usuario,
                u.username,
                u.nombre,
                u.apellido,
                u.avatar,
                u.bio,
                (SELECT COUNT(*) FROM seguimiento WHERE id_seguido = u.id_usuario) as total_seguidores,
                (SELECT COUNT(*) FROM seguimiento WHERE id_seguidor = u.id_usuario) as total_siguiendo,
                (SELECT COUNT(*) FROM post WHERE id_usuario = u.id_usuario) as total_posts,
                CASE WHEN s.id_seguimiento IS NOT NULL THEN true ELSE false END as siguiendo
            FROM usuario u
            LEFT JOIN seguimiento s ON s.id_seguidor = $1 AND s.id_seguido = u.id_usuario
            WHERE u.id_usuario != $1
        `;
        
        const params = [userId];
        let paramCount = 2;
        
        if (username) {
            query += ` AND LOWER(u.username) LIKE LOWER($${paramCount})`;
            params.push(`%${username}%`);
            paramCount++;
        }
        
        if (nombre) {
            query += ` AND (LOWER(u.nombre) LIKE LOWER($${paramCount}) OR LOWER(u.apellido) LIKE LOWER($${paramCount}))`;
            params.push(`%${nombre}%`);
            paramCount++;
        }
        
        if (id_region) {
            query += ` AND u.id_region = $${paramCount}`;
            params.push(parseInt(id_region));
            paramCount++;
        }
        
        query += ` ORDER BY u.username ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al buscar usuarios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Buscar usuarios por username (compatibilidad)
router.get('/buscar-usuario/:username', auth, async (req, res) => {
    try {
        const username = req.params.username.toLowerCase();
        const userId = req.user.id;
        
        const query = `
            SELECT 
                u.id_usuario, 
                u.nombre, 
                u.apellido, 
                u.email, 
                u.avatar, 
                u.username,
                CASE WHEN s.id_seguido IS NOT NULL THEN true ELSE false END as siguiendo
            FROM usuario u
            -- CORRECCIÓN 1: u.id -> u.id_usuario
            LEFT JOIN seguimiento s ON u.id_usuario = s.id_seguido AND s.id_seguidor = $1
            -- CORRECCIÓN 2: u.id -> u.id_usuario
            WHERE LOWER(u.username) LIKE $2 AND u.id_usuario != $1
            ORDER BY u.username
            LIMIT 20
        `;
        
        const result = await db.query(query, [userId, `%${username}%`]);
        
        const usuarios = result.rows.map(row => ({
            id_usuario: row.id_usuario,
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
        const userExists = await db.query('SELECT id_usuario FROM usuario WHERE id_usuario = $1', [seguidoId]);
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
        
        const result = await db.query(query, [seguidorId, seguidoId]);
        
        if (result.rows.length > 0) {
            // Crear notificación para el usuario seguido
            const usuario = await db.query('SELECT username FROM usuario WHERE id_usuario = $1', [seguidorId]);
            const username = usuario.rows[0]?.username || 'Un usuario';
            
            await db.query(
                'INSERT INTO notificacion (id_usuario, tipo_notificacion, titulo, contenido, id_referencia, tipo_referencia) VALUES ($1, $2, $3, $4, $5, $6)',
                [
                    seguidoId,
                    'nuevo_seguidor',
                    'Nuevo seguidor',
                    `${username} comenzó a seguirte`,
                    seguidorId,
                    'usuario'
                ]
            );
            
            // Emitir notificación por Socket.io si está disponible
            const ioInstance = require('../index').getIO();
            if (ioInstance) {
                ioInstance.to(`usuario_${seguidoId}`).emit('nueva_notificacion', {
                    tipo_notificacion: 'nuevo_seguidor',
                    titulo: 'Nuevo seguidor',
                    contenido: `${username} comenzó a seguirte`,
                    id_referencia: seguidorId,
                    tipo_referencia: 'usuario'
                });
            }
            
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
        await db.query(query, [seguidorId, seguidoId]);
        
        res.json({ message: 'Has dejado de seguir a este usuario', siguiendo: false });
    } catch (error) {
        console.error('Error al dejar de seguir:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Enviar mensaje con archivo (imagen o audio)
router.post('/mensajes/enviar', auth, upload.single('archivo'), upload.validateFileSize, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id_destinatario, contenido } = req.body;
        const archivo = req.file;

        if (!id_destinatario) {
            return res.status(400).json({ error: 'ID de destinatario requerido' });
        }

        // Validar que haya contenido o archivo
        if (!contenido && !archivo) {
            return res.status(400).json({ error: 'Debe proporcionar contenido o un archivo' });
        }

        let tipo_archivo = null;
        let url_archivo = null;
        let nombre_archivo = null;

        if (archivo) {
            // Determinar tipo de archivo
            if (archivo.mimetype.startsWith('image/')) {
                tipo_archivo = 'imagen';
            } else if (archivo.mimetype.startsWith('audio/')) {
                tipo_archivo = 'audio';
            }

            // Construir URL del archivo
            const subfolder = tipo_archivo === 'imagen' ? 'imagenes' : 'audios';
            url_archivo = `/uploads/mensajes/${subfolder}/${archivo.filename}`;
            nombre_archivo = archivo.originalname;
        }

        // Insertar mensaje en la base de datos
        const query = `
            INSERT INTO mensaje (id_remitente, id_destinatario, contenido, tipo_archivo, url_archivo, nombre_archivo)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        const result = await db.query(query, [
            userId,
            id_destinatario,
            contenido || null,
            tipo_archivo,
            url_archivo,
            nombre_archivo
        ]);

        const nuevoMensaje = result.rows[0];

        // Emitir mensaje por Socket.IO si está disponible
        if (ioInstance) {
          ioInstance.to('usuario_' + id_destinatario).emit('nuevo_mensaje', nuevoMensaje);
          ioInstance.to('usuario_' + userId).emit('nuevo_mensaje', nuevoMensaje);
        }

        res.json(nuevoMensaje);
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Eliminar un mensaje (DELETE - CRUD completo)
router.delete('/mensajes/:idMensaje', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const idMensaje = parseInt(req.params.idMensaje);
        
        if (isNaN(idMensaje)) {
            return res.status(400).json({ error: 'ID de mensaje inválido' });
        }

        // Verificar que el mensaje pertenece al usuario (solo puede eliminar sus propios mensajes)
        const mensajeQuery = await db.query(
            'SELECT id_remitente, url_archivo FROM mensaje WHERE id_mensaje = $1',
            [idMensaje]
        );

        if (mensajeQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Mensaje no encontrado' });
        }

        const mensaje = mensajeQuery.rows[0];

        if (mensaje.id_remitente !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este mensaje' });
        }

        // Eliminar el archivo físico si existe
        if (mensaje.url_archivo) {
            const fs = require('fs');
            const path = require('path');
            const filePath = path.join(__dirname, '..', mensaje.url_archivo);
            
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            } catch (fileError) {
                console.error('Error al eliminar archivo físico:', fileError);
                // Continuar con la eliminación del mensaje aunque falle la eliminación del archivo
            }
        }

        // Eliminar el mensaje de la base de datos
        await db.query('DELETE FROM mensaje WHERE id_mensaje = $1', [idMensaje]);

        // Emitir evento por Socket.IO para notificar la eliminación
        if (ioInstance) {
            ioInstance.emit('mensaje_eliminado', { id_mensaje: idMensaje });
        }

        res.json({ message: 'Mensaje eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar mensaje:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Actualizar un mensaje (UPDATE - CRUD completo)
router.put('/mensajes/:idMensaje', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const idMensaje = parseInt(req.params.idMensaje);
        const { contenido } = req.body;
        
        if (isNaN(idMensaje)) {
            return res.status(400).json({ error: 'ID de mensaje inválido' });
        }

        if (!contenido || !contenido.trim()) {
            return res.status(400).json({ error: 'El contenido del mensaje es requerido' });
        }

        // Verificar que el mensaje pertenece al usuario
        const mensajeQuery = await db.query(
            'SELECT id_remitente FROM mensaje WHERE id_mensaje = $1',
            [idMensaje]
        );

        if (mensajeQuery.rows.length === 0) {
            return res.status(404).json({ error: 'Mensaje no encontrado' });
        }

        if (mensajeQuery.rows[0].id_remitente !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para editar este mensaje' });
        }

        // Actualizar el mensaje
        const updateQuery = await db.query(
            'UPDATE mensaje SET contenido = $1, fecha_envio = NOW() WHERE id_mensaje = $2 RETURNING *',
            [contenido.trim(), idMensaje]
        );

        const mensajeActualizado = updateQuery.rows[0];

        // Emitir evento por Socket.IO para notificar la actualización
        if (ioInstance) {
            ioInstance.emit('mensaje_actualizado', mensajeActualizado);
        }

        res.json(mensajeActualizado);
    } catch (error) {
        console.error('Error al actualizar mensaje:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;