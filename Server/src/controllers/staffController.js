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
  try {
    // 1) Check permissions
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

    // 3) Build query to find staff created by current user
    const query = {
      'profile.createdBy': req.user.userId,
      role: { $in: [ROLES.STAFF, ROLES.BUSINESS_ADMIN] }
    };

    // 4) Add filters
    if (status && status !== 'all') {
      query.isActive = status === 'active';
    }

    if (role && role !== 'all') {
      query.role = role;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { 'profile.firstName': searchRegex },
        { 'profile.lastName': searchRegex },
        { 'profile.email': searchRegex }
      ];
    }

    // 5) Get staff members with full details
    const staff = await User.find(query)
      .populate('profile.createdBy', 'profile.firstName profile.lastName profile.email role')
      .populate('business', 'profile.name profile.companyName profile.email')
      .select('-auth.passwordHash') // Exclude password
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // 6) Get total count
    const total = await User.countDocuments(query);

    // 7) Format response with additional metadata
    const formattedStaff = staff.map(member => {
      const memberObj = member.toObject();
      
      return {
        ...memberObj,
        createdByInfo: {
          id: req.user.userId,
          name: req.user.firstName ? `${req.user.firstName} ${req.user.lastName}` : 'You',
          email: req.user.email,
          role: req.user.role
        },
        wasCreatedByCurrentUser: true,
        canEdit: true,
        canDelete: true,
        businessInfo: memberObj.business?.map(b => ({
          id: b._id,
          name: b.profile.name,
          companyName: b.profile.companyName,
          email: b.profile.email
        })) || []
      };
    });

    // 8) Calculate stats for user's created staff
    const allUserStaff = await User.find({
      'profile.createdBy': req.user.userId,
      role: { $in: [ROLES.STAFF, ROLES.BUSINESS_ADMIN] }
    }).select('role isActive');

    const stats = {
      total: allUserStaff.length,
      active: allUserStaff.filter(s => s.isActive).length,
      inactive: allUserStaff.filter(s => !s.isActive).length,
      byRole: {
        staff: allUserStaff.filter(s => s.role === ROLES.STAFF).length,
        business_admin: allUserStaff.filter(s => s.role === ROLES.BUSINESS_ADMIN).length
      }
    };

    // 9) Respond
    return res.json({
      success: true,
      data: {
        staff: formattedStaff,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        },
        stats,
        message: `Showing ${formattedStaff.length} staff members created by you`
      }
    });
    
  } catch (error) {
    console.error('getMyCreatedStaff error:', error);
    next(error);
  }
}

