// server/src/models/Inquiry.js
const mongoose = require('mongoose');

const inquirySchema = new mongoose.Schema({
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  customer: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  serviceInterest: {
    type: String,
    default: 'General Inquiry'
  },
  source: {
    type: String,
    enum: ['website', 'phone', 'email', 'social', 'referral', 'other'],
    default: 'website'
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'converted', 'closed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    note: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  followUpDate: Date,
  contactedAt: Date,
  closedAt: Date,
  metadata: {
    userAgent: String,
    ipAddress: String,
    referrer: String,
    utm: {
      source: String,
      medium: String,
      campaign: String
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
inquirySchema.index({ business: 1, status: 1 });
inquirySchema.index({ business: 1, createdAt: -1 });
inquirySchema.index({ 'customer.phone': 1 });
inquirySchema.index({ 'customer.email': 1 });
inquirySchema.index({ followUpDate: 1 });

// Virtual for inquiry age
inquirySchema.virtual('ageInDays').get(function() {
  return Math.floor((new Date() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Method to add a note
inquirySchema.methods.addNote = function(userId, noteText) {
  this.notes.push({
    user: userId,
    note: noteText,
    createdAt: new Date()
  });
  return this.save();
};

// Method to update status
inquirySchema.methods.updateStatus = function(status, userId) {
  this.status = status;
  
  if (status === 'contacted' && !this.contactedAt) {
    this.contactedAt = new Date();
  }
  
  if (status === 'closed' && !this.closedAt) {
    this.closedAt = new Date();
  }
  
  return this.save();
};

// Static method to get business inquiries with stats
inquirySchema.statics.getBusinessInquiries = function(businessId, options = {}) {
  const {
    status,
    limit = 10,
    skip = 0,
    sortBy = 'createdAt',
    sortOrder = -1
  } = options;
  
  const query = { business: businessId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('assignedTo', 'firstName lastName email')
    .sort({ [sortBy]: sortOrder })
    .limit(limit)
    .skip(skip);
};

// Static method to get inquiry stats
inquirySchema.statics.getInquiryStats = function(businessId, dateRange) {
  const matchQuery = { business: mongoose.Types.ObjectId(businessId) };
  
  if (dateRange) {
    matchQuery.createdAt = {
      $gte: new Date(dateRange.start),
      $lte: new Date(dateRange.end)
    };
  }
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avgResponseTime: {
          $avg: {
            $cond: {
              if: { $ne: ['$contactedAt', null] },
              then: { $subtract: ['$contactedAt', '$createdAt'] },
              else: null
            }
          }
        }
      }
    }
  ]);
};

module.exports = mongoose.model('Inquiry', inquirySchema);