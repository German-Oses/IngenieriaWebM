const db = require('../config/db');

// Crear o actualizar nota personal en ejercicio
exports.crearNota = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id_ejercicio, nota } = req.body;
        
        if (!id_ejercicio) {
            return res.status(400).json({ error: 'ID de ejercicio es requerido' });
        }
        
        // Crear tabla si no existe
        await db.query(`
            CREATE TABLE IF NOT EXISTS nota_ejercicio (
                id_nota SERIAL PRIMARY KEY,
                id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
                id_ejercicio INT NOT NULL REFERENCES ejercicio(id_ejercicio) ON DELETE CASCADE,
                nota TEXT,
                fecha_creacion TIMESTAMP DEFAULT NOW(),
                fecha_actualizacion TIMESTAMP DEFAULT NOW(),
                UNIQUE(id_usuario, id_ejercicio)
            )
        `);
        
        const query = `
            INSERT INTO nota_ejercicio (id_usuario, id_ejercicio, nota)
            VALUES ($1, $2, $3)
            ON CONFLICT (id_usuario, id_ejercicio)
            DO UPDATE SET 
                nota = EXCLUDED.nota,
                fecha_actualizacion = NOW()
            RETURNING *
        `;
        
        const result = await db.query(query, [userId, id_ejercicio, nota || '']);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear nota:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener nota de un ejercicio
exports.getNota = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id_ejercicio } = req.params;
        
        // Crear tabla si no existe
        await db.query(`
            CREATE TABLE IF NOT EXISTS nota_ejercicio (
                id_nota SERIAL PRIMARY KEY,
                id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
                id_ejercicio INT NOT NULL REFERENCES ejercicio(id_ejercicio) ON DELETE CASCADE,
                nota TEXT,
                fecha_creacion TIMESTAMP DEFAULT NOW(),
                fecha_actualizacion TIMESTAMP DEFAULT NOW(),
                UNIQUE(id_usuario, id_ejercicio)
            )
        `);
        
        const query = `
            SELECT * FROM nota_ejercicio
            WHERE id_usuario = $1 AND id_ejercicio = $2
        `;
        
        const result = await db.query(query, [userId, id_ejercicio]);
        
        if (result.rows.length === 0) {
            return res.json({ nota: null });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener nota:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener todas las notas del usuario
exports.getNotas = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Crear tabla si no existe
        await db.query(`
            CREATE TABLE IF NOT EXISTS nota_ejercicio (
                id_nota SERIAL PRIMARY KEY,
                id_usuario INT NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
                id_ejercicio INT NOT NULL REFERENCES ejercicio(id_ejercicio) ON DELETE CASCADE,
                nota TEXT,
                fecha_creacion TIMESTAMP DEFAULT NOW(),
                fecha_actualizacion TIMESTAMP DEFAULT NOW(),
                UNIQUE(id_usuario, id_ejercicio)
            )
        `);
        
        const query = `
            SELECT 
                n.*,
                e.nombre_ejercicio,
                e.grupo_muscular
            FROM nota_ejercicio n
            JOIN ejercicio e ON n.id_ejercicio = e.id_ejercicio
            WHERE n.id_usuario = $1
            ORDER BY n.fecha_actualizacion DESC
        `;
        
        const result = await db.query(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener notas:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Eliminar nota
exports.eliminarNota = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id_ejercicio } = req.params;
        
        // Verificar que la nota pertenece al usuario
        const nota = await db.query(
            'SELECT id_usuario FROM nota_ejercicio WHERE id_ejercicio = $1 AND id_usuario = $2',
            [id_ejercicio, userId]
        );
        
        if (nota.rows.length === 0) {
            return res.status(404).json({ error: 'Nota no encontrada' });
        }
        
        await db.query(
            'DELETE FROM nota_ejercicio WHERE id_ejercicio = $1 AND id_usuario = $2',
            [id_ejercicio, userId]
        );
        res.json({ message: 'Nota eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar nota:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

