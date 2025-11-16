
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerRules, validate } = require('../middleware/validator');
const { authLimiter } = require('../middleware/security');

// POST /api/auth/register (Público)
router.post('/register', authLimiter, registerRules(), validate, authController.register);

// POST /api/auth/login (Público)
router.post('/login', authLimiter, authController.login);


module.exports = router;