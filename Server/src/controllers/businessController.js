const Business = require('../models/Business');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { ROLES } = require('../config/constants');
const auditService = require('../services/auditService');
const Appointment = require('../models/Appointment');

class BusinessController {
  // Create new business (Business Admin only)
// Server/src/controllers/businessController.js (Fixed createBusiness method)
async createBusiness(req, res, next) {
  try {
    const {
      businessData = {}   
    } = req.body;

    const {
      profile,
      services = [],   
      schedule,
      settings = {},
      subscription = {}
    } = businessData;

    const userId = req.user.userId;
    const userRole = req.user.role;

    // Only business_admin and super_admin can create businesses
    if (![ROLES.BUSINESS_ADMIN, ROLES.SUPER_ADMIN].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Only business administrators can create businesses'
      });
    }

    // Get the user creating the business
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validation for required fields
    if (!profile?.name || !profile?.companyName) {
      return res.status(400).json({
        success: false,
        message: 'Business name and company name are required'
      });
    }

    // Validate category if provided
    if (!profile?.category) {
      return res.status(400).json({
        success: false,
        message: 'Business category is required'
      });
    }

    // Verify category exists
    const BusinessCategory = require('../models/BusinessCategory');
    const categoryExists = await BusinessCategory.findById(profile.category);
    if (!categoryExists) {
      return res.status(400).json({
        success: false,
        message: 'Invalid business category'
      });
    }

