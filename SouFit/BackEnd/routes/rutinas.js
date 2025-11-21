const express = require('express');
const router = express.Router();
const rutinaController = require('../controllers/rutinaController');
const auth = require('../middleware/authmiddleware');

// Rutas públicas
router.get('/', rutinaController.getRutinas);
router.get('/:id', rutinaController.getRutinaById);

// Rutas protegidas
router.get('/usuario/mis-rutinas', auth, rutinaController.getMisRutinas);
router.get('/usuario/guardadas', auth, rutinaController.getRutinasGuardadas);
router.post('/', auth, rutinaController.createRutina);
router.put('/:id', auth, rutinaController.updateRutina);
router.delete('/:id', auth, rutinaController.deleteRutina);
router.post('/:id/guardar', auth, rutinaController.guardarRutina);
router.delete('/:id/guardar', auth, rutinaController.quitarRutinaGuardada);
router.post('/:id/reaccionar', auth, rutinaController.reaccionarRutina);
router.post('/:id/compartir', auth, rutinaController.compartirRutina);
router.post('/:id_rutina/ejercicios', auth, rutinaController.agregarEjercicioARutina);

module.exports = router;

