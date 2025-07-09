const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');
const { validateOTPRequest, validateOTPVerification } = require('../middleware/validation');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

// ===================================
// OTP AUTHENTICATION ROUTES
// ===================================

// Send OTP for login
router.post('/send-login-otp', 
  authLimiter,
  validateOTPRequest,
  otpController.sendLoginOTP
);

// Verify OTP and complete login
router.post('/verify-login-otp', 
  authLimiter,
  validateOTPVerification,
  otpController.verifyLoginOTP
);

// ===================================
// OTP REGISTRATION ROUTES
// ===================================

// Send OTP for registration
router.post('/send-registration-otp', 
  authLimiter,
  validateOTPRequest,
  otpController.sendRegistrationOTP
);

// ===================================
// OTP PASSWORD RESET ROUTES
// ===================================

// Send OTP for password reset
router.post('/send-password-reset-otp', 
  passwordResetLimiter,
  validateOTPRequest,
  otpController.sendPasswordResetOTP
);

// Verify password reset OTP and set new password
router.post('/verify-password-reset-otp', 
  authLimiter,
  validateOTPVerification,
  otpController.verifyPasswordResetOTP
);

// ===================================
// OTP UTILITY ROUTES
// ===================================

// Resend OTP (with rate limiting)
router.post('/resend-otp', 
  authLimiter,
  validateOTPRequest,
  otpController.resendOTP
);

module.exports = router;