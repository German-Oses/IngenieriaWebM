
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

module.exports = router;