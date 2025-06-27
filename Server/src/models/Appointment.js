const mongoose = require('mongoose');
const { APPOINTMENT_STATUS } = require('../config/constants');

const AppointmentSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
  
  service: {
    id: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true },
    duration: { type: Number, required: true }, // minutes
    price: {
      amount: { type: Number, required: true },
      currency: { type: String, default: 'INR' }
    }
  },
  
  schedule: {
    date: { type: Date, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    timezone: String
  },
  
  staff: {
    assigned: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedAt: Date
  },
  
  status: { 
    type: String, 
    enum: Object.values(APPOINTMENT_STATUS), 
    default: APPOINTMENT_STATUS.SCHEDULED 
  },
  
  details: {
    notes: String,
    specialRequests: String,
    dropOffInstructions: String,
    pickUpInstructions: String
  },
  
  communication: {
    remindersSent: [{
      type: { type: String, enum: ['email', 'sms'] },
      sentAt: Date,
      status: String
    }],
    confirmationSent: {
      sentAt: Date,
      confirmedAt: Date
    }
  },
  
  tracking: {
    checkedInAt: Date,
    serviceStartedAt: Date,
    serviceCompletedAt: Date,
    checkedOutAt: Date,
    photos: [String] // before/after photos
  },
  
  billing: {
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
    additionalCharges: [{
      description: String,
      amount: Number
    }],
    discounts: [{
      description: String,
      amount: Number,
      type: { type: String, enum: ['fixed', 'percentage'] }
    }]
  },
  
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    review: String,
    submittedAt: Date
  },
  
  cancellation: {
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    cancelledAt: Date,
    reason: String,
    refundAmount: Number
  },
  
  recurrence: {
    isRecurring: { type: Boolean, default: false },
    frequency: { type: String, enum: ['weekly', 'monthly', 'quarterly'] },
    endDate: Date,
    parentAppointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }
  },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for performance
AppointmentSchema.index({ business: 1, 'schedule.date': 1 });
AppointmentSchema.index({ client: 1, status: 1 });
AppointmentSchema.index({ 'staff.assigned': 1, 'schedule.date': 1 });
AppointmentSchema.index({ 'schedule.startTime': 1, 'schedule.endTime': 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);