// Server/src/controllers/serviceController.js
const Service = require('../models/Service');
const Business = require('../models/Business');
const User = require('../models/User');
const { ROLES } = require('../config/constants');
const mongoose = require('mongoose');

class ServiceController {
  // Get all services for a business
 async getServices(req, res, next) {
  try {
    const { page = 1, limit = 20, search, category, isActive } = req.query;
    const { role, businessId, userId,userData } = req.user;
    

    console.log(req.user.userData.profile.createdBy)


  // 1) CLIENT: find all businesses owned by this client’s creator, then list services
    if (role === ROLES.CLIENT) {
      // Normalize ownerId
      let ownerId = userData.profile.createdBy;
      // if (typeof ownerId === 'object' && ownerId._id) {
      //   ownerId = ownerId._id;
      // }
      // Get all business IDs for that owner
      const owner = await User.findById(ownerId).select('business');
  if (!owner) {
    return res.status(404).json({
      success: false,
      message: 'Owner not found'
    });
  }

  // 3) Extract their business array directly
  const businessIds = Array.isArray(owner.business)
    ? owner.business
    : [];

  if (!businessIds.length) {
    return res.json({
      success: true,
      data: {
        services: [],
        pagination: { current: page, pages: 0, total: 0, hasNext: false, hasPrev: false }
      }
    });
  }

      // Build service filter for those businesses
      const filter = { business: { $in: businessIds } };

      // Apply optional search/category/isActive
      if (search) {
        filter.$or = [
          { name:        { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      if (category && category !== 'all') {
        filter.category = category;
      }
      if (typeof isActive !== 'undefined') {
        filter.isActive = isActive === 'true';
      }

      // Paginate & fetch
      const skip = (page - 1) * limit;
      const [ total, services ] = await Promise.all([
        Service.countDocuments(filter),
        Service.find(filter)
          .populate('business', 'profile.name profile.email')
          .populate('staff',    'profile.firstName profile.lastName profile.email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
      ]);

      return res.json({
        success: true,
        data: {
          services,
          pagination: {
            current: page,
            pages:   Math.ceil(total / limit),
            total,
            hasNext: page * limit < total,
            hasPrev: page > 1
          }
        }
      });
    }


        if (role === ROLES.SUPER_ADMIN) {
            return res.status(403).json({
            success: false,
            message: 'Access denied'
            });
        }
    // Build filter
    const filter = {};
    
    // Business access control
    if (role === ROLES.SUPER_ADMIN) {
      // Super admin can see all services
      if (req.query.businessId) {
        filter.business = new mongoose.Types.ObjectId(req.query.businessId);
      }
    } else if (role === ROLES.BUSINESS_ADMIN) {
      // Business admin can only see services from businesses they created
      
      // First, get all businesses created by this business admin
      const userBusinesses = await Business.find({
        'staff': userId, // Business admin is in the staff array
        isActive: true
      }).select('_id');
      
    const businessIds = userBusinesses.map(id => new mongoose.Types.ObjectId(id));
      
      if (businessIds.length === 0) {
        // If business admin has no businesses, return empty result
        return res.json({
          success: true,
          data: {
            services: [],
            pagination: {
              current: parseInt(page),
              pages: 0,
              total: 0,
              hasNext: false,
              hasPrev: false
            }
          }
        });
      }
      
      // Filter services by businesses owned by this business admin
     if (businessIds && businessIds.length > 0) {
        // Show services from all businesses owned by this admin
        filter.business = { $in: businessIds };
        } else {
        return res.status(403).json({
            success: false,
            message: 'Access denied. You have no businesses assigned.'
        });
        }

    } else if (role === ROLES.STAFF || role === ROLES.CLIENT) {
      // Staff can only see services from their assigned business
      filter.business = new mongoose.Types.ObjectId(businessId);
      
      // Additionally, staff can only see services they are assigned to
      filter.staff = userId;
    } else {
      // Other roles (like CLIENT) cannot access services
      return res.status(403).json({
        success: false,
        message: 'Access denied. You do not have permission to view services.'
      });
    }

    // Additional filters
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Execute query with pagination
   const services = await Service.find(filter)
  .populate('business', 'profile.name profile.email')
  .populate('staff', 'profile.firstName profile.lastName profile.email')
  .sort({ createdAt: -1 })
  .skip((page - 1) * limit)
  .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Service.countDocuments(filter);


    res.json({
      success: true,
      data: {
        services,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

  // Get single service
  async getService(req, res, next) {
    try {
      const { id } = req.params;
      const { role, businessId } = req.user;

      const service = await Service.findById(id)
        .populate('business', 'profile.name profile.email profile.category')
        .populate('staff.user', 'profile.firstName profile.lastName profile.email profile.phone');

      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      // Check access permissions
      if (role !== ROLES.SUPER_ADMIN && service.business._id.toString() !== businessId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      res.json({
        success: true,
        data: { service }
      });
    } catch (error) {
      next(error);
    }
  }

  // Create new service
  async createService(req, res, next) {
    try {
      const { role } = req.user;
      const serviceData = req.body;
      
      // Business access control
      if (!role === ROLES.SUPER_ADMIN) {
        if (!serviceData.business) {
          return res.status(400).json({
            success: false,
            message: 'Business ID is required for super admin'
          });
        }
      } 

      // Verify business exists
      const business = await Business.findById(serviceData.business);
      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found'
        });
      }

   if (serviceData.staff && serviceData.staff.length > 0) {
  // 🛠 Fix structure: convert ["id1", "id2"] → [{ user: id1 }, { user: id2 }]
  if (typeof serviceData.staff[0] === 'string') {
    serviceData.staff = serviceData.staff.map(id => ({ user: id }));
  }

  const staffIds = serviceData.staff.map(s => s.user);

  const staffMembers = await User.find({
    business: serviceData.business,
    role: { $in: [ROLES.BUSINESS_ADMIN, ROLES.STAFF] }
  });

  const validStaffIds = staffMembers.map(s => s._id.toString());
  const allValid = staffIds.every(id => validStaffIds.includes(id.toString()));

  if (!allValid) {
    return res.status(400).json({
      success: false,
      message: 'One or more staff members are invalid or not part of this business'
    });
  }
}



      // Create service
      const service = new Service(serviceData);
      await service.save();

      // Populate for response
      await service.populate([
        { path: 'business', select: 'profile.name profile.email' },
        { path: 'staff.user', select: 'profile.firstName profile.lastName profile.email' }
      ]);

      res.status(201).json({
        success: true,
        message: 'Service created successfully',
        data: { service }
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: Object.values(error.errors).map(e => e.message)
        });
      }
      next(error);
    }
  }

  // Update service
  async updateService(req, res, next) {
    try {
      const { id } = req.params;
      const { role, businessId } = req.user;
      const updateData = req.body;

      const service = await Service.findById(id);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      // Check access permissions
      if (role !== ROLES.BUSINESS_ADMIN && service.business.toString() !== businessId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Validate staff assignments if being updated
      if (updateData.staff && updateData.staff.length > 0) {
        const staffIds = updateData.staff.map(s => s.user);
        const staffMembers = await User.find({
          _id: { $in: staffIds },
          business: service.business,
          role: { $in: [ROLES.BUSINESS_ADMIN, ROLES.STAFF] }
        });

        if (staffMembers.length !== staffIds.length) {
          return res.status(400).json({
            success: false,
            message: 'One or more staff members are invalid or not part of this business'
          });
        }
      }

      // Update service
      Object.assign(service, updateData);
      service.updatedAt = new Date();
      await service.save();

      // Populate for response
      await service.populate([
        { path: 'business', select: 'profile.name profile.email' },
        { path: 'staff.user', select: 'profile.firstName profile.lastName profile.email' }
      ]);

      res.json({
        success: true,
        message: 'Service updated successfully',
        data: { service }
      });
    } catch (error) {
      if (error.name === 'ValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: Object.values(error.errors).map(e => e.message)
        });
      }
      next(error);
    }
  }

  // Delete service
  async deleteService(req, res, next) {
    try {
      const { id } = req.params;
      const { role, businessId } = req.user;

      const service = await Service.findById(id);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      // Check access permissions
      if (role !== ROLES.BUSINESS_ADMIN && role !== ROLES.SUPER_ADMIN && service.business.toString() !== businessId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if service is used in any appointments
      const Appointment = require('../models/Appointment');
      const appointmentCount = await Appointment.countDocuments({
        'service.id': service._id,
        status: { $in: ['scheduled', 'confirmed', 'in_progress'] }
      });

      if (appointmentCount > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete service. It has ${appointmentCount} active appointments. Consider deactivating instead.`
        });
      }

      await Service.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Service deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Toggle service status
  async toggleServiceStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const { role, businessId } = req.user;

      const service = await Service.findById(id);
      if (!service) {
        return res.status(404).json({
          success: false,
          message: 'Service not found'
        });
      }

      // Check access permissions
      if (role !== ROLES.SUPER_ADMIN && service.business.toString() !== businessId?.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      service.isActive = isActive;
      service.updatedAt = new Date();
      await service.save();

      res.json({
        success: true,
        message: `Service ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: { service }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get service categories for dropdown
  async getServiceCategories(req, res, next) {
    try {
      const { role, businessId } = req.user;

      // Build filter
      const filter = {};
      if (role !== ROLES.SUPER_ADMIN) {
        filter.business = new mongoose.Types.ObjectId(businessId);
      }

      const categories = await Service.distinct('category', filter);

      res.json({
        success: true,
        data: { categories }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get service statistics
  async getServiceStats(req, res, next) {
    try {
      const { role, businessId } = req.user;

      // Build filter
      const filter = {};
      if (role !== ROLES.SUPER_ADMIN) {
        filter.business = new mongoose.Types.ObjectId(businessId);
      }

      const [totalServices, activeServices, categoryStats] = await Promise.all([
        Service.countDocuments(filter),
        Service.countDocuments({ ...filter, isActive: true }),
        Service.aggregate([
          { $match: filter },
          {
            $group: {
              _id: '$category',
              count: { $sum: 1 },
              averagePrice: { $avg: '$pricing.basePrice' },
              averageDuration: { $avg: '$duration.estimated' }
            }
          },
          { $sort: { count: -1 } }
        ])
      ]);

      res.json({
        success: true,
        data: {
          totalServices,
          activeServices,
          inactiveServices: totalServices - activeServices,
          categoryStats
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ServiceController();