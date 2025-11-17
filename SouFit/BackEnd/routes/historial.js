const express = require('express');
const router = express.Router();
const historialController = require('../controllers/historialController');
const auth = require('../middleware/authmiddleware');

router.get('/', auth, historialController.getHistorial);
router.get('/estadisticas', auth, historialController.getEstadisticasEntrenamiento);
router.post('/', auth, historialController.registrarEntrenamiento);
router.delete('/:id', auth, historialController.eliminarEntrenamiento);

module.exports = router;

