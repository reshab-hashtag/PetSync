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




  // delete client 
  // Replace the existing deleteClient method in ClientController.js with this fixed version

async deleteClient(req, res, next) {
  try {
    const { id } = req.params;
    const { userId, role, businessId } = req.user;
    
    // Handle cases where req.body might be undefined or empty (common with DELETE requests)
    const requestBody = req.body || {};
    const { force = false, transferAppointments = false, transferToStaff = null } = requestBody;

    // Only business admins and super admins can delete clients
    if (![ROLES.BUSINESS_ADMIN, ROLES.SUPER_ADMIN].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Find the client with business associations
    const client = await User.findById(id).populate('business', 'profile.name');
    if (!client || client.role !== ROLES.CLIENT) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Check if business admin owns this client
    // if (role === ROLES.BUSINESS_ADMIN) {
    //   // Check if client is associated with the business admin's business
    //   const hasAccess = client.business && client.business.some(bizId => 
    //     businessId === bizId.toString()
    //   );
    //   if (!hasAccess) {
    //     return res.status(403).json({
    //       success: false,
    //       message: 'Access denied. You can only delete clients associated with your business.'
    //     });
    //   }
    // }

    // Store client info for logging
    const clientInfo = {
      name: `${client.profile.firstName} ${client.profile.lastName}`,
      email: client.profile.email,
      phone: client.profile.phone
    };

    // Check for related data
    const [appointmentCount, invoiceCount, petCount] = await Promise.all([
      Appointment.countDocuments({ client: id }),
      Invoice.countDocuments({ client: id }),
      Pet.countDocuments({ owner: id })
    ]);

    const hasRelatedData = appointmentCount > 0 || invoiceCount > 0 || petCount > 0;

    // If client has related data and force is not specified, provide summary
    if (hasRelatedData && !force) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete client with existing data. Use force option to proceed.',
        data: {
          client: clientInfo,
          relatedData: {
            appointments: appointmentCount,
            invoices: invoiceCount,
            pets: petCount
          },
          solution: {
            message: 'To delete this client, send a DELETE request with a JSON body containing:',
            example: {
              force: true,
              transferAppointments: appointmentCount > 0 ? true : false,
              transferToStaff: appointmentCount > 0 ? 'staff_user_id_here' : null
            }
          }
        }
      });
    }

    // Handle related data cleanup if force is true
    const cleanupResults = {
      appointmentsHandled: 0,
      invoicesArchived: 0,
      petsDeleted: 0
    };

    if (force && hasRelatedData) {
      // Validate transfer staff if appointments need to be transferred
      if (transferAppointments && appointmentCount > 0) {
        if (!transferToStaff) {
          return res.status(400).json({
            success: false,
            message: 'transferToStaff is required when transferAppointments is true'
          });
        }

        const transferStaff = await User.findById(transferToStaff);
        if (!transferStaff || transferStaff.role !== ROLES.STAFF) {
          return res.status(400).json({
            success: false,
            message: 'Invalid transfer staff member. Must be a valid staff user.'
          });
        }
      }

      // Handle appointments
      if (appointmentCount > 0) {
        if (transferAppointments && transferToStaff) {
          // Transfer future appointments to staff
          const transferResult = await Appointment.updateMany(
            { 
              client: id,
              'schedule.startTime': { $gte: new Date() },
              status: { $in: ['scheduled', 'confirmed'] }
            },
            { 
              $set: { 
                client: null,
                'details.notes': `Transferred from deleted client: ${clientInfo.name} (${clientInfo.email})`,
                'staff.assigned': transferToStaff,
                updatedAt: new Date()
              }
            }
          );
          cleanupResults.appointmentsHandled += transferResult.modifiedCount;

          // Cancel past appointments
          await Appointment.updateMany(
            { 
              client: id,
              'schedule.startTime': { $lt: new Date() }
            },
            { 
              $set: { 
                status: 'cancelled',
                'details.cancellationReason': `Client account deleted: ${clientInfo.name}`,
                updatedAt: new Date()
              }
            }
          );
        } else {
          // Cancel all appointments
          const cancelResult = await Appointment.updateMany(
            { client: id },
            { 
              $set: { 
                status: 'cancelled',
                'details.cancellationReason': `Client account deleted: ${clientInfo.name}`,
                updatedAt: new Date()
              }
            }
          );
          cleanupResults.appointmentsHandled = cancelResult.modifiedCount;
        }
      }

      // Archive invoices (don't delete for compliance)
      if (invoiceCount > 0) {
        const invoiceResult = await Invoice.updateMany(
          { client: id },
          { 
            $set: { 
              'metadata.clientDeleted': true,
              'metadata.deletedClientInfo': clientInfo,
              'metadata.deletionDate': new Date(),
              updatedAt: new Date()
            }
          }
        );
        cleanupResults.invoicesArchived = invoiceResult.modifiedCount;
      }

      // Delete pets
      if (petCount > 0) {
        await Pet.deleteMany({ owner: id });
        cleanupResults.petsDeleted = petCount;
      }

      // Remove client from business associations
      await Business.updateMany(
        { clients: id },
        { $pull: { clients: id } }
      );
    }

    // Log the deletion
    await auditService.log({
      user: userId,
      action: 'DELETE',
      resource: 'client',
      resourceId: id,
      details: {
        deletedClient: clientInfo,
        deletedBy: role === ROLES.SUPER_ADMIN ? 'Super Admin' : `Business Admin (${businessId})`,
        relatedDataSummary: {
          appointments: appointmentCount,
          invoices: invoiceCount,
          pets: petCount
        },
        cleanupResults: force ? cleanupResults : null,
        forceDelete: force
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        deletionReason: 'client_account_deletion'
      }
    });

    // Delete the user account
    await User.findByIdAndDelete(id);

    const message = force && hasRelatedData 
      ? `Client ${clientInfo.name} and all related data have been handled and deleted successfully`
      : `Client ${clientInfo.name} deleted successfully`;

    res.json({
      success: true,
      message,
      data: {
        deletedClient: clientInfo,
        relatedDataSummary: {
          appointments: appointmentCount,
          invoices: invoiceCount,
          pets: petCount
        },
        cleanupResults: force ? cleanupResults : null,
        deletionSummary: {
          userAccountDeleted: true,
          relatedDataHandled: force && hasRelatedData,
          auditLogPreserved: true
        }
      }
    });

  } catch (error) {
    console.error('Delete client error:', error);
    
    // Handle specific errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID format'
      });
    }

    next(error);
  }
}



  // Create staff and client accounts
 async createUser(req, res, next) {
  try {
    const { 
      auth, 
      role,
      profile
    } = req.body;


      const { firstName, lastName, phone, address, email } = profile;
      const { password } = auth;

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

    // Create the user
    const newUser = new User(userData);
    await newUser.save();


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


// Get single user by ID
async getUser(req, res, next) {
  try {
    const { id } = req.params;
    const { 
      includeOwnerBusinesses = false,
      includeFullAuditLog = false,
      includeRelatedData = false,
      includeStats = false
    } = req.query;

    // Get current user info
    const currentUserId = req.user.userData?.id || req.user.userData?._id;
    const currentUserRole = req.user.userData.role;
    const currentUserBusinessId = req.user.userData.business || req.user.businessId;

    console.log('Getting single user:', { 
      requestedUserId: id, 
      currentUserId, 
      currentUserRole,
      currentUserBusinessId 
    });

    // Validate that the ID is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    // Build base filter
    const filter = { _id: id };
    
    // Apply role-based access restrictions
    let hasAccess = false;
    
    switch (currentUserRole) {
      case 'super_admin':
        // Super admin can access any user
        hasAccess = true;
        break;
        
      case 'business_admin':
        // Business admin can only access users they created
        filter['profile.createdBy'] = currentUserId;
        hasAccess = true;
        break;
        
      case 'staff':
        // Staff can only see their own profile or users from same business
        if (id === currentUserId) {
          hasAccess = true;
        } else {
          // Check if the requested user is from the same business
          filter['business'] = currentUserBusinessId;
          hasAccess = true;
        }
        break;
        
      default:
        hasAccess = false;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions to view this user.'
      });
    }

    console.log('Access filter applied:', filter);

    // Enhanced population based on user role and request parameters
    const businessPopulation = includeOwnerBusinesses === 'true' 
      ? 'profile.name owner profile.contactInfo profile.address profile.category'
      : 'profile.name profile.contactInfo';

    // Find the user with comprehensive related data
    const user = await User.findOne(filter)
      .populate('business', businessPopulation)
      .populate('pets', 'profile.name profile.species profile.breed profile.age profile.gender profile.medicalHistory')
      .populate('profile.createdBy', 'profile.firstName profile.lastName profile.email role')
      .select('-auth.passwordHash -auth.loginAttempts -auth.lockUntil')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found or access denied'
      });
    }

    // Initialize response object
    let userResponse = { ...user };

    // Add ownership information if requested
    if (includeOwnerBusinesses === 'true') {
      try {
        const ownedBusinesses = await Business.find({ owner: user._id })
          .select('profile.name profile.description createdAt isActive profile.contactInfo profile.address')
          .populate('profile.category', 'name color')
          .lean();

        const isOwnerOfCurrentBusiness = user.business && 
          user.business.owner && 
          user.business.owner.toString() === user._id.toString();

        userResponse.ownershipInfo = {
          isOwnerOfCurrentBusiness,
          ownedBusinesses,
          totalOwnedBusinesses: ownedBusinesses.length
        };
      } catch (error) {
        console.error('Error fetching ownership info:', error);
        userResponse.ownershipInfo = {
          error: 'Failed to fetch ownership information'
        };
      }
    }

    // Add related data if requested
    if (includeRelatedData === 'true') {
      try {
        const [appointmentStats, invoiceStats, messageStats] = await Promise.all([
          // Appointment statistics
          mongoose.model('Appointment').aggregate([
            { $match: { client: mongoose.Types.ObjectId(user._id) } },
            { 
              $group: { 
                _id: '$status', 
                count: { $sum: 1 },
                totalAmount: { $sum: '$price' }
              } 
            }
          ]),
          
          // Invoice statistics
          mongoose.model('Invoice').aggregate([
            { $match: { client: mongoose.Types.ObjectId(user._id) } },
            { 
              $group: { 
                _id: '$status', 
                count: { $sum: 1 },
                totalAmount: { $sum: '$amount' }
              } 
            }
          ]),
          
          // Message statistics (if you have messaging)
          mongoose.model('Message') ? mongoose.model('Message').aggregate([
            { $match: { $or: [{ sender: mongoose.Types.ObjectId(user._id) }, { recipient: mongoose.Types.ObjectId(user._id) }] } },
            { $group: { _id: null, count: { $sum: 1 } } }
          ]) : Promise.resolve([])
        ]);

        userResponse.relatedData = {
          appointments: {
            breakdown: appointmentStats.reduce((acc, item) => {
              acc[item._id] = { count: item.count, totalAmount: item.totalAmount };
              return acc;
            }, {}),
            total: appointmentStats.reduce((sum, item) => sum + item.count, 0)
          },
          invoices: {
            breakdown: invoiceStats.reduce((acc, item) => {
              acc[item._id] = { count: item.count, totalAmount: item.totalAmount };
              return acc;
            }, {}),
            total: invoiceStats.reduce((sum, item) => sum + item.count, 0),
            totalSpent: invoiceStats
              .filter(item => item._id === 'paid')
              .reduce((sum, item) => sum + item.totalAmount, 0)
          },
          messages: {
            total: messageStats[0]?.count || 0
          }
        };
      } catch (error) {
        console.error('Error fetching related data:', error);
        userResponse.relatedData = {
          error: 'Failed to fetch related data'
        };
      }
    }

    // Add audit log if requested (only for super_admin)
    if (includeFullAuditLog === 'true' && currentUserRole === 'super_admin') {
      try {
        const auditLogs = await mongoose.model('AuditLog').find({ 
          $or: [
            { user: user._id },
            { resourceId: user._id }
          ]
        })
        .sort({ createdAt: -1 })
        .limit(100)
        .populate('user', 'profile.firstName profile.lastName profile.email')
        .select('action resource details createdAt metadata')
        .lean();

        userResponse.auditLog = auditLogs;
      } catch (error) {
        console.error('Error fetching audit log:', error);
        userResponse.auditLog = {
          error: 'Failed to fetch audit log'
        };
      }
    }

    // Add statistics if requested
    if (includeStats === 'true') {
      try {
        let createdUsersStats = null;
        
        if (user.role === 'business_admin' || currentUserRole === 'super_admin') {
          const [createdUsersCount, createdUsersBreakdown] = await Promise.all([
            User.countDocuments({ 'profile.createdBy': user._id }),
            User.aggregate([
              { $match: { 'profile.createdBy': mongoose.Types.ObjectId(user._id) } },
              { $group: { _id: '$role', count: { $sum: 1 } } }
            ])
          ]);

          createdUsersStats = {
            totalCreated: createdUsersCount,
            breakdown: createdUsersBreakdown.reduce((acc, item) => {
              acc[item._id] = item.count;
              return acc;
            }, {})
          };
        }

        userResponse.stats = {
          createdUsersStats,
          recentActivity: {
            lastLogin: user.auth?.lastLogin,
            lastUpdated: user.updatedAt,
            accountCreated: user.createdAt,
            emailVerified: user.auth?.emailVerified,
            phoneVerified: user.auth?.phoneVerified,
            twoFactorEnabled: user.auth?.twoFactorEnabled,
            isLocked: user.auth?.lockUntil && user.auth.lockUntil > new Date()
          }
        };
      } catch (error) {
        console.error('Error fetching statistics:', error);
        userResponse.stats = {
          error: 'Failed to fetch statistics'
        };
      }
    }

    // Log the access for audit purposes
    try {
      await auditService.log({
        user: currentUserId,
        action: 'VIEW',
        resource: 'user',
        resourceId: user._id,
        details: {
          viewedUser: {
            id: user._id,
            email: user.profile.email,
            role: user.role
          },
          requestParameters: {
            includeOwnerBusinesses,
            includeFullAuditLog,
            includeRelatedData,
            includeStats
          }
        },
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
    } catch (auditError) {
      console.error('Failed to log audit entry:', auditError);
    }

    res.json({
      success: true,
      data: userResponse,
      metadata: {
        requestedBy: {
          id: currentUserId,
          role: currentUserRole
        },
        requestedAt: new Date().toISOString(),
        requestParameters: {
          includeOwnerBusinesses: includeOwnerBusinesses === 'true',
          includeFullAuditLog: includeFullAuditLog === 'true',
          includeRelatedData: includeRelatedData === 'true',
          includeStats: includeStats === 'true'
        }
      }
    });

  } catch (error) {
    console.error('Get single user error:', error);
    
    // Handle specific errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.message
      });
    }

    next(error);
  }
}




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
    } = req.query;
    
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
    console.log(updates)

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    if (req.user.role !== ROLES.BUSINESS_ADMIN && user.business?.toString() !== req.user.businessId?.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    console.log('Original user:', user);
    console.log('Updates received:', updates);

    // Store original data for audit
    const originalData = user.toObject();

    // Handle profile updates specifically
    if (updates.profile) {
      // Ensure user.profile exists
      if (!user.profile) {
        user.profile = {};
      }

      // Update only the provided profile fields
      Object.keys(updates.profile).forEach(profileKey => {
        if (updates.profile[profileKey] !== undefined) {
          if (profileKey === 'address' && typeof updates.profile[profileKey] === 'object') {
            // Handle nested address object
            user.profile.address = {
              ...user.profile.address,
              ...updates.profile[profileKey]
            };
          } else if (profileKey === 'emergencyContact' && typeof updates.profile[profileKey] === 'object') {
            // Handle nested emergencyContact object
            user.profile.emergencyContact = {
              ...user.profile.emergencyContact,
              ...updates.profile[profileKey]
            };
          } else {
            // Handle direct profile fields (firstName, lastName, email, phone, etc.)
            user.profile[profileKey] = updates.profile[profileKey];
          }
        }
      });
    }

    // Handle other top-level updates (excluding profile and auth)
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined && key !== 'auth' && key !== 'profile') {
        user[key] = updates[key];
      }
    });

    // Handle password update separately if provided
    if (updates.password) {
      const bcrypt = require('bcrypt');
      const saltRounds = 12;
      user.auth = user.auth || {};
      user.auth.passwordHash = await bcrypt.hash(updates.password, saltRounds);
    }

    // Mark profile as modified for Mongoose
    user.markModified('profile');

    await user.save();


    // Log update
    await auditService.log({
      user: req.user.userId,
      // business: user.business,
      action: 'UPDATE',
      resource: 'user',
      resourceId: user._id,
      details: {
        before: originalData,
        after: user.toObject(),
        updatedFields: Object.keys(updates)
      }
    });

    // Remove sensitive data from response
    const responseUser = user.toObject();
    if (responseUser.auth && responseUser.auth.passwordHash) {
      delete responseUser.auth.passwordHash;
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      data: { user: responseUser }
    });
  } catch (error) {
    console.error('Update user error:', error);
    next(error);
  }
}

  // Deactivate/Activate user
 // Fixed toggleUserStatus method for adminController.js

