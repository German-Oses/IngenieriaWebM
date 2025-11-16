const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authmiddleware');

router.get('/', authMiddleware, authController.getAuthenticatedUser);
router.put('/', authMiddleware, authController.updateProfile);
router.put('/username', authMiddleware, authController.updateUsername);
router.put('/password', authMiddleware, authController.changePassword);

module.exports = router;