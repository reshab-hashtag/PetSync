// Server/src/controllers/notificationController.js
const Notification = require('../models/Notification');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const { ROLES } = require('../config/constants');

const notificationController = {
  // Get user notifications with filtering and pagination
  async getNotifications(req, res, next) {
  try {
    const userId = req.user.userId;
    const {
      type,
      isRead,
      category,
      limit = 20,
      offset = 0,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log('Fetching notifications for user:', userId); // Debug log

    // Build filter query
    const filter = { userId };
    
    if (type && type !== 'all') {
      filter.type = type;
    }
    
    if (isRead !== undefined) {
      filter.isRead = isRead === 'true';
    }
    
    if (category) {
      filter.category = category;
    }

    console.log('Filter being used:', filter); // Debug log

    // Get notifications with pagination
    const notifications = await Notification.find(filter)
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .lean();

    console.log(`Found ${notifications.length} notifications`); // Debug log
    console.log('First notification:', notifications[0]); // Debug log

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false
    });

    console.log('Unread count:', unreadCount); // Debug log

    // Get total count for pagination
    const totalCount = await Notification.countDocuments(filter);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notifications:', error); // Debug log
    next(error);
  }
},

  // Get unread notification count
  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.userId;
      
      const count = await Notification.countDocuments({
        userId,
        isRead: false
      });

      res.json({
        success: true,
        data: { count }
      });
    } catch (error) {
      next(error);
    }
  },

  // Get specific notification
  async getNotificationById(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const notification = await Notification.findOne({
        _id: id,
        userId
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      next(error);
    }
  },

  // Create notification (for admin/system use)
  async createNotification(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        userId,
        title,
        message,
        type = 'system',
        category,
        actionUrl,
        data: notificationData,
        priority = 'normal'
      } = req.body;

      // Check if user has permission to create notifications for others
      if (userId !== req.user.userId) {
        if (![ROLES.SUPER_ADMIN, ROLES.BUSINESS_ADMIN].includes(req.user.role)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied'
          });
        }

        // Business admin can only create notifications for users in their business
        if (req.user.role === ROLES.BUSINESS_ADMIN) {
          const targetUser = await User.findById(userId);
          if (!targetUser || targetUser.businessId?.toString() !== req.user.businessId?.toString()) {
            return res.status(403).json({
              success: false,
              message: 'Access denied'
            });
          }
        }
      }

      const notification = new Notification({
        userId: userId || req.user.userId,
        title,
        message,
        type,
        category,
        actionUrl,
        data: notificationData,
        priority,
        createdBy: req.user.userId
      });

      await notification.save();

      // TODO: Send real-time notification via Socket.IO
      // const io = req.app.get('io');
      // if (io) {
      //   io.to(`user_${notification.userId}`).emit('new_notification', notification);
      // }

      res.status(201).json({
        success: true,
        message: 'Notification created successfully',
        data: notification
      });
    } catch (error) {
      next(error);
    }
  },

  // Mark notification as read
  async markAsRead(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const notification = await Notification.findOneAndUpdate(
        { _id: id, userId },
        { 
          isRead: true,
          readAt: new Date()
        },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        message: 'Notification marked as read',
        data: notification
      });
    } catch (error) {
      next(error);
    }
  },

  // Mark all notifications as read
  async markAllAsRead(req, res, next) {
    try {
      const userId = req.user.userId;

      const result = await Notification.updateMany(
        { userId, isRead: false },
        { 
          isRead: true,
          readAt: new Date()
        }
      );

      res.json({
        success: true,
        message: `Marked ${result.modifiedCount} notifications as read`,
        data: { modifiedCount: result.modifiedCount }
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete specific notification
  async deleteNotification(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const notification = await Notification.findOneAndDelete({
        _id: id,
        userId
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  },

  // Clear all notifications
  async clearAllNotifications(req, res, next) {
    try {
      const userId = req.user.userId;

      const result = await Notification.deleteMany({ userId });

      res.json({
        success: true,
        message: `Deleted ${result.deletedCount} notifications`,
        data: { deletedCount: result.deletedCount }
      });
    } catch (error) {
      next(error);
    }
  },

  // Update notification preferences
  async updateNotificationPreferences(req, res, next) {
    try {
      const userId = req.user.userId;
      const { preferences } = req.body;

      const user = await User.findByIdAndUpdate(
        userId,
        { 
          'profile.notificationPreferences': preferences
        },
        { new: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'Notification preferences updated',
        data: user.profile.notificationPreferences
      });
    } catch (error) {
      next(error);
    }
  },

  // Get notification preferences
  async getNotificationPreferences(req, res, next) {
    try {
      const userId = req.user.userId;

      const user = await User.findById(userId).select('profile.notificationPreferences');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const defaultPreferences = {
        email: {
          appointments: true,
          reminders: true,
          system: true,
          marketing: false
        },
        push: {
          appointments: true,
          reminders: true,
          system: true,
          marketing: false
        },
        sms: {
          appointments: false,
          reminders: true,
          system: false,
          marketing: false
        }
      };

      res.json({
        success: true,
        data: user.profile?.notificationPreferences || defaultPreferences
      });
    } catch (error) {
      next(error);
    }
  },






  async sendBulkNotification(req, res, next) {
    try {
      const {
        title,
        message,
        type = 'system',
        category = 'general',
        priority = 'normal',
        targetType, // 'specific', 'role', 'business', 'all'
        targetUsers = [],
        targetRole,
        targetBusiness,
        actionUrl,
        scheduledFor,
        expiresAt
      } = req.body;

      console.log('Received bulk notification request:', req.body); // Debug log

      // Validation
      if (!title?.trim() || !message?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Title and message are required'
        });
      }

      // Permission checks
      const userRole = req.user.role;
      const userBusinessId = req.user.businessId;

      // Super admin can send to anyone
      // Business admin can only send to users in their business
      if (userRole !== ROLES.SUPER_ADMIN && userRole !== ROLES.BUSINESS_ADMIN) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only admins can send bulk notifications.'
        });
      }

      let recipientIds = [];

      // Determine recipients based on target type
      switch (targetType) {
        case 'specific':
          if (!targetUsers || targetUsers.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'No users selected for specific targeting'
            });
          }

          // Filter out null/undefined values
          const validTargetUsers = targetUsers.filter(id => id && id !== 'null');
          
          if (validTargetUsers.length === 0) {
            return res.status(400).json({
              success: false,
              message: 'No valid users selected'
            });
          }

          // For business admin, ensure all target users belong to their business
          if (userRole === ROLES.BUSINESS_ADMIN) {
            const usersInBusiness = await User.find({
              _id: { $in: validTargetUsers },
              businessId: userBusinessId
            }).select('_id');

            recipientIds = usersInBusiness.map(u => u._id.toString());

            if (recipientIds.length !== validTargetUsers.length) {
              return res.status(403).json({
                success: false,
                message: 'You can only send notifications to users in your business'
              });
            }
          } else {
            // Super admin can send to any users
            const validUsers = await User.find({
              _id: { $in: validTargetUsers }
            }).select('_id');
            
            recipientIds = validUsers.map(u => u._id.toString());
          }
          break;

        case 'role':
          if (!targetRole) {
            return res.status(400).json({
              success: false,
              message: 'Target role is required'
            });
          }

          const roleFilter = { role: targetRole };
          
          // Business admin can only target users in their business
          if (userRole === ROLES.BUSINESS_ADMIN) {
            roleFilter.businessId = userBusinessId;
          }

          const usersByRole = await User.find(roleFilter).select('_id');
          recipientIds = usersByRole.map(u => u._id.toString());
          break;

        case 'business':
          // Only super admin can target entire businesses
          if (userRole !== ROLES.SUPER_ADMIN) {
            return res.status(403).json({
              success: false,
              message: 'Only super admins can send notifications to entire businesses'
            });
          }

          if (!targetBusiness) {
            return res.status(400).json({
              success: false,
              message: 'Target business is required'
            });
          }

          const businessUsers = await User.find({ businessId: targetBusiness }).select('_id');
          recipientIds = businessUsers.map(u => u._id.toString());
          break;

        case 'all':
          // Only super admin can target all users
          if (userRole !== ROLES.SUPER_ADMIN) {
            return res.status(403).json({
              success: false,
              message: 'Only super admins can send notifications to all users'
            });
          }

          const allUsers = await User.find({}).select('_id');
          recipientIds = allUsers.map(u => u._id.toString());
          break;

        default:
          return res.status(400).json({
            success: false,
            message: 'Invalid target type'
          });
      }

      if (recipientIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No recipients found for the specified criteria'
        });
      }

      // Prepare notification data
      const notificationData = {
        title: title.trim(),
        message: message.trim(),
        type,
        category,
        priority,
        actionUrl: actionUrl?.trim() || undefined,
        businessId: userRole === ROLES.BUSINESS_ADMIN ? userBusinessId : targetBusiness,
        createdBy: req.user.userId,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      };

      // Handle scheduling (future enhancement)
      if (scheduledFor) {
        const scheduleDate = new Date(scheduledFor);
        if (scheduleDate <= new Date()) {
          return res.status(400).json({
            success: false,
            message: 'Scheduled time must be in the future'
          });
        }
        // For now, we'll send immediately. In production, you'd use a job queue
        notificationData.scheduledFor = scheduleDate;
      }

      // Create notifications for all recipients
      const notifications = recipientIds.map(userId => ({
        ...notificationData,
        userId
      }));

      console.log(`Creating ${notifications.length} notifications`); // Debug log

      const createdNotifications = await Notification.insertMany(notifications);

      // Log the bulk notification activity
      console.log(`Admin ${req.user.userId} sent ${createdNotifications.length} notifications`);

      res.json({
        success: true,
        message: `Notification sent successfully to ${createdNotifications.length} users`,
        data: {
          recipientCount: createdNotifications.length,
          notificationIds: createdNotifications.map(n => n._id)
        }
      });

    } catch (error) {
      console.error('Error sending bulk notification:', error);
      next(error);
    }
  }
};

module.exports = notificationController;