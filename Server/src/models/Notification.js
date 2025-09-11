// Server/src/models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // User who will receive the notification
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Notification content
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },

  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },

  // Notification type
  type: {
    type: String,
    enum: [
      'appointment',  // Appointment related
      'payment',      // Payment related
      'system',       // System notifications
      'reminder',     // Reminders
      'warning',      // Warnings/alerts
      'info',         // General information
      'marketing'     // Marketing messages
    ],
    default: 'system',
    index: true
  },

  // Category for grouping notifications
  category: {
    type: String,
    enum: [
      'appointment_created',
      'appointment_updated',
      'appointment_cancelled',
      'appointment_reminder',
      'payment_received',
      'payment_failed',
      'payment_reminder', // Add this line
      'system_maintenance',
      'account_update',
      'staff_assignment',
      'business_update',
      'general'
    ],
    index: true
  },

  // Priority level
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
    index: true
  },

  // Read status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },

  readAt: {
    type: Date
  },

  // Action URL for clickable notifications
  actionUrl: {
    type: String,
    trim: true
  },

  // Additional data payload
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Who created this notification (for tracking)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Business context (if applicable)
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    index: true
  },

  // Related entity references
  relatedTo: {
    entityType: {
      type: String,
      enum: ['appointment', 'payment', 'pet', 'user', 'business', 'service']
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId
    }
  },

  // Delivery status
  delivery: {
    email: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      error: { type: String }
    },
    push: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      error: { type: String }
    },
    sms: {
      sent: { type: Boolean, default: false },
      sentAt: { type: Date },
      error: { type: String }
    }
  },

  // Expiration date for temporary notifications
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 }
  },

  // Metadata
  metadata: {
    source: { type: String }, // Where the notification came from
    version: { type: String, default: '1.0' },
    template: { type: String } // Template used for rendering
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes for better query performance
notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, isRead: 1 });
notificationSchema.index({ userId: 1, priority: 1, isRead: 1 });
notificationSchema.index({ businessId: 1, createdAt: -1 });

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const created = this.createdAt;
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return 'Today';
  if (diffDays === 2) return 'Yesterday';
  if (diffDays <= 7) return `${diffDays} days ago`;
  return created.toLocaleDateString();
});

// Static methods
notificationSchema.statics = {
  // Create notification for user
  async createForUser(userId, notificationData) {
    const notification = new this({
      userId,
      ...notificationData
    });
    return await notification.save();
  },

  // Create bulk notifications
  async createBulk(notifications) {
    return await this.insertMany(notifications);
  },

  // Get unread count for user
  async getUnreadCount(userId) {
    return await this.countDocuments({
      userId,
      isRead: false
    });
  },

  // Mark all as read for user
  async markAllAsRead(userId) {
    return await this.updateMany(
      { userId, isRead: false },
      { 
        isRead: true,
        readAt: new Date()
      }
    );
  },

  // Clean up old notifications
  async cleanup(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    return await this.deleteMany({
      createdAt: { $lt: cutoffDate },
      isRead: true
    });
  }
};

// Instance methods
notificationSchema.methods = {
  // Mark as read
  async markAsRead() {
    this.isRead = true;
    this.readAt = new Date();
    return await this.save();
  },

  // Check if notification is expired
  isExpired() {
    return this.expiresAt && new Date() > this.expiresAt;
  },

  // Get notification for API response
  toAPI() {
    return {
      id: this._id,
      title: this.title,
      message: this.message,
      type: this.type,
      category: this.category,
      priority: this.priority,
      isRead: this.isRead,
      readAt: this.readAt,
      actionUrl: this.actionUrl,
      data: this.data,
      timeAgo: this.timeAgo,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
};

// Pre-save middleware
notificationSchema.pre('save', function(next) {
  // Set businessId from user if not provided
  if (!this.businessId && this.populated('userId')) {
    this.businessId = this.userId.businessId;
  }
  next();
});

// Post-save middleware for real-time updates
notificationSchema.post('save', function(doc) {
  // TODO: Emit real-time notification via Socket.IO
  // const io = mongoose.connection.db.app?.get('io');
  // if (io) {
  //   io.to(`user_${doc.userId}`).emit('new_notification', doc.toAPI());
  // }
});

module.exports = mongoose.model('Notification', notificationSchema);