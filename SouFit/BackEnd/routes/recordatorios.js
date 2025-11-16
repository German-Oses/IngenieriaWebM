const express = require('express');
const router = express.Router();
const recordatorioController = require('../controllers/recordatorioController');
const auth = require('../middleware/authmiddleware');

router.get('/', auth, recordatorioController.getRecordatorios);
router.post('/', auth, recordatorioController.crearRecordatorio);
router.put('/:id', auth, recordatorioController.actualizarRecordatorio);
router.delete('/:id', auth, recordatorioController.eliminarRecordatorio);

module.exports = router;

