const express = require('express');
const router = express.Router();
const db = require('../config/db'); 

// Endpoint para OBTENER TODAS LAS REGIONES
router.get('/regiones', async (req, res) => {
    try {
        const regiones = await db.query('SELECT * FROM region ORDER BY id_region');
        res.json(regiones.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
});

// Endpoint para OBTENER COMUNAS DE UNA REGIÓN ESPECÍFICA
router.get('/comunas/:id_region', async (req, res) => {
    try {
        const { id_region } = req.params;
        const comunas = await db.query('SELECT * FROM comuna WHERE id_region = $1 ORDER BY nombre_comuna', [id_region]);
        res.json(comunas.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Error en el servidor');
    }
});

module.exports = router;