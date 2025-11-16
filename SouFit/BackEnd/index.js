

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const pool = require('./config/db');
const { generalLimiter, sanitizeInput, securityHeaders } = require('./middleware/security');
const { errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

const app = express();

// CORS debe ir PRIMERO para manejar las peticiones OPTIONS (preflight)
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:4200',
            'http://localhost:8100',
            'http://localhost:3000',
            'https://soufit.vercel.app',
            'https://ingenieria-web-m.vercel.app',
            process.env.FRONTEND_URL,
            // Permitir todos los dominios de Vercel (producción y previews)
            /^https:\/\/.*\.vercel\.app$/,
            /^https:\/\/.*\.vercel\.dev$/,
            // Permitir todos los dominios de Render (por si acaso)
            /^https:\/\/.*\.render\.com$/
        ].filter(Boolean);
        
        // Permitir peticiones sin origin:
        // - En desarrollo: siempre permitir (Postman, mobile apps, etc.)
        // - En producción: permitir (Render health checks, herramientas de monitoreo)
        // Las peticiones desde navegadores siempre tienen origin, así que esto es seguro
        if (!origin) {
            // En desarrollo, siempre permitir
            if (process.env.NODE_ENV !== 'production') {
                logger.debug('Permitiendo petición sin origin (desarrollo)');
                return callback(null, true);
            }
            
            // En producción, permitir peticiones sin origin
            // Render y otros servicios hacen health checks sin origin
            // Esto es seguro porque las peticiones desde navegadores siempre tienen origin
            logger.info('Permitiendo petición sin origin (probablemente health check o herramienta de monitoreo)');
            return callback(null, true);
        }
        
        // Log para debugging (info en producción para diagnosticar)
        logger.info('Verificando origin CORS', { origin, allowedOrigins: allowedOrigins.filter(o => typeof o === 'string') });
        
        // Verificar si el origin está en la lista o coincide con regex
        const isAllowed = allowedOrigins.some(allowed => {
            if (typeof allowed === 'string') {
                const matches = allowed === origin;
                if (matches) logger.info(`Origin permitido (string match): ${origin}`);
                return matches;
            } else if (allowed instanceof RegExp) {
                const matches = allowed.test(origin);
                if (matches) logger.info(`Origin permitido (regex match): ${origin}`);
                return matches;
            }
            return false;
        });
        
        if (isAllowed) {
            logger.info(`✅ Origin permitido: ${origin}`);
            callback(null, true);
        } else {
            logger.error('❌ Intento de acceso desde origen no permitido', { 
                origin, 
                allowedOrigins: allowedOrigins.filter(o => typeof o === 'string'),
                frontendUrl: process.env.FRONTEND_URL 
            });
            callback(new Error('No permitido por CORS'), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Middlewares de seguridad (después de CORS)
app.use(securityHeaders);
app.use(sanitizeInput);
app.use(generalLimiter);
app.use(express.json({ limit: '10mb' })); // Limitar tamaño de JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos de uploads
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:4200',
            'http://localhost:8100',
            'http://localhost:3000',
            'https://soufit.vercel.app',
            'https://ingenieria-web-m.vercel.app',
            process.env.FRONTEND_URL,
            // Permitir todos los dominios de Vercel (producción y previews)
            /^https:\/\/.*\.vercel\.app$/,
            /^https:\/\/.*\.vercel\.dev$/,
            // Permitir todos los dominios de Render (por si acaso)
            /^https:\/\/.*\.render\.com$/
        ].filter(Boolean);
        
        // Permitir peticiones sin origin (health checks de Render, herramientas de monitoreo)
        // Las peticiones desde navegadores siempre tienen origin, así que esto es seguro
        if (!origin) {
            logger.info('Permitiendo petición Socket.io sin origin (probablemente health check)');
            return callback(null, true);
        }
        
        logger.info('Verificando origin Socket.io CORS', { origin });
        
        const isAllowed = allowedOrigins.some(allowed => {
            if (typeof allowed === 'string') {
                const matches = allowed === origin;
                if (matches) logger.info(`Origin Socket.io permitido (string match): ${origin}`);
                return matches;
            } else if (allowed instanceof RegExp) {
                const matches = allowed.test(origin);
                if (matches) logger.info(`Origin Socket.io permitido (regex match): ${origin}`);
                return matches;
            }
            return false;
        });
        
        if (isAllowed) {
            logger.info(`✅ Origin Socket.io permitido: ${origin}`);
            callback(null, true);
        } else {
            logger.error('❌ Intento de conexión Socket.io desde origen no permitido', { 
                origin,
                allowedOrigins: allowedOrigins.filter(o => typeof o === 'string'),
                frontendUrl: process.env.FRONTEND_URL
            });
            callback(new Error('No permitido por CORS'), false);
        }
    },
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'X-Requested-With', 'Accept']
  }
});

