const User = require('../models/User');
const Business = require('../models/Business');
const Pet = require('../models/Pet');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const Message = require('../models/Message');
const Document = require('../models/Document');
const Service = require('../models/Service');
const AuditLog = require('../models/AuditLog');
const auditService = require('../services/auditService');
const { sendEmail } = require('../services/emailService');
const { ROLES, APPOINTMENT_STATUS, INVOICE_STATUS } = require('../config/constants');
const mongoose = require('mongoose');

class AdminController {
  // ===================================
  // DASHBOARD & ANALYTICS
  // ===================================

  // Get admin dashboard overview
  async getDashboardOverview(req, res, next) {
    try {
      const { dateFrom, dateTo, businessId } = req.query;
      
      // Build date filter
      const dateFilter = {};
      if (dateFrom || dateTo) {
        dateFilter.createdAt = {};
        if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) dateFilter.createdAt.$lte = new Date(dateTo);
      }

      // Build business filter for super admin
      const businessFilter = {};
      if (req.user.role === ROLES.SUPER_ADMIN && businessId) {
        businessFilter.business = businessId;
      } else if (req.user.role !== ROLES.SUPER_ADMIN) {
        businessFilter.business = req.user.businessId;
      }

      // Get overview statistics
      const [
        totalUsers,
        totalBusinesses,
        totalPets,
        totalAppointments,
        totalRevenue,
        recentAppointments,
        businessStats,
        appointmentStatusStats,
        revenueByMonth
      ] = await Promise.all([
        // Total users
        User.countDocuments({ ...dateFilter, isActive: true }),
        
        // Total businesses (super admin only)
        req.user.role === ROLES.SUPER_ADMIN 
          ? Business.countDocuments({ ...dateFilter, isActive: true })
          : 1,
        
        // Total pets
        Pet.countDocuments({ ...dateFilter, isActive: true }),
        
        // Total appointments
        Appointment.countDocuments({ ...dateFilter, ...businessFilter }),
        
        // Total revenue
        Invoice.aggregate([
          { $match: { ...dateFilter, ...businessFilter, 'payment.status': INVOICE_STATUS.PAID } },
          { $group: { _id: null, total: { $sum: '$totals.total' } } }
        ]).then(result => result[0]?.total || 0),
        
        // Recent appointments
        Appointment.find({ ...businessFilter })
          .populate('client', 'profile.firstName profile.lastName')
          .populate('pet', 'profile.name profile.species')
          .populate('business', 'profile.name')
          .sort({ createdAt: -1 })
          .limit(10),
        
        // Business performance stats
        Business.aggregate([
          { $match: { isActive: true } },
          {
            $lookup: {
              from: 'appointments',
              localField: '_id',
              foreignField: 'business',
              as: 'appointments'
            }
          },
          {
            $lookup: {
              from: 'invoices',
              localField: '_id',
              foreignField: 'business',
              as: 'invoices'
            }
          },
          {
            $project: {
              name: '$profile.name',
              totalAppointments: { $size: '$appointments' },
              totalRevenue: {
                $sum: {
                  $map: {
                    input: {
                      $filter: {
                        input: '$invoices',
                        cond: { $eq: ['$$this.payment.status', INVOICE_STATUS.PAID] }
                      }
                    },
                    as: 'invoice',
                    in: '$$invoice.totals.total'
                  }
                }
              }
            }
          },
          { $sort: { totalRevenue: -1 } },
          { $limit: 5 }
        ]),
        
        // Appointment status distribution
        Appointment.aggregate([
          { $match: { ...dateFilter, ...businessFilter } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        
        // Revenue by month (last 12 months)
        Invoice.aggregate([
          {
            $match: {
              ...businessFilter,
              'payment.status': INVOICE_STATUS.PAID,
              createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              revenue: { $sum: '$totals.total' },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ])
      ]);

      // Calculate growth metrics (compared to previous period)
      const periodLength = dateTo && dateFrom 
        ? new Date(dateTo) - new Date(dateFrom)
        : 30 * 24 * 60 * 60 * 1000; // Default 30 days

      const previousPeriodFilter = {
        createdAt: {
          $gte: new Date(Date.now() - 2 * periodLength),
          $lt: new Date(Date.now() - periodLength)
        }
      };

      const [previousUsers, previousAppointments, previousRevenue] = await Promise.all([
        User.countDocuments({ ...previousPeriodFilter, isActive: true }),
        Appointment.countDocuments({ ...previousPeriodFilter, ...businessFilter }),
        Invoice.aggregate([
          { $match: { ...previousPeriodFilter, ...businessFilter, 'payment.status': INVOICE_STATUS.PAID } },
          { $group: { _id: null, total: { $sum: '$totals.total' } } }
        ]).then(result => result[0]?.total || 0)
      ]);

      // Calculate growth percentages
      const calculateGrowth = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous * 100).toFixed(1);
      };

      const dashboard = {
        overview: {
          totalUsers,
          totalBusinesses,
          totalPets,
          totalAppointments,
          totalRevenue,
          growth: {
            users: calculateGrowth(totalUsers, previousUsers),
            appointments: calculateGrowth(totalAppointments, previousAppointments),
            revenue: calculateGrowth(totalRevenue, previousRevenue)
          }
        },
        recentActivity: {
          appointments: recentAppointments
        },
        charts: {
          appointmentStatus: appointmentStatusStats,
          revenueByMonth,
          topBusinesses: businessStats
        }
      };

      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      next(error);
    }
  }





  // Create staff and client accounts
 async createUser(req, res, next) {
  try {
    const { 
      firstName, 
      lastName, 
      email, 
      password, 
      phone, 
      role,
      address,
      emergencyContact
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: firstName, lastName, email, password, and role are required'
      });
    }

    // Validate role permissions
    const allowedRoles = ['client', 'staff'];
    if (req.user.role === 'business_admin') {
      // Business admin can only create pet_owner and staff
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Business admin can only create pet_owner and staff users'
        });
      }
    } else if (req.user.role === 'super_admin') {
      // Super admin can create any role
      allowedRoles.push('business_admin');
    } else {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to create users'
      });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Invalid role. Allowed roles: ${allowedRoles.join(', ')}`
      });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ 'profile.email': normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Get the correct user ID - handle both possible structures
    const creatorId = req.user._id || req.user.userData?.id;
    
    if (!creatorId) {
      return res.status(400).json({
        success: false,
        message: 'Unable to identify creating user'
      });
    }

    console.log('Creator ID:', creatorId);
    console.log('User role:', req.user.role);

    // Prepare user data
    const userData = {
      role,
      profile: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: normalizedEmail,
        phone: phone?.trim(),
        address: address || {},
        createdBy: creatorId  // Always set createdBy
      },
      auth: {
        passwordHash: password, 
        emailVerified: false,
        phoneVerified: false
      },
      settings: {
        timezone: 'GMT+5:30',
        notifications: {
          email: true,
          sms: false,
          push: true
        },
        language: 'en'
      }
    };

    // Handle business association based on creator role
    if (req.user.role === 'business_admin') {
      // Add business association for business_admin created users
      if (req.user.business) {
        userData.business = req.user.business;
      }
    } else if (req.user.role === 'super_admin') {
      // Super admin creating a business_admin
      if (role === 'business_admin') {
        userData.profile.isSelfRegistered = true;
      }
    }

    // Add emergency contact if provided
    if (emergencyContact && emergencyContact.name && emergencyContact.phone) {
      userData.emergencyContact = {
        name: emergencyContact.name.trim(),
        phone: emergencyContact.phone.trim(),
        relationship: emergencyContact.relationship?.trim() || 'other'
      };
    }

    console.log('User data before save:', {
      role: userData.role,
      createdBy: userData.profile.createdBy,
      business: userData.business
    });

    // Create the user
    const newUser = new User(userData);
    await newUser.save();

    console.log('User created successfully with createdBy:', newUser.profile.createdBy);

    // Log the creation with additional context
    await auditService.log({
      user: creatorId,
      action: 'CREATE',
      resource: 'user',
      resourceId: newUser._id,
      metadata: { 
        createdRole: role,
        createdBy: req.user.role,
        businessAdminId: req.user.role === 'business_admin' ? creatorId : null,
        ipAddress: req.ip, 
        userAgent: req.get('User-Agent') 
      }
    });

    // Populate business info and creator info for response
    await newUser.populate([
      { path: 'business', select: 'profile.name profile.contactInfo' },
      { path: 'profile.createdBy', select: 'profile.firstName profile.lastName profile.email' }
    ]);

    // Remove password from response
    const responseData = newUser.toObject();
    delete responseData.auth.passwordHash;

    res.status(201).json({
      success: true,
      message: `${role === 'client' ? 'Client' : 'User'} created successfully`,
      data: responseData
    });

  } catch (error) {
    console.error('Create user error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorMessages
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists'
      });
    }

    next(error);
  }
}
  // ===================================
  // USER MANAGEMENT
  // ===================================

  // Get all users with filtering and pagination
async getUsers(req, res, next) {
  try {
    const {
      role,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeOwnerBusinesses = false,
      showMyCreatedUsers = false
    } = req.query; // ✅ Fixed: Changed from req.user to req.query

    console.log('Current user:', req.user.userData);
    console.log('Query params:', req.query);
    
    // Get current user ID from userData
    const currentUserId = req.user.userData?.id || req.user.userData?._id;

    // Build filter
    const filter = {};
    
    // Add role filter if specified
    if (role) filter.role = role;
  
    // This ensures business_admin only sees users they created
    if (req.user.userData.role === 'business_admin') {
      filter['profile.createdBy'] = currentUserId;
    }
    
    // If showMyCreatedUsers is explicitly requested, filter by creator
    if (showMyCreatedUsers === 'true') {
      filter['profile.createdBy'] = currentUserId;
    }

    // Restrict access for non-super-admin users
    if (req.user.userData.role !== 'super_admin') {
      // For business_admin, they should only see users they created
      if (req.user.userData.role === 'business_admin') {
        filter['profile.createdBy'] = currentUserId;
      }
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Enhanced population to include business owner info and creator info
    const businessPopulation = includeOwnerBusinesses === 'true' 
      ? 'profile.name owner profile.contactInfo' 
      : 'profile.name';

    console.log('Filter being applied:', filter);

    const [users, total] = await Promise.all([
      User.find(filter)
        .populate('business', businessPopulation)
        .populate('pets', 'profile.name profile.species')
        .populate('profile.createdBy', 'profile.firstName profile.lastName profile.email role')
        .select('-auth.passwordHash')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(filter)
    ]);

    // Check for owner businesses if requested
    let usersWithOwnershipInfo = users;
    if (includeOwnerBusinesses === 'true') {
      usersWithOwnershipInfo = await Promise.all(
        users.map(async (user) => {
          const userObj = user.toObject();
          
          // Find businesses owned by this user
          const ownedBusinesses = await Business.find({ owner: user._id })
            .select('profile.name profile.description createdAt isActive')
            .lean();
          
          // Check if user is owner of their current business
          const isOwnerOfCurrentBusiness = user.business && 
            user.business.owner && 
            user.business.owner.toString() === user._id.toString();
          
          return {
            ...userObj,
            ownershipInfo: {
              isOwnerOfCurrentBusiness,
              ownedBusinesses,
              totalOwnedBusinesses: ownedBusinesses.length
            }
          };
        })
      );
    }

    // Add summary of created users for business admins
    const createdUsersCount = await User.countDocuments({
      'profile.createdBy': currentUserId
    });

    res.json({
      success: true,
      data: {
        users: usersWithOwnershipInfo,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        },
        summary: {
          totalCreatedByCurrentUser: createdUsersCount,
          currentUserRole: req.user.userData.role,
          currentUserId: currentUserId,
          filtersApplied: {
            role: role || null,
            createdBy: currentUserId,
            showMyCreatedUsers: showMyCreatedUsers === 'true',
            // search: search || null
          }
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    next(error);
  }
}
  // Create new user
  // async createUser(req, res, next) {
  //   try {
  //     const userData = req.body;

  //     // Check if user already exists
  //     const existingUser = await User.findOne({ 'profile.email': userData.profile.email });
  //     if (existingUser) {
  //       return res.status(400).json({
  //         success: false,
  //         message: 'User with this email already exists'
  //       });
  //     }

  //     // For non-super-admin, restrict to their business
  //     if (req.user.role !== ROLES.SUPER_ADMIN) {
  //       userData.business = req.user.businessId;
  //     }

  //     const user = new User(userData);
  //     await user.save();

  //     // Add user to business staff if applicable
  //     if (user.business && [ROLES.BUSINESS_ADMIN, ROLES.STAFF].includes(user.role)) {
  //       await Business.findByIdAndUpdate(user.business, {
  //         $push: { staff: user._id }
  //       });
  //     }

  //     // Send welcome email
  //     try {
  //       await sendEmail({
  //         to: user.profile.email,
  //         subject: 'Welcome to PetSync',
  //         template: 'user-welcome',
  //         data: {
  //           firstName: user.profile.firstName,
  //           role: user.role
  //         }
  //       });
  //     } catch (emailError) {
  //       console.error('Failed to send welcome email:', emailError);
  //     }

  //     // Log creation
  //     await auditService.log({
  //       user: req.user.userId,
  //       business: user.business,
  //       action: 'CREATE',
  //       resource: 'user',
  //       resourceId: user._id
  //     });

  //     res.status(201).json({
  //       success: true,
  //       message: 'User created successfully',
  //       data: { user }
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // }

  // Update user
  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check permissions
      if (req.user.role !== ROLES.SUPER_ADMIN && user.business?.toString() !== req.user.businessId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Store original data for audit
      const originalData = user.toObject();

      // Update user
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && key !== 'auth') {
          user[key] = updates[key];
        }
      });

      await user.save();

      // Log update
      await auditService.log({
        user: req.user.userId,
        business: user.business,
        action: 'UPDATE',
        resource: 'user',
        resourceId: user._id,
        details: {
          before: originalData,
          after: user.toObject()
        }
      });

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  // Deactivate/Activate user
  async toggleUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check permissions
      if (req.user.role !== ROLES.SUPER_ADMIN && user.business?.toString() !== req.user.businessId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      user.isActive = isActive;
      await user.save();

      // Log action
      await auditService.log({
        user: req.user.userId,
        business: user.business,
        action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
        resource: 'user',
        resourceId: user._id
      });

      res.json({
        success: true,
        message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: { user }
      });
    } catch (error) {
      next(error);
    }
  }

  // Reset user password
  async resetUserPassword(req, res, next) {
    try {
      const { id } = req.params;
      const { newPassword, sendEmail: shouldSendEmail = true } = req.body;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check permissions
      if (req.user.role !== ROLES.SUPER_ADMIN && user.business?.toString() !== req.user.businessId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Generate new password if not provided
      const password = newPassword || this.generateRandomPassword();

      user.auth.passwordHash = password;
      await user.save();

      // Send password reset email
      if (shouldSendEmail) {
        try {
          await sendEmail({
            to: user.profile.email,
            subject: 'Password Reset - PetSync',
            template: 'password-reset-admin',
            data: {
              firstName: user.profile.firstName,
              newPassword: password
            }
          });
        } catch (emailError) {
          console.error('Failed to send password reset email:', emailError);
        }
      }

      // Log password reset
      await auditService.log({
        user: req.user.userId,
        business: user.business,
        action: 'PASSWORD_RESET',
        resource: 'user',
        resourceId: user._id
      });

      res.json({
        success: true,
        message: 'Password reset successfully',
        data: { newPassword: !shouldSendEmail ? password : undefined }
      });
    } catch (error) {
      next(error);
    }
  }

  // ===================================
  // BUSINESS MANAGEMENT
  // ===================================

  // Get all businesses
  async getBusinesses(req, res, next) {
    try {
      const {
        isActive,
        search,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      // Only super admin can access all businesses
      if (req.user.role !== ROLES.SUPER_ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Build filter
      const filter = {};
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      
      if (search) {
        filter.$or = [
          { 'profile.name': { $regex: search, $options: 'i' } },
          { 'profile.email': { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

      const [businesses, total] = await Promise.all([
        Business.find(filter)
          .populate('staff', 'profile.firstName profile.lastName role')
          .sort(sort)
          .skip(skip)
          .limit(parseInt(limit)),
        Business.countDocuments(filter)
      ]);

      // Add statistics for each business
      const businessesWithStats = await Promise.all(
        businesses.map(async (business) => {
          const [appointmentCount, revenue, clientCount] = await Promise.all([
            Appointment.countDocuments({ business: business._id }),
            Invoice.aggregate([
              { $match: { business: business._id, 'payment.status': INVOICE_STATUS.PAID } },
              { $group: { _id: null, total: { $sum: '$totals.total' } } }
            ]).then(result => result[0]?.total || 0),
            User.countDocuments({ business: business._id, role: ROLES.CLIENT, isActive: true })
          ]);

          return {
            ...business.toObject(),
            stats: {
              totalAppointments: appointmentCount,
              totalRevenue: revenue,
              totalClients: clientCount
            }
          };
        })
      );

      res.json({
        success: true,
        data: {
          businesses: businessesWithStats,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Create new business
  async createBusiness(req, res, next) {
    try {
      // Only super admin can create businesses
      if (req.user.role !== ROLES.SUPER_ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const businessData = req.body;

      // Check if business email already exists
      const existingBusiness = await Business.findOne({ 'profile.email': businessData.profile.email });
      if (existingBusiness) {
        return res.status(400).json({
          success: false,
          message: 'Business with this email already exists'
        });
      }

      const business = new Business(businessData);
      await business.save();

      // Log creation
      await auditService.log({
        user: req.user.userId,
        action: 'CREATE',
        resource: 'business',
        resourceId: business._id
      });

      res.status(201).json({
        success: true,
        message: 'Business created successfully',
        data: { business }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update business
  async updateBusiness(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const business = await Business.findById(id);
      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found'
        });
      }

      // Check permissions
      if (req.user.role !== ROLES.SUPER_ADMIN && req.user.businessId?.toString() !== id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Store original data for audit
      const originalData = business.toObject();

      // Update business
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          business[key] = updates[key];
        }
      });

      await business.save();

      // Log update
      await auditService.log({
        user: req.user.userId,
        business: business._id,
        action: 'UPDATE',
        resource: 'business',
        resourceId: business._id,
        details: {
          before: originalData,
          after: business.toObject()
        }
      });

      res.json({
        success: true,
        message: 'Business updated successfully',
        data: { business }
      });
    } catch (error) {
      next(error);
    }
  }

  // Toggle business status
  async toggleBusinessStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;

      // Only super admin can deactivate businesses
      if (req.user.role !== ROLES.SUPER_ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const business = await Business.findById(id);
      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found'
        });
      }

      business.isActive = isActive;
      await business.save();

      // Also deactivate/activate all users in the business
      await User.updateMany(
        { business: business._id },
        { isActive }
      );

      // Log action
      await auditService.log({
        user: req.user.userId,
        action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
        resource: 'business',
        resourceId: business._id
      });

      res.json({
        success: true,
        message: `Business ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: { business }
      });
    } catch (error) {
      next(error);
    }
  }

  // ===================================
  // APPOINTMENT MANAGEMENT
  // ===================================

  // Get appointments with advanced filtering
  async getAppointments(req, res, next) {
    try {
      const {
        businessId,
        status,
        dateFrom,
        dateTo,
        staffId,
        clientId,
        page = 1,
        limit = 20
      } = req.query;

      // Build filter
      const filter = {};
      
      // Business access control
      if (req.user.role === ROLES.SUPER_ADMIN && businessId) {
        filter.business = businessId;
      } else if (req.user.role !== ROLES.SUPER_ADMIN) {
        filter.business = req.user.businessId;
      }

      if (status) filter.status = status;
      if (staffId) filter['staff.assigned'] = staffId;
      if (clientId) filter.client = clientId;

      if (dateFrom || dateTo) {
        filter['schedule.date'] = {};
        if (dateFrom) filter['schedule.date'].$gte = new Date(dateFrom);
        if (dateTo) filter['schedule.date'].$lte = new Date(dateTo);
      }

      const skip = (page - 1) * limit;

      const [appointments, total] = await Promise.all([
        Appointment.find(filter)
          .populate('client', 'profile.firstName profile.lastName profile.email profile.phone')
          .populate('pet', 'profile.name profile.species profile.breed')
          .populate('staff.assigned', 'profile.firstName profile.lastName')
          .populate('business', 'profile.name')
          .populate('billing.invoice')
          .sort({ 'schedule.startTime': -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Appointment.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: {
          appointments,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get appointment analytics
  async getAppointmentAnalytics(req, res, next) {
    try {
      const { businessId, dateFrom, dateTo } = req.query;

      // Build filter
      const filter = {};
      if (req.user.role === ROLES.SUPER_ADMIN && businessId) {
        filter.business = new mongoose.Types.ObjectId(businessId);
      } else if (req.user.role !== ROLES.SUPER_ADMIN) {
        filter.business = new mongoose.Types.ObjectId(req.user.businessId);
      }

      if (dateFrom || dateTo) {
        filter['schedule.date'] = {};
        if (dateFrom) filter['schedule.date'].$gte = new Date(dateFrom);
        if (dateTo) filter['schedule.date'].$lte = new Date(dateTo);
      }

      const [
        statusDistribution,
        servicePopularity,
        dailyAppointments,
        staffPerformance,
        averageServiceTime
      ] = await Promise.all([
        // Status distribution
        Appointment.aggregate([
          { $match: filter },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),

        // Service popularity
        Appointment.aggregate([
          { $match: filter },
          { $group: { _id: '$service.name', count: { $sum: 1 }, revenue: { $sum: '$service.price.amount' } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ]),

        // Daily appointments
        Appointment.aggregate([
          { $match: filter },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$schedule.date' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]),

        // Staff performance
        Appointment.aggregate([
          { $match: { ...filter, 'staff.assigned': { $exists: true } } },
          {
            $lookup: {
              from: 'users',
              localField: 'staff.assigned',
              foreignField: '_id',
              as: 'staffInfo'
            }
          },
          { $unwind: '$staffInfo' },
          {
            $group: {
              _id: '$staff.assigned',
              name: { $first: { $concat: ['$staffInfo.profile.firstName', ' ', '$staffInfo.profile.lastName'] } },
              totalAppointments: { $sum: 1 },
              completedAppointments: {
                $sum: { $cond: [{ $eq: ['$status', APPOINTMENT_STATUS.COMPLETED] }, 1, 0] }
              },
              totalRevenue: { $sum: '$service.price.amount' }
            }
          },
          {
            $project: {
              name: 1,
              totalAppointments: 1,
              completedAppointments: 1,
              completionRate: {
                $multiply: [
                  { $divide: ['$completedAppointments', '$totalAppointments'] },
                  100
                ]
              },
              totalRevenue: 1
            }
          },
          { $sort: { totalRevenue: -1 } }
        ]),

        // Average service time
        Appointment.aggregate([
          {
            $match: {
              ...filter,
              'tracking.serviceStartedAt': { $exists: true },
              'tracking.serviceCompletedAt': { $exists: true }
            }
          },
          {
            $project: {
              serviceName: '$service.name',
              duration: {
                $divide: [
                  { $subtract: ['$tracking.serviceCompletedAt', '$tracking.serviceStartedAt'] },
                  1000 * 60 // Convert to minutes
                ]
              }
            }
          },
          {
            $group: {
              _id: '$serviceName',
              averageDuration: { $avg: '$duration' },
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      res.json({
        success: true,
        data: {
          statusDistribution,
          servicePopularity,
          dailyAppointments,
          staffPerformance,
          averageServiceTime
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // ===================================
  // FINANCIAL MANAGEMENT
  // ===================================

  // Get financial overview
  async getFinancialOverview(req, res, next) {
    try {
      const { businessId, dateFrom, dateTo } = req.query;

      // Build filter
      const filter = {};
      if (req.user.role === ROLES.SUPER_ADMIN && businessId) {
        filter.business = new mongoose.Types.ObjectId(businessId);
      } else if (req.user.role !== ROLES.SUPER_ADMIN) {
        filter.business = new mongoose.Types.ObjectId(req.user.businessId);
      }

      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
      }

      const [
        revenueStats,
        invoiceStats,
        paymentMethodStats,
        monthlyRevenue,
        topClients
      ] = await Promise.all([
        // Revenue statistics
        Invoice.aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: { $cond: [{ $eq: ['$payment.status', INVOICE_STATUS.PAID] }, '$totals.total', 0] } },
              pendingRevenue: { $sum: { $cond: [{ $eq: ['$payment.status', INVOICE_STATUS.SENT] }, '$totals.total', 0] } },
              overdueRevenue: { $sum: { $cond: [{ $eq: ['$payment.status', INVOICE_STATUS.OVERDUE] }, '$totals.total', 0] } }
            }
          }
        ]),

        // Invoice status distribution
        Invoice.aggregate([
          { $match: filter },
          { $group: { _id: '$payment.status', count: { $sum: 1 }, amount: { $sum: '$totals.total' } } }
        ]),

        // Payment method distribution
        Invoice.aggregate([
          { $match: { ...filter, 'payment.status': INVOICE_STATUS.PAID } },
          { $group: { _id: '$payment.method', count: { $sum: 1 }, amount: { $sum: '$totals.total' } } }
        ]),

        // Monthly revenue trend
        Invoice.aggregate([
          { $match: { ...filter, 'payment.status': INVOICE_STATUS.PAID } },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              revenue: { $sum: '$totals.total' },
              invoiceCount: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]),

        // Top paying clients
        Invoice.aggregate([
          { $match: { ...filter, 'payment.status': INVOICE_STATUS.PAID } },
          {
            $lookup: {
              from: 'users',
              localField: 'client',
              foreignField: '_id',
              as: 'clientInfo'
            }
          },
          { $unwind: '$clientInfo' },
          {
            $group: {
              _id: '$client',
              clientName: { $first: { $concat: ['$clientInfo.profile.firstName', ' ', '$clientInfo.profile.lastName'] } },
              clientEmail: { $first: '$clientInfo.profile.email' },
              totalSpent: { $sum: '$totals.total' },
              invoiceCount: { $sum: 1 }
            }
          },
          { $sort: { totalSpent: -1 } },
          { $limit: 10 }
        ])
      ]);

      res.json({
        success: true,
        data: {
          revenue: revenueStats[0] || { totalRevenue: 0, pendingRevenue: 0, overdueRevenue: 0 },
          invoiceStats,
          paymentMethodStats,
          monthlyRevenue,
          topClients
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get overdue invoices
  async getOverdueInvoices(req, res, next) {
    try {
      const { businessId, page = 1, limit = 20 } = req.query;

      // Build filter
      const filter = {
        'payment.status': { $in: [INVOICE_STATUS.SENT, INVOICE_STATUS.OVERDUE] },
        'dates.dueDate': { $lt: new Date() }
      };

      if (req.user.role === ROLES.SUPER_ADMIN && businessId) {
        filter.business = businessId;
      } else if (req.user.role !== ROLES.SUPER_ADMIN) {
        filter.business = req.user.businessId;
      }

      const skip = (page - 1) * limit;

      const [overdueInvoices, total] = await Promise.all([
        Invoice.find(filter)
          .populate('client', 'profile.firstName profile.lastName profile.email profile.phone')
          .populate('business', 'profile.name')
          .sort({ 'dates.dueDate': 1 })
          .skip(skip)
          .limit(parseInt(limit)),
        Invoice.countDocuments(filter)
      ]);

      // Calculate days overdue for each invoice
      const invoicesWithOverdueDays = overdueInvoices.map(invoice => ({
        ...invoice.toObject(),
        daysOverdue: Math.floor((new Date() - new Date(invoice.dates.dueDate)) / (1000 * 60 * 60 * 24))
      }));

      res.json({
        success: true,
        data: {
          invoices: invoicesWithOverdueDays,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // ===================================
  // SYSTEM MANAGEMENT
  // ===================================

  // Get system statistics
  async getSystemStats(req, res, next) {
    try {
      // Only super admin can access system stats
      if (req.user.role !== ROLES.SUPER_ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const [
        totalUsers,
        totalBusinesses,
        totalAppointments,
        totalPets,
        totalInvoices,
        totalRevenue,
        systemHealth
      ] = await Promise.all([
        User.countDocuments({ isActive: true }),
        Business.countDocuments({ isActive: true }),
        Appointment.countDocuments(),
        Pet.countDocuments({ isActive: true }),
        Invoice.countDocuments(),
        Invoice.aggregate([
          { $match: { 'payment.status': INVOICE_STATUS.PAID } },
          { $group: { _id: null, total: { $sum: '$totals.total' } } }
        ]).then(result => result[0]?.total || 0),
        this.getSystemHealthCheck()
      ]);

      // Get growth metrics (last 30 days vs previous 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      const [currentPeriod, previousPeriod] = await Promise.all([
        Promise.all([
          User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
          Business.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
          Appointment.countDocuments({ createdAt: { $gte: thirtyDaysAgo } })
        ]),
        Promise.all([
          User.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
          Business.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } }),
          Appointment.countDocuments({ createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } })
        ])
      ]);

      const calculateGrowth = (current, previous) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous * 100).toFixed(1);
      };

      res.json({
        success: true,
        data: {
          totals: {
            users: totalUsers,
            businesses: totalBusinesses,
            appointments: totalAppointments,
            pets: totalPets,
            invoices: totalInvoices,
            revenue: totalRevenue
          },
          growth: {
            users: calculateGrowth(currentPeriod[0], previousPeriod[0]),
            businesses: calculateGrowth(currentPeriod[1], previousPeriod[1]),
            appointments: calculateGrowth(currentPeriod[2], previousPeriod[2])
          },
          systemHealth
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // System health check
  async getSystemHealthCheck() {
    try {
      const [
        dbConnection,
        diskSpace,
        memoryUsage,
        activeConnections
      ] = await Promise.all([
        // Database connection health
        mongoose.connection.readyState === 1,
        
        // Simulated disk space check (in production, use actual system calls)
        { total: 100, used: 45, available: 55 },
        
        // Memory usage
        process.memoryUsage(),
        
        // Active database connections
        mongoose.connection.db?.serverStatus().then(status => status.connections) || { current: 0 }
      ]);

      return {
        database: {
          connected: dbConnection,
          status: dbConnection ? 'healthy' : 'disconnected'
        },
        system: {
          diskSpace,
          memory: {
            used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            external: Math.round(memoryUsage.external / 1024 / 1024)
          }
        },
        connections: activeConnections
      };
    } catch (error) {
      return {
        error: error.message,
        status: 'unhealthy'
      };
    }
  }

  // Get audit logs
  async getAuditLogs(req, res, next) {
    try {
      const {
        userId,
        businessId,
        resource,
        action,
        dateFrom,
        dateTo,
        page = 1,
        limit = 50
      } = req.query;

      // Build filter based on user role
      const filter = {};
      
      if (req.user.role !== ROLES.SUPER_ADMIN) {
        filter.business = req.user.businessId;
      } else if (businessId) {
        filter.business = businessId;
      }

      if (userId) filter.user = userId;
      if (resource) filter.resource = resource;
      if (action) filter.action = action;

      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
      }

      const skip = (page - 1) * limit;

      const [logs, total] = await Promise.all([
        AuditLog.find(filter)
          .populate('user', 'profile.firstName profile.lastName profile.email')
          .populate('business', 'profile.name')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        AuditLog.countDocuments(filter)
      ]);

      res.json({
        success: true,
        data: {
          logs,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // ===================================
  // REPORTS & ANALYTICS
  // ===================================

  // Generate comprehensive business report
  async generateBusinessReport(req, res, next) {
    try {
      const { businessId, dateFrom, dateTo, format = 'json' } = req.query;

      // Check permissions
      if (req.user.role !== ROLES.SUPER_ADMIN && req.user.businessId?.toString() !== businessId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const filter = { business: new mongoose.Types.ObjectId(businessId) };
      
      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
      }

      const business = await Business.findById(businessId);
      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found'
        });
      }

      const [
        appointmentStats,
        financialStats,
        clientStats,
        staffStats,
        serviceStats
      ] = await Promise.all([
        // Appointment statistics
        Appointment.aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              completed: { $sum: { $cond: [{ $eq: ['$status', APPOINTMENT_STATUS.COMPLETED] }, 1, 0] } },
              cancelled: { $sum: { $cond: [{ $eq: ['$status', APPOINTMENT_STATUS.CANCELLED] }, 1, 0] } },
              noShow: { $sum: { $cond: [{ $eq: ['$status', APPOINTMENT_STATUS.NO_SHOW] }, 1, 0] } }
            }
          }
        ]),

        // Financial statistics
        Invoice.aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: { $cond: [{ $eq: ['$payment.status', INVOICE_STATUS.PAID] }, '$totals.total', 0] } },
              pendingRevenue: { $sum: { $cond: [{ $eq: ['$payment.status', INVOICE_STATUS.SENT] }, '$totals.total', 0] } },
              overdueRevenue: { $sum: { $cond: [{ $eq: ['$payment.status', INVOICE_STATUS.OVERDUE] }, '$totals.total', 0] } },
              averageInvoice: { $avg: '$totals.total' }
            }
          }
        ]),

        // Client statistics
        User.aggregate([
          { $match: { business: new mongoose.Types.ObjectId(businessId), role: ROLES.CLIENT } },
          {
            $lookup: {
              from: 'pets',
              localField: '_id',
              foreignField: 'owner',
              as: 'pets'
            }
          },
          {
            $group: {
              _id: null,
              totalClients: { $sum: 1 },
              activeClients: { $sum: { $cond: ['$isActive', 1, 0] } },
              totalPets: { $sum: { $size: '$pets' } }
            }
          }
        ]),

        // Staff performance
        User.aggregate([
          { $match: { business: new mongoose.Types.ObjectId(businessId), role: { $in: [ROLES.BUSINESS_ADMIN, ROLES.STAFF] } } },
          {
            $lookup: {
              from: 'appointments',
              localField: '_id',
              foreignField: 'staff.assigned',
              as: 'appointments'
            }
          },
          {
            $project: {
              name: { $concat: ['$profile.firstName', ' ', '$profile.lastName'] },
              role: 1,
              appointmentCount: { $size: '$appointments' },
              completedAppointments: {
                $size: {
                  $filter: {
                    input: '$appointments',
                    cond: { $eq: ['$this.status', APPOINTMENT_STATUS.COMPLETED] }
                  }
                }
              }
            }
          }
        ]),

        // Service popularity
        Appointment.aggregate([
          { $match: filter },
          {
            $group: {
              _id: '$service.name',
              count: { $sum: 1 },
              revenue: { $sum: '$service.price.amount' }
            }
          },
          { $sort: { count: -1 } }
        ])
      ]);

      const report = {
        business: {
          name: business.profile.name,
          email: business.profile.email,
          reportPeriod: {
            from: dateFrom || 'All time',
            to: dateTo || 'Present'
          }
        },
        summary: {
          appointments: appointmentStats[0] || { total: 0, completed: 0, cancelled: 0, noShow: 0 },
          financial: financialStats[0] || { totalRevenue: 0, pendingRevenue: 0, overdueRevenue: 0, averageInvoice: 0 },
          clients: clientStats[0] || { totalClients: 0, activeClients: 0, totalPets: 0 }
        },
        details: {
          staffPerformance: staffStats,
          servicePopularity: serviceStats
        },
        generatedAt: new Date(),
        generatedBy: req.user.userData.fullName
      };

      if (format === 'pdf') {
        // In a real implementation, you would generate a PDF here
        // For now, we'll return the data and mention PDF generation
        res.json({
          success: true,
          message: 'PDF generation would be implemented here',
          data: report
        });
      } else {
        res.json({
          success: true,
          data: report
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // ===================================
  // UTILITY METHODS
  // ===================================

  // Generate random password
  generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  // Bulk operations
  async bulkUpdateUsers(req, res, next) {
    try {
      const { userIds, updates } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'User IDs array is required'
        });
      }

      // Build filter for users
      const filter = { _id: { $in: userIds } };
      
      // Restrict to business if not super admin
      if (req.user.role !== ROLES.SUPER_ADMIN) {
        filter.business = req.user.businessId;
      }

      const result = await User.updateMany(filter, updates);

      // Log bulk update
      await auditService.log({
        user: req.user.userId,
        business: req.user.businessId,
        action: 'BULK_UPDATE',
        resource: 'user',
        details: {
          userIds,
          updates,
          modifiedCount: result.modifiedCount
        }
      });

      res.json({
        success: true,
        message: `Updated ${result.modifiedCount} users`,
        data: { modifiedCount: result.modifiedCount }
      });
    } catch (error) {
      next(error);
    }
  }

  // Send bulk notifications
  async sendBulkNotifications(req, res, next) {
    try {
      const { userIds, message, type = 'email', subject } = req.body;

      if (!Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'User IDs array is required'
        });
      }

      // Get users
      const filter = { _id: { $in: userIds }, isActive: true };
      if (req.user.role !== ROLES.SUPER_ADMIN) {
        filter.business = req.user.businessId;
      }

      const users = await User.find(filter);

      const results = [];

      for (const user of users) {
        try {
          if (type === 'email') {
            await sendEmail({
              to: user.profile.email,
              subject: subject || 'Notification from PetSync',
              template: 'admin-notification',
              data: {
                firstName: user.profile.firstName,
                message
              }
            });
          }
          
          results.push({ userId: user._id, status: 'sent' });
        } catch (error) {
          results.push({ userId: user._id, status: 'failed', error: error.message });
        }
      }

      // Log bulk notification
      await auditService.log({
        user: req.user.userId,
        business: req.user.businessId,
        action: 'BULK_NOTIFICATION',
        resource: 'user',
        details: {
          type,
          message,
          recipientCount: users.length,
          results
        }
      });

      res.json({
        success: true,
        message: `Notifications sent to ${results.filter(r => r.status === 'sent').length} users`,
        data: { results }
      });
    } catch (error) {
      next(error);
    }
  }

  // Export data
  async exportData(req, res, next) {
    try {
      const { type, businessId, format = 'json', dateFrom, dateTo } = req.query;

      // Check permissions
      if (req.user.role !== ROLES.SUPER_ADMIN && req.user.businessId?.toString() !== businessId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const filter = {};
      if (businessId) filter.business = businessId;
      
      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
      }

      let data;
      
      switch (type) {
        case 'users':
          data = await User.find(filter).populate('business', 'profile.name').select('-auth.passwordHash');
          break;
        case 'appointments':
          data = await Appointment.find(filter)
            .populate('client', 'profile.firstName profile.lastName profile.email')
            .populate('pet', 'profile.name profile.species')
            .populate('business', 'profile.name');
          break;
        case 'invoices':
          data = await Invoice.find(filter)
            .populate('client', 'profile.firstName profile.lastName profile.email')
            .populate('business', 'profile.name');
          break;
        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid export type'
          });
      }

      // Log export
      await auditService.log({
        user: req.user.userId,
        business: businessId,
        action: 'EXPORT',
        resource: type,
        details: {
          recordCount: data.length,
          format,
          dateRange: { dateFrom, dateTo }
        }
      });

      if (format === 'csv') {
        // In a real implementation, convert to CSV
        res.json({
          success: true,
          message: 'CSV export would be implemented here',
          data: { recordCount: data.length }
        });
      } else {
        res.json({
          success: true,
          data: {
            type,
            exportDate: new Date(),
            recordCount: data.length,
            records: data
          }
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // Database maintenance
  async performMaintenance(req, res, next) {
    try {
      // Only super admin can perform maintenance
      if (req.user.role !== ROLES.SUPER_ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const { action } = req.body;
      const results = {};

      switch (action) {
        case 'cleanup_old_logs':
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          const deletedLogs = await AuditLog.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
          results.deletedLogs = deletedLogs.deletedCount;
          break;

        case 'update_metrics':
          // Update business metrics
          const businesses = await Business.find({ isActive: true });
          
          for (const business of businesses) {
            const [appointmentCount, revenue, clientCount] = await Promise.all([
              Appointment.countDocuments({ business: business._id }),
              Invoice.aggregate([
                { $match: { business: business._id, 'payment.status': INVOICE_STATUS.PAID } },
                { $group: { _id: null, total: { $sum: '$totals.total' } } }
              ]).then(result => result[0]?.total || 0),
              User.countDocuments({ business: business._id, role: ROLES.CLIENT, isActive: true })
            ]);

            business.metrics = {
              totalAppointments: appointmentCount,
              totalRevenue: revenue,
              totalClients: clientCount
            };

            await business.save();
          }
          
          results.updatedBusinesses = businesses.length;
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid maintenance action'
          });
      }

      // Log maintenance action
      await auditService.log({
        user: req.user.userId,
        action: 'MAINTENANCE',
        resource: 'system',
        details: { action, results }
      });

      res.json({
        success: true,
        message: 'Maintenance completed successfully',
        data: results
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();