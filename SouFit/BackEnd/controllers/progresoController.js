const db = require('../config/db');

// Registrar progreso (peso, medidas)
exports.registrarProgreso = async (req, res) => {
    try {
        const userId = req.user.id;
        const { fecha, peso, altura, cintura, pecho, brazo, muslo, notas } = req.body;
        
        // Crear tabla si no existe
        await db.query(`
            CREATE TABLE IF NOT EXISTS progreso_fisico (
                id_progreso SERIAL PRIMARY KEY,
                id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
                fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,
                peso DECIMAL(5,2),
                altura DECIMAL(5,2),
                cintura DECIMAL(5,2),
                pecho DECIMAL(5,2),
                brazo DECIMAL(5,2),
                muslo DECIMAL(5,2),
                notas TEXT,
                fecha_creacion TIMESTAMP DEFAULT NOW(),
                UNIQUE(id_usuario, fecha_registro)
            )
        `);
        
        const query = `
            INSERT INTO progreso_fisico (
                id_usuario, fecha_registro, peso, altura, cintura, pecho, brazo, muslo, notas
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id_usuario, fecha_registro) 
            DO UPDATE SET 
                peso = EXCLUDED.peso,
                altura = EXCLUDED.altura,
                cintura = EXCLUDED.cintura,
                pecho = EXCLUDED.pecho,
                brazo = EXCLUDED.brazo,
                muslo = EXCLUDED.muslo,
                notas = EXCLUDED.notas
            RETURNING *
        `;
        
        const result = await db.query(query, [
            userId, fecha || new Date(), peso || null, altura || null,
            cintura || null, pecho || null, brazo || null, muslo || null, notas || null
        ]);
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al registrar progreso:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener progreso del usuario
exports.getProgreso = async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 100, offset = 0, fecha_desde, fecha_hasta } = req.query;
        
        // Crear tabla si no existe
        await db.query(`
            CREATE TABLE IF NOT EXISTS progreso_fisico (
                id_progreso SERIAL PRIMARY KEY,
                id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
                fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,
                peso DECIMAL(5,2),
                altura DECIMAL(5,2),
                cintura DECIMAL(5,2),
                pecho DECIMAL(5,2),
                brazo DECIMAL(5,2),
                muslo DECIMAL(5,2),
                notas TEXT,
                fecha_creacion TIMESTAMP DEFAULT NOW(),
                UNIQUE(id_usuario, fecha_registro)
            )
        `);
        
        let query = `
            SELECT * FROM progreso_fisico
            WHERE id_usuario = $1
        `;
        
        const params = [userId];
        let paramCount = 2;
        
        if (fecha_desde) {
            query += ` AND fecha_registro >= $${paramCount}`;
            params.push(fecha_desde);
            paramCount++;
        }
        
        if (fecha_hasta) {
            query += ` AND fecha_registro <= $${paramCount}`;
            params.push(fecha_hasta);
            paramCount++;
        }
        
        query += ` ORDER BY fecha_registro DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(parseInt(limit), parseInt(offset));
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener progreso:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener resumen de progreso
exports.getResumenProgreso = async (req, res) => {
    try {
        const userId = req.user.id;
        const { dias = 90 } = req.query;
        
        // Crear tabla si no existe
        await db.query(`
            CREATE TABLE IF NOT EXISTS progreso_fisico (
                id_progreso SERIAL PRIMARY KEY,
                id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
                fecha_registro DATE NOT NULL DEFAULT CURRENT_DATE,
                peso DECIMAL(5,2),
                altura DECIMAL(5,2),
                cintura DECIMAL(5,2),
                pecho DECIMAL(5,2),
                brazo DECIMAL(5,2),
                muslo DECIMAL(5,2),
                notas TEXT,
                fecha_creacion TIMESTAMP DEFAULT NOW(),
                UNIQUE(id_usuario, fecha_registro)
            )
        `);
        
        const query = `
            SELECT 
                COUNT(*) as total_registros,
                MIN(fecha_registro) as primera_fecha,
                MAX(fecha_registro) as ultima_fecha,
                MIN(peso) FILTER (WHERE peso IS NOT NULL) as peso_minimo,
                MAX(peso) FILTER (WHERE peso IS NOT NULL) as peso_maximo,
                AVG(peso) FILTER (WHERE peso IS NOT NULL) as peso_promedio,
                (SELECT peso FROM progreso_fisico WHERE id_usuario = $1 AND peso IS NOT NULL ORDER BY fecha_registro DESC LIMIT 1) as peso_actual,
                (SELECT peso FROM progreso_fisico WHERE id_usuario = $1 AND peso IS NOT NULL ORDER BY fecha_registro ASC LIMIT 1) as peso_inicial
            FROM progreso_fisico
            WHERE id_usuario = $1 
            AND fecha_registro >= CURRENT_DATE - INTERVAL '${parseInt(dias)} days'
        `;
        
        const result = await db.query(query, [userId]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener resumen de progreso:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Eliminar registro de progreso
exports.eliminarProgreso = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        
        // Verificar que el progreso pertenece al usuario
        const progreso = await db.query(
            'SELECT id_usuario FROM progreso_fisico WHERE id_progreso = $1',
            [id]
        );
        
        if (progreso.rows.length === 0) {
            return res.status(404).json({ error: 'Registro de progreso no encontrado' });
        }
        
        if (progreso.rows[0].id_usuario !== userId) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este registro' });
        }
        
        await db.query('DELETE FROM progreso_fisico WHERE id_progreso = $1', [id]);
        res.json({ message: 'Registro de progreso eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar progreso:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

