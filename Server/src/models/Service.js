const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  name: { type: String, required: true, trim: true },
  description: String,
  category: { type: String, required: true }, // 'grooming', 'veterinary', 'boarding'
  
  pricing: {
    basePrice: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    priceType: { type: String, enum: ['fixed', 'variable'], default: 'fixed' },
    variations: [{
      name: String, // 'Small Dog', 'Large Dog'
      price: Number,
      conditions: String
    }]
  },
  
  duration: {
    estimated: { type: Number, required: true }, // minutes
    buffer: { type: Number, default: 15 } // buffer time between appointments
  },
  
  requirements: {
    vaccinationRequired: { type: Boolean, default: false },
    requiredVaccines: [String],
    ageRestrictions: {
      minAge: Number, // in months
      maxAge: Number
    },
    specialRequirements: [String]
  },
  
 staff: [{
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedAt: Date,
}],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
ServiceSchema.index({ business: 1, isActive: 1 });
ServiceSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Service', ServiceSchema);