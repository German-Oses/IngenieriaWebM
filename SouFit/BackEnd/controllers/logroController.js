const db = require('../config/db');

// Obtener logros del usuario
exports.getLogros = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Crear tabla si no existe
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
        
        // Obtener logros del usuario con información del logro
        const query = `
            SELECT 
                ul.*,
                l.nombre_logro,
                l.descripcion,
                l.icono,
                l.categoria
            FROM usuario_logro ul
            JOIN logro l ON ul.id_logro = l.id_logro
            WHERE ul.id_usuario = $1
            ORDER BY ul.fecha_obtenido DESC
        `;
        
        const result = await db.query(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener logros:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Obtener todos los logros disponibles
exports.getLogrosDisponibles = async (req, res) => {
    try {
        const userId = req.user.id;
        
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
        
        // Obtener todos los logros con estado de obtención
        const query = `
            SELECT 
                l.*,
                CASE WHEN ul.id_usuario_logro IS NOT NULL THEN true ELSE false END as obtenido,
                ul.fecha_obtenido
            FROM logro l
            LEFT JOIN usuario_logro ul ON l.id_logro = ul.id_logro AND ul.id_usuario = $1
            ORDER BY l.categoria, l.nombre_logro
        `;
        
        const result = await db.query(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener logros disponibles:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Verificar y otorgar logros automáticamente
exports.verificarLogros = async (req, res) => {
    try {
        const userId = req.user.id;
        
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
        `, [userId]);
        
        const estadisticas = stats.rows[0];
        const logrosOtorgados = [];
        
        // Verificar cada logro
        const logros = await db.query('SELECT * FROM logro');
        
        for (const logro of logros.rows) {
            // Verificar si ya lo tiene
            const tieneLogro = await db.query(
                'SELECT * FROM usuario_logro WHERE id_usuario = $1 AND id_logro = $2',
                [userId, logro.id_logro]
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
                    [userId, logro.id_logro]
                );
                logrosOtorgados.push(logro);
            }
        }
        
        res.json({ logros_otorgados: logrosOtorgados });
    } catch (error) {
        console.error('Error al verificar logros:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

