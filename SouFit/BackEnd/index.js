

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares esenciales
app.use(cors());
app.use(express.json());

// Definir y usar las rutas
app.use('/api/auth', require('./routes/auth'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
});