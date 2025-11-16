const express = require('express');
const router = express.Router();
const notaController = require('../controllers/notaController');
const auth = require('../middleware/authmiddleware');

router.get('/', auth, notaController.getNotas);
router.get('/ejercicio/:id_ejercicio', auth, notaController.getNota);
router.post('/', auth, notaController.crearNota);
router.delete('/ejercicio/:id_ejercicio', auth, notaController.eliminarNota);

module.exports = router;