// Add this method to your adminController.js (based on your toggleUserStatus pattern)

async toggleClientStatus(req, res, next) {
  try {
    const { id } = req.params; // This is the client ID
    
    // Handle cases where req.body might be undefined or empty
    const requestBody = req.body || {};
    const { isActive } = requestBody;

    // Validate that isActive is provided
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive field is required and must be a boolean (true or false)',
        example: {
          isActive: true // or false
        }
      });
    }

    // Find the client (user with role 'client')
    const client = await User.findById(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'Client not found'
      });
    }

    // Ensure this is actually a client
    if (client.role !== ROLES.CLIENT) {
      return res.status(400).json({
        success: false,
        message: 'User is not a client. This endpoint is only for client accounts.'
      });
    }


    // Check permissions - business admin can only manage clients in their business
    // if (req.user.role !== ROLES.SUPER_ADMIN && client.business?.toString() !== req.user.businessId?.toString()) {
    //   return res.status(403).json({
    //     success: false,
    //     message: 'Access denied. You can only manage clients within your business.'
    //   });
    // }


    const creatorId = client.profile.createdBy?.toString();

    // only allow SUPER_ADMIN or the original creator
    if (
      req.user.role !== ROLES.SUPER_ADMIN &&
      creatorId !== req.user.userId.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only manage clients you created.'
      });
    }

    // Store previous status for audit
    const previousStatus = client.isActive;
    
    // Update client status
    client.isActive = isActive;
    client.updatedAt = new Date();
    await client.save();

    // Log action with comprehensive details
    await auditService.log({
      user: req.user.userId,
      action: isActive ? 'ACTIVATE_CLIENT' : 'DEACTIVATE_CLIENT',
      resource: 'client',
      resourceId: client._id,
      details: {
        targetClient: {
          name: `${client.profile.firstName} ${client.profile.lastName}`,
          email: client.profile.email,
          role: client.role
        },
        statusChange: {
          from: previousStatus,
          to: isActive
        },
        performedBy: {
          userId: req.user.userId,
          role: req.user.role,
          businessId: req.user.businessId
        }
      },
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      }
    });

    // Remove sensitive data from response
    const clientResponse = client.toObject();
    delete clientResponse.auth;

    res.json({
      success: true,
      message: `Client ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { 
        client: clientResponse,
        statusChange: {
          from: previousStatus,
          to: isActive,
          changedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('Toggle client status error:', error);
    
    // Handle specific errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid client ID format'
      });
    }

    next(error);
  }
}

// Batch toggle client status method
async batchToggleClientStatus(req, res, next) {
  try {
    const requestBody = req.body || {};
    const { clientIds, isActive } = requestBody;

    // Validation
    if (!Array.isArray(clientIds) || clientIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'clientIds must be a non-empty array'
      });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive field is required and must be a boolean'
      });
    }

    if (clientIds.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update more than 50 clients at once'
      });
    }

    // Find all clients (users with role 'client')
    const clients = await User.find({ 
      _id: { $in: clientIds },
      role: ROLES.CLIENT 
    });
    
    if (clients.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid clients found'
      });
    }

    // Check permissions for each client
    const unauthorizedClients = [];
    const authorizedClients = [];

    for (const client of clients) {
      if (req.user.role !== ROLES.SUPER_ADMIN && 
          client.business?.toString() !== req.user.businessId?.toString()) {
        unauthorizedClients.push({
          id: client._id,
          name: `${client.profile.firstName} ${client.profile.lastName}`,
          email: client.profile.email
        });
      } else {
        authorizedClients.push(client);
      }
    }

    if (unauthorizedClients.length > 0) {
      return res.status(403).json({
        success: false,
        message: `Access denied for ${unauthorizedClients.length} client(s)`,
        data: {
          unauthorizedClients,
          authorizedCount: authorizedClients.length
        }
      });
    }

    // Update authorized clients
    const updateResults = {
      updated: 0,
      unchanged: 0,
      errors: []
    };

    for (const client of authorizedClients) {
      try {
        const previousStatus = client.isActive;
        
        if (previousStatus !== isActive) {
          client.isActive = isActive;
          client.updatedAt = new Date();
          await client.save();
          updateResults.updated++;

          // Log individual change
          await auditService.log({
            user: req.user.userId,
            business: client.business,
            action: isActive ? 'BATCH_ACTIVATE_CLIENT' : 'BATCH_DEACTIVATE_CLIENT',
            resource: 'client',
            resourceId: client._id,
            details: {
              targetClient: {
                name: `${client.profile.firstName} ${client.profile.lastName}`,
                email: client.profile.email,
                role: client.role
              },
              statusChange: { from: previousStatus, to: isActive },
              batchOperation: true
            },
            metadata: {
              ipAddress: req.ip,
              userAgent: req.get('User-Agent'),
              batchId: `batch_${Date.now()}`
            }
          });
        } else {
          updateResults.unchanged++;
        }
      } catch (error) {
        updateResults.errors.push({
          clientId: client._id,
          name: `${client.profile.firstName} ${client.profile.lastName}`,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Batch client status update completed. ${updateResults.updated} client(s) updated.`,
      data: {
        summary: updateResults,
        targetStatus: isActive,
        processedClients: authorizedClients.length
      }
    });

  } catch (error) {
    console.error('Batch toggle client status error:', error);
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