// Function to check if current user can manage a specific staff member
async canManageStaff(req, res, next) {
  try {
    const { staffId } = req.params;
    
    const staffMember = await User.findById(staffId)
      .populate('profile.createdBy', 'profile.firstName profile.lastName profile.email role')
      .select('profile.createdBy role business');

    if (!staffMember) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    const wasCreatedByCurrentUser = staffMember.profile.createdBy && 
      staffMember.profile.createdBy._id.toString() === req.user.userId;
    
    const isSuperAdmin = req.user.role === ROLES.SUPER_ADMIN;
    const isSameBusiness = staffMember.business.some(b => 
      req.user.userData?.business?.some(ub => 
        (typeof ub === 'object' ? ub._id : ub).toString() === b.toString()
      )
    );

    const canManage = wasCreatedByCurrentUser || isSuperAdmin || 
      (isSameBusiness && req.user.role === ROLES.BUSINESS_ADMIN);

    return res.json({
      success: true,
      data: {
        canManage,
        canEdit: canManage,
        canDelete: wasCreatedByCurrentUser || isSuperAdmin,
        wasCreatedByCurrentUser,
        createdByInfo: staffMember.profile.createdBy ? {
          id: staffMember.profile.createdBy._id,
          name: `${staffMember.profile.createdBy.profile.firstName} ${staffMember.profile.createdBy.profile.lastName}`,
          email: staffMember.profile.createdBy.profile.email,
          role: staffMember.profile.createdBy.role
        } : null
      }
    });
  } catch (error) {
    console.error('canManageStaff error:', error);
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

    // Create staff member with createdBy field
    const staff = new User({
      profile: {
        firstName,
        lastName,
        email,
        phone,
        createdBy: req.user.userId, // ← ADD THIS LINE - Store who created this user
        emergencyContact: emergencyContact // Move emergencyContact to profile
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
      isActive: true
    });

    await staff.save();

    // Add staff to business staff array
    const Business = require('../models/Business');
    await Business.findByIdAndUpdate(
      req.user.businessId,
      { $addToSet: { staff: staff._id } }
    );

    // Enhanced audit log with more details
    await auditService.log({
      user: req.user.userId,
      business: req.user.businessId,
      action: 'CREATE',
      resource: 'staff',
      resourceId: staff._id,
      details: {
        staffEmail: email,
        staffName: `${firstName} ${lastName}`,
        role: role,
        createdBy: req.user.userId
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    // Remove password from response
    const staffResponse = staff.toObject();
    delete staffResponse.auth.passwordHash;

    // Populate the createdBy field in response for verification
    await staff.populate('profile.createdBy', 'profile.firstName profile.lastName profile.email role');

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: {
        staff: {
          ...staffResponse,
          profile: {
            ...staffResponse.profile,
            createdBy: staff.profile.createdBy // This will now include the creator's info
          }
        },
        tempPassword, // Send temp password to admin for sharing
        createdBy: {
          id: req.user.userId,
          name: req.user.firstName ? `${req.user.firstName} ${req.user.lastName}` : 'Admin',
          email: req.user.email
        }
      }
    });
  } catch (error) {
    console.error('Error creating staff member:', error);
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

    // 1) Load the staff member with creator information
    const staffUser = await User.findById(staffId)
      .populate('profile.createdBy', 'profile.firstName profile.lastName profile.email')
      .select('profile.createdBy isActive profile.firstName profile.lastName profile.email role');

    if (!staffUser) {
      return res.status(404).json({
        success: false,
        message: 'Staff user not found'
      });
    }

    // 2) Check if this staff member was created by the current user
   const wasCreatedByCurrentUser = staffUser.profile.createdBy._id.equals(req.user.userId);

    console.log('wasCreatedByCurrentUser:', wasCreatedByCurrentUser);

    if (!wasCreatedByCurrentUser) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only manage staff members that you created.',
        details: {
          staffMember: `${staffUser.profile.firstName} ${staffUser.profile.lastName}`,
          createdBy: staffUser.profile.createdBy ? {
            name: `${staffUser.profile.createdBy.profile.firstName} ${staffUser.profile.createdBy.profile.lastName}`,
            email: staffUser.profile.createdBy.profile.email
          } : 'Unknown',
          currentUser: req.user.userId
        }
      });
    }

    // 3) Store original status for audit
    const originalStatus = staffUser.isActive;

    // 4) Toggle the staff member's active status
    staffUser.isActive = !!isActive;
    await staffUser.save();

    // 5) Enhanced audit log with creator verification
    await auditService.log({
      user: req.user.userId,
      action: isActive ? 'ACTIVATE_STAFF' : 'DEACTIVATE_STAFF',
      resource: 'User',
      resourceId: staffUser._id,
      details: {
        staffName: `${staffUser.profile.firstName} ${staffUser.profile.lastName}`,
        staffEmail: staffUser.profile.email,
        statusChanged: {
          from: originalStatus,
          to: !!isActive
        },
        createdBy: req.user.userId,
        verifiedCreator: true
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    // 6) Respond with success
    return res.json({
      success: true,
      message: `Staff member ${staffUser.profile.firstName} ${staffUser.profile.lastName} has been ${isActive ? 'activated' : 'deactivated'}.`,
      data: {
        staffId: staffUser._id,
        staffName: `${staffUser.profile.firstName} ${staffUser.profile.lastName}`,
        isActive: staffUser.isActive,
        wasCreatedByYou: true
      }
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
    
    // Find the staff member first with creator information
    const staff = await User.findById(id)
      .populate('profile.createdBy', 'profile.firstName profile.lastName profile.email');
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Prevent self-deletion
    if (staff._id.toString() === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete yourself'
      });
    }

    // Check if current user created this staff member
 const wasCreatedByCurrentUser = staff.profile.createdBy._id.equals(req.user.userId);


    // Allow deletion only if:
    // 1. Current user created the staff member, OR
    // 2. Current user is SUPER_ADMIN
    if (!wasCreatedByCurrentUser && req.user.role !== ROLES.SUPER_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete staff members that you created.',
        details: {
          staffMember: `${staff.profile.firstName} ${staff.profile.lastName}`,
          createdBy: staff.profile.createdBy ? {
            name: `${staff.profile.createdBy.profile.firstName} ${staff.profile.createdBy.profile.lastName}`,
            email: staff.profile.createdBy.profile.email
          } : 'Unknown'
        }
      });
    }

    // Store staff information for response and audit
    const staffInfo = {
      id: staff._id,
      name: `${staff.profile.firstName} ${staff.profile.lastName}`,
      email: staff.profile.email,
      role: staff.role,
      createdBy: staff.profile.createdBy ? {
        id: staff.profile.createdBy._id,
        name: `${staff.profile.createdBy.profile.firstName} ${staff.profile.createdBy.profile.lastName}`,
        email: staff.profile.createdBy.profile.email
      } : null
    };

    // Find all businesses where this staff member is present
    const businessesWithStaff = await Business.find({ staff: id })
      .select('profile.name profile.companyName staff');

    // Remove staff from all businesses
    const removedFromBusinesses = [];
    for (const business of businessesWithStaff) {
      await Business.findByIdAndUpdate(
        business._id,
        { $pull: { staff: id } }
      );
      
      removedFromBusinesses.push({
        id: business._id,
        name: business.profile.name || business.profile.companyName
      });
    }

    // Check for any related data that needs cleanup
    const relatedDataCleanup = [];

    // Clean up appointments (if any)
    const Appointment = require('../models/Appointment');
    const appointmentCount = await Appointment.countDocuments({
      $or: [
        { staff: id },
        { veterinarian: id },
        { assignedTo: id }
      ]
    });

    if (appointmentCount > 0) {
      // Option 1: Transfer appointments to admin or another staff member
      // Option 2: Cancel/mark appointments as staff unavailable
      // For now, we'll just log this for manual handling
      relatedDataCleanup.push({
        type: 'appointments',
        count: appointmentCount,
        action: 'requires_manual_review'
      });
    }

    // Clean up any documents created by this staff member
    const Document = require('../models/Document');
    const documentCount = await Document.countDocuments({ uploadedBy: id });
    
    if (documentCount > 0) {
      // Keep documents but mark as uploaded by deleted user
      await Document.updateMany(
        { uploadedBy: id },
        { 
          $set: { 
            uploadedBy: null,
            metadata: {
              originalUploader: staffInfo,
              deletedAt: new Date()
            }
          }
        }
      );
      
      relatedDataCleanup.push({
        type: 'documents',
        count: documentCount,
        action: 'transferred_to_system'
      });
    }

    // Clean up audit logs - keep them but mark user as deleted
    const AuditLog = require('../models/AuditLog');
    await AuditLog.updateMany(
      { user: id },
      { 
        $set: { 
          userDeleted: true,
          deletedUserInfo: staffInfo
        }
      }
    );

    // Create final audit log before deletion
    await auditService.log({
      user: req.user.userId,
      action: 'DELETE_USER_ACCOUNT',
      resource: 'user',
      resourceId: staff._id,
      details: {
        deletedStaff: staffInfo,
        deletedBy: {
          id: req.user.userId,
          name: req.user.firstName ? `${req.user.firstName} ${req.user.lastName}` : 'Admin',
          role: req.user.role
        },
        businessesAffected: removedFromBusinesses,
        relatedDataCleanup,
        wasCreatedByDeleter: wasCreatedByCurrentUser
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deletionReason: 'staff_account_deletion'
      }
    });

    // Delete the user account completely
    await User.findByIdAndDelete(id);

    // Prepare response
    const message = `Staff member ${staffInfo.name} has been permanently deleted from the system`;

    res.json({
      success: true,
      message,
      data: {
        deletedStaff: staffInfo,
        businessesAffected: removedFromBusinesses,
        relatedDataCleanup,
        deletionSummary: {
          userAccountDeleted: true,
          businessAssociationsRemoved: removedFromBusinesses.length,
          appointmentsAffected: appointmentCount,
          documentsTransferred: documentCount,
          auditLogsPreserved: true
        },
        warning: appointmentCount > 0 ? 
          `This staff member had ${appointmentCount} appointments that may need manual review` : null
      }
    });

  } catch (error) {
    console.error('Delete staff member error:', error);
    
    // Handle specific errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid staff member ID provided'
      });
    }
    
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