    // Build business payload
    const businessPayload = {
      profile: {
        name: profile.name,
        companyName: profile.companyName,
        description: profile.description || '',
        logo: profile.logo || '',
        website: profile.website || '',
        email: profile.email.toLowerCase(),
        phone: profile.phone,
        category: profile.category, // Add the category ID to the business payload
        address: {
          street: profile.address.street,
          city: profile.address.city,
          state: profile.address.state,
          zipCode: profile.address.zipCode,
          country: profile.address.country || 'IND'
        }
      },
      services: services.map(service => ({
        name: service.name,
        description: service.description || '',
        duration: service.duration || 60,
        price: {
          amount: service.price?.amount || 0,
          currency: service.price?.currency || 'INR'
        },
        category: service.category || 'general',
        isActive: service.isActive !== false
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
      staff: [userId], // Add creator as first staff member
      settings: {
        appointmentBookingWindow: settings.appointmentBookingWindow || 30,
        cancellationPolicy: {
          hoursRequired: settings.cancellationPolicy?.hoursRequired || 24,
          feePercentage: settings.cancellationPolicy?.feePercentage || 0
        },
        autoReminders: {
          email: {
            enabled: settings.autoReminders?.email?.enabled !== false,
            hoursBefore: settings.autoReminders?.email?.hoursBefore || 24
          },
          sms: {
            enabled: settings.autoReminders?.sms?.enabled || false,
            hoursBefore: settings.autoReminders?.sms?.hoursBefore || 2
          }
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

    // Create business
    const business = new Business(businessPayload);
    await business.save();

    // Update user with business reference
    user.business.push(business._id);
    await user.save();

    // Audit log
    await auditService.log({
      user: userId,
      action: 'CREATE_BUSINESS',
      resource: 'business',
      resourceId: business._id,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        businessName: business.profile.name,
        companyName: business.profile.companyName,
        categoryId: business.profile.category
      }
    });

    // Populate category information in response
    await business.populate('profile.category', 'name slug color icon description');

    // Prepare response
    const responseData = {
      business: {
        id: business._id,
        name: business.profile.name,
        companyName: business.profile.companyName,
        email: business.profile.email,
        phone: business.profile.phone,
        category: business.profile.category, // Include populated category
        address: business.profile.address,
        services: business.services,
        settings: business.settings,
        subscription: business.subscription,
        isActive: business.isActive,
        createdAt: business.createdAt
      }
    };

    res.status(201).json({
      success: true,
      message: 'Business created successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Create business error:', error);
    next(error);
  }
}
  // Get business details
   async getBusiness(req, res, next) {
    try {
      const userId     = req.user.userId;
      const userRole   = req.user.role;
      const businessId = req.params.businessId;

      let business;

      if (userRole === ROLES.SUPER_ADMIN) {
        // Super admin can access any business
        business = await Business.findById(businessId)
          .populate('staff', 'profile.firstName profile.lastName profile.email role');
      } else {
        // Business admin and staff can only access their own business
        const user = await User.findById(userId);
        if (!user.business) {
          return res.status(404).json({
            success: false,
            message: 'No business associated with your account'
          });
        }

        business = await Business.findById(user.business)
          .populate('staff', 'profile.firstName profile.lastName profile.email role');
      }

      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found'
        });
      }

      // Get business metrics
      const totalAppointments = await Appointment.countDocuments({ business: business._id });
      const revenueAgg = await Appointment.aggregate([
        { $match: { business: business._id, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$payment.amount' } } }
      ]);

      business.metrics = business.metrics || {};
      business.metrics.totalAppointments = totalAppointments;
      business.metrics.totalRevenue      = revenueAgg[0]?.total || 0;

      res.json({
        success: true,
        data: { business }
      });
    } catch (error) {
      console.error('Get business error:', error);
      next(error);
    }
  }

  // Update business
  async updateBusiness(req, res, next) {

    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const businessId = req.params.businessId || req.user.business.id;
      const updates = req.body;

      let business;

      if (userRole === ROLES.SUPER_ADMIN) {
        business = await Business.findById(businessId);
      } else {
        // Business admin can only update their own business
        const user = await User.findById(userId);
        if (!user.business || user.business.toString() !== businessId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You can only update your own business.'
          });
        }
        business = await Business.findById(businessId);
      }

      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found'
        });
      }

      // Store original data for audit
      const originalData = business.toObject();

      // Define allowed update fields
      const allowedUpdates = [
        'profile.name', 'profile.description', 'profile.logo', 'profile.website',
        'profile.phone', 'profile.address', 'services', 'schedule',
        'settings.appointmentBookingWindow', 'settings.cancellationPolicy',
        'settings.autoReminders', 'settings.paymentMethods'
      ];

      // Apply updates
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.some(allowed => key.startsWith(allowed.split('.')[0]))) {
          if (key.includes('.')) {
            // Handle nested updates
            const keys = key.split('.');
            let obj = business;
            for (let i = 0; i < keys.length - 1; i++) {
              if (!obj[keys[i]]) obj[keys[i]] = {};
              obj = obj[keys[i]];
            }
            obj[keys[keys.length - 1]] = updates[key];
          } else {
            business[key] = updates[key];
          }
        }
      });

      // Update timestamp
      business.updatedAt = new Date();

      // Save business
      await business.save();

      // Audit log
      await auditService.log({
        user: userId,
        action: 'UPDATE_BUSINESS',
        resource: 'business',
        resourceId: business._id,
        details: {
          before: originalData,
          after: business.toObject()
        },
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.json({
        success: true,
        message: 'Business updated successfully',
        data: { business }
      });

    } catch (error) {
      console.error('Update business error:', error);
      next(error);
    }
  }

  // Get all businesses (Business Admin only)
 async getAllBusinesses(req, res, next) {
    try {
      // 1) Only BUSINESS_ADMIN may call this
      if (req.user.role !== ROLES.BUSINESS_ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Business admins only.'
        });
      }

      // 2) Pagination params
      const page  = parseInt(req.query.page,  10) || 1;
      const limit = parseInt(req.query.limit, 10) || 10;
      const skip  = (page - 1) * limit;

      // 3) Determine which businesses this admin owns
      const owned = req.user.userData?.business;
      if (!Array.isArray(owned) || owned.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'You have no businesses assigned.'
        });
      }
      // Normalize to array of string IDs
      const ownedIds = owned.map(b =>
        typeof b === 'object' ? b._id.toString() : b.toString()
      );

      // 4) Build query filters, including ownership
      const query = {
        _id: { $in: ownedIds }
      };
      if (req.query.search) {
        query.$or = [
          { 'profile.name':  { $regex: req.query.search, $options: 'i' } },
          { 'profile.email': { $regex: req.query.search, $options: 'i' } }
        ];
      }
      if (req.query.status) {
        query.isActive = req.query.status === 'active';
      }
      if (req.query.plan) {
        query['subscription.plan'] = req.query.plan;
      }

      // 5) Fetch the paged results in parallel with the count
      const [ businesses, total ] = await Promise.all([
        Business.find(query)
          .populate('staff', 'profile.firstName profile.lastName profile.email role')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Business.countDocuments(query)
      ]);

      // 6) Return with pagination info
      return res.json({
        success: true,
        data: {
          businesses,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      console.error('Get all businesses error:', error);
      next(error);
    }
  }


  // Enhanced version of getAllStaffMembers with business details
async getAllStaffMembersEnhanced(req, res, next) {
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
        select: 'profile.firstName profile.lastName profile.email role isActive business createdAt',
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

  // Add staff to business
async addStaff(req, res, next) {
  try {
    const { email, role = ROLES.STAFF } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const businessId = req.params.businessId;

    // Validate businessId is provided
    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Business ID is required in the URL parameters.'
      });
    }

    // Only business admin and super admin can add staff
    if (![ROLES.BUSINESS_ADMIN, ROLES.SUPER_ADMIN].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only business administrators can add staff.'
      });
    }

    // Get the business
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({
        success: false,
        message: 'Business not found'
      });
    }

    // Authorization check based on role
    if (userRole === ROLES.BUSINESS_ADMIN) {
      // Business admin can only add staff to businesses they own
      const user = await User.findById(userId);
      
      // Check if user has any businesses
      if (!user.business || user.business.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'You do not own any businesses.'
        });
      }

      // Convert to array if it's not already (handle both single business and multiple businesses)
      const userBusinesses = Array.isArray(user.business) ? user.business : [user.business];
      
      // Check if the requested business is owned by the user
      const ownsThisBusiness = userBusinesses.some(bizId => bizId.toString() === businessId);
      
      if (!ownsThisBusiness) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only add staff to businesses you own.'
        });
      }
    }
    // Super admin can add staff to any business (no additional checks needed)

    // Find staff user
    const staffUser = await User.findOne({ 'profile.email': email.toLowerCase() });
    if (!staffUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Check if user is already staff in this business
    if (business.staff.includes(staffUser._id)) {
      return res.status(400).json({
        success: false,
        message: 'User is already a staff member of this business'
      });
    }

    // Validate role assignment
    const allowedRoles = [ROLES.STAFF, ROLES.MANAGER];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Only STAFF and MANAGER roles can be assigned.'
      });
    }

    // Add staff to business
    business.staff.push(staffUser._id);
    await business.save();

    // Update user's business association and role
    // Handle multiple business associations
    if (!Array.isArray(staffUser.business)) {
      staffUser.business = staffUser.business ? [staffUser.business] : [];
    }
    
    // Add business if not already associated
    if (!staffUser.business.includes(businessId)) {
      staffUser.business.push(businessId);
    }
    
    staffUser.role = role;
    await staffUser.save();

    // Audit log
    await auditService.log({
      user: userId,
      action: 'ADD_STAFF',
      resource: 'business',
      resourceId: business._id,
      metadata: {
        staffUserId: staffUser._id,
        staffEmail: email,
        staffRole: role,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    });

    res.json({
      success: true,
      message: 'Staff member added successfully',
      data: {
        staff: {
          id: staffUser._id,
          name: `${staffUser.profile.firstName} ${staffUser.profile.lastName}`,
          email: staffUser.profile.email,
          role: staffUser.role,
          businessId: businessId,
          businessName: business.profile.name
        }
      }
    });

  } catch (error) {
    console.error('Add staff error:', error);
    next(error);
  }
}

  // Remove staff from business
  async removeStaff(req, res, next) {
    try {
      const { staffId } = req.params;
      const userId = req.user.userId;
      const userRole = req.user.role;
      const businessId = req.params.businessId || req.user.businessId;

      // Only business admin and super admin can remove staff
      if (![ROLES.BUSINESS_ADMIN, ROLES.SUPER_ADMIN].includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only business administrators can remove staff.'
        });
      }

      // Get business
      let business;
      if (userRole === ROLES.SUPER_ADMIN) {
        business = await Business.findById(businessId);
      } else {
        const user = await User.findById(userId);
        if (!user.business || user.business.toString() !== businessId) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. You can only manage your own business staff.'
          });
        }
        business = await Business.findById(businessId);
      }

      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found'
        });
      }

      // Remove staff from business
      business.staff = business.staff.filter(id => id.toString() !== staffId);
      await business.save();

      // Update user
      const staffUser = await User.findById(staffId);
      if (staffUser) {
        staffUser.business = null;
        staffUser.role = ROLES.PET_OWNER; // Default role
        await staffUser.save();
      }

      // Audit log
      await auditService.log({
        user: userId,
        action: 'REMOVE_STAFF',
        resource: 'business',
        resourceId: business._id,
        metadata: {
          staffUserId: staffId,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.json({
        success: true,
        message: 'Staff member removed successfully'
      });

    } catch (error) {
      console.error('Remove staff error:', error);
      next(error);
    }
  }

  // Deactivate business
  async deactivateBusiness(req, res, next) {
    try {
      const userId = req.user.userId;
      const userRole = req.user.role;
      const businessId = req.params.businessId || req.user.businessId;

      // Only super admin can deactivate businesses
      if (userRole !== ROLES.SUPER_ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only super administrators can deactivate businesses.'
        });
      }

      const business = await Business.findById(businessId);
      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found'
        });
      }

      // Check for active appointments
      const Appointment = require('../models/Appointment');
      const activeAppointments = await Appointment.countDocuments({
        business: businessId,
        status: { $in: ['confirmed', 'pending'] },
        'schedule.startTime': { $gte: new Date() }
      });

      if (activeAppointments > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot deactivate business with ${activeAppointments} active appointments`
        });
      }

      // Deactivate business
      business.isActive = false;
      business.updatedAt = new Date();
      await business.save();

      // Deactivate associated staff
      await User.updateMany(
        { business: businessId },
        { isActive: false }
      );

      // Audit log
      await auditService.log({
        user: userId,
        action: 'DEACTIVATE_BUSINESS',
        resource: 'business',
        resourceId: business._id,
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });

      res.json({
        success: true,
        message: 'Business deactivated successfully'
      });

    } catch (error) {
      console.error('Deactivate business error:', error);
      next(error);
    }
  }
}

module.exports = new BusinessController();