io.on('connection', (socket) =>{
    logger.info('Usuario conectado', { socketId: socket.id });

    socket.on('entrar_chat', (id_usuario) => {
        socket.join('usuario_' + id_usuario);
        logger.debug(`Usuario ${id_usuario} ha entrado a su chat`, { socketId: socket.id });
    });

    socket.on('enviar_mensaje', async (data) => {
        const { id_remitente, id_destinatario, contenido, tipo_archivo, url_archivo, nombre_archivo } = data;
        try {
            const nuevoMensaje = await pool.query(
                'INSERT INTO mensaje (id_remitente, id_destinatario, contenido, tipo_archivo, url_archivo, nombre_archivo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',   
                [id_remitente, id_destinatario, contenido || null, tipo_archivo || null, url_archivo || null, nombre_archivo || null]
            );

            // Enviar mensaje al destinatario
            io.to('usuario_' + id_destinatario).emit('nuevo_mensaje', nuevoMensaje.rows[0]);
            
            // También enviar al remitente para actualización inmediata
            io.to('usuario_' + id_remitente).emit('nuevo_mensaje', nuevoMensaje.rows[0]);
            
            logger.debug('Mensaje enviado', { 
                remitente: id_remitente, 
                destinatario: id_destinatario 
            });
        } catch (err) {
            logger.error('Error al enviar mensaje por Socket.io', err);
        }
    });

    socket.on('disconnect', () => {
        logger.info('Usuario desconectado', { socketId: socket.id });
    });

});




// Definir y usar las rutas
logger.info('🔧 Montando rutas...');
try {
    const authRoutes = require('./routes/auth');
    app.use('/api/auth', (req, res, next) => {
        logger.info('📥 Petición recibida en /api/auth', { 
            method: req.method, 
            path: req.path,
            originalUrl: req.originalUrl,
            url: req.url
        });
        authRoutes(req, res, next);
    });
    logger.info('✅ Ruta /api/auth montada correctamente');
} catch (error) {
    logger.error('❌ Error al montar ruta /api/auth', error);
    throw error; // Re-lanzar para que el servidor no inicie con rutas rotas
}

try {
    app.use('/api/ubicacion', require('./routes/ubicacion'));
    logger.info('✅ Ruta /api/ubicacion montada correctamente');
} catch (error) {
    logger.error('❌ Error al montar ruta /api/ubicacion', error);
}

try {
    app.use('/api/profile', require('./routes/profile'));
    logger.info('✅ Ruta /api/profile montada correctamente');
} catch (error) {
    logger.error('❌ Error al montar ruta /api/profile', error);
}

// Configurar io en la ruta de mensajes antes de usarla
const mensajesRouter = require('./routes/mensajes');
mensajesRouter.setIO(io);
app.use('/api', mensajesRouter);

app.use('/api/ejercicios', require('./routes/ejercicios'));
app.use('/api/rutinas', require('./routes/rutinas'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/notificaciones', require('./routes/notificaciones'));
app.use('/api/external', require('./routes/external'));

// Health check endpoint mejorado
app.get('/api/health', async (req, res) => {
    try {
        // Verificar conexión a la base de datos
        await pool.query('SELECT 1');
        
        res.json({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: 'connected',
            environment: process.env.NODE_ENV || 'development'
        });
    } catch (err) {
        logger.error('Health check falló', err);
        res.status(503).json({
            status: 'error',
            timestamp: new Date().toISOString(),
            database: 'disconnected',
            error: 'Database connection failed'
        });
    }
});

// Middleware de manejo de errores (debe ir al final, antes de iniciar el servidor)
app.use(errorHandler);

// Manejo de rutas no encontradas (debe ir al final, después de todas las rutas)
// En Express 5, no se puede usar '*' directamente, se usa sin ruta para capturar todo
app.use((req, res) => {
    logger.warn('⚠️ Ruta no encontrada', { 
        method: req.method, 
        path: req.originalUrl,
        url: req.url,
        baseUrl: req.baseUrl
    });
    res.status(404).json({
        error: 'Ruta no encontrada',
        path: req.originalUrl,
        method: req.method
    });
});




// Render.com requiere PORT=10000, pero también acepta la variable PORT del entorno
const PORT = process.env.PORT || 3000;

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', error);
    process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
    logger.info(`Recibida señal ${signal}, cerrando servidor...`);
    
    server.close(() => {
        logger.info('Servidor HTTP cerrado');
        
        pool.end(() => {
            logger.info('Pool de base de datos cerrado');
            process.exit(0);
        });
    });
    
    // Forzar cierre después de 10 segundos
    setTimeout(() => {
        logger.error('Forzando cierre del servidor');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

server.listen(PORT, () => {
    logger.info(`🚀 Servidor backend corriendo en http://localhost:${PORT}`, {
        environment: process.env.NODE_ENV || 'development',
        port: PORT
    });
});