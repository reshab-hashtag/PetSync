const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const Pet = require('../models/Pet');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
const auditService = require('../services/auditService');
const { APPOINTMENT_STATUS, ROLES } = require('../config/constants');

class AppointmentController {
  // Create new appointment
  async createAppointment(req, res, next) {
    try {
      const {
        businessId,
        clientId,
        petId,
        serviceId,
        serviceName,
        serviceDescription,
        duration,
        price,
        date,
        startTime,
        staffId,
        notes,
        specialRequests
      } = req.body;

      const { userId, role } = req.user;

      // Validate business exists and user has access
      const business = await Business.findById(businessId);
      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found'
        });
      }

      // Check if user has permission to create appointments for this business
      if (role === ROLES.BUSINESS_ADMIN) {
        // Check if user owns this business
        const userBusinesses = Array.isArray(req.user.userData?.business) 
          ? req.user.userData.business 
          : [req.user.userData?.business];
        
        const hasAccess = userBusinesses.some(b => 
          (typeof b === 'object' ? b._id : b)?.toString() === businessId
        );
        
        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this business'
          });
        }
      } else if (role === ROLES.STAFF) {
        // Check if staff member is assigned to this business
        if (!business.staff.includes(userId)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied to this business'
          });
        }
      }

      // Validate client and pet
      const client = await User.findById(clientId);
      const pet = await Pet.findById(petId);
      
      if (!client || !pet) {
        return res.status(404).json({
          success: false,
          message: 'Client or pet not found'
        });
      }

      // Validate pet belongs to client
      if (pet.owner.toString() !== clientId) {
        return res.status(400).json({
          success: false,
          message: 'Pet does not belong to the selected client'
        });
      }

      // Calculate start and end times
      const appointmentDate = new Date(date);
      const [hours, minutes] = startTime.split(':');
      const startDateTime = new Date(appointmentDate);
      startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      
      const endDateTime = new Date(startDateTime.getTime() + (duration * 60000));

      // Check for conflicts
      const conflictingAppointment = await Appointment.findOne({
        business: businessId,
        'schedule.startTime': { $lt: endDateTime },
        'schedule.endTime': { $gt: startDateTime },
        status: { $in: [APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED, APPOINTMENT_STATUS.IN_PROGRESS] },
        ...(staffId && { 'staff.assigned': staffId })
      });

      if (conflictingAppointment) {
        return res.status(400).json({
          success: false,
          message: 'Time slot is not available'
        });
      }

      // Create appointment
      const appointment = new Appointment({
        business: businessId,
        client: clientId,
        pet: petId,
        service: {
          id: serviceId || Date.now().toString(),
          name: serviceName,
          description: serviceDescription,
          duration,
          price: {
            amount: price,
            currency: 'USD'
          }
        },
        schedule: {
          date: appointmentDate,
          startTime: startDateTime,
          endTime: endDateTime,
          timezone: business.schedule?.timezone || 'UTC'
        },
        staff: {
          assigned: staffId || null,
          assignedAt: staffId ? new Date() : null
        },
        details: {
          notes: notes || '',
          specialRequests: specialRequests || ''
        },
        status: APPOINTMENT_STATUS.SCHEDULED,
        createdBy: userId
      });

      await appointment.save();
      
      // Populate for response
      await appointment.populate([
        { path: 'client', select: 'profile' },
        { path: 'pet', select: 'profile' },
        { path: 'staff.assigned', select: 'profile' },
        { path: 'business', select: 'profile' }
      ]);

      // Send confirmation email to client
      try {
        await sendEmail({
          to: client.profile.email,
          subject: 'Appointment Confirmation - PetSync',
          template: 'appointment-confirmation',
          data: {
            clientName: `${client.profile.firstName} ${client.profile.lastName}`,
            petName: pet.profile.name,
            serviceName,
            date: startDateTime.toLocaleDateString(),
            time: startDateTime.toLocaleTimeString(),
            businessName: business.profile.name,
            notes: notes || '',
            specialRequests: specialRequests || ''
          }
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }

      // Log activity
      await auditService.log({
        user: userId,
        business: businessId,
        action: 'CREATE',
        resource: 'appointment',
        resourceId: appointment._id,
        details: {
          clientName: `${client.profile.firstName} ${client.profile.lastName}`,
          petName: pet.profile.name,
          serviceName,
          appointmentDate: startDateTime,
          createdByRole: role
        }
      });

      res.status(201).json({
        success: true,
        message: 'Appointment created successfully',
        data: { appointment }
      });
    } catch (error) {
      console.error('Create appointment error:', error);
      next(error);
    }
  }

  // Get appointments with filtering and pagination
  async getAppointments(req, res, next) {
    try {
      const {
        businessId,
        clientId,
        staffId,
        status,
        date,
        dateFrom,
        dateTo,
        search,
        page = 1,
        limit = 10
      } = req.query;

      const { userId, role, userData } = req.user;

      // Build filter based on user role
      const filter = {};
      
      if (role === ROLES.BUSINESS_ADMIN) {
        // Business admin can see appointments for businesses they own
        const userBusinesses = Array.isArray(req.user.userData?.business) 
          ? req.user.userData.business 
          : [req.user.userData?.business];
        
        const businessIds = userBusinesses.map(b => 
          typeof b === 'object' ? b._id : b
        ).filter(Boolean);
        
        if (businessId) {
          // Check if requested business is owned by user
          if (businessIds.includes(businessId)) {
            filter.business = businessId;
          } else {
            return res.status(403).json({
              success: false,
              message: 'Access denied to this business'
            });
          }
        } else {
          // Show appointments for all owned businesses
          filter.business = { $in: businessIds };
        }
      } else if (role === ROLES.STAFF) {

        if (userData?.business) {
          filter.business = userData?.business;
        } else {
          filter['staff.assigned'] = userId;
        }


      } else if (role === ROLES.CLIENT) {
        // Client can only see their own appointments
        filter.client = userId;
      } else if (role === ROLES.SUPER_ADMIN) {
        // Super admin can see all appointments
        if (businessId) filter.business = businessId;
      }

      // Apply additional filters
      if (clientId) filter.client = clientId;
      if (staffId) filter['staff.assigned'] = staffId;
      if (status) filter.status = status;
      
      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        filter['schedule.date'] = { $gte: startOfDay, $lte: endOfDay };
      } else if (dateFrom || dateTo) {
        filter['schedule.date'] = {};
        if (dateFrom) filter['schedule.date'].$gte = new Date(dateFrom);
        if (dateTo) filter['schedule.date'].$lte = new Date(dateTo);
      }

      // Search filter
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        filter.$or = [
          { 'service.name': searchRegex },
          { 'service.description': searchRegex },
          { 'details.notes': searchRegex }
        ];
      }

      const skip = (page - 1) * limit;

      const appointments = await Appointment.find(filter)
        .populate('client', 'profile')
        .populate('pet', 'profile')
        .populate('staff.assigned', 'profile')
        .populate('business', 'profile')
        .populate('billing.invoice')
        .sort({ 'schedule.startTime': -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Appointment.countDocuments(filter);

      res.json({
        success: true,
        data: {
          appointments,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get appointments error:', error);
      next(error);
    }
  }

  // Get appointment statistics
  async getStatistics(req, res, next) {
    try {
      const { businessId, dateFrom, dateTo } = req.query;
      const { userId, role } = req.user;

      // Build filter based on user role
      const filter = {};
      
      if (role === ROLES.BUSINESS_ADMIN) {
        const userBusinesses = Array.isArray(req.user.userData?.business) 
          ? req.user.userData.business 
          : [req.user.userData?.business];
        
        const businessIds = userBusinesses.map(b => 
          typeof b === 'object' ? b._id : b
        ).filter(Boolean);
        
        if (businessId) {
          if (businessIds.includes(businessId)) {
            filter.business = businessId;
          } else {
            return res.status(403).json({
              success: false,
              message: 'Access denied to this business'
            });
          }
        } else {
          filter.business = { $in: businessIds };
        }
      } else if (role === ROLES.STAFF) {
        filter['staff.assigned'] = userId;
        if (businessId) filter.business = businessId;
      } else if (role === ROLES.CLIENT) {
        filter.client = userId;
      } else if (role === ROLES.SUPER_ADMIN) {
        if (businessId) filter.business = businessId;
      }

      if (dateFrom || dateTo) {
        filter['schedule.date'] = {};
        if (dateFrom) filter['schedule.date'].$gte = new Date(dateFrom);
        if (dateTo) filter['schedule.date'].$lte = new Date(dateTo);
      }

      const [stats, statusBreakdown] = await Promise.all([
        Appointment.aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              totalAppointments: { $sum: 1 },
              totalRevenue: { $sum: '$service.price.amount' },
              averagePrice: { $avg: '$service.price.amount' }
            }
          }
        ]),
        Appointment.aggregate([
          { $match: filter },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalRevenue: { $sum: '$service.price.amount' }
            }
          }
        ])
      ]);

      const result = {
        totalAppointments: stats[0]?.totalAppointments || 0,
        totalRevenue: stats[0]?.totalRevenue || 0,
        averagePrice: stats[0]?.averagePrice || 0,
        byStatus: statusBreakdown.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      };

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Get appointment statistics error:', error);
      next(error);
    }
  }

  // Get single appointment
  async getAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user;

      const appointment = await Appointment.findById(id)
        .populate('client', 'profile')
        .populate('pet', 'profile medical behavior')
        .populate('staff.assigned', 'profile')
        .populate('business', 'profile')
        .populate('billing.invoice');

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      // Check access permissions
      let hasAccess = false;
      
      if (role === ROLES.SUPER_ADMIN) {
      return res.status(404).json({
          success: false,
          message: 'You are not allowed!'
        });
      } else if (role === ROLES.BUSINESS_ADMIN) {
        const userBusinesses = Array.isArray(req.user.userData?.business) 
          ? req.user.userData.business 
          : [req.user.userData?.business];
        
        const businessIds = userBusinesses.map(b => 
          typeof b === 'object' ? b._id : b
        ).filter(Boolean);
        
        hasAccess = businessIds.includes(appointment.business._id.toString());
      } else if (role === ROLES.STAFF) {
        hasAccess = appointment.staff.assigned?.toString() === userId ||
                   appointment.business.staff.includes(userId);
      } else if (role === ROLES.CLIENT) {
        hasAccess = appointment.client._id.toString() === userId;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this appointment'
        });
      }

      res.json({
        success: true,
        data: { appointment }
      });
    } catch (error) {
      console.error('Get appointment error:', error);
      next(error);
    }
  }

  // Update appointment
  async updateAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;
      const { userId, role } = req.user;

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      // Check permissions
      let hasAccess = false;
      
      if (role === ROLES.SUPER_ADMIN) {
       return res.status(404).json({
          success: false,
          message: 'You are not allowed!'
        });
      } else if (role === ROLES.BUSINESS_ADMIN) {
        const userBusinesses = Array.isArray(req.user.userData?.business) 
          ? req.user.userData.business 
          : [req.user.userData?.business];
        
        const businessIds = userBusinesses.map(b => 
          typeof b === 'object' ? b._id : b
        ).filter(Boolean);
        
        hasAccess = businessIds.includes(appointment.business.toString());
      } else if (role === ROLES.STAFF) {
        hasAccess = appointment.staff.assigned?.toString() === userId;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to update this appointment'
        });
      }

      // Store original data for audit
      const originalData = appointment.toObject();

      // Update appointment
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined) {
          appointment[key] = updates[key];
        }
      });

      await appointment.save();

      // Log update
      await auditService.log({
        user: userId,
        business: appointment.business,
        action: 'UPDATE',
        resource: 'appointment',
        resourceId: appointment._id,
        details: {
          before: originalData,
          after: appointment.toObject(),
          updatedBy: role
        }
      });

      res.json({
        success: true,
        message: 'Appointment updated successfully',
        data: { appointment }
      });
    } catch (error) {
      console.error('Update appointment error:', error);
      next(error);
    }
  }

  // Cancel appointment
  async cancelAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const { reason, notifyClient = true } = req.body;
      const { userId, role } = req.user;

      const appointment = await Appointment.findById(id)
        .populate('client', 'profile')
        .populate('pet', 'profile')
        .populate('business', 'profile');

      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      // Check permissions
      let hasAccess = false;
      console.log(appointment.business._id)
      
      if (role === ROLES.SUPER_ADMIN) {
        hasAccess = true;
      } else if (role === ROLES.BUSINESS_ADMIN) {
        const userBusinesses = Array.isArray(req.user.userData?.business) 
          ? req.user.userData.business 
          : [req.user.userData?.business];
        
        const businessIds = userBusinesses.map(b => 
          typeof b === 'object' ? b._id : b
        ).filter(Boolean);
        console.log(businessIds)
        
       hasAccess = businessIds.some(id => id.toString() === appointment.business._id.toString());

      } else if (role === ROLES.STAFF) {
        hasAccess = appointment.staff.assigned?.toString() === userId;
      } else if (role === ROLES.CLIENT) {
        hasAccess = appointment.client._id.toString() === userId;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to cancel this appointment'
        });
      }

      // Update appointment status
      appointment.status = APPOINTMENT_STATUS.CANCELLED;
      appointment.cancellation = {
        cancelledBy: userId,
        cancelledAt: new Date(),
        reason: reason || 'No reason provided'
      };

      await appointment.save();

      // Send cancellation notification
      if (notifyClient && appointment.client) {
        try {
          await sendEmail({
            to: appointment.client.profile.email,
            subject: 'Appointment Cancelled - PetSync',
            template: 'appointment-cancellation',
            data: {
              clientName: `${appointment.client.profile.firstName} ${appointment.client.profile.lastName}`,
              petName: appointment.pet.profile.name,
              serviceName: appointment.service.name,
              date: appointment.schedule.startTime.toLocaleDateString(),
              time: appointment.schedule.startTime.toLocaleTimeString(),
              businessName: appointment.business.profile.name,
              reason: reason || 'No reason provided'
            }
          });
        } catch (emailError) {
          console.error('Failed to send cancellation email:', emailError);
        }
      }

      // Log cancellation
      await auditService.log({
        user: userId,
        business: appointment.business._id,
        action: 'CANCEL',
        resource: 'appointment',
        resourceId: appointment._id,
        details: { 
          reason: reason || 'No reason provided',
          cancelledBy: role
        }
      });

      res.json({
        success: true,
        message: 'Appointment cancelled successfully',
        data: { appointment }
      });
    } catch (error) {
      console.error('Cancel appointment error:', error);
      next(error);
    }
  }

  // Check-in appointment
  async checkinAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user;

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      // Check permissions
      let hasAccess = false;
      
      if (role === ROLES.SUPER_ADMIN) {
        return res.status(404).json({
          success: false,
          message: 'You are not allowed!'
        });
      } else if (role === ROLES.BUSINESS_ADMIN || role === ROLES.STAFF) {
        const userBusinesses = Array.isArray(req.user.userData?.business) 
          ? req.user.userData.business 
          : [req.user.userData?.business];
        
        const businessIds = userBusinesses.map(b => 
          typeof b === 'object' ? b._id : b
        ).filter(Boolean);
        
      hasAccess = businessIds.map(id => id.toString()).includes(appointment.business.toString()) ||
                  appointment.staff.assigned?.toString() === userId;

      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to check-in this appointment'
        });
      }

      appointment.tracking.checkedInAt = new Date();
      appointment.status = APPOINTMENT_STATUS.CONFIRMED;
      await appointment.save();

      // Log check-in
      await auditService.log({
        user: userId,
        business: appointment.business,
        action: 'CHECKIN',
        resource: 'appointment',
        resourceId: appointment._id,
        details: { checkedInBy: role }
      });

      res.json({
        success: true,
        message: 'Pet checked in successfully',
        data: { appointment }
      });
    } catch (error) {
      console.error('Check-in appointment error:', error);
      next(error);
    }
  }

  // Start service
  async startService(req, res, next) {
    try {
      const { id } = req.params;
      const { userId, role } = req.user;

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      // Check permissions
      let hasAccess = false;
      
      if (role === ROLES.SUPER_ADMIN) {
      return res.status(404).json({
          success: false,
          message: 'You are not allowed!'
        });
      } else if (role === ROLES.BUSINESS_ADMIN || role === ROLES.STAFF) {
        const userBusinesses = Array.isArray(req.user.userData?.business) 
          ? req.user.userData.business 
          : [req.user.userData?.business];
        
        const businessIds = userBusinesses.map(b => 
          typeof b === 'object' ? b._id : b
        ).filter(Boolean);
        
       hasAccess = businessIds.map(id => id.toString()).includes(appointment.business.toString()) ||
                  appointment.staff.assigned?.toString() === userId;

      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to start this appointment'
        });
      }

      appointment.tracking.serviceStartedAt = new Date();
      appointment.status = APPOINTMENT_STATUS.IN_PROGRESS;
      await appointment.save();

      // Log service start
      await auditService.log({
        user: userId,
        business: appointment.business,
        action: 'START_SERVICE',
        resource: 'appointment',
        resourceId: appointment._id,
        details: { startedBy: role }
      });

      res.json({
        success: true,
        message: 'Service started successfully',
        data: { appointment }
      });
    } catch (error) {
      console.error('Start service error:', error);
      next(error);
    }
  }

  // Complete service
  async completeService(req, res, next) {
    try {
      const { id } = req.params;
      const { notes, photos = [] } = req.body;
      const { userId, role } = req.user;

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      // Check permissions
      let hasAccess = false;
      
      if (role === ROLES.SUPER_ADMIN) {
        return res.status(404).json({
          success: false,
          message: 'You are not allowed!'
        });
      } else if (role === ROLES.BUSINESS_ADMIN || role === ROLES.STAFF) {
        const userBusinesses = Array.isArray(req.user.userData?.business) 
          ? req.user.userData.business 
          : [req.user.userData?.business];
        
        const businessIds = userBusinesses.map(b => 
          typeof b === 'object' ? b._id : b
        ).filter(Boolean);
        
        hasAccess = businessIds.map(id => id.toString()).includes(appointment.business.toString()) ||
                  appointment.staff.assigned?.toString() === userId;

      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to complete this appointment'
        });
      }

      appointment.tracking.serviceCompletedAt = new Date();
      appointment.tracking.photos = photos;
      appointment.status = APPOINTMENT_STATUS.COMPLETED;
      
      if (notes) {
        appointment.details.notes = notes;
      }

      await appointment.save();

      // Log service completion
      await auditService.log({
        user: userId,
        business: appointment.business,
        action: 'COMPLETE_SERVICE',
        resource: 'appointment',
        resourceId: appointment._id,
        details: { 
          completedBy: role,
          hasNotes: !!notes,
          photoCount: photos.length
        }
      });

      res.json({
        success: true,
        message: 'Service completed successfully',
        data: { appointment }
      });
    } catch (error) {
      console.error('Complete service error:', error);
      next(error);
    }
  }
}

module.exports = new AppointmentController();