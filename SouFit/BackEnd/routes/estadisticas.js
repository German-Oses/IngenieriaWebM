const express = require('express');
const router = express.Router();
const estadisticasController = require('../controllers/estadisticasController');
const auth = require('../middleware/authmiddleware');

router.get('/', auth, estadisticasController.getEstadisticas);
router.get('/rutinas', auth, estadisticasController.getProgresoRutinas);

module.exports = router;

