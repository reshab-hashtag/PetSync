const mongoose = require('mongoose');

const PetSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  profile: {
    name: { type: String, required: true, trim: true },
    species: { type: String, required: true }, // 'dog', 'cat', 'bird'
    breed: String,
    gender: { type: String, enum: ['male', 'female', 'unknown'] },
    color: String,
    birthDate: Date,
    weight: {
      value: Number,
      unit: { type: String, default: 'gram' },
      lastUpdated: Date
    },
    microchipId: String,
    photos: [String]
  },
  medical: {
    allergies: [String],
    medications: [{
      name: String,
      dosage: String,
      frequency: String,
      startDate: Date,
      endDate: Date
    }],
    conditions: [{
      name: String,
      diagnosis: String,
      diagnosedDate: Date,
      status: { type: String, enum: ['active', 'resolved', 'chronic'] }
    }],
    vaccinations: [{
      vaccine: String,
      administeredDate: Date,
      expirationDate: Date,
      veterinarian: String,
      batchNumber: String
    }],
    emergencyContact: {
      veterinarian: String,
      phone: String,
      clinic: String
    }
  },
  behavior: {
    temperament: [String], // 'friendly', 'aggressive', 'shy'
    specialInstructions: String,
    likes: [String],
    dislikes: [String]
  },
  documents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  notes: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Virtual for age calculation
PetSchema.virtual('age').get(function() {
  if (!this.profile.birthDate) return null;
  const now = new Date();
  const birth = new Date(this.profile.birthDate);
  const years = now.getFullYear() - birth.getFullYear();
  const months = now.getMonth() - birth.getMonth();
  return { years, months: months < 0 ? months + 12 : months };
});

// Indexes
PetSchema.index({ owner: 1 });
PetSchema.index({ 'profile.name': 'text' });

module.exports = mongoose.model('Pet', PetSchema);