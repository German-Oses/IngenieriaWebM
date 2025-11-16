const express = require('express');
const router = express.Router();
const progresoController = require('../controllers/progresoController');
const auth = require('../middleware/authmiddleware');

router.get('/', auth, progresoController.getProgreso);
router.get('/resumen', auth, progresoController.getResumenProgreso);
router.post('/', auth, progresoController.registrarProgreso);
router.delete('/:id', auth, progresoController.eliminarProgreso);

module.exports = router;

