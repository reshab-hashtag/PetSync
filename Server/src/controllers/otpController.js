const otpService = require('../services/otpService');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const auditService = require('../services/auditService');

class OTPController {
  // Send OTP for login
  async sendLoginOTP(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const normalizedEmail = email.toLowerCase();

      // Check if user exists and is active
      const user = await User.findOne({ 'profile.email': normalizedEmail });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'No account found with this email address'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated'
        });
      }

      // Send OTP
      const result = await otpService.createAndSendOTP(normalizedEmail, 'login', {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName
      });

      // Log OTP request
      await auditService.log({
        user: user._id,
        action: 'OTP_REQUEST',
        resource: 'authentication',
        metadata: { 
          type: 'login',
          email: normalizedEmail,
          ipAddress: req.ip, 
          userAgent: req.get('User-Agent') 
        }
      });

      res.json({
        success: true,
        message: 'OTP sent to your email address',
        expiresAt: result.expiresAt
      });
    } catch (error) {
      next(error);
    }
  }

  // Verify OTP and complete login
  async verifyLoginOTP(req, res, next) {
    try {
      const { email, otp } = req.body;

      if (!email || !otp) {
        return res.status(400).json({
          success: false,
          message: 'Email and OTP are required'
        });
      }

      const normalizedEmail = email.toLowerCase();

      // Find user
      const user = await User.findOne({ 'profile.email': normalizedEmail })
        .populate('business');

      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Verify OTP
      const otpResult = await otpService.verifyOTP(normalizedEmail, otp, 'login');

      if (!otpResult.success) {
        // Log failed attempt
        await auditService.log({
          user: user._id,
          action: 'OTP_VERIFICATION_FAILED',
          resource: 'authentication',
          metadata: { 
            type: 'login',
            email: normalizedEmail,
            reason: otpResult.message,
            ipAddress: req.ip, 
            userAgent: req.get('User-Agent') 
          }
        });

        return res.status(400).json(otpResult);
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id, 
          role: user.role,
          businessId: user.business?._id 
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Update last login
      user.auth.lastLogin = new Date();
      await user.save();

      // Log successful login
      await auditService.log({
        user: user._id,
        action: 'LOGIN_SUCCESS',
        resource: 'authentication',
        metadata: { 
          type: 'otp_login',
          email: normalizedEmail,
          ipAddress: req.ip, 
          userAgent: req.get('User-Agent') 
        }
      });

      // Remove password from response
      const userData = user.toObject();
      delete userData.auth.passwordHash;

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: userData
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Send OTP for registration
  async sendRegistrationOTP(req, res, next) {
    try {
      const { email, firstName, lastName } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const normalizedEmail = email.toLowerCase();

      // Check if user already exists
      const existingUser = await User.findOne({ 'profile.email': normalizedEmail });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists'
        });
      }

      // Send OTP
      const result = await otpService.createAndSendOTP(normalizedEmail, 'register', {
        firstName: firstName || '',
        lastName: lastName || ''
      });

      res.json({
        success: true,
        message: 'OTP sent to your email address',
        expiresAt: result.expiresAt
      });
    } catch (error) {
      next(error);
    }
  }

  // Send OTP for password reset
  async sendPasswordResetOTP(req, res, next) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email is required'
        });
      }

      const normalizedEmail = email.toLowerCase();

      // Check if user exists
      const user = await User.findOne({ 'profile.email': normalizedEmail });
      
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({
          success: true,
          message: 'If an account with this email exists, you will receive a password reset code'
        });
      }

      // Send OTP
      const result = await otpService.createAndSendOTP(normalizedEmail, 'password_reset', {
        firstName: user.profile.firstName,
        lastName: user.profile.lastName
      });

      // Log password reset request
      await auditService.log({
        user: user._id,
        action: 'PASSWORD_RESET_REQUEST',
        resource: 'authentication',
        metadata: { 
          email: normalizedEmail,
          ipAddress: req.ip, 
          userAgent: req.get('User-Agent') 
        }
      });

      res.json({
        success: true,
        message: 'Password reset code sent to your email address',
        expiresAt: result.expiresAt
      });
    } catch (error) {
      next(error);
    }
  }

  // Verify password reset OTP
  async verifyPasswordResetOTP(req, res, next) {
    try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Email, OTP, and new password are required'
        });
      }

      const normalizedEmail = email.toLowerCase();

      // Find user
      const user = await User.findOne({ 'profile.email': normalizedEmail });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify OTP
      const otpResult = await otpService.verifyOTP(normalizedEmail, otp, 'password_reset');

      if (!otpResult.success) {
        return res.status(400).json(otpResult);
      }

      // Update password
      user.auth.passwordHash = newPassword; // Will be hashed by pre-save middleware
      await user.save();

      // Log password reset success
      await auditService.log({
        user: user._id,
        action: 'PASSWORD_RESET_SUCCESS',
        resource: 'authentication',
        metadata: { 
          email: normalizedEmail,
          ipAddress: req.ip, 
          userAgent: req.get('User-Agent') 
        }
      });

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Resend OTP
  async resendOTP(req, res, next) {
    try {
      const { email, type } = req.body;

      if (!email || !type) {
        return res.status(400).json({
          success: false,
          message: 'Email and type are required'
        });
      }

      const validTypes = ['login', 'register', 'password_reset', 'email_verification'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid OTP type'
        });
      }

      const normalizedEmail = email.toLowerCase();
      let userData = {};

      // Get user data for personalization
      if (type !== 'register') {
        const user = await User.findOne({ 'profile.email': normalizedEmail });
        if (user) {
          userData = {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName
          };
        }
      }

      const result = await otpService.resendOTP(normalizedEmail, type, userData);

      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OTPController();