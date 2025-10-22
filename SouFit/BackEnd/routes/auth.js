
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerRules, validate } = require('../middleware/validator');
const authMiddleware = require('../middleware/authmiddleware');


// POST /api/auth/register (Público)
router.post('/register', registerRules(), validate, authController.register);

// POST /api/auth/login (Público)
router.post('/login', authController.login);

// GET /api/auth (Privado, requiere token)
router.get('/', authMiddleware, authController.getAuthenticatedUser);

module.exports = router;