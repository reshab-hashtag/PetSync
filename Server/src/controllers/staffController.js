// Server/src/controllers/staffController.js
const User = require('../models/User');
const Business = require('../models/Business');
const auditService = require('../services/auditService');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');
const { validationResult } = require('express-validator');

class StaffController {
  // Get all staff members for the business
    async getStaffMembers(req, res, next) {
    try {
      // 1. Parse query params
      const page   = parseInt(req.query.page,  10) || 1;
      const limit  = parseInt(req.query.limit, 10) || 20;
      const { search, status } = req.query;
      const skip   = (page - 1) * limit;

      // 2. Extract the first businessId from the JWT payload
      const businesses = req.user.userData?.business;
      if (!Array.isArray(businesses) || businesses.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No business found on your account'
        });
      }
      // business entries might be ObjectIds or full docs
      const businessId = typeof businesses[0] === 'object'
        ? businesses[0]._id
        : businesses[0];

      // 3. Load & populate staff
      const business = await Business.findById(businessId)
        .select('staff')
        .populate({
          path: 'staff',
          match: { role: ROLES.STAFF },               // only STAFF role
          select: 'profile.firstName profile.lastName profile.email role isActive'
        });

      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found'
        });
      }

      let staffList = business.staff; // this is an array of User docs

      // 4. Optional text-search filter
      if (search) {
        const re = new RegExp(search, 'i');
        staffList = staffList.filter(u =>
          re.test(u.profile.firstName) ||
          re.test(u.profile.lastName)  ||
          re.test(u.profile.email)
        );
      }

      // 5. Optional status filter
      if (status === 'active' || status === 'inactive') {
        const wantActive = status === 'active';
        staffList = staffList.filter(u => u.isActive === wantActive);
      }

      // 6. Pagination
      const total = staffList.length;
      const paged = staffList.slice(skip, skip + limit);

      // 7. Respond
      return res.json({
        success: true,
        data: {
          staff: paged,
          pagination: {
            current: page,
            pages:   Math.ceil(total / limit),
            total,
            limit
          }
        }
      });
    } catch (error) {
      console.error('getStaffMembers error:', error);
      next(error);
    }
  }

  // Get single staff member
  async getStaffMember(req, res, next) {
    try {
      const { id } = req.params;

      // First, get the business to check if the user is staff
      const Business = require('../models/Business');
      const business = await Business.findById(req.user.businessId);
      
      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found'
        });
      }

      // Check if the requested user is in the business staff
      if (!business.staff.includes(id)) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      const staff = await User.findById(id)
        .select('-auth.passwordHash')
        .populate('business', 'profile.name');

      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      res.json({
        success: true,
        data: { staff }
      });
    } catch (error) {
      next(error);
    }
  }

  // Create new staff member
  async createStaffMember(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array()
        });
      }

      const {
        firstName,
        lastName,
        email,
        phone,
        role = ROLES.STAFF,
        specializations = [],
        permissions = {},
        schedule = {},
        emergencyContact = {}
      } = req.body;

      // Check if email already exists
      const existingUser = await User.findOne({ 'profile.email': email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }

      // Validate role
      if (![ROLES.STAFF, ROLES.BUSINESS_ADMIN].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role specified'
        });
      }

      // Generate temporary password
      const tempPassword = generateTempPassword();

      // Create staff member
      const staff = new User({
        profile: {
          firstName,
          lastName,
          email,
          phone
        },
        auth: {
          passwordHash: tempPassword,
          emailVerified: false
        },
        role,
        business: [req.user.businessId], // Add business to user's business array
        specializations,
        permissions,
        schedule,
        emergencyContact,
        isActive: true
      });

      await staff.save();

      // Add staff to business staff array
      const Business = require('../models/Business');
      await Business.findByIdAndUpdate(
        req.user.businessId,
        { $addToSet: { staff: staff._id } }
      );

      // Log creation
      await auditService.log({
        user: req.user.userId,
        business: req.user.businessId,
        action: 'CREATE',
        resource: 'staff',
        resourceId: staff._id,
        details: {
          staffEmail: email,
          role: role
        }
      });

      // Remove password from response
      const staffResponse = staff.toObject();
      delete staffResponse.auth.passwordHash;

      res.status(201).json({
        success: true,
        message: 'Staff member created successfully',
        data: {
          staff: staffResponse,
          tempPassword // Send temp password to admin for sharing
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update staff member
  async updateStaffMember(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // First, get the business to check if the user is staff
      const Business = require('../models/Business');
      const business = await Business.findById(req.user.businessId);
      
      if (!business || !business.staff.includes(id)) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      const staff = await User.findById(id);
      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      // Store original data for audit
      const originalData = staff.toObject();

      // Update allowed fields
      const allowedUpdates = [
        'profile.firstName',
        'profile.lastName', 
        'profile.phone',
        'specializations',
        'permissions',
        'schedule',
        'emergencyContact'
      ];

      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          if (key.startsWith('profile.')) {
            const profileKey = key.split('.')[1];
            staff.profile[profileKey] = updates[key];
          } else {
            staff[key] = updates[key];
          }
        }
      });

      await staff.save();

      // Log update
      await auditService.log({
        user: req.user.userId,
        business: req.user.businessId,
        action: 'UPDATE',
        resource: 'staff',
        resourceId: staff._id,
        details: {
          before: originalData,
          after: staff.toObject()
        }
      });

      // Remove password from response
      const staffResponse = staff.toObject();
      delete staffResponse.auth.passwordHash;

      res.json({
        success: true,
        message: 'Staff member updated successfully',
        data: { staff: staffResponse }
      });
    } catch (error) {
      next(error);
    }
  }

  // Toggle staff status (activate/deactivate)
   async toggleStaffStatus(req, res, next) {
    try {
      const staffId = req.params.id;            // the staff _id passed in the URL
      const { isActive } = req.body;            // desired active flag

      // 1) Determine which business this admin is on
      let businessId = req.user.businessId;
      const bizArray = req.user.userData?.business;
      if (!businessId && Array.isArray(bizArray) && bizArray.length > 0) {
        // bizArray entries may be full docs or just ObjectIds
        businessId = typeof bizArray[0] === 'object'
          ? bizArray[0]._id
          : bizArray[0];
      }

      if (!businessId) {
        return res.status(400).json({
          success: false,
          message: 'No associated business found for your account'
        });
      }

      // 2) Load the business and confirm this staffId is in its staff list
      const business = await Business.findById(businessId).select('staff');
      if (
        !business ||
        !business.staff.some(id => id.equals(staffId))
      ) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found in your business'
        });
      }

      // 3) Load the User and toggle isActive
      const staffUser = await User.findById(staffId);
      if (!staffUser) {
        return res.status(404).json({
          success: false,
          message: 'Staff user not found'
        });
      }

      staffUser.isActive = !!isActive;
      await staffUser.save();

      // 4) Audit log
      await auditService.log({
        user:      req.user.userId,
        business:  businessId,
        action:    isActive ? 'ACTIVATE_STAFF' : 'DEACTIVATE_STAFF',
        resource:  'User',
        resourceId: staffUser._id
      });

      // 5) Respond
      return res.json({
        success: true,
        message: `Staff member has been ${isActive ? 'activated' : 'deactivated'}.`
      });
    } catch (error) {
      console.error('toggleStaffStatus error:', error);
      next(error);
    }
  }

  // Reset staff password
  async resetStaffPassword(req, res, next) {
    try {
      const { id } = req.params;

      // First, get the business to check if the user is staff
      const Business = require('../models/Business');
      const business = await Business.findById(req.user.businessId);
      
      if (!business || !business.staff.includes(id)) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      const staff = await User.findById(id);
      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      // Generate new temporary password
      const tempPassword = generateTempPassword();
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      staff.auth.passwordHash = hashedPassword;
      // Set flag to force password change on next login
      staff.auth.mustChangePassword = true;
      await staff.save();

      // Log action
      await auditService.log({
        user: req.user.userId,
        business: req.user.businessId,
        action: 'RESET_PASSWORD',
        resource: 'staff',
        resourceId: staff._id
      });

      res.json({
        success: true,
        message: 'Password reset successfully',
        data: { tempPassword }
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete staff member
  async deleteStaffMember(req, res, next) {
    try {
      const { id } = req.params;

      // First, get the business to check if the user is staff
      const Business = require('../models/Business');
      const business = await Business.findById(req.user.businessId);
      
      if (!business || !business.staff.includes(id)) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      const staff = await User.findById(id);
      if (!staff) {
        return res.status(404).json({
          success: false,
          message: 'Staff member not found'
        });
      }

      // Remove staff from business staff array
      await Business.findByIdAndUpdate(
        req.user.businessId,
        { $pull: { staff: id } }
      );

      // Remove business from user's business array
      staff.business = staff.business.filter(
        businessId => businessId.toString() !== req.user.businessId.toString()
      );

      // If user has no more businesses, deactivate them
      if (staff.business.length === 0) {
        staff.isActive = false;
        staff.profile.email = `deleted_${Date.now()}_${staff.profile.email}`;
      }

      await staff.save();

      // Log deletion
      await auditService.log({
        user: req.user.userId,
        business: req.user.businessId,
        action: 'DELETE',
        resource: 'staff',
        resourceId: staff._id
      });

      res.json({
        success: true,
        message: 'Staff member removed from business successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get staff statistics
  async getStaffStats(req, res, next) {
    try {
      const businessId = req.user.businessId;

      // Get business with staff
      const Business = require('../models/Business');
      const business = await Business.findById(businessId);
      
      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found'
        });
      }

      const stats = await User.aggregate([
        {
          $match: {
            _id: { $in: business.staff || [] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            inactive: {
              $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
            },
            staff: {
              $sum: { $cond: [{ $eq: ['$role', ROLES.STAFF] }, 1, 0] }
            },
            admins: {
              $sum: { $cond: [{ $eq: ['$role', ROLES.BUSINESS_ADMIN] }, 1, 0] }
            }
          }
        }
      ]);

      const result = stats[0] || {
        total: 0,
        active: 0,
        inactive: 0,
        staff: 0,
        admins: 0
      };

      res.json({
        success: true,
        data: { stats: result }
      });
    } catch (error) {
      next(error);
    }
  }
}

// Helper function to generate temporary password
const generateTempPassword = (length = 12) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

module.exports = new StaffController();