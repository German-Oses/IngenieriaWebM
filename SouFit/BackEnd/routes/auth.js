
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerRules, validate } = require('../middleware/validator');
const { authLimiter } = require('../middleware/security');
const logger = require('../utils/logger');

logger.info('🔧 Configurando rutas de autenticación...');

// POST /api/auth/register (Público)
router.post('/register', authLimiter, registerRules(), validate, (req, res, next) => {
    logger.info('📨 Petición POST /register recibida', { 
        email: req.body?.email,
        username: req.body?.username 
    });
    authController.register(req, res, next);
});

// POST /api/auth/login (Público)
router.post('/login', authLimiter, authController.login);

// POST /api/auth/solicitar-recuperacion (Público)
router.post('/solicitar-recuperacion', authLimiter, authController.solicitarRecuperacionPassword);

// POST /api/auth/resetear-password (Público)
router.post('/resetear-password', authLimiter, authController.resetearPassword);

// Log todas las rutas registradas
logger.info('✅ Rutas de autenticación configuradas:', {
    routes: [
        'POST /register',
        'POST /login',
        'POST /solicitar-recuperacion',
        'POST /resetear-password'
    ]
});

module.exports = router;