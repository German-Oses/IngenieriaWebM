

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');
const pool = require('./config/db');

const app = express();

// Middlewares esenciales
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:4200",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) =>{
    console.log('Usuario conectado: ' + socket.id);

    socket.on('entrar_chat', (id_usuario) => {
        socket.join('usuario_' + id_usuario);
        console.log(`El usuario ${id_usuario} ha entrado a su chat.`);
    });

    socket.on('enviar_mensaje', async (data) => {
        const { id_remitente, id_destinatario, contenido } = data;
        try {
            const nuevoMensaje = await pool.query(
                'INSERT INTO mensaje (id_remitente, id_destinatario, contenido) VALUES ($1, $2, $3) RETURNING *',   
                [id_remitente, id_destinatario, contenido]
            );

            io.to('usuario_' + id_destinatario).emit('nuevo_mensaje', nuevoMensaje.rows[0]);
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
app.use('/api', require('./routes/mensajes'));




const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});