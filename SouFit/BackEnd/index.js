

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const pool = require('./config/db');
const { generalLimiter, sanitizeInput, securityHeaders } = require('./middleware/security');

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
            // Permitir todos los dominios de Vercel (preview deployments)
            /^https:\/\/.*\.vercel\.app$/,
            // Permitir todos los dominios de Render
            /^https:\/\/.*\.render\.com$/
        ].filter(Boolean);
        
        // Permitir peticiones sin origin (ej: Postman, mobile apps)
        if (!origin) {
            return callback(null, true);
        }
        
        // Verificar si el origin está en la lista o coincide con regex
        const isAllowed = allowedOrigins.some(allowed => {
            if (typeof allowed === 'string') {
                return allowed === origin;
            } else if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return false;
        });
        
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'X-Requested-With'],
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
            /^https:\/\/.*\.vercel\.app$/,
            /^https:\/\/.*\.render\.com$/
        ].filter(Boolean);
        
        if (!origin) {
            return callback(null, true);
        }
        
        const isAllowed = allowedOrigins.some(allowed => {
            if (typeof allowed === 'string') {
                return allowed === origin;
            } else if (allowed instanceof RegExp) {
                return allowed.test(origin);
            }
            return false;
        });
        
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on('connection', (socket) =>{
    console.log('Usuario conectado: ' + socket.id);

    socket.on('entrar_chat', (id_usuario) => {
        socket.join('usuario_' + id_usuario);
        console.log(`El usuario ${id_usuario} ha entrado a su chat.`);
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
        } catch (err) {
            console.error('Error al enviar mensaje:', err);
        }
    });

    socket.on('disconnect', () => {
        console.log('Usuario desconectado: ' + socket.id);
    });

});




// Definir y usar las rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/ubicacion', require('./routes/ubicacion'));
app.use('/api/profile', require('./routes/profile'));

// Configurar io en la ruta de mensajes antes de usarla
const mensajesRouter = require('./routes/mensajes');
mensajesRouter.setIO(io);
app.use('/api', mensajesRouter);

app.use('/api/ejercicios', require('./routes/ejercicios'));
app.use('/api/rutinas', require('./routes/rutinas'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/notificaciones', require('./routes/notificaciones'));
app.use('/api/external', require('./routes/external'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});




const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});