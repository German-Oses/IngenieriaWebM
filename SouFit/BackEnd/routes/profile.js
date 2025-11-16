const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authmiddleware');
const uploadAvatar = require('../middleware/uploadAvatar');

router.get('/', authMiddleware, authController.getAuthenticatedUser);
router.put('/', authMiddleware, authController.updateProfile);
router.put('/username', authMiddleware, authController.updateUsername);
router.put('/password', authMiddleware, authController.changePassword);
router.post('/avatar', authMiddleware, uploadAvatar.single('avatar'), authController.uploadAvatar);

module.exports = router;