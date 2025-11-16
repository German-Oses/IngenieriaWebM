const express = require('express');
const router = express.Router();
const ejercicioController = require('../controllers/ejercicioController');
const auth = require('../middleware/authmiddleware');

// Rutas públicas (pueden acceder sin autenticación)
router.get('/', ejercicioController.getEjercicios);
router.get('/:id', ejercicioController.getEjercicioById);

// Rutas protegidas
router.post('/', auth, ejercicioController.createEjercicio);
router.put('/:id', auth, ejercicioController.updateEjercicio);
router.delete('/:id', auth, ejercicioController.deleteEjercicio);
router.post('/:id/guardar', auth, ejercicioController.guardarEjercicio);
router.delete('/:id/guardar', auth, ejercicioController.quitarEjercicioGuardado);
router.get('/usuario/guardados', auth, ejercicioController.getEjerciciosGuardados);
router.post('/:id/reaccionar', auth, ejercicioController.reaccionarEjercicio);

module.exports = router;

