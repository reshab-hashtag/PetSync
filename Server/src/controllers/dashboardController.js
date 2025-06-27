const User = require('../models/User');
const Business = require('../models/Business');
const Pet = require('../models/Pet');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const Message = require('../models/Message');
// const Document = require('../models/Document');
// const Service = require('../models/Service');
// const AuditLog = require('../models/AuditLog');
const { ROLES, APPOINTMENT_STATUS, INVOICE_STATUS } = require('../config/constants');
const mongoose = require('mongoose');

class DashboardController {

    constructor() {
    // bind each handler so `this` is always the controller instance
    this.getDashboardOverview    = this.getDashboardOverview.bind(this);
    this.getSuperAdminDashboard  = this.getSuperAdminDashboard.bind(this);
    this.getBusinessAdminDashboard = this.getBusinessAdminDashboard.bind(this);
    this.getStaffDashboard       = this.getStaffDashboard.bind(this);
    this.getPetOwnerDashboard    = this.getPetOwnerDashboard.bind(this);
    }
  // ===================================
  // MAIN DASHBOARD OVERVIEW
  // ===================================

  // Get main dashboard overview
  async getDashboardOverview(req, res, next) {
  try {
    const { dateFrom, dateTo } = req.query;
     const { userId, role, businessId } = req.user;
    const businessArray = req.user.userData?.business || [];

    // Build date filter
    const dateFilter = {};
    if (dateFrom || dateTo) {
      dateFilter.createdAt = {};
      if (dateFrom) dateFilter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) dateFilter.createdAt.$lte = new Date(dateTo);
    }

    // Build business filter based on user role
    const businessFilter = {};
    if (role !== ROLES.SUPER_ADMIN) {
      businessFilter.business = businessId;
    }

    let dashboardData;

    switch (role) {
      case ROLES.SUPER_ADMIN:
        dashboardData = await this.getSuperAdminDashboard(dateFilter);
        break;
      case ROLES.BUSINESS_ADMIN:
        dashboardData = await this.getBusinessAdminDashboard(businessId, dateFilter);
        break;
      case ROLES.STAFF:
        dashboardData = await this.getStaffDashboard(userId, businessId, dateFilter);
        break;
      case ROLES.CLIENT:
        dashboardData = await this.getPetOwnerDashboard(userId, dateFilter);
        break;
      default:
        return res.status(403).json({ success: false, message: 'Invalid user role' });
    }

    // Include the full business array for business admins
    const responsePayload = {
      ...dashboardData,
      businesses: businessArray || []
    };

    res.json({ success: true, data: responsePayload });
  } catch (error) {
    next(error);
  }
}


  // ===================================
  // ROLE-SPECIFIC DASHBOARDS
  // ===================================

  // Super Admin Dashboard
  async getSuperAdminDashboard(dateFilter) {
    const [
      totalUsers,
      totalBusinesses,
      totalPets,
      totalAppointments,
      totalRevenue
    ] = await Promise.all([
      // Basic totals
      User.countDocuments({ 
        ...dateFilter,
        isActive: true,
        role: ROLES.BUSINESS_ADMIN
      }),
      Business.countDocuments({ ...dateFilter, isActive: true }),
      Pet.countDocuments({ ...dateFilter, isActive: true }),
      Appointment.countDocuments(dateFilter),
      
      // Total revenue
      Invoice.aggregate([
        { $match: { ...dateFilter, 'payment.status': INVOICE_STATUS.PAID } },
        { $group: { _id: null, total: { $sum: '$totals.total' } } }
      ]).then(result => result[0]?.total || 0)
    ]);


      const currentUsers = await User.countDocuments({
      ...dateFilter,
      isActive: true,
      role: ROLES.BUSINESS_ADMIN
    });
    const lastUsers = await User.countDocuments({
    createdAt: {
        $gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        $lt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    isActive: true,
    role: ROLES.BUSINESS_ADMIN
    });
    const userGrowth = lastUsers === 0 ? 100 : ((currentUsers - lastUsers) / lastUsers * 100);

    // revenue over “today” period is your totalRevenue from above:
    const currentRevenue = totalRevenue;
    // now compute “yesterday” revenue for the growth calc:
    const lastRevenue = await Invoice.aggregate([
      { $match: {
          createdAt: {
            $gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            $lt:  new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
          },
          'payment.status': INVOICE_STATUS.PAID
      }},
      { $group: { _id: null, total: { $sum: '$totals.total' } } }
    ]).then(r => r[0]?.total || 0);
    const revenueGrowth = lastRevenue === 0
      ? 100
      : ((currentRevenue - lastRevenue) / lastRevenue * 100);
    // const revenueGrowth = lastRevenue === 0 ? 100 : ((currentRevenue - lastRevenue) / lastRevenue * 100);
  
    return {
      totalUsers,
      totalBusinesses,
      totalPets,
      totalAppointments,
      users: { current: currentUsers, previous: lastUsers, growth: userGrowth.toFixed(1) },
      revenue: {
        current:  currentRevenue,
        previous: lastRevenue,
        growth:   revenueGrowth.toFixed(1)
      }
    };
  }

  // Get staff performance metrics
  async getStaffPerformanceMetrics(businessId, dateFilter) {
    return await User.aggregate([
      { $match: { business: new mongoose.Types.ObjectId(businessId), role: { $in: [ROLES.STAFF, ROLES.BUSINESS_ADMIN] } } },
      {
        $lookup: {
          from: 'appointments',
          let: { staffId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$staff.assigned', '$staffId'] }, dateFilter] } } }
          ],
          as: 'appointments'
        }
      },
      {
        $project: {
          name: { $concat: ['$profile.firstName', ' ', '$profile.lastName'] },
          role: 1,
          totalAppointments: { $size: '$appointments' },
          completedAppointments: {
            $size: {
              $filter: {
                input: '$appointments',
                cond: { $eq: ['$this.status', APPOINTMENT_STATUS.COMPLETED] }
              }
            }
          },
          revenue: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$appointments',
                    cond: { $eq: ['$this.status', APPOINTMENT_STATUS.COMPLETED] }
                  }
                },
                as: 'apt',
                in: '$apt.service.price.amount'
              }
            }
          }
        }
      },
      {
        $addFields: {
          completionRate: {
            $cond: [
              { $eq: ['$totalAppointments', 0] },
              0,
              { $multiply: [{ $divide: ['$completedAppointments', '$totalAppointments'] }, 100] }
            ]
          }
        }
      },
      { $sort: { revenue: -1 } }
    ]);
  }

  // Get service popularity metrics
  async getServicePopularityMetrics(businessId, dateFilter) {
    return await Appointment.aggregate([
      { $match: { business: new mongoose.Types.ObjectId(businessId), ...dateFilter } },
      {
        $group: {
          _id: '$service.name',
          count: { $sum: 1 },
          revenue: { $sum: '$service.price.amount' },
          avgPrice: { $avg: '$service.price.amount' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
  }

  // Get appointment trends (last 7 days)
  async getAppointmentTrends(businessId) {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    return await Appointment.aggregate([
      {
        $match: {
          business: new mongoose.Types.ObjectId(businessId),
          'schedule.date': { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$schedule.date' } },
          count: { $sum: 1 },
          revenue: { $sum: '$service.price.amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }

  // Get client activity metrics
  async getClientActivityMetrics(businessId, dateFilter) {
    return await User.aggregate([
      { $match: { business: new mongoose.Types.ObjectId(businessId), role: ROLES.CLIENT } },
      {
        $lookup: {
          from: 'appointments',
          let: { clientId: '$_id' },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ['$client', '$clientId'] }, dateFilter] } } }
          ],
          as: 'appointments'
        }
      },
      {
        $project: {
          name: { $concat: ['$profile.firstName', ' ', '$profile.lastName'] },
          email: '$profile.email',
          totalAppointments: { $size: '$appointments' },
          lastAppointment: { $max: '$appointments.schedule.startTime' },
          totalSpent: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$appointments',
                    cond: { $eq: ['$this.status', APPOINTMENT_STATUS.COMPLETED] }
                  }
                },
                as: 'apt',
                in: '$apt.service.price.amount'
              }
            }
          }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 }
    ]);
  }

  // Get staff daily schedule
  async getStaffDailySchedule(staffId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return await Appointment.find({
      'staff.assigned': staffId,
      'schedule.date': { $gte: today, $lt: tomorrow }
    })
    .populate('client', 'profile.firstName profile.lastName profile.phone')
    .populate('pet', 'profile.name profile.species')
    .sort({ 'schedule.startTime': 1 });
  }

  // Get staff weekly schedule
  async getStaffWeeklySchedule(staffId) {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    return await Appointment.aggregate([
      {
        $match: {
          'staff.assigned': new mongoose.Types.ObjectId(staffId),
          'schedule.date': { $gte: startOfWeek, $lt: endOfWeek }
        }
      },
      {
        $group: {
          _id: { $dayOfWeek: '$schedule.date' },
          count: { $sum: 1 },
          totalDuration: { $sum: '$service.duration' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
  }

  // Get staff performance stats
  async getStaffPerformanceStats(staffId, dateFilter) {
    const [appointments, completionRate, avgRating, revenue] = await Promise.all([
      Appointment.countDocuments({ 'staff.assigned': staffId, ...dateFilter }),
      
      Appointment.aggregate([
        { $match: { 'staff.assigned': new mongoose.Types.ObjectId(staffId), ...dateFilter } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', APPOINTMENT_STATUS.COMPLETED] }, 1, 0] } }
          }
        }
      ]).then(result => {
        if (!result[0] || result[0].total === 0) return 0;
        return (result[0].completed / result[0].total * 100).toFixed(1);
      }),

      Appointment.aggregate([
        { $match: { 'staff.assigned': new mongoose.Types.ObjectId(staffId), 'feedback.rating': { $exists: true } } },
        { $group: { _id: null, avgRating: { $avg: '$feedback.rating' } } }
      ]).then(result => result[0]?.avgRating?.toFixed(1) || 0),

      Appointment.aggregate([
        { $match: { 'staff.assigned': new mongoose.Types.ObjectId(staffId), status: APPOINTMENT_STATUS.COMPLETED, ...dateFilter } },
        { $group: { _id: null, total: { $sum: '$service.price.amount' } } }
      ]).then(result => result[0]?.total || 0)
    ]);

    return {
      totalAppointments: appointments,
      completionRate: parseFloat(completionRate),
      averageRating: parseFloat(avgRating),
      totalRevenue: revenue
    };
  }

  // Get client appointment history
  async getClientAppointmentHistory(clientId) {
    return await Appointment.aggregate([
      { $match: { client: new mongoose.Types.ObjectId(clientId) } },
      {
        $group: {
          _id: '$service.name',
          count: { $sum: 1 },
          lastVisit: { $max: '$schedule.startTime' },
          totalSpent: { $sum: '$service.price.amount' }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }

  // Get pet health reminders
  async getPetHealthReminders(ownerId) {
    const pets = await Pet.find({ owner: ownerId, isActive: true });
    const reminders = [];

    for (const pet of pets) {
      // Check vaccination expiry
      if (pet.medical.vaccinations) {
        pet.medical.vaccinations.forEach(vaccination => {
          if (vaccination.expirationDate) {
            const daysUntilExpiry = Math.ceil((new Date(vaccination.expirationDate) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
              reminders.push({
                petId: pet._id,
                petName: pet.profile.name,
                type: 'vaccination',
                message: `${vaccination.vaccine} vaccination expires in ${daysUntilExpiry} days`,
                priority: daysUntilExpiry <= 7 ? 'high' : 'medium',
                dueDate: vaccination.expirationDate
              });
            }
          }
        });
      }

      // Check for overdue appointments (if last appointment was more than 6 months ago)
      const lastAppointment = await Appointment.findOne({
        pet: pet._id,
        status: APPOINTMENT_STATUS.COMPLETED
      }).sort({ 'schedule.startTime': -1 });

      if (lastAppointment) {
        const daysSinceLastVisit = Math.ceil((new Date() - new Date(lastAppointment.schedule.startTime)) / (1000 * 60 * 60 * 24));
        if (daysSinceLastVisit > 180) {
          reminders.push({
            petId: pet._id,
            petName: pet.profile.name,
            type: 'checkup',
            message: `${pet.profile.name} hasn't had a checkup in ${Math.floor(daysSinceLastVisit / 30)} months`,
            priority: 'medium'
          });
        }
      }
    }

    return reminders.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Get quick stats
  async getQuickStats(req, res, next) {
    try {
      const { role, businessId } = req.user;

      let stats;

      if (role === ROLES.SUPER_ADMIN) {
        stats = await Promise.all([
          User.countDocuments({ isActive: true }),
          Business.countDocuments({ isActive: true }),
          Appointment.countDocuments(),
          Invoice.aggregate([
            { $match: { 'payment.status': INVOICE_STATUS.PAID } },
            { $group: { _id: null, total: { $sum: '$totals.total' } } }
          ]).then(result => result[0]?.total || 0)
        ]);

        res.json({
          success: true,
          data: {
            totalUsers: stats[0],
            totalBusinesses: stats[1],
            totalAppointments: stats[2],
            totalRevenue: stats[3]
          }
        });
      } else {
        stats = await Promise.all([
          User.countDocuments({ business: businessId, role: ROLES.CLIENT, isActive: true }),
          Appointment.countDocuments({ business: businessId }),
          Invoice.aggregate([
            { $match: { business: new mongoose.Types.ObjectId(businessId), 'payment.status': INVOICE_STATUS.PAID } },
            { $group: { _id: null, total: { $sum: '$totals.total' } } }
          ]).then(result => result[0]?.total || 0),
          Appointment.countDocuments({
            business: businessId,
            'schedule.date': {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
              $lte: new Date(new Date().setHours(23, 59, 59, 999))
            }
          })
        ]);

        res.json({
          success: true,
          data: {
            totalClients: stats[0],
            totalAppointments: stats[1],
            totalRevenue: stats[2],
            appointmentsToday: stats[3]
          }
        });
      }
    } catch (error) {
      next(error);
    }
  }

  // Get recent activity
  async getRecentActivity(req, res, next) {
    try {
      const { role, businessId, userId } = req.user;
      const { limit = 10 } = req.query;

      let activities = [];

      if (role === ROLES.SUPER_ADMIN) {
        // Super admin sees all recent activities
        const [recentUsers, recentBusinesses, recentAppointments] = await Promise.all([
          User.find({ isActive: true }).sort({ createdAt: -1 }).limit(5)
            .select('profile.firstName profile.lastName profile.email createdAt'),
          Business.find({ isActive: true }).sort({ createdAt: -1 }).limit(5)
            .select('profile.name profile.email createdAt'),
          Appointment.find().sort({ createdAt: -1 }).limit(5)
            .populate('client', 'profile.firstName profile.lastName')
            .populate('business', 'profile.name')
        ]);

        activities = [
          ...recentUsers.map(user => ({
            type: 'user_registered',
            data: user,
            timestamp: user.createdAt
          })),
          ...recentBusinesses.map(business => ({
            type: 'business_created',
            data: business,
            timestamp: business.createdAt
          })),
          ...recentAppointments.map(appointment => ({
            type: 'appointment_created',
            data: appointment,
            timestamp: appointment.createdAt
          }))
        ];
      } else {
        // Business-specific activities
        const [recentAppointments, recentInvoices, recentMessages] = await Promise.all([
          Appointment.find({ business: businessId }).sort({ createdAt: -1 }).limit(5)
            .populate('client', 'profile.firstName profile.lastName')
            .populate('pet', 'profile.name'),
          Invoice.find({ business: businessId }).sort({ createdAt: -1 }).limit(3)
            .populate('client', 'profile.firstName profile.lastName'),
          Message.find({
            $or: [{ from: userId }, { to: userId }]
          }).sort({ createdAt: -1 }).limit(3)
            .populate('from', 'profile.firstName profile.lastName')
            .populate('to', 'profile.firstName profile.lastName')
        ]);

        activities = [
          ...recentAppointments.map(appointment => ({
            type: 'appointment_created',
            data: appointment,
            timestamp: appointment.createdAt
          })),
          ...recentInvoices.map(invoice => ({
            type: 'invoice_created',
            data: invoice,
            timestamp: invoice.createdAt
          })),
          ...recentMessages.map(message => ({
            type: 'message_received',
            data: message,
            timestamp: message.createdAt
          }))
        ];
      }

      // Sort by timestamp and limit
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      activities = activities.slice(0, parseInt(limit));

      res.json({
        success: true,
        data: { activities }
      });
    } catch (error) {
      next(error);
    }
  }




   // Business Admin Dashboard
  async getBusinessAdminDashboard(businessId, dateFilter) {
  console.log('Fetching business admin dashboard for business:', businessId, 'with date filter:', dateFilter);
  const businessFilter = { business: businessId, ...dateFilter };

  const [
    business,
    totalClients,
    totalPets,
    totalAppointments,
    totalRevenue,
    todayAppointments,
    pendingInvoices,
    recentAppointments,
    staffPerformance,
    servicePopularity,
    appointmentTrends,
    clientActivity,
    upcomingAppointments,
    overdueInvoices
  ] = await Promise.all([
    Business.findById(businessId).populate('staff', 'profile.firstName profile.lastName role'),
    User.countDocuments({ business: businessId, role: ROLES.CLIENT, isActive: true }),
    Pet.countDocuments({ ...dateFilter, owner: { $in: await User.find({ business: businessId, role: ROLES.CLIENT }).distinct('_id') } }),
    Appointment.countDocuments(businessFilter),
    Invoice.aggregate([
      { $match: { ...businessFilter, 'payment.status': INVOICE_STATUS.PAID } },
      { $group: { _id: null, total: { $sum: '$totals.total' } } }
    ]).then(result => result[0]?.total || 0),
    Appointment.find({
      business: businessId,
      'schedule.date': {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lte: new Date(new Date().setHours(23, 59, 59, 999))
      }
    })
      .populate('client', 'profile.firstName profile.lastName')
      .populate('pet', 'profile.name profile.species')
      .populate('staff.assigned', 'profile.firstName profile.lastName')
      .sort({ 'schedule.startTime': 1 }),
    Invoice.countDocuments({
      business: businessId,
      'payment.status': { $in: [INVOICE_STATUS.SENT, INVOICE_STATUS.OVERDUE] }
    }),
    Appointment.find(businessFilter)
      .populate('client', 'profile.firstName profile.lastName')
      .populate('pet', 'profile.name profile.species')
      .populate('staff.assigned', 'profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .limit(10),
    this.getStaffPerformanceMetrics(businessId, dateFilter),
    this.getServicePopularityMetrics(businessId, dateFilter),
    this.getAppointmentTrends(businessId),
    this.getClientActivityMetrics(businessId, dateFilter),
    Appointment.find({
      business: businessId,
      'schedule.date': {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      status: { $in: [APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED] }
    })
      .populate('client', 'profile.firstName profile.lastName')
      .populate('pet', 'profile.name')
      .sort({ 'schedule.startTime': 1 })
      .limit(20),
    Invoice.find({
      business: businessId,
      'payment.status': { $in: [INVOICE_STATUS.SENT, INVOICE_STATUS.OVERDUE] },
      'dates.dueDate': { $lt: new Date() }
    })
      .populate('client', 'profile.firstName profile.lastName')
      .sort({ 'dates.dueDate': 1 })
      .limit(10)
  ]);

  return {
    business,
    overview: {
      totalClients,
      totalPets,
      totalAppointments,
      totalRevenue,
      pendingInvoices
    },
    todaySchedule: {
      appointments: todayAppointments,
      totalToday: todayAppointments.length
    },
    recentActivity: {
      appointments: recentAppointments
    },
    upcomingSchedule: {
      appointments: upcomingAppointments
    },
    performance: {
      staff: staffPerformance,
      services: servicePopularity
    },
    charts: {
      appointmentTrends,
      clientActivity
    },
    alerts: {
      overdueInvoices
    }
  };
}


  // Staff Dashboard
  async getStaffDashboard(userId, businessId, dateFilter) {
    const staffFilter = { 'staff.assigned': userId, ...dateFilter };

    const [
      user,
      myAppointmentsToday,
      myUpcomingAppointments,
      myCompletedAppointments,
      myTotalRevenue,
      recentMessages,
      todaySchedule,
      weeklySchedule,
      myPerformanceStats
    ] = await Promise.all([
      // Staff info
      User.findById(userId).populate('business', 'profile.name'),

      // Today's appointments
      Appointment.find({
        'staff.assigned': userId,
        'schedule.date': {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setHours(23, 59, 59, 999))
        }
      })
      .populate('client', 'profile.firstName profile.lastName profile.phone')
      .populate('pet', 'profile.name profile.species profile.breed')
      .sort({ 'schedule.startTime': 1 }),

      // Upcoming appointments (next 7 days)
      Appointment.find({
        'staff.assigned': userId,
        'schedule.date': {
          $gte: new Date(),
          $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        status: { $in: [APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED] }
      })
      .populate('client', 'profile.firstName profile.lastName')
      .populate('pet', 'profile.name profile.species')
      .sort({ 'schedule.startTime': 1 })
      .limit(15),

      // Completed appointments count
      Appointment.countDocuments({
        ...staffFilter,
        status: APPOINTMENT_STATUS.COMPLETED
      }),

      // Revenue generated
      Appointment.aggregate([
        { $match: { ...staffFilter, status: APPOINTMENT_STATUS.COMPLETED } },
        { $group: { _id: null, total: { $sum: '$service.price.amount' } } }
      ]).then(result => result[0]?.total || 0),

      // Recent messages
      Message.find({
        $or: [{ from: userId }, { to: userId }]
      })
      .populate('from', 'profile.firstName profile.lastName')
      .populate('to', 'profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .limit(10),

      // Today's detailed schedule
      this.getStaffDailySchedule(userId),

      // Weekly schedule overview
      this.getStaffWeeklySchedule(userId),

      // Performance statistics
      this.getStaffPerformanceStats(userId, dateFilter)
    ]);

    return {
      staff: user,
      overview: {
        appointmentsToday: myAppointmentsToday.length,
        upcomingAppointments: myUpcomingAppointments.length,
        completedAppointments: myCompletedAppointments,
        totalRevenue: myTotalRevenue
      },
      todaySchedule: {
        appointments: myAppointmentsToday,
        schedule: todaySchedule
      },
      upcomingSchedule: {
        appointments: myUpcomingAppointments,
        weeklyOverview: weeklySchedule
      },
      communication: {
        recentMessages
      },
      performance: myPerformanceStats
    };
  }

  // Pet Owner Dashboard
  async getPetOwnerDashboard(userId, dateFilter) {
    const [
      user,
      myPets,
      upcomingAppointments,
      recentAppointments,
      pendingInvoices,
      recentMessages,
      appointmentHistory,
      petHealthReminders,
      totalSpent
    ] = await Promise.all([
      // User info
      User.findById(userId).populate('pets'),

      // My pets
      Pet.find({ owner: userId, isActive: true })
        .sort({ 'profile.name': 1 }),

      // Upcoming appointments
      Appointment.find({
        client: userId,
        'schedule.date': { $gte: new Date() },
        status: { $in: [APPOINTMENT_STATUS.SCHEDULED, APPOINTMENT_STATUS.CONFIRMED] }
      })
      .populate('pet', 'profile.name profile.species')
      .populate('business', 'profile.name profile.phone profile.address')
      .populate('staff.assigned', 'profile.firstName profile.lastName')
      .sort({ 'schedule.startTime': 1 })
      .limit(10),

      // Recent appointments
      Appointment.find({
        client: userId,
        ...dateFilter
      })
      .populate('pet', 'profile.name profile.species')
      .populate('business', 'profile.name')
      .sort({ 'schedule.startTime': -1 })
      .limit(10),

      // Pending invoices
      Invoice.find({
        client: userId,
        'payment.status': { $in: [INVOICE_STATUS.SENT, INVOICE_STATUS.OVERDUE] }
      })
      .populate('business', 'profile.name')
      .sort({ 'dates.dueDate': 1 }),

      // Recent messages
      Message.find({
        $or: [{ from: userId }, { to: userId }]
      })
      .populate('from', 'profile.firstName profile.lastName')
      .populate('to', 'profile.firstName profile.lastName')
      .sort({ createdAt: -1 })
      .limit(5),

      // Appointment history summary
      this.getClientAppointmentHistory(userId),

      // Pet health reminders
      this.getPetHealthReminders(userId),

      // Total amount spent
      Invoice.aggregate([
        { $match: { client: userId, 'payment.status': INVOICE_STATUS.PAID } },
        { $group: { _id: null, total: { $sum: '$totals.total' } } }
      ]).then(result => result[0]?.total || 0)
    ]);

    return {
      client: user,
      overview: {
        totalPets: myPets.length,
        upcomingAppointments: upcomingAppointments.length,
        pendingInvoices: pendingInvoices.length,
        totalSpent
      },
      pets: myPets,
      schedule: {
        upcoming: upcomingAppointments,
        recent: recentAppointments
      },
      billing: {
        pendingInvoices
      },
      communication: {
        recentMessages
      },
      insights: {
        appointmentHistory,
        healthReminders: petHealthReminders
      }
    };
  }

  // ===================================
  // ANALYTICS & METRICS
  // ===================================

  // Get appointment analytics
  async getAppointmentAnalytics(req, res, next) {
    try {
      const { businessId, dateFrom, dateTo, staffId, serviceId } = req.query;
      const { role, businessId: userBusinessId } = req.user;

      // Build filter
      const filter = {};
      
      if (role === ROLES.SUPER_ADMIN && businessId) {
        filter.business = businessId;
      } else if (role !== ROLES.SUPER_ADMIN) {
        filter.business = userBusinessId;
      }

      if (staffId) filter['staff.assigned'] = staffId;
      if (serviceId) filter['service.id'] = serviceId;

      if (dateFrom || dateTo) {
        filter['schedule.date'] = {};
        if (dateFrom) filter['schedule.date'].$gte = new Date(dateFrom);
        if (dateTo) filter['schedule.date'].$lte = new Date(dateTo);
      }

      const [
        statusDistribution,
        dailyTrends,
        hourlyDistribution,
        serviceAnalytics,
        staffAnalytics,
        completionRates,
        averageServiceTime
      ] = await Promise.all([
        // Status distribution
        Appointment.aggregate([
          { $match: filter },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),

        // Daily trends (last 30 days)
        Appointment.aggregate([
          {
            $match: {
              ...filter,
              'schedule.date': {
                $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$schedule.date' } },
              count: { $sum: 1 },
              revenue: { $sum: '$service.price.amount' }
            }
          },
          { $sort: { _id: 1 } }
        ]),

        // Hourly distribution
        Appointment.aggregate([
          { $match: filter },
          {
            $group: {
              _id: { $hour: '$schedule.startTime' },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]),

        // Service analytics
        Appointment.aggregate([
          { $match: filter },
          {
            $group: {
              _id: '$service.name',
              count: { $sum: 1 },
              revenue: { $sum: '$service.price.amount' },
              avgDuration: { $avg: '$service.duration' }
            }
          },
          { $sort: { count: -1 } }
        ]),

        // Staff analytics
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
              revenue: { $sum: '$service.price.amount' }
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
              revenue: 1
            }
          }
        ]),

        // Completion rates by day of week
        Appointment.aggregate([
          { $match: filter },
          {
            $group: {
              _id: {
                dayOfWeek: { $dayOfWeek: '$schedule.date' },
                status: '$status'
              },
              count: { $sum: 1 }
            }
          }
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
              actualDuration: {
                $divide: [
                  { $subtract: ['$tracking.serviceCompletedAt', '$tracking.serviceStartedAt'] },
                  1000 * 60 // Convert to minutes
                ]
              },
              estimatedDuration: '$service.duration'
            }
          },
          {
            $group: {
              _id: '$serviceName',
              avgActualDuration: { $avg: '$actualDuration' },
              avgEstimatedDuration: { $avg: '$estimatedDuration' },
              count: { $sum: 1 }
            }
          }
        ])
      ]);

      res.json({
        success: true,
        data: {
          statusDistribution,
          dailyTrends,
          hourlyDistribution,
          serviceAnalytics,
          staffAnalytics,
          completionRates,
          averageServiceTime
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get financial analytics
  async getFinancialAnalytics(req, res, next) {
    try {
      const { businessId, dateFrom, dateTo } = req.query;
      const { role, businessId: userBusinessId } = req.user;

      // Build filter
      const filter = {};
      
      if (role === ROLES.SUPER_ADMIN && businessId) {
        filter.business = businessId;
      } else if (role !== ROLES.SUPER_ADMIN) {
        filter.business = userBusinessId;
      }

      if (dateFrom || dateTo) {
        filter.createdAt = {};
        if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
        if (dateTo) filter.createdAt.$lte = new Date(dateTo);
      }

      const [
        revenueOverview,
        paymentMethodDistribution,
        monthlyRevenue,
        invoiceStatusDistribution,
        topClients,
        averageInvoiceValue,
        cashFlowAnalysis
      ] = await Promise.all([
        // Revenue overview
        Invoice.aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: { $cond: [{ $eq: ['$payment.status', INVOICE_STATUS.PAID] }, '$totals.total', 0] } },
              pendingRevenue: { $sum: { $cond: [{ $eq: ['$payment.status', INVOICE_STATUS.SENT] }, '$totals.total', 0] } },
              overdueRevenue: { $sum: { $cond: [{ $eq: ['$payment.status', INVOICE_STATUS.OVERDUE] }, '$totals.total', 0] } },
              totalInvoices: { $sum: 1 },
              paidInvoices: { $sum: { $cond: [{ $eq: ['$payment.status', INVOICE_STATUS.PAID] }, 1, 0] } }
            }
          }
        ]),

        // Payment method distribution
        Invoice.aggregate([
          { $match: { ...filter, 'payment.status': INVOICE_STATUS.PAID } },
          {
            $group: {
              _id: '$payment.method',
              count: { $sum: 1 },
              amount: { $sum: '$totals.total' }
            }
          }
        ]),

        // Monthly revenue trend
        Invoice.aggregate([
          { $match: { ...filter, 'payment.status': INVOICE_STATUS.PAID } },
          {
            $group: {
              _id: {
                year: { $year: '$payment.paidAt' },
                month: { $month: '$payment.paidAt' }
              },
              revenue: { $sum: '$totals.total' },
              invoiceCount: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]),

        // Invoice status distribution
        Invoice.aggregate([
          { $match: filter },
          {
            $group: {
              _id: '$payment.status',
              count: { $sum: 1 },
              amount: { $sum: '$totals.total' }
            }
          }
        ]),

        // Top clients by revenue
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
              totalSpent: { $sum: '$totals.total' },
              invoiceCount: { $sum: 1 }
            }
          },
          { $sort: { totalSpent: -1 } },
          { $limit: 10 }
        ]),

        // Average invoice value
        Invoice.aggregate([
          { $match: filter },
          {
            $group: {
              _id: null,
              avgValue: { $avg: '$totals.total' },
              maxValue: { $max: '$totals.total' },
              minValue: { $min: '$totals.total' }
            }
          }
        ]),

        // Cash flow analysis (last 12 months)
        Invoice.aggregate([
          {
            $match: {
              ...filter,
              createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              invoiced: { $sum: '$totals.total' },
              paid: { $sum: { $cond: [{ $eq: ['$payment.status', INVOICE_STATUS.PAID] }, '$totals.total', 0] } },
              pending: { $sum: { $cond: [{ $eq: ['$payment.status', INVOICE_STATUS.SENT] }, '$totals.total', 0] } }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ])
      ]);

      res.json({
        success: true,
        data: {
          overview: revenueOverview[0] || {},
          paymentMethods: paymentMethodDistribution,
          monthlyTrends: monthlyRevenue,
          invoiceStatus: invoiceStatusDistribution,
          topClients,
          metrics: averageInvoiceValue[0] || {},
          cashFlow: cashFlowAnalysis
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // ===================================
  // HELPER METHODS
  // ===================================

  // Get system metrics
  async getSystemMetrics() {
    return {
      database: {
        connected: mongoose.connection.readyState === 1,
        collections: mongoose.connection.db ? Object.keys(mongoose.connection.db.collection).length : 0
      },
      server: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      }
    };
  }
}

module.exports = new DashboardController();