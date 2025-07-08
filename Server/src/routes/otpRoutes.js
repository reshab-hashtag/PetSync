const express = require('express');
const router = express.Router();
const otpController = require('../controllers/otpController');
const { validateOTPRequest, validateOTPVerification } = require('../middleware/validation');
const rateLimiter = require('../middleware/rateLimiter');

// Apply rate limiting to OTP routes
const otpLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 OTP requests per windowMs
  message: {
    success: false,
    message: 'Too many OTP requests. Please try again later.'
  }
});

// Send OTP routes
router.post('/send-login-otp', otpLimiter, validateOTPRequest, otpController.sendLoginOTP);
router.post('/send-registration-otp', otpLimiter, validateOTPRequest, otpController.sendRegistrationOTP);
router.post('/send-password-reset-otp', otpLimiter, validateOTPRequest, otpController.sendPasswordResetOTP);

// Verify OTP routes
router.post('/verify-login-otp', validateOTPVerification, otpController.verifyLoginOTP);
router.post('/verify-password-reset-otp', validateOTPVerification, otpController.verifyPasswordResetOTP);

// Resend OTP
router.post('/resend-otp', otpLimiter, otpController.resendOTP);

module.exports = router;