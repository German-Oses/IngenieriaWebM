const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authmiddleware');


router.get(
  '/',
  authMiddleware, 
  authController.getAuthenticatedUser 
);

module.exports = router;