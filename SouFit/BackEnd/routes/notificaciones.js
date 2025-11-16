const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacionController');
const auth = require('../middleware/authmiddleware');

// Todas las rutas requieren autenticación
router.get('/', auth, notificacionController.getNotificaciones);
router.get('/contador', auth, notificacionController.getContadorNoLeidas);
router.put('/:id/leida', auth, notificacionController.marcarLeida);
router.put('/todas/leidas', auth, notificacionController.marcarTodasLeidas);
router.delete('/:id', auth, notificacionController.deleteNotificacion);

module.exports = router;

