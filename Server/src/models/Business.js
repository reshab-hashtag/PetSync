// Server/src/models/Business.js (Updated)
const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  profile: {
    name: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    description: String,
    logo: String,
    website: String,
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    // Add category reference to BusinessCategory model
    category: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'BusinessCategory',
      required: true
    },
    // Keep legacy category field for backward compatibility
    legacyCategory: String, // 'grooming', 'veterinary', 'boarding', etc.
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, default: 'IND' }
    }
  },
  // services: [{
  //   name: { type: String, required: true },
  //   description: String,
  //   duration: Number, // in minutes
  //   price: {
  //     amount: Number,
  //     currency: { type: String, default: 'INR' }
  //   },
  //   category: String, // Service category, different from business category
  //   isActive: { type: Boolean, default: true }
  // }],

  services: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Service' // Reference to your existing Service model
}],
  schedule: {
    timezone: { type: String, default: 'GMT+5:30' },
    workingHours: {
      monday: { isOpen: { type: Boolean, default: true }, open: String, close: String },
      tuesday: { isOpen: { type: Boolean, default: true }, open: String, close: String },
      wednesday: { isOpen: { type: Boolean, default: true }, open: String, close: String },
      thursday: { isOpen: { type: Boolean, default: true }, open: String, close: String },
      friday: { isOpen: { type: Boolean, default: true }, open: String, close: String },
      saturday: { isOpen: { type: Boolean, default: true }, open: String, close: String },
      sunday: { isOpen: { type: Boolean, default: false }, open: String, close: String }
    },
    breaks: [{
      day: String,
      start: String,
      end: String
    }],
    holidays: [{
      date: Date,
      name: String,
      isRecurring: Boolean
    }]
  },
  staff: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  settings: {
    appointmentBookingWindow: { type: Number, default: 30 }, // days in advance
    cancellationPolicy: {
      hoursRequired: { type: Number, default: 24 },
      feePercentage: { type: Number, default: 0 }
    },
    autoReminders: {
      email: { enabled: { type: Boolean, default: true }, hoursBefore: { type: Number, default: 24 } },
      sms: { enabled: { type: Boolean, default: false }, hoursBefore: { type: Number, default: 2 } }
    },
    paymentMethods: {
      cash: { type: Boolean, default: true },
      card: { type: Boolean, default: true },
      online: { type: Boolean, default: true }
    }
  },
  subscription: {
    plan: { type: String, enum: ['free', 'basic', 'premium'], default: 'free' },
    status: { type: String, enum: ['active', 'cancelled', 'suspended'], default: 'active' },
    expiresAt: Date,
    stripeCustomerId: String
  },
  metrics: {
    totalAppointments: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalClients: { type: Number, default: 0 }
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
BusinessSchema.index({ 'profile.email': 1 });
BusinessSchema.index({ 'profile.name': 'text', 'profile.description': 'text' });
BusinessSchema.index({ 'profile.category': 1 });

// Populate category when querying businesses
BusinessSchema.pre(['find', 'findOne', 'findOneAndUpdate'], function() {
  this.populate('profile.category', 'name slug color icon description');
});



// Also add this method to your Business schema for easy population:
BusinessSchema.methods.populateServices = function() {
  return this.populate({
    path: 'services',
    select: 'name description duration price category isActive',
    match: { isActive: true }, // Only get active services
    options: { sort: { name: 1 } }
  });
};

// And this static method for getting businesses with services:
BusinessSchema.statics.findWithServices = function(query = {}) {
  return this.find(query)
    .populate('profile.category', 'name slug color icon')
    .populate({
      path: 'services',
      select: 'name description duration price category isActive',
      match: { isActive: true },
      options: { sort: { name: 1 } }
    });
};

module.exports = mongoose.model('Business', BusinessSchema);