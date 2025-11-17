const db = require('../config/db');

// Registrar entrenamiento completado
exports.registrarEntrenamiento = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id_rutina, id_ejercicio, fecha, notas, duracion_minutos, peso_usado, repeticiones, series } = req.body;
        
        // Crear tabla si no existe
        await db.query(`
            CREATE TABLE IF NOT EXISTS historial_entrenamiento (
                id_historial SERIAL PRIMARY KEY,
                id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
                id_rutina INT REFERENCES rutina(id_rutina) ON DELETE SET NULL,
                id_ejercicio INT REFERENCES ejercicio(id_ejercicio) ON DELETE SET NULL,
                fecha_entrenamiento DATE NOT NULL DEFAULT CURRENT_DATE,
                duracion_minutos INTEGER,
                peso_usado DECIMAL(10,2),
                repeticiones VARCHAR(50),
                series INTEGER,
                notas TEXT,
                fecha_registro TIMESTAMP DEFAULT NOW()
            )
        `);
        
        const query = `
            INSERT INTO historial_entrenamiento (
                id_usuario, id_rutina, id_ejercicio, fecha_entrenamiento,
                duracion_minutos, peso_usado, repeticiones, series, notas
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;
        
        const result = await db.query(query, [
            userId, id_rutina || null, id_ejercicio || null, fecha || new Date(),
            duracion_minutos || null, peso_usado || null, repeticiones || null, series || null, notas || null
        ]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al registrar entrenamiento:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener historial de entrenamientos
exports.getHistorial = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50, offset = 0, fecha_desde, fecha_hasta, id_rutina, id_ejercicio } = req.query;
        
        // Crear tabla si no existe
        await db.query(`
            CREATE TABLE IF NOT EXISTS historial_entrenamiento (
                id_historial SERIAL PRIMARY KEY,
                id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
                id_rutina INT REFERENCES rutina(id_rutina) ON DELETE SET NULL,
                id_ejercicio INT REFERENCES ejercicio(id_ejercicio) ON DELETE SET NULL,
                fecha_entrenamiento DATE NOT NULL DEFAULT CURRENT_DATE,
                duracion_minutos INTEGER,
                peso_usado DECIMAL(10,2),
                repeticiones VARCHAR(50),
                series INTEGER,
                notas TEXT,
                fecha_registro TIMESTAMP DEFAULT NOW()
            )
        `);
        
        let query = `
            SELECT 
                h.*,
                r.nombre_rutina,
                e.nombre_ejercicio
            FROM historial_entrenamiento h
            LEFT JOIN rutina r ON h.id_rutina = r.id_rutina
            LEFT JOIN ejercicio e ON h.id_ejercicio = e.id_ejercicio
            WHERE h.id_usuario = $1
        `;
        
        const params = [userId];
        let paramCount = 2;
        
        if (fecha_desde) {
            query += ` AND h.fecha_entrenamiento >= $${paramCount}`;
            params.push(fecha_desde);
            paramCount++;
        }
        
        if (fecha_hasta) {
            query += ` AND h.fecha_entrenamiento <= $${paramCount}`;
            params.push(fecha_hasta);
            paramCount++;
        }
        
        if (id_rutina) {
            query += ` AND h.id_rutina = $${paramCount}`;
            params.push(id_rutina);
            paramCount++;
        }
        
        if (id_ejercicio) {
            query += ` AND h.id_ejercicio = $${paramCount}`;
            params.push(id_ejercicio);
            paramCount++;
        }
        
        query += ` ORDER BY h.fecha_entrenamiento DESC, h.fecha_registro DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener estadísticas de entrenamiento
exports.getEstadisticasEntrenamiento = async (req, res) => {
    try {
        const userId = req.user.id;
        const { dias = 30 } = req.query;
        
        // Crear tabla si no existe
        await db.query(`
            CREATE TABLE IF NOT EXISTS historial_entrenamiento (
                id_historial SERIAL PRIMARY KEY,
                id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
                id_rutina INT REFERENCES rutina(id_rutina) ON DELETE SET NULL,
                id_ejercicio INT REFERENCES ejercicio(id_ejercicio) ON DELETE SET NULL,
                fecha_entrenamiento DATE NOT NULL DEFAULT CURRENT_DATE,
                duracion_minutos INTEGER,
                peso_usado DECIMAL(10,2),
                repeticiones VARCHAR(50),
                series INTEGER,
                notas TEXT,
                fecha_registro TIMESTAMP DEFAULT NOW()
            )
        `);
        
        const query = `
            SELECT 
                COUNT(*) as total_entrenamientos,
                SUM(duracion_minutos) as total_minutos,
                COUNT(DISTINCT fecha_entrenamiento) as dias_entrenados,
                COUNT(DISTINCT id_rutina) FILTER (WHERE id_rutina IS NOT NULL) as rutinas_diferentes,
                COUNT(DISTINCT id_ejercicio) FILTER (WHERE id_ejercicio IS NOT NULL) as ejercicios_diferentes,
                AVG(duracion_minutos) as promedio_minutos
            FROM historial_entrenamiento
            WHERE id_usuario = $1 
            AND fecha_entrenamiento >= CURRENT_DATE - INTERVAL '${parseInt(dias)} days'
        `;
        
        const result = await db.query(query, [userId]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener estadísticas de entrenamiento:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Eliminar entrada del historial
exports.eliminarEntrenamiento = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        // Verificar que el entrenamiento pertenece al usuario
        const entrenamiento = await db.query(
            'SELECT id_usuario FROM historial_entrenamiento WHERE id_historial = $1',
            [id]
        );
        
        if (entrenamiento.rows.length === 0) {
            return res.status(404).json({ error: 'Entrenamiento no encontrado' });
        }
        
        if (entrenamiento.rows[0].id_usuario !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este entrenamiento' });
        }
        
        await db.query('DELETE FROM historial_entrenamiento WHERE id_historial = $1', [id]);
        res.json({ message: 'Entrenamiento eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar entrenamiento:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

