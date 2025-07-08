const crypto = require('crypto');
const OTP = require('../models/OTP');
const { sendEmail } = require('./emailService');

class OTPService {
  // Generate 6-digit OTP
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Create and send OTP
  async createAndSendOTP(email, type, userData = {}) {
    try {
      const normalizedEmail = email.toLowerCase();
      
      // Delete any existing OTPs for this email and type
      await OTP.deleteMany({ email: normalizedEmail, type });

      // Generate new OTP
      const otpCode = this.generateOTP();
      
      // Create OTP record
      const otpRecord = new OTP({
        email: normalizedEmail,
        otp: otpCode,
        type,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      });

      await otpRecord.save();

      // Send OTP email
      await this.sendOTPEmail(normalizedEmail, otpCode, type, userData);

      return {
        success: true,
        message: 'OTP sent successfully',
        expiresAt: otpRecord.expiresAt
      };
    } catch (error) {
      console.error('Failed to create and send OTP:', error);
      throw new Error('Failed to send OTP. Please try again.');
    }
  }

  // Verify OTP
  async verifyOTP(email, otp, type) {
    try {
      const normalizedEmail = email.toLowerCase();
      
      const otpRecord = await OTP.findOne({
        email: normalizedEmail,
        type,
        verified: false,
        expiresAt: { $gt: new Date() }
      });

      if (!otpRecord) {
        return {
          success: false,
          message: 'Invalid or expired OTP'
        };
      }

      // Check attempts
      if (otpRecord.attempts >= 3) {
        await OTP.deleteOne({ _id: otpRecord._id });
        return {
          success: false,
          message: 'Too many failed attempts. Please request a new OTP.'
        };
      }

      // Verify OTP
      if (otpRecord.otp !== otp) {
        otpRecord.attempts += 1;
        await otpRecord.save();
        
        return {
          success: false,
          message: `Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.`
        };
      }

      // Mark as verified
      otpRecord.verified = true;
      await otpRecord.save();

      return {
        success: true,
        message: 'OTP verified successfully'
      };
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      throw new Error('Failed to verify OTP. Please try again.');
    }
  }

  // Send OTP email
  async sendOTPEmail(email, otp, type, userData = {}) {
    const emailData = this.getEmailTemplate(type, otp, userData);
    
    await sendEmail({
      to: email,
      subject: emailData.subject,
      template: 'otp-verification',
      data: {
        otp,
        type,
        email,
        ...emailData.data,
        ...userData
      }
    });
  }

  // Get email template data based on type
  getEmailTemplate(type, otp, userData = {}) {
    const templates = {
      login: {
        subject: 'Login Verification Code - PetSync',
        data: {
          title: 'Login Verification',
          message: 'Please use this code to complete your login:',
          action: 'logging in'
        }
      },
      register: {
        subject: 'Account Registration Verification - PetSync',
        data: {
          title: 'Welcome to PetSync!',
          message: 'Please use this code to verify your email and complete registration:',
          action: 'completing your registration'
        }
      },
      password_reset: {
        subject: 'Password Reset Verification - PetSync',
        data: {
          title: 'Password Reset',
          message: 'Please use this code to reset your password:',
          action: 'resetting your password'
        }
      },
      email_verification: {
        subject: 'Email Verification Code - PetSync',
        data: {
          title: 'Email Verification',
          message: 'Please use this code to verify your email address:',
          action: 'verifying your email'
        }
      }
    };

    return templates[type] || templates.login;
  }

  // Clean up expired OTPs (can be called by a cron job)
  async cleanupExpiredOTPs() {
    try {
      const result = await OTP.deleteMany({
        expiresAt: { $lt: new Date() }
      });
      console.log(`Cleaned up ${result.deletedCount} expired OTPs`);
      return result.deletedCount;
    } catch (error) {
      console.error('Failed to cleanup expired OTPs:', error);
    }
  }

  // Check if OTP exists and is valid
  async isOTPValid(email, type) {
    try {
      const normalizedEmail = email.toLowerCase();
      
      const otpRecord = await OTP.findOne({
        email: normalizedEmail,
        type,
        verified: false,
        expiresAt: { $gt: new Date() }
      });

      return !!otpRecord;
    } catch (error) {
      console.error('Failed to check OTP validity:', error);
      return false;
    }
  }

  // Resend OTP (with rate limiting)
  async resendOTP(email, type, userData = {}) {
    try {
      const normalizedEmail = email.toLowerCase();
      
      // Check if there's a recent OTP (prevent spam)
      const recentOTP = await OTP.findOne({
        email: normalizedEmail,
        type,
        createdAt: { $gt: new Date(Date.now() - 2 * 60 * 1000) } // 2 minutes
      });

      if (recentOTP) {
        return {
          success: false,
          message: 'Please wait 2 minutes before requesting another OTP'
        };
      }

      return await this.createAndSendOTP(email, type, userData);
    } catch (error) {
      console.error('Failed to resend OTP:', error);
      throw new Error('Failed to resend OTP. Please try again.');
    }
  }
}

module.exports = new OTPService();