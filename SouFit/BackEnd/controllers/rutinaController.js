const db = require('../config/db');
let notificationHelper = null;

// Función para establecer el helper de notificaciones
exports.setNotificationHelper = (helper) => {
    notificationHelper = helper;
};

// Obtener todas las rutinas públicas
exports.getRutinas = async (req, res) => {
    try {
        const { tipo_rutina, nivel_dificultad, busqueda, limit = 50, offset = 0 } = req.query;
        const userId = req.user?.id;
        
        let query = `
            SELECT 
                r.id_rutina,
                r.nombre_rutina,
                r.descripcion,
                r.tipo_rutina,
                r.duracion_semanas,
                r.nivel_dificultad,
                r.fecha_creacion,
                r.fecha_actualizacion,
                u.id_usuario as creador_id,
                u.username as creador_username,
                u.nombre || ' ' || u.apellido as creador_nombre,
                COUNT(DISTINCT re.id_reaccion) as total_likes,
                COUNT(DISTINCT rg.id_guardado) as total_guardados,
                CASE WHEN rg2.id_guardado IS NOT NULL THEN true ELSE false END as esta_guardada
            FROM rutina r
            LEFT JOIN usuario u ON r.id_usuario = u.id_usuario
            LEFT JOIN reaccion re ON re.id_rutina = r.id_rutina
            LEFT JOIN rutina_guardada rg ON rg.id_rutina = r.id_rutina
            LEFT JOIN rutina_guardada rg2 ON rg2.id_rutina = r.id_rutina AND rg2.id_usuario = $1
            WHERE r.es_publica = TRUE
        `;
        
        const params = [userId || null];
        let paramCount = 2;
        
        if (tipo_rutina) {
            query += ` AND r.tipo_rutina = $${paramCount}`;
            params.push(tipo_rutina);
            paramCount++;
        }
        
        if (nivel_dificultad) {
            query += ` AND r.nivel_dificultad = $${paramCount}`;
            params.push(nivel_dificultad);
            paramCount++;
        }
        
        if (busqueda) {
            query += ` AND (LOWER(r.nombre_rutina) LIKE LOWER($${paramCount}) OR LOWER(r.descripcion) LIKE LOWER($${paramCount}))`;
            params.push(`%${busqueda}%`);
            paramCount++;
        }
        
        query += ` GROUP BY r.id_rutina, u.id_usuario, u.username, u.nombre, u.apellido, rg2.id_guardado ORDER BY r.fecha_creacion DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener rutinas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener rutinas del usuario actual (con días y ejercicios)
exports.getMisRutinas = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Obtener rutinas
        const rutinasQuery = `
            SELECT 
                r.*,
                COUNT(DISTINCT re.id_reaccion) as total_likes,
                COUNT(DISTINCT rg.id_guardado) as total_guardados
            FROM rutina r
            LEFT JOIN reaccion re ON re.id_rutina = r.id_rutina
            LEFT JOIN rutina_guardada rg ON rg.id_rutina = r.id_rutina
            WHERE r.id_usuario = $1
            GROUP BY r.id_rutina
            ORDER BY r.fecha_creacion DESC
        `;
        
        const rutinasResult = await db.query(rutinasQuery, [userId]);
        const rutinas = rutinasResult.rows;
        
        // Para cada rutina, obtener sus días y ejercicios
        for (let rutina of rutinas) {
            const diasQuery = `
                SELECT * FROM rutina_dia 
                WHERE id_rutina = $1 
                ORDER BY orden, numero_dia
            `;
            const diasResult = await db.query(diasQuery, [rutina.id_rutina]);
            rutina.dias = diasResult.rows;
            
            // Para cada día, obtener sus ejercicios
            for (let dia of rutina.dias) {
                const ejerciciosQuery = `
                    SELECT 
                        re.*,
                        e.nombre_ejercicio,
                        e.descripcion as descripcion_ejercicio
                    FROM rutina_ejercicio re
                    JOIN ejercicio e ON re.id_ejercicio = e.id_ejercicio
                    WHERE re.id_dia = $1
                    ORDER BY re.orden
                `;
                const ejerciciosResult = await db.query(ejerciciosQuery, [dia.id_dia]);
                dia.ejercicios = ejerciciosResult.rows;
            }
        }
        
        res.json(rutinas);
    } catch (error) {
        console.error('Error al obtener mis rutinas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener una rutina por ID con sus días y ejercicios
exports.getRutinaById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;
        
        // Obtener información de la rutina
        const rutinaQuery = `
            SELECT 
                r.*,
                u.username as creador_username,
                u.nombre || ' ' || u.apellido as creador_nombre,
                COUNT(DISTINCT re.id_reaccion) as total_likes,
                COUNT(DISTINCT rg.id_guardado) as total_guardados,
                CASE WHEN rg2.id_guardado IS NOT NULL THEN true ELSE false END as esta_guardada
            FROM rutina r
            LEFT JOIN usuario u ON r.id_usuario = u.id_usuario
            LEFT JOIN reaccion re ON re.id_rutina = r.id_rutina
            LEFT JOIN rutina_guardada rg ON rg.id_rutina = r.id_rutina
            LEFT JOIN rutina_guardada rg2 ON rg2.id_rutina = r.id_rutina AND rg2.id_usuario = $2
            WHERE r.id_rutina = $1 AND (r.es_publica = TRUE OR r.id_usuario = $2)
            GROUP BY r.id_rutina, u.username, u.nombre, u.apellido, rg2.id_guardado
        `;
        
        const rutinaResult = await db.query(rutinaQuery, [id, userId || null]);
        
        if (rutinaResult.rows.length === 0) {
            return res.status(404).json({ error: 'Rutina no encontrada' });
        }
        
        const rutina = rutinaResult.rows[0];
        
        // Obtener días de la rutina
        const diasQuery = `
            SELECT * FROM rutina_dia 
            WHERE id_rutina = $1 
            ORDER BY orden, numero_dia
        `;
        
        const diasResult = await db.query(diasQuery, [id]);
        const dias = diasResult.rows;
        
        // Obtener ejercicios de cada día
        for (let dia of dias) {
            const ejerciciosQuery = `
                SELECT 
                    re.*,
                    e.nombre_ejercicio,
                    e.descripcion as ejercicio_descripcion,
                    e.tipo as ejercicio_tipo,
                    e.grupo_muscular,
                    e.url_media
                FROM rutina_ejercicio re
                JOIN ejercicio e ON re.id_ejercicio = e.id_ejercicio
                WHERE re.id_dia = $1
                ORDER BY re.orden
            `;
            
            const ejerciciosResult = await db.query(ejerciciosQuery, [dia.id_dia]);
            dia.ejercicios = ejerciciosResult.rows;
        }
        
        rutina.dias = dias;
        res.json(rutina);
    } catch (error) {
        console.error('Error al obtener rutina:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Crear una nueva rutina
exports.createRutina = async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const userId = req.user.id;
        const { nombre_rutina, descripcion, tipo_rutina, duracion_semanas, nivel_dificultad, es_publica = true, dias } = req.body;
        
        if (!nombre_rutina) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'El nombre de la rutina es requerido' });
        }
        
        // Crear la rutina
        const rutinaQuery = `
            INSERT INTO rutina (
                id_usuario, nombre_rutina, descripcion, tipo_rutina, 
                duracion_semanas, nivel_dificultad, es_publica
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        
        const rutinaResult = await client.query(rutinaQuery, [
            userId, nombre_rutina, descripcion, tipo_rutina, 
            duracion_semanas, nivel_dificultad, es_publica
        ]);
        
        const rutinaId = rutinaResult.rows[0].id_rutina;
        
        // Crear días y ejercicios si se proporcionan
        if (dias && Array.isArray(dias)) {
            for (let diaData of dias) {
                const { nombre_dia, numero_dia, descripcion: diaDescripcion, orden, ejercicios } = diaData;
                
                const diaQuery = `
                    INSERT INTO rutina_dia (id_rutina, numero_dia, nombre_dia, descripcion, orden)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING *
                `;
                
                const diaResult = await client.query(diaQuery, [
                    rutinaId, numero_dia || 1, nombre_dia, diaDescripcion, orden || 0
                ]);
                
                const diaId = diaResult.rows[0].id_dia;
                
                // Agregar ejercicios al día
                if (ejercicios && Array.isArray(ejercicios)) {
                    for (let ejercicioData of ejercicios) {
                        const { id_ejercicio, series, repeticiones, peso_recomendado, descanso_segundos, orden: ejercicioOrden, notas } = ejercicioData;
                        
                        const ejercicioQuery = `
                            INSERT INTO rutina_ejercicio (
                                id_dia, id_ejercicio, series, repeticiones, 
                                peso_recomendado, descanso_segundos, orden, notas
                            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        `;
                        
                        await client.query(ejercicioQuery, [
                            diaId, id_ejercicio, series, repeticiones,
                            peso_recomendado, descanso_segundos, ejercicioOrden || 0, notas
                        ]);
                    }
                }
            }
        }
        
        await client.query('COMMIT');
        
        // Verificar logros después de crear una rutina
        if (notificationHelper) {
            notificationHelper.verificarYOtorgarLogros(userId).catch(err => {
                console.error('Error al verificar logros:', err);
            });
        }
        
        res.status(201).json(rutinaResult.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al crear rutina:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    } finally {
        client.release();
    }
};

// Actualizar una rutina
exports.updateRutina = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { nombre_rutina, descripcion, tipo_rutina, duracion_semanas, nivel_dificultad, es_publica } = req.body;
        
        // Verificar que la rutina pertenece al usuario
        const rutina = await db.query('SELECT id_usuario FROM rutina WHERE id_rutina = $1', [id]);
        
        if (rutina.rows.length === 0) {
            return res.status(404).json({ error: 'Rutina no encontrada' });
        }
        
        if (rutina.rows[0].id_usuario !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para modificar esta rutina' });
        }
        
        const query = `
            UPDATE rutina SET
                nombre_rutina = COALESCE($1, nombre_rutina),
                descripcion = COALESCE($2, descripcion),
                tipo_rutina = COALESCE($3, tipo_rutina),
                duracion_semanas = COALESCE($4, duracion_semanas),
                nivel_dificultad = COALESCE($5, nivel_dificultad),
                es_publica = COALESCE($6, es_publica),
                fecha_actualizacion = NOW()
            WHERE id_rutina = $7
            RETURNING *
        `;
        
        const result = await db.query(query, [
            nombre_rutina, descripcion, tipo_rutina, duracion_semanas, 
            nivel_dificultad, es_publica, id
        ]);
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar rutina:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Eliminar una rutina
exports.deleteRutina = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const rutina = await db.query('SELECT id_usuario FROM rutina WHERE id_rutina = $1', [id]);
        
        if (rutina.rows.length === 0) {
            return res.status(404).json({ error: 'Rutina no encontrada' });
        }
        
        if (rutina.rows[0].id_usuario !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar esta rutina' });
        }
        
        await db.query('DELETE FROM rutina WHERE id_rutina = $1', [id]);
        res.json({ message: 'Rutina eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar rutina:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Guardar rutina como favorita
exports.guardarRutina = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const query = `
            INSERT INTO rutina_guardada (id_usuario, id_rutina)
            VALUES ($1, $2)
            ON CONFLICT (id_usuario, id_rutina) DO NOTHING
            RETURNING *
        `;
        
        const result = await db.query(query, [userId, id]);
        
        if (result.rows.length > 0) {
            // Crear notificación para el creador de la rutina usando el helper
            if (notificationHelper) {
                await notificationHelper.notificarRutinaGuardada(id, userId);
            } else {
                // Fallback: crear notificación directamente
                const rutina = await db.query('SELECT id_usuario FROM rutina WHERE id_rutina = $1', [id]);
                if (rutina.rows.length > 0 && rutina.rows[0].id_usuario !== userId) {
                    const usuario = await db.query('SELECT username FROM usuario WHERE id_usuario = $1', [userId]);
                    await db.query(
                        'INSERT INTO notificacion (id_usuario, tipo_notificacion, titulo, contenido, id_referencia, tipo_referencia) VALUES ($1, $2, $3, $4, $5, $6)',
                        [
                            rutina.rows[0].id_usuario,
                            'rutina_guardada',
                            'Tu rutina fue guardada',
                            `${usuario.rows[0]?.username || 'Un usuario'} guardó tu rutina`,
                            id,
                            'rutina'
                        ]
                    );
                }
            }
            
            res.json({ message: 'Rutina guardada como favorita', guardada: true });
        } else {
            res.json({ message: 'La rutina ya está guardada', guardada: true });
        }
    } catch (error) {
        console.error('Error al guardar rutina:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Quitar rutina de favoritos
exports.quitarRutinaGuardada = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        await db.query('DELETE FROM rutina_guardada WHERE id_usuario = $1 AND id_rutina = $2', [userId, id]);
        res.json({ message: 'Rutina eliminada de favoritos', guardada: false });
    } catch (error) {
        console.error('Error al quitar rutina guardada:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener rutinas guardadas del usuario
exports.getRutinasGuardadas = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = `
            SELECT 
                r.*,
                u.username as creador_username,
                rg.fecha_guardado
            FROM rutina_guardada rg
            JOIN rutina r ON rg.id_rutina = r.id_rutina
            LEFT JOIN usuario u ON r.id_usuario = u.id_usuario
            WHERE rg.id_usuario = $1
            ORDER BY rg.fecha_guardado DESC
        `;
        
        const result = await db.query(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener rutinas guardadas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Reaccionar a una rutina (like)
exports.reaccionarRutina = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { tipo_reaccion = 'like' } = req.body;
        
        const query = `
            INSERT INTO reaccion (id_usuario, id_rutina, tipo_reaccion)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
            RETURNING *
        `;
        
        const result = await db.query(query, [userId, id, tipo_reaccion]);
        
        if (result.rows.length > 0) {
            res.json({ message: 'Reacción agregada', reaccion: true });
        } else {
            // Si ya existe, eliminarlo (toggle)
            await db.query('DELETE FROM reaccion WHERE id_usuario = $1 AND id_rutina = $2', [userId, id]);
            res.json({ message: 'Reacción eliminada', reaccion: false });
        }
    } catch (error) {
        console.error('Error al reaccionar rutina:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Compartir una rutina
exports.compartirRutina = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        // Verificar que la rutina existe
        const rutina = await db.query('SELECT id_rutina FROM rutina WHERE id_rutina = $1', [id]);
        
        if (rutina.rows.length === 0) {
            return res.status(404).json({ error: 'Rutina no encontrada' });
        }
        
        // Aquí puedes agregar lógica para compartir (por ejemplo, incrementar contador)
        res.json({ message: 'Rutina compartida' });
    } catch (error) {
        console.error('Error al compartir rutina:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Crear un día para una rutina
exports.createRutinaDia = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id_rutina } = req.params;
        const { numero_dia, nombre_dia, descripcion, orden } = req.body;
        
        // Validar que la rutina existe y pertenece al usuario
        const rutina = await db.query('SELECT id_usuario FROM rutina WHERE id_rutina = $1', [id_rutina]);
        
        if (rutina.rows.length === 0) {
            return res.status(404).json({ error: 'Rutina no encontrada' });
        }
        
        if (rutina.rows[0].id_usuario !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para modificar esta rutina' });
        }
        
        // Validar número de día
        if (!numero_dia || numero_dia < 1) {
            return res.status(400).json({ error: 'El número de día debe ser mayor a 0' });
        }
        
        // Obtener el siguiente orden si no se proporciona
        let diaOrden = orden;
        if (diaOrden === undefined || diaOrden === null) {
            const ordenResult = await db.query(
                'SELECT COALESCE(MAX(orden), 0) + 1 as siguiente_orden FROM rutina_dia WHERE id_rutina = $1',
                [id_rutina]
            );
            diaOrden = ordenResult.rows[0].siguiente_orden;
        }
        
        // Crear el día
        const query = `
            INSERT INTO rutina_dia (id_rutina, numero_dia, nombre_dia, descripcion, orden)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `;
        
        const result = await db.query(query, [
            id_rutina,
            numero_dia,
            nombre_dia || `Día ${numero_dia}`,
            descripcion || null,
            diaOrden
        ]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear día de rutina:', error);
        
        // Manejar errores de duplicados
        if (error.code === '23505') {
            return res.status(409).json({ error: 'Ya existe un día con este número en esta rutina' });
        }
        
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Agregar ejercicio a un día de rutina
exports.agregarEjercicioARutina = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id_rutina } = req.params;
        const { id_dia, id_ejercicio, series, repeticiones, peso_recomendado, descanso_segundos, orden, notas } = req.body;
        
        // Verificar que la rutina pertenece al usuario
        const rutina = await db.query('SELECT id_usuario FROM rutina WHERE id_rutina = $1', [id_rutina]);
        
        if (rutina.rows.length === 0) {
            return res.status(404).json({ error: 'Rutina no encontrada' });
        }
        
        if (rutina.rows[0].id_usuario !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para modificar esta rutina' });
        }
        
        // Verificar que el día pertenece a la rutina
        const dia = await db.query('SELECT id_dia FROM rutina_dia WHERE id_dia = $1 AND id_rutina = $2', [id_dia, id_rutina]);
        
        if (dia.rows.length === 0) {
            return res.status(404).json({ error: 'Día de rutina no encontrado' });
        }
        
        // Verificar que el ejercicio existe
        const ejercicio = await db.query('SELECT id_ejercicio FROM ejercicio WHERE id_ejercicio = $1', [id_ejercicio]);
        
        if (ejercicio.rows.length === 0) {
            return res.status(404).json({ error: 'Ejercicio no encontrado' });
        }
        
        // Obtener el siguiente orden si no se proporciona
        let ejercicioOrden = orden;
        if (ejercicioOrden === undefined || ejercicioOrden === null) {
            const ordenResult = await db.query(
                'SELECT COALESCE(MAX(orden), 0) + 1 as siguiente_orden FROM rutina_ejercicio WHERE id_dia = $1',
                [id_dia]
            );
            ejercicioOrden = ordenResult.rows[0].siguiente_orden;
        }
        
        // Insertar el ejercicio en el día
        const query = `
            INSERT INTO rutina_ejercicio (
                id_dia, id_ejercicio, series, repeticiones, 
                peso_recomendado, descanso_segundos, orden, notas
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `;
        
        const result = await db.query(query, [
            id_dia, id_ejercicio, series || null, repeticiones || null,
            peso_recomendado || null, descanso_segundos || null, ejercicioOrden, notas || null
        ]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al agregar ejercicio a rutina:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

exports.compartirRutina = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        const query = `
            INSERT INTO compartido (id_usuario, id_rutina)
            VALUES ($1, $2)
            RETURNING *
        `;
        
        const result = await db.query(query, [userId, id]);
        
        // Crear notificación para el creador de la rutina usando el helper
        if (notificationHelper) {
            const rutina = await db.query('SELECT id_usuario FROM rutina WHERE id_rutina = $1', [id]);
            if (rutina.rows.length > 0 && rutina.rows[0].id_usuario !== userId) {
                const usuario = await db.query('SELECT username FROM usuario WHERE id_usuario = $1', [userId]);
                await notificationHelper.crearNotificacion(
                    rutina.rows[0].id_usuario,
                    'nuevo_compartido',
                    'Tu rutina fue compartida',
                    `${usuario.rows[0]?.username || 'Un usuario'} compartió tu rutina`,
                    id,
                    'rutina'
                );
            }
        } else {
            // Fallback: crear notificación directamente
            const rutina = await db.query('SELECT id_usuario FROM rutina WHERE id_rutina = $1', [id]);
            if (rutina.rows.length > 0 && rutina.rows[0].id_usuario !== userId) {
                const usuario = await db.query('SELECT username FROM usuario WHERE id_usuario = $1', [userId]);
                await db.query(
                    'INSERT INTO notificacion (id_usuario, tipo_notificacion, titulo, contenido, id_referencia, tipo_referencia) VALUES ($1, $2, $3, $4, $5, $6)',
                    [
                        rutina.rows[0].id_usuario,
                        'nuevo_compartido',
                        'Tu rutina fue compartida',
                        `${usuario.rows[0]?.username || 'Un usuario'} compartió tu rutina`,
                        id,
                        'rutina'
                    ]
                );
            }
        }
        
        res.json({ message: 'Rutina compartida', compartido: true });
    } catch (error) {
        console.error('Error al compartir rutina:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

