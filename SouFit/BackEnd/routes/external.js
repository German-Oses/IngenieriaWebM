const express = require('express');
const router = express.Router();
const externalApiService = require('../services/externalApiService');
const auth = require('../middleware/authmiddleware');

// Buscar ejercicios en API externa
router.get('/ejercicios', auth, async (req, res) => {
    try {
        const { nombre, tipo, grupoMuscular } = req.query;
        const ejercicios = await externalApiService.buscarEjerciciosExternos(nombre, tipo, grupoMuscular);
        res.json(ejercicios);
    } catch (error) {
        console.error('Error al buscar ejercicios externos:', error);
        res.status(500).json({ error: 'Error al buscar ejercicios externos' });
    }
});

module.exports = router;

