const mongoose = require('mongoose');

const BusinessSchema = new mongoose.Schema({
  profile: {
    name: { type: String, required: true, trim: true },
    description: String,
    logo: String,
    website: String,
    email: { type: String, required: true, lowercase: true },
    phone: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, default: 'IND' }
    }
  },
  services: [{
    name: { type: String, required: true },
    description: String,
    duration: Number, // in minutes
    price: {
      amount: Number,
      currency: { type: String, default: 'INR' }
    },
    category: String, // 'grooming', 'veterinary', 'boarding'
    isActive: { type: Boolean, default: true }
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

module.exports = mongoose.model('Business', BusinessSchema);
