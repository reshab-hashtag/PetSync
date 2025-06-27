const Appointment = require('../models/Appointment');
const Business = require('../models/Business');
const Pet = require('../models/Pet');
const User = require('../models/User');
const { sendEmail } = require('../services/emailService');
// const { sendSMS } = require('../services/smsService');
const auditService = require('../services/auditService');
const { APPOINTMENT_STATUS } = require('../config/constants');

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
        duration,
        price,
        date,
        startTime,
        staffId,
        notes,
        specialRequests
      } = req.body;

      // Validate business exists
      const business = await Business.findById(businessId);
      if (!business) {
        return res.status(404).json({
          success: false,
          message: 'Business not found'
        });
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

      // Calculate end time
      const startDateTime = new Date(`${date}T${startTime}`);
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
          id: serviceId,
          name: serviceName,
          duration,
          price: {
            amount: price,
            currency: 'USD'
          }
        },
        schedule: {
          date: new Date(date),
          startTime: startDateTime,
          endTime: endDateTime,
          timezone: business.schedule.timezone
        },
        staff: {
          assigned: staffId,
          assignedAt: staffId ? new Date() : null
        },
        details: {
          notes,
          specialRequests
        },
        createdBy: req.user.userId
      });

      await appointment.save();
      
      // Populate for response
      await appointment.populate(['client', 'pet', 'staff.assigned', 'business']);

      // Send confirmation email
      try {
        await sendEmail({
          to: client.profile.email,
          subject: 'Appointment Confirmation - PetSync',
          template: 'appointment-confirmation',
          data: {
            clientName: client.fullName,
            petName: pet.profile.name,
            serviceName,
            date: startDateTime.toLocaleDateString(),
            time: startDateTime.toLocaleTimeString(),
            businessName: business.profile.name
          }
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }

      // Log activity
      await auditService.log({
        user: req.user.userId,
        business: businessId,
        action: 'CREATE',
        resource: 'appointment',
        resourceId: appointment._id
      });

      res.status(201).json({
        success: true,
        message: 'Appointment created successfully',
        data: { appointment }
      });
    } catch (error) {
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
        page = 1,
        limit = 20
      } = req.query;

      // Build filter
      const filter = {};
      
      if (businessId) filter.business = businessId;
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

      const skip = (page - 1) * limit;

      const appointments = await Appointment.find(filter)
        .populate('client', 'profile')
        .populate('pet', 'profile')
        .populate('staff.assigned', 'profile')
        .populate('business', 'profile')
        .sort({ 'schedule.startTime': 1 })
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
            total
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get single appointment
  async getAppointment(req, res, next) {
    try {
      const { id } = req.params;

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

      res.json({
        success: true,
        data: { appointment }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update appointment
  async updateAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
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
        user: req.user.userId,
        business: appointment.business,
        action: 'UPDATE',
        resource: 'appointment',
        resourceId: appointment._id,
        details: {
          before: originalData,
          after: appointment.toObject()
        }
      });

      res.json({
        success: true,
        message: 'Appointment updated successfully',
        data: { appointment }
      });
    } catch (error) {
      next(error);
    }
  }

  // Cancel appointment
  async cancelAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const { reason, notifyClient = true } = req.body;

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

      // Update appointment status
      appointment.status = APPOINTMENT_STATUS.CANCELLED;
      appointment.cancellation = {
        cancelledBy: req.user.userId,
        cancelledAt: new Date(),
        reason
      };

      await appointment.save();

      // Send cancellation notification
      if (notifyClient) {
        try {
          await sendEmail({
            to: appointment.client.profile.email,
            subject: 'Appointment Cancelled - PetSync',
            template: 'appointment-cancellation',
            data: {
              clientName: appointment.client.fullName,
              petName: appointment.pet.profile.name,
              serviceName: appointment.service.name,
              date: appointment.schedule.startTime.toLocaleDateString(),
              time: appointment.schedule.startTime.toLocaleTimeString(),
              businessName: appointment.business.profile.name,
              reason
            }
          });
        } catch (emailError) {
          console.error('Failed to send cancellation email:', emailError);
        }
      }

      // Log cancellation
      await auditService.log({
        user: req.user.userId,
        business: appointment.business._id,
        action: 'CANCEL',
        resource: 'appointment',
        resourceId: appointment._id,
        details: { reason }
      });

      res.json({
        success: true,
        message: 'Appointment cancelled successfully',
        data: { appointment }
      });
    } catch (error) {
      next(error);
    }
  }

  // Check-in appointment
  async checkinAppointment(req, res, next) {
    try {
      const { id } = req.params;

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      appointment.tracking.checkedInAt = new Date();
      appointment.status = APPOINTMENT_STATUS.CONFIRMED;
      await appointment.save();

      res.json({
        success: true,
        message: 'Pet checked in successfully',
        data: { appointment }
      });
    } catch (error) {
      next(error);
    }
  }

  // Start service
  async startService(req, res, next) {
    try {
      const { id } = req.params;

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      appointment.tracking.serviceStartedAt = new Date();
      appointment.status = APPOINTMENT_STATUS.IN_PROGRESS;
      await appointment.save();

      res.json({
        success: true,
        message: 'Service started successfully',
        data: { appointment }
      });
    } catch (error) {
      next(error);
    }
  }

  // Complete service
  async completeService(req, res, next) {
    try {
      const { id } = req.params;
      const { notes, photos = [] } = req.body;

      const appointment = await Appointment.findById(id);
      if (!appointment) {
        return res.status(404).json({
          success: false,
          message: 'Appointment not found'
        });
      }

      appointment.tracking.serviceCompletedAt = new Date();
      appointment.tracking.photos = photos;
      appointment.status = APPOINTMENT_STATUS.COMPLETED;
      
      if (notes) {
        appointment.details.notes = notes;
      }

      await appointment.save();

      res.json({
        success: true,
        message: 'Service completed successfully',
        data: { appointment }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get appointment statistics
  async getStatistics(req, res, next) {
    try {
      const { businessId, dateFrom, dateTo } = req.query;

      const filter = { business: businessId };
      if (dateFrom || dateTo) {
        filter['schedule.date'] = {};
        if (dateFrom) filter['schedule.date'].$gte = new Date(dateFrom);
        if (dateTo) filter['schedule.date'].$lte = new Date(dateTo);
      }

      const stats = await Appointment.aggregate([
        { $match: filter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalRevenue: { $sum: '$service.price.amount' }
          }
        }
      ]);

      const totalAppointments = stats.reduce((sum, stat) => sum + stat.count, 0);
      const totalRevenue = stats.reduce((sum, stat) => sum + stat.totalRevenue, 0);

      res.json({
        success: true,
        data: {
          totalAppointments,
          totalRevenue,
          byStatus: stats
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AppointmentController();