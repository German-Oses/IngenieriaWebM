
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerRules, validate } = require('../middleware/validator');
const { authLimiter } = require('../middleware/security');

// POST /api/auth/register (Público)
router.post('/register', authLimiter, registerRules(), validate, authController.register);

// POST /api/auth/login (Público)
router.post('/login', authLimiter, authController.login);

// POST /api/auth/solicitar-recuperacion (Público)
router.post('/solicitar-recuperacion', authLimiter, authController.solicitarRecuperacionPassword);

// POST /api/auth/resetear-password (Público)
router.post('/resetear-password', authLimiter, authController.resetearPassword);

// POST /api/auth/verificar-email (Público)
router.post('/verificar-email', authLimiter, authController.verificarEmail);

// POST /api/auth/reenviar-codigo-verificacion (Público)
router.post('/reenviar-codigo-verificacion', authLimiter, authController.reenviarCodigoVerificacion);

module.exports = router;