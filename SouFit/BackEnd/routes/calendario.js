const express = require('express');
const router = express.Router();
const calendarioController = require('../controllers/calendarioController');
const auth = require('../middleware/authmiddleware');

router.get('/', auth, calendarioController.getCalendario);
router.post('/', auth, calendarioController.agregarEntrenamiento);
router.put('/:id/completado', auth, calendarioController.marcarCompletado);
router.delete('/:id', auth, calendarioController.eliminarEntrenamiento);

module.exports = router;

