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
      // 1) Parse pagination + filters
      const page   = parseInt(req.query.page,  10) || 1;
      const limit  = parseInt(req.query.limit, 10) || 20;
      const { search, status } = req.query;
      const skip   = (page - 1) * limit;

      // 2) Get the businessId from the URL
      const { businessId } = req.params;

      // 3) Pull the list of businesses this admin owns
      const owned = req.user.userData?.business;
      if (!Array.isArray(owned) || owned.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'You don’t have any businesses yet.'
        });
      }

      // 4) Normalize to an array of string IDs
      const ownedIds = owned.map(b =>
        typeof b === 'object' ? b._id.toString() : b.toString()
      );

      // 5) Ownership check
      if (!ownedIds.includes(businessId)) {
        return res.status(403).json({
          success: false,
          message: 'You are not the authentic business owner to access this business'
        });
      }

      // 6) Load & populate staff for that business
      const business = await Business.findById(businessId)
        .select('staff')
        .populate({
          path: 'staff',
          match: { role: ROLES.STAFF },
          select: 'profile.firstName profile.lastName profile.email role isActive'
        });

      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found'
        });
      }

      let staffList = business.staff; // array of User docs

      // 7) Apply optional search filter
      if (search) {
        const re = new RegExp(search, 'i');
        staffList = staffList.filter(u =>
          re.test(u.profile.firstName) ||
          re.test(u.profile.lastName)  ||
          re.test(u.profile.email)
        );
      }

      // 8) Apply optional status filter
      if (status === 'active' || status === 'inactive') {
        const wantActive = status === 'active';
        staffList = staffList.filter(u => u.isActive === wantActive);
      }

      // 9) Paginate in memory
      const total = staffList.length;
      const paged = staffList.slice(skip, skip + limit);

      // 10) Respond
      return res.json({
        success: true,
        data: {
          businessId,
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




// Get all staff members across all businesses owned by the admin
  async getAllStaffMembers(req, res, next) {
    console.log("getAllStaffMembers called");
    try {
      // 1) Only BUSINESS_ADMIN may call this
      if (req.user.role !== ROLES.BUSINESS_ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Business admins only.'
        });
      }

      // 2) Parse pagination + filters
      const page   = parseInt(req.query.page,  10) || 1;
      const limit  = parseInt(req.query.limit, 10) || 20;
      const { search, status } = req.query;
      const skip   = (page - 1) * limit;

      // 3) Gather the IDs of all businesses this admin owns
      const owned = req.user.userData?.business;
      if (!Array.isArray(owned) || owned.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'You don’t have any businesses yet.'
        });
      }
      const ownedIds = owned.map(b => (
        typeof b === 'object' ? b._id.toString() : b.toString()
      ));

      // 4) Load all those businesses with their staff arrays
      const businesses = await Business.find({ _id: { $in: ownedIds } })
        .select('staff')
        .populate({
          path: 'staff',
          match: { role: ROLES.STAFF },
          select: 'profile.firstName profile.lastName profile.email role isActive'
        });

      // 5) Flatten and dedupe staff
      const allStaff = [];
      const seen = new Set();
      for (const biz of businesses) {
        for (const user of biz.staff) {
          const id = user._id.toString();
          if (!seen.has(id)) {
            seen.add(id);
            allStaff.push(user);
          }
        }
      }

      // 6) Apply optional search filter
      let filtered = allStaff;
      if (search) {
        const re = new RegExp(search, 'i');
        filtered = filtered.filter(u =>
          re.test(u.profile.firstName) ||
          re.test(u.profile.lastName)  ||
          re.test(u.profile.email)
        );
      }

      // 7) Apply optional status filter
      if (status === 'active' || status === 'inactive') {
        const wantActive = status === 'active';
        filtered = filtered.filter(u => u.isActive === wantActive);
      }

      // 8) Paginate in memory
      const total = filtered.length;
      const paged = filtered.slice(skip, skip + limit);

      // 9) Respond
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
      console.error('getAllStaffMembers error:', error);
      next(error);
    }
  }


  // Get all staff members with their business assignments for admin
