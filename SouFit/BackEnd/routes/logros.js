const express = require('express');
const router = express.Router();
const logroController = require('../controllers/logroController');
const auth = require('../middleware/authmiddleware');

router.get('/', auth, logroController.getLogros);
router.get('/disponibles', auth, logroController.getLogrosDisponibles);
router.post('/verificar', auth, logroController.verificarLogros);

module.exports = router;

