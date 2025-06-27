const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../services/emailService');
const auditService = require('../services/auditService');
const { ROLES } = require('../config/constants');
const Business = require('../models/Business');

class AuthController {
  // Register new user
 async register(req, res, next) {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      role,
      businessData // Optional business information
    } = req.body;

    console.log('Registering user with role:', role);

    // Only the 'business_admin' role can be registered, and only by 'super_admin'
    if (role !== 'business_admin') {
      return res.status(403).json({
        success: false,
        message: 'Invalid role: only business_admin can be registered'
      });
    }

    if (!req.user || req.user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Only super_admin can register business_admin'
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase();

    // Check if user already exists
    if (await User.findOne({ 'profile.email': normalizedEmail })) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // If businessData is provided, check for existing business email
    if (businessData && businessData.profile && businessData.profile.email) {
      const bizEmail = businessData.profile.email.toLowerCase();
      if (await Business.findOne({ 'profile.email': bizEmail })) {
        return res.status(400).json({
          success: false,
          message: 'Business with this email already exists'
        });
      }
    }

    // Build user payload
    const userPayload = {
      role,
      profile: {
        firstName,
        lastName,
        email: normalizedEmail,
        phone
      },
      auth: {
        passwordHash: password,
        emailVerified: false
      },
      business: []
    };

    // Create and save the user first
    const user = new User(userPayload);
    await user.save();

    let createdBusiness = null;
    // Conditionally create business if data provided
    if (businessData && businessData.profile) {
      const {
        profile,
        services = [],
        schedule,
        settings = {},
        subscription = {}
      } = businessData;

      // Build business payload
      const businessPayload = {
        profile: {
          name: profile.name,
          description: profile.description || '',
          logo: profile.logo || '',
          website: profile.website || '',
          email: profile.email.toLowerCase(),
          phone: profile.phone,
          address: {
            street: profile.address.street,
            city: profile.address.city,
            state: profile.address.state,
            zipCode: profile.address.zipCode,
            country: profile.address.country || 'IND'
          }
        },
        services: services.map(s => ({
          name: s.name,
          description: s.description || '',
          duration: s.duration || 60,
          price: {
            amount: s.price?.amount || 0,
            currency: s.price?.currency || 'INR'
          },
          category: s.category || 'general',
          isActive: s.isActive !== false
        })),
        schedule: {
          timezone: schedule?.timezone || 'Asia/Kolkata',
          workingHours: schedule?.workingHours || {
            monday: { isOpen: true, open: '09:00', close: '17:00' },
            tuesday: { isOpen: true, open: '09:00', close: '17:00' },
            wednesday: { isOpen: true, open: '09:00', close: '17:00' },
            thursday: { isOpen: true, open: '09:00', close: '17:00' },
            friday: { isOpen: true, open: '09:00', close: '17:00' },
            saturday: { isOpen: true, open: '09:00', close: '15:00' },
            sunday: { isOpen: false, open: '10:00', close: '14:00' }
          },
          breaks: schedule?.breaks || [],
          holidays: schedule?.holidays || []
        },
        staff: [user._id],
        settings: {
          appointmentBookingWindow: settings.appointmentBookingWindow || 30,
          cancellationPolicy: {
            hoursRequired: settings.cancellationPolicy?.hoursRequired || 24,
            feePercentage: settings.cancellationPolicy?.feePercentage || 0
          },
          autoReminders: {
            email: { enabled: settings.autoReminders?.email?.enabled !== false, hoursBefore: settings.autoReminders?.email?.hoursBefore || 24 },
            sms: { enabled: settings.autoReminders?.sms?.enabled || false, hoursBefore: settings.autoReminders?.sms?.hoursBefore || 2 }
          },
          paymentMethods: {
            cash: settings.paymentMethods?.cash !== false,
            card: settings.paymentMethods?.card !== false,
            online: settings.paymentMethods?.online !== false
          }
        },
        subscription: {
          plan: subscription.plan || 'free',
          status: subscription.status || 'active',
          expiresAt: subscription.plan !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
        },
        isActive: true
      };

      // Save business
      createdBusiness = new Business(businessPayload);
      await createdBusiness.save();

      // Link business to user
      user.business.push(createdBusiness._id);
      await user.save();

      // Audit business creation
      await auditService.log({
        user: user._id,
        action: 'CREATE_BUSINESS',
        resource: 'business',
        resourceId: createdBusiness._id,
        metadata: { ipAddress: req.ip, userAgent: req.get('User-Agent'), businessName: createdBusiness.profile.name, createdBy: req.user.userId }
      });
    }

    // Audit user registration
    await auditService.log({
      user: req.user.userId,
      action: 'REGISTER_BUSINESS_ADMIN',
      resource: 'user',
      resourceId: user._id,
      metadata: { ipAddress: req.ip, userAgent: req.get('User-Agent'), newBusinessAdminEmail: normalizedEmail, businessId: createdBusiness?._id }
    });

    // Prepare response
    const responseData = {
      user: {
        id: user._id,
        firstName: user.profile.firstName,
        lastName: user.profile.lastName,
        email: user.profile.email,
        role: user.role
      },
      business: createdBusiness ? {
        id: createdBusiness._id,
        name: createdBusiness.profile.name,
        email: createdBusiness.profile.email,
        phone: createdBusiness.profile.phone,
        address: createdBusiness.profile.address,
        services: createdBusiness.services,
        settings: createdBusiness.settings,
        subscription: createdBusiness.subscription,
        isActive: createdBusiness.isActive,
        createdAt: createdBusiness.createdAt
      } : []
    };

    res.status(201).json({
      success: true,
      message: 'Business admin registered successfully.',
      data: responseData
    });
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
}





  // Login user
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Find user and include password for comparison
      const user = await User.findOne({ 'profile.email': email.toLowerCase() })
        .populate('business')
        .select('+auth.passwordHash');

      if (!user || !await user.comparePassword(password)) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Your account has been deactivated'
        });
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

      // Log login
      await auditService.log({
        user: user._id,
        action: 'LOGIN',
        resource: 'user',
        resourceId: user._id,
        metadata: { ipAddress: req.ip, userAgent: req.get('User-Agent') }
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

  // Get current user profile
  async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user.userId)
        .populate('business')
        .populate('pets');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user profile
   async updateProfile(req, res, next) {
    try {
      const updates = req.body;

      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // keep original for audit
      const originalData = user.toObject();

      // 1) merge any nested profile object
      if (updates.profile && typeof updates.profile === 'object') {
        Object.assign(user.profile, updates.profile);
      }

      // 2) pick up flat profile fields too
      ['firstName', 'lastName', 'email', 'phone'].forEach(field => {
        if (updates[field] !== undefined) {
          user.profile[field] = updates[field];
        }
      });

      // 3) address is an object on profile — merge rather than overwrite
      if (updates.address && typeof updates.address === 'object') {
        user.profile.address = user.profile.address || {};
        Object.assign(user.profile.address, updates.address);
      }

      // 4) merge settings if provided
      if (updates.settings && typeof updates.settings === 'object') {
        Object.assign(user.settings, updates.settings);
      }

      // save & audit
      await user.save();
      await auditService.log({
        user:       req.user.userId,
        action:     'UPDATE',
        resource:   'user',
        resourceId: user._id,
        details: {
          before: originalData,
          after:  user.toObject()
        }
      });

      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data:    { user }
      });
    } catch (error) {
      next(error);
    }
  }

  // Change password
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.userId).select('+auth.passwordHash');

      if (!await user.comparePassword(currentPassword)) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      user.auth.passwordHash = newPassword; // Will be hashed by middleware
      await user.save();

      // Log password change
      await auditService.log({
        user: req.user.userId,
        action: 'PASSWORD_CHANGE',
        resource: 'user',
        resourceId: user._id
      });

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Forgot password
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const user = await User.findOne({ 'profile.email': email.toLowerCase() });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found with this email'
        });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes

      // Store reset token (you might want to add these fields to user schema)
      user.auth.resetToken = resetToken;
      user.auth.resetTokenExpiry = resetTokenExpiry;
      await user.save();

      // Send reset email
      try {
        await sendEmail({
          to: email,
          subject: 'Password Reset - PetSync',
          template: 'password-reset',
          data: { 
            resetToken, 
            firstName: user.profile.firstName,
            resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`
          }
        });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
      }

      res.json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (error) {
      next(error);
    }
  }

  // Reset password
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;

      const user = await User.findOne({
        'auth.resetToken': token,
        'auth.resetTokenExpiry': { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired reset token'
        });
      }

      // Update password
      user.auth.passwordHash = newPassword;
      user.auth.resetToken = undefined;
      user.auth.resetTokenExpiry = undefined;
      await user.save();

      res.json({
        success: true,
        message: 'Password reset successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Logout (mainly for audit purposes)
  async logout(req, res, next) {
    try {
      // Log logout
      await auditService.log({
        user: req.user.userId,
        action: 'LOGOUT',
        resource: 'user',
        resourceId: req.user.userId,
        metadata: { ipAddress: req.ip, userAgent: req.get('User-Agent') }
      });

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();