async getAllStaffWithBusinesses(req, res, next) {
  console.log("getAllStaffWithBusinesses called");
  try {
    // 1) Only BUSINESS_ADMIN and SUPER_ADMIN may call this
    if (![ROLES.BUSINESS_ADMIN, ROLES.SUPER_ADMIN].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Business admins and super admins only.'
      });
    }

    // 2) Parse pagination + filters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { search, status, role } = req.query;
    const skip = (page - 1) * limit;

    let staffQuery = {};
    let businessFilter = {};

    // 3) If business admin, only get staff from their businesses
    if (req.user.role === ROLES.BUSINESS_ADMIN) {
      const owned = req.user.userData?.business;
      if (!Array.isArray(owned) || owned.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'You dont have any businesses yet.'
        });
      }
      const ownedIds = owned.map(b => (
        typeof b === 'object' ? b._id.toString() : b.toString()
      ));
      
      // Filter to only staff assigned to admin's businesses
      staffQuery.business = { $in: ownedIds };
      businessFilter._id = { $in: ownedIds };
    }

    // 4) Apply role filter
    if (role && role !== 'all') {
      staffQuery.role = role;
    }

    // 5) Apply status filter
    if (status && status !== 'all') {
      staffQuery.isActive = status === 'active';
    }

    // 6) Apply search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      staffQuery.$or = [
        { 'profile.firstName': searchRegex },
        { 'profile.lastName': searchRegex },
        { 'profile.email': searchRegex }
      ];
    }

    // 7) Fetch staff members with populated business details
    const staffMembers = await User.find(staffQuery)
      .select('profile.firstName profile.lastName profile.email role isActive business createdAt updatedAt')
      .populate({
        path: 'business',
        match: businessFilter,
        select: 'profile.name profile.email profile.phone isActive staff',
        populate: {
          path: 'staff',
          select: '_id' // Just get the count
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 8) Get total count for pagination
    const totalCount = await User.countDocuments(staffQuery);

    // 9) Filter out staff who don't have any businesses (in case of role-based filtering)
    const filteredStaff = staffMembers.filter(staff => 
      staff.business && staff.business.length > 0
    );

    // 10) Respond
    return res.json({
      success: true,
      data: {
        staff: filteredStaff,
        pagination: {
          current: page,
          pages: Math.ceil(totalCount / limit),
          total: totalCount,
          limit
        }
      }
    });
  } catch (error) {
    console.error('getAllStaffWithBusinesses error:', error);
    next(error);
  }
}

// Enhanced version of getAllStaffMembers with business details
async getAllStaffMembersEnhanced(req, res, next) {
  console.log("getAllStaffMembersEnhanced called");
  try {
    // 1) Only BUSINESS_ADMIN and SUPER_ADMIN may call this
    if (![ROLES.BUSINESS_ADMIN, ROLES.SUPER_ADMIN].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Business admins and super admins only.'
      });
    }

    // 2) Parse pagination + filters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { search, status, role } = req.query;
    const skip = (page - 1) * limit;

    let businessIds = [];

    // 3) Get business IDs based on user role
    if (req.user.role === ROLES.BUSINESS_ADMIN) {
      const owned = req.user.userData?.business;
      if (!Array.isArray(owned) || owned.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'You dont have any businesses yet.'
        });
      }
      businessIds = owned.map(b => (
        typeof b === 'object' ? b._id.toString() : b.toString()
      ));
    } else if (req.user.role === ROLES.SUPER_ADMIN) {
      // Super admin can see all businesses
      const allBusinesses = await Business.find({}).select('_id');
      businessIds = allBusinesses.map(b => b._id.toString());
    }

    // 4) Find all businesses and populate their staff
    const businesses = await Business.find({ _id: { $in: businessIds } })
      .select('profile.name profile.email profile.phone isActive staff createdAt')
      .populate({
        path: 'staff',
        select: 'profile.firstName profile.lastName profile.email profile.phone role isActive business createdAt',
        populate: {
          path: 'business',
          select: 'profile.name profile.email profile.phone isActive staff'
        }
      });

    // 5) Flatten staff and remove duplicates while maintaining business relationships
    const staffMap = new Map();
    
    businesses.forEach(business => {
      business.staff.forEach(staffMember => {
        const staffId = staffMember._id.toString();
        
        if (staffMap.has(staffId)) {
          // Add this business to existing staff member's business list
          const existingStaff = staffMap.get(staffId);
          if (!existingStaff.business.some(b => b._id.toString() === business._id.toString())) {
            existingStaff.business.push({
              _id: business._id,
              profile: business.profile,
              isActive: business.isActive,
              staff: business.staff.map(s => s._id) // Just IDs for count
            });
          }
        } else {
          // Create new staff entry with business info
          const staffWithBusiness = {
            ...staffMember.toObject(),
            business: [{
              _id: business._id,
              profile: business.profile,
              isActive: business.isActive,
              staff: business.staff.map(s => s._id) // Just IDs for count
            }]
          };
          staffMap.set(staffId, staffWithBusiness);
        }
      });
    });

    // 6) Convert map to array
    let allStaff = Array.from(staffMap.values());

    // 7) Apply filters
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      allStaff = allStaff.filter(staff =>
        searchRegex.test(staff.profile.firstName) ||
        searchRegex.test(staff.profile.lastName) ||
        searchRegex.test(staff.profile.email) 
      );
    }

    if (status && status !== 'all') {
      const isActive = status === 'active';
      allStaff = allStaff.filter(staff => staff.isActive === isActive);
    }

    if (role && role !== 'all') {
      allStaff = allStaff.filter(staff => staff.role === role);
    }

    // 8) Sort by creation date (newest first)
    allStaff.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 9) Apply pagination
    const total = allStaff.length;
    const paginatedStaff = allStaff.slice(skip, skip + limit);

    // 10) Respond
    return res.json({
      success: true,
      data: {
        staff: paginatedStaff,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      }
    });
  } catch (error) {
    console.error('getAllStaffMembersEnhanced error:', error);
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
    const Business = require('../models/Business');
    
    
    // Find the staff member first
    const staff = await User.findById(id);
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Prevent self-deletion
    if (staff._id.toString() === req.user.userId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete yourself'
      });
    }

    // Get all businesses where the requesting user is the owner/admin
    const userBusinesses = req.user.userData.business || [];
    
    if (!userBusinesses || userBusinesses.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You do not own any businesses'
      });
    }

    // Extract business IDs that the current user owns
    const ownedBusinessIds = userBusinesses.map(business => business._id.toString());
    
    // Find businesses where the staff member is actually present
    const businessesWithStaff = await Business.find({
      _id: { $in: ownedBusinessIds },
      staff: id
    });

    if (businessesWithStaff.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Staff member is not associated with any of your businesses'
      });
    }

    // Track which businesses the staff will be removed from
    const removedFromBusinesses = [];

    // Remove staff from all owned businesses
    for (const business of businessesWithStaff) {
      await Business.findByIdAndUpdate(
        business._id,
        { $pull: { staff: id } }
      );
      removedFromBusinesses.push(business._id.toString());
      
      // Log the deletion for each business
      await auditService.log({
        user: req.user.userId,
        business: business._id,
        action: 'DELETE',
        resource: 'staff',
        resourceId: staff._id,
        details: {
          staffName: staff.fullName || `${staff.profile.firstName} ${staff.profile.lastName}`,
          staffEmail: staff.profile.email
        }
      });
    }

    // Update staff member's business array - remove only the businesses we removed them from
    staff.business = staff.business.filter(
      businessId => !removedFromBusinesses.includes(businessId.toString())
    );

    // Check if staff member has any remaining business associations
    const remainingBusinessCount = await Business.countDocuments({
      staff: id
    });

    // If staff has no remaining business associations, deactivate them
    if (remainingBusinessCount === 0 && staff.business.length === 0) {
      staff.isActive = false;
      // Optionally archive their email to prevent conflicts
      if (!staff.profile.email.startsWith('deleted_')) {
        staff.profile.email = `deleted_${Date.now()}_${staff.profile.email}`;
      }
    }

    await staff.save();

    // Prepare response message
    const businessNames = businessesWithStaff.map(b => b.profile?.name || 'Unknown').join(', ');
    let message = `Staff member removed successfully from ${businessesWithStaff.length} business${businessesWithStaff.length > 1 ? 'es' : ''}`;
    
    if (remainingBusinessCount === 0) {
      message += ' and deactivated (no remaining business associations)';
    }

    res.json({
      success: true,
      message,
      data: {
        staffMember: {
          id: staff._id,
          name: staff.fullName || `${staff.profile.firstName} ${staff.profile.lastName}`,
          email: staff.profile.email,
          isActive: staff.isActive
        },
        removedFromBusinesses: businessesWithStaff.map(b => ({
          id: b._id,
          name: b.profile?.name
        })),
        remainingBusinessAssociations: remainingBusinessCount
      }
    });

  } catch (error) {
    console.error('Delete staff member error:', error);
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