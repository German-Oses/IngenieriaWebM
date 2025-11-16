const db = require('../config/db');

// Obtener entrenamientos del calendario
exports.getCalendario = async (req, res) => {
    try {
        const userId = req.user.id;
        const { mes, año } = req.query;
        
        // Crear tabla si no existe
        await db.query(`
            CREATE TABLE IF NOT EXISTS calendario_entrenamiento (
                id_calendario SERIAL PRIMARY KEY,
                id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
                id_rutina INT REFERENCES rutina(id_rutina) ON DELETE SET NULL,
                fecha_entrenamiento DATE NOT NULL,
                hora TIME,
                completado BOOLEAN DEFAULT FALSE,
                notas TEXT,
                fecha_creacion TIMESTAMP DEFAULT NOW(),
                UNIQUE(id_usuario, fecha_entrenamiento)
            )
        `);
        
        let query = `
            SELECT 
                c.*,
                r.nombre_rutina,
                r.tipo_rutina,
                r.nivel_dificultad
            FROM calendario_entrenamiento c
            LEFT JOIN rutina r ON c.id_rutina = r.id_rutina
            WHERE c.id_usuario = $1
        `;
        
        const params = [userId];
        let paramCount = 2;
        
        if (mes && año) {
            query += ` AND EXTRACT(MONTH FROM c.fecha_entrenamiento) = $${paramCount} AND EXTRACT(YEAR FROM c.fecha_entrenamiento) = $${paramCount + 1}`;
            params.push(parseInt(mes), parseInt(año));
            paramCount += 2;
        }
        
        query += ` ORDER BY c.fecha_entrenamiento ASC, c.hora ASC`;
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener calendario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Agregar entrenamiento al calendario
exports.agregarEntrenamiento = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fecha, hora, id_rutina, notas } = req.body;
        
        if (!fecha) {
            return res.status(400).json({ error: 'La fecha es requerida' });
        }
        
        // Crear tabla si no existe
        await db.query(`
            CREATE TABLE IF NOT EXISTS calendario_entrenamiento (
                id_calendario SERIAL PRIMARY KEY,
                id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
                id_rutina INT REFERENCES rutina(id_rutina) ON DELETE SET NULL,
                fecha_entrenamiento DATE NOT NULL,
                hora TIME,
                completado BOOLEAN DEFAULT FALSE,
                notas TEXT,
                fecha_creacion TIMESTAMP DEFAULT NOW(),
                UNIQUE(id_usuario, fecha_entrenamiento)
            )
        `);
        
        const query = `
            INSERT INTO calendario_entrenamiento (id_usuario, fecha_entrenamiento, hora, id_rutina, notas)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (id_usuario, fecha_entrenamiento)
            DO UPDATE SET 
                hora = EXCLUDED.hora,
                id_rutina = EXCLUDED.id_rutina,
                notas = EXCLUDED.notas
            RETURNING *
        `;
        
        const result = await db.query(query, [
            userId, fecha, hora || null, id_rutina || null, notas || null
        ]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al agregar entrenamiento al calendario:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Marcar entrenamiento como completado
exports.marcarCompletado = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { completado = true } = req.body;
        
        // Verificar que el entrenamiento pertenece al usuario
        const entrenamiento = await db.query(
            'SELECT id_usuario FROM calendario_entrenamiento WHERE id_calendario = $1',
            [id]
        );
        
        if (entrenamiento.rows.length === 0) {
            return res.status(404).json({ error: 'Entrenamiento no encontrado' });
        }
        
        if (entrenamiento.rows[0].id_usuario !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para modificar este entrenamiento' });
        }
        
        const query = `
            UPDATE calendario_entrenamiento
            SET completado = $1
            WHERE id_calendario = $2
            RETURNING *
        `;
        
        const result = await db.query(query, [completado, id]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al marcar entrenamiento como completado:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Eliminar entrenamiento del calendario
exports.eliminarEntrenamiento = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        // Verificar que el entrenamiento pertenece al usuario
        const entrenamiento = await db.query(
            'SELECT id_usuario FROM calendario_entrenamiento WHERE id_calendario = $1',
            [id]
        );
        
        if (entrenamiento.rows.length === 0) {
            return res.status(404).json({ error: 'Entrenamiento no encontrado' });
        }
        
        if (entrenamiento.rows[0].id_usuario !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este entrenamiento' });
        }
        
        await db.query('DELETE FROM calendario_entrenamiento WHERE id_calendario = $1', [id]);
        res.json({ message: 'Entrenamiento eliminado del calendario' });
    } catch (error) {
        console.error('Error al eliminar entrenamiento:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

