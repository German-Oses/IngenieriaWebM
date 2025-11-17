const db = require('../config/db');

// Crear recordatorio de entrenamiento
exports.crearRecordatorio = async (req, res) => {
    try {
        const userId = req.user.id;
        const { hora, dias_semana, mensaje, activo = true } = req.body;
        
        if (!hora || !dias_semana || !Array.isArray(dias_semana) || dias_semana.length === 0) {
            return res.status(400).json({ error: 'Hora y días de la semana son requeridos' });
        }
        
        // Crear tabla de recordatorios si no existe
        await db.query(`
            CREATE TABLE IF NOT EXISTS recordatorio_entrenamiento (
                id_recordatorio SERIAL PRIMARY KEY,
                id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
                hora TIME NOT NULL,
                dias_semana INTEGER[] NOT NULL,
                mensaje TEXT,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion TIMESTAMP DEFAULT NOW()
            )
        `);
        
        const result = await db.query(
            `INSERT INTO recordatorio_entrenamiento (id_usuario, hora, dias_semana, mensaje, activo)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [userId, hora, dias_semana, mensaje || '¡Es hora de entrenar!', activo]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear recordatorio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener recordatorios del usuario
exports.getRecordatorios = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Crear tabla si no existe
        await db.query(`
            CREATE TABLE IF NOT EXISTS recordatorio_entrenamiento (
                id_recordatorio SERIAL PRIMARY KEY,
                id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
                hora TIME NOT NULL,
                dias_semana INTEGER[] NOT NULL,
                mensaje TEXT,
                activo BOOLEAN DEFAULT TRUE,
                fecha_creacion TIMESTAMP DEFAULT NOW()
            )
        `);
        
        const result = await db.query(
            'SELECT * FROM recordatorio_entrenamiento WHERE id_usuario = $1 ORDER BY hora',
            [userId]
        );
        
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener recordatorios:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Actualizar recordatorio
exports.actualizarRecordatorio = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { hora, dias_semana, mensaje, activo } = req.body;
        
        // Verificar que el recordatorio pertenece al usuario
        const recordatorio = await db.query(
            'SELECT id_usuario FROM recordatorio_entrenamiento WHERE id_recordatorio = $1',
            [id]
        );
        
        if (recordatorio.rows.length === 0) {
            return res.status(404).json({ error: 'Recordatorio no encontrado' });
        }
        
        if (recordatorio.rows[0].id_usuario !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para modificar este recordatorio' });
        }
        
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (hora !== undefined) {
            updates.push(`hora = $${paramCount++}`);
            values.push(hora);
        }
        if (dias_semana !== undefined) {
            updates.push(`dias_semana = $${paramCount++}`);
            values.push(dias_semana);
        }
        if (mensaje !== undefined) {
            updates.push(`mensaje = $${paramCount++}`);
            values.push(mensaje);
        }
        if (activo !== undefined) {
            updates.push(`activo = $${paramCount++}`);
            values.push(activo);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }
        
        values.push(id);
        
        const query = `
            UPDATE recordatorio_entrenamiento
            SET ${updates.join(', ')}
            WHERE id_recordatorio = $${paramCount}
            RETURNING *
        `;
        
        const result = await db.query(query, values);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar recordatorio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Eliminar recordatorio
exports.eliminarRecordatorio = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        // Verificar que el recordatorio pertenece al usuario
        const recordatorio = await db.query(
            'SELECT id_usuario FROM recordatorio_entrenamiento WHERE id_recordatorio = $1',
            [id]
        );
        
        if (recordatorio.rows.length === 0) {
            return res.status(404).json({ error: 'Recordatorio no encontrado' });
        }
        
        if (recordatorio.rows[0].id_usuario !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este recordatorio' });
        }
        
        await db.query('DELETE FROM recordatorio_entrenamiento WHERE id_recordatorio = $1', [id]);
        res.json({ message: 'Recordatorio eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar recordatorio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

