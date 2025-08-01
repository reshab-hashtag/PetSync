const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateUserRegistration, validateUserLogin } = require('../middleware/validation');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { handleUploadError, uploadAvatar } = require('../middleware/upload');

// Register
router.post('/register', authLimiter, validateUserRegistration,authenticate, authController.register);

// Login
router.post('/login', authLimiter, validateUserLogin, authController.login);

// Get profile
router.get('/profile', authenticate, authController.getProfile);

// Avatar upload routes
router.post('/profile/avatar', 
  authenticate, 
  uploadAvatar.single('avatar'), 
  handleUploadError,
  authController.uploadAvatar
);
// Remove avatar
router.delete('/profile/avatar', 
  authenticate, 
  authController.removeAvatar
);

// Update profile
router.put('/profile', authenticate, authController.updateProfile);

// Change password
router.post('/change-password', authenticate, authController.changePassword);

// Forgot password
router.post('/forgot-password', passwordResetLimiter, authController.forgotPassword);

// Reset password
// router.post('/reset-password', authController.resetPassword);

// Logout
router.post('/logout', authenticate, authController.logout);

module.exports = router;