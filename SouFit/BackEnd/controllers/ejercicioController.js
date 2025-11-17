const db = require('../config/db');

// Obtener todos los ejercicios (banco de ejercicios)
exports.getEjercicios = async (req, res) => {
    try {
        const { tipo, grupo_muscular, dificultad, busqueda, nombre, duracion_max, equipamiento, ordenar_por = 'fecha', limit = 50, offset = 0 } = req.query;
        
        let query = `
            SELECT 
                e.id_ejercicio,
                e.nombre_ejercicio,
                e.descripcion,
                e.tipo,
                e.grupo_muscular,
                e.dificultad,
                e.duracion_minutos,
                e.equipamiento,
                e.instrucciones,
                e.url_media,
                e.es_sistema,
                e.fecha_publicacion,
                u.username as creador_username,
                COUNT(DISTINCT r.id_reaccion) as total_likes,
                COUNT(DISTINCT eg.id_guardado) as total_guardados
            FROM ejercicio e
            LEFT JOIN usuario u ON e.id_usuario = u.id_usuario
            LEFT JOIN reaccion r ON r.id_ejercicio = e.id_ejercicio
            LEFT JOIN ejercicio_guardado eg ON eg.id_ejercicio = e.id_ejercicio
            WHERE 1=1
        `;
        
        const params = [];
        let paramCount = 1;
        
        if (tipo) {
            query += ` AND e.tipo = $${paramCount}`;
            params.push(tipo);
            paramCount++;
        }
        
        if (grupo_muscular) {
            query += ` AND e.grupo_muscular = $${paramCount}`;
            params.push(grupo_muscular);
            paramCount++;
        }
        
        if (dificultad) {
            query += ` AND e.dificultad = $${paramCount}`;
            params.push(dificultad);
            paramCount++;
        }
        
        if (busqueda || nombre) {
            const termino = busqueda || nombre;
            query += ` AND (LOWER(e.nombre_ejercicio) LIKE LOWER($${paramCount}) OR LOWER(e.descripcion) LIKE LOWER($${paramCount}))`;
            params.push(`%${termino}%`);
            paramCount++;
        }
        
        if (duracion_max) {
            query += ` AND e.duracion_minutos <= $${paramCount}`;
            params.push(parseInt(duracion_max));
            paramCount++;
        }
        
        if (equipamiento) {
            query += ` AND (LOWER(e.equipamiento) LIKE LOWER($${paramCount}) OR e.equipamiento IS NULL)`;
            params.push(`%${equipamiento}%`);
            paramCount++;
        }
        
        // Ordenamiento
        let orderBy = 'e.fecha_publicacion DESC';
        if (ordenar_por === 'nombre') {
            orderBy = 'e.nombre_ejercicio ASC';
        } else if (ordenar_por === 'duracion') {
            orderBy = 'e.duracion_minutos ASC';
        } else if (ordenar_por === 'likes') {
            orderBy = 'total_likes DESC';
        } else if (ordenar_por === 'guardados') {
            orderBy = 'total_guardados DESC';
        }
        
        query += ` GROUP BY e.id_ejercicio, u.username ORDER BY ${orderBy} LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener ejercicios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener un ejercicio por ID
exports.getEjercicioById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        
        const query = `
            SELECT 
                e.*,
                u.username as creador_username,
                u.nombre || ' ' || u.apellido as creador_nombre,
                COUNT(DISTINCT r.id_reaccion) as total_likes,
                COUNT(DISTINCT eg.id_guardado) as total_guardados,
                CASE WHEN eg2.id_guardado IS NOT NULL THEN true ELSE false END as esta_guardado,
                CASE WHEN r2.id_reaccion IS NOT NULL THEN true ELSE false END as me_gusta
            FROM ejercicio e
            LEFT JOIN usuario u ON e.id_usuario = u.id_usuario
            LEFT JOIN reaccion r ON r.id_ejercicio = e.id_ejercicio
            LEFT JOIN ejercicio_guardado eg ON eg.id_ejercicio = e.id_ejercicio
            LEFT JOIN ejercicio_guardado eg2 ON eg2.id_ejercicio = e.id_ejercicio AND eg2.id_usuario = $2
            LEFT JOIN reaccion r2 ON r2.id_ejercicio = e.id_ejercicio AND r2.id_usuario = $2
            WHERE e.id_ejercicio = $1
            GROUP BY e.id_ejercicio, u.username, u.nombre, u.apellido, eg2.id_guardado, r2.id_reaccion
        `;
        
        const result = await db.query(query, [id, userId || null]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ejercicio no encontrado' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener ejercicio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Crear un nuevo ejercicio
exports.createEjercicio = async (req, res) => {
    try {
        const userId = req.user.id;
        const { nombre_ejercicio, descripcion, tipo, grupo_muscular, dificultad, duracion_minutos, equipamiento, instrucciones, url_media } = req.body;
        
        if (!nombre_ejercicio) {
            return res.status(400).json({ error: 'El nombre del ejercicio es requerido' });
        }
        
        const query = `
            INSERT INTO ejercicio (
                id_usuario, nombre_ejercicio, descripcion, tipo, grupo_muscular, 
                dificultad, duracion_minutos, equipamiento, instrucciones, url_media, es_sistema
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, FALSE)
            RETURNING *
        `;
        
        const result = await db.query(query, [
            userId, nombre_ejercicio, descripcion, tipo, grupo_muscular,
            dificultad, duracion_minutos, equipamiento, instrucciones, url_media
        ]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear ejercicio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Actualizar un ejercicio
exports.updateEjercicio = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { nombre_ejercicio, descripcion, tipo, grupo_muscular, dificultad, duracion_minutos, equipamiento, instrucciones, url_media } = req.body;
        
        // Verificar que el ejercicio pertenece al usuario o es del sistema
        const ejercicio = await db.query('SELECT id_usuario, es_sistema FROM ejercicio WHERE id_ejercicio = $1', [id]);
        
        if (ejercicio.rows.length === 0) {
            return res.status(404).json({ error: 'Ejercicio no encontrado' });
        }
        
        if (ejercicio.rows[0].es_sistema) {
            return res.status(403).json({ error: 'No se pueden modificar ejercicios del sistema' });
        }
        
        if (ejercicio.rows[0].id_usuario !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para modificar este ejercicio' });
        }
        
        const query = `
            UPDATE ejercicio SET
                nombre_ejercicio = COALESCE($1, nombre_ejercicio),
                descripcion = COALESCE($2, descripcion),
                tipo = COALESCE($3, tipo),
                grupo_muscular = COALESCE($4, grupo_muscular),
                dificultad = COALESCE($5, dificultad),
                duracion_minutos = COALESCE($6, duracion_minutos),
                equipamiento = COALESCE($7, equipamiento),
                instrucciones = COALESCE($8, instrucciones),
                url_media = COALESCE($9, url_media)
            WHERE id_ejercicio = $10
            RETURNING *
        `;
        
        const result = await db.query(query, [
            nombre_ejercicio, descripcion, tipo, grupo_muscular, dificultad,
            duracion_minutos, equipamiento, instrucciones, url_media, id
        ]);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar ejercicio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Eliminar un ejercicio
exports.deleteEjercicio = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const ejercicio = await db.query('SELECT id_usuario, es_sistema FROM ejercicio WHERE id_ejercicio = $1', [id]);
        
        if (ejercicio.rows.length === 0) {
            return res.status(404).json({ error: 'Ejercicio no encontrado' });
        }
        
        if (ejercicio.rows[0].es_sistema) {
            return res.status(403).json({ error: 'No se pueden eliminar ejercicios del sistema' });
        }
        
        if (ejercicio.rows[0].id_usuario !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este ejercicio' });
        }
        
        await db.query('DELETE FROM ejercicio WHERE id_ejercicio = $1', [id]);
        res.json({ message: 'Ejercicio eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar ejercicio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Guardar ejercicio como favorito
exports.guardarEjercicio = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const query = `
            INSERT INTO ejercicio_guardado (id_usuario, id_ejercicio)
            VALUES ($1, $2)
            ON CONFLICT (id_usuario, id_ejercicio) DO NOTHING
            RETURNING *
        `;
        
        const result = await db.query(query, [userId, id]);
        
        if (result.rows.length > 0) {
            res.json({ message: 'Ejercicio guardado', guardado: true });
        } else {
            res.json({ message: 'Ejercicio ya estaba guardado', guardado: true });
        }
    } catch (error) {
        console.error('Error al guardar ejercicio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Quitar ejercicio de favoritos
exports.quitarEjercicioGuardado = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        await db.query('DELETE FROM ejercicio_guardado WHERE id_usuario = $1 AND id_ejercicio = $2', [userId, id]);
        res.json({ message: 'Ejercicio eliminado de favoritos', guardado: false });
    } catch (error) {
        console.error('Error al quitar ejercicio guardado:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener ejercicios guardados del usuario
exports.getEjerciciosGuardados = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = `
            SELECT 
                e.*,
                u.username as creador_username,
                eg.fecha_guardado
            FROM ejercicio_guardado eg
            JOIN ejercicio e ON eg.id_ejercicio = e.id_ejercicio
            LEFT JOIN usuario u ON e.id_usuario = u.id_usuario
            WHERE eg.id_usuario = $1
            ORDER BY eg.fecha_guardado DESC
        `;
        
        const result = await db.query(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener ejercicios guardados:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Reaccionar a un ejercicio (like)
exports.reaccionarEjercicio = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { tipo_reaccion = 'like' } = req.body;
        
        const query = `
            INSERT INTO reaccion (id_usuario, id_ejercicio, tipo_reaccion)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
            RETURNING *
        `;
        
        const result = await db.query(query, [userId, id, tipo_reaccion]);
        
        if (result.rows.length > 0) {
            res.json({ message: 'Reacción agregada', reaccion: true });
        } else {
            // Si ya existe, eliminarlo (toggle)
            await db.query('DELETE FROM reaccion WHERE id_usuario = $1 AND id_ejercicio = $2', [userId, id]);
            res.json({ message: 'Reacción eliminada', reaccion: false });
        }
    } catch (error) {
        console.error('Error al reaccionar ejercicio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

