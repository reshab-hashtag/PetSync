const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  type: { 
    type: String, 
    enum: ['vaccination', 'checkup', 'surgery', 'grooming', 'treatment', 'emergency', 'other'],
    required: true 
  },
  veterinarian: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  description: { type: String, required: true },
  diagnosis: String,
  treatment: String,
  medications: [String],
  followUpDate: Date,
  cost: {
    amount: Number,
    currency: { type: String, default: 'USD' }
  },
  attachments: [String], // File URLs
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const petSchema = new mongoose.Schema({
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  profile: {
    name: { type: String, required: true, trim: true },
    species: { 
      type: String, 
      required: true,
      enum: ['dog', 'cat', 'bird', 'rabbit', 'hamster', 'guinea pig', 'fish', 'reptile', 'other'],
      lowercase: true
    },
    breed: { type: String, required: true, trim: true },
    gender: { 
      type: String, 
      required: true,
      enum: ['male', 'female'],
      lowercase: true
    },
    dateOfBirth: Date,
    weight: { type: Number, min: 0 }, // in pounds
    color: { type: String, trim: true },
    microchipId: { type: String, unique: true, sparse: true },
    photos: [String], // URLs to pet photos
    notes: String
  },

  medicalHistory: {
    allergies: [String],
    medications: [String],
    conditions: [String],
    vaccinations: [{
      vaccine: String,
      date: Date,
      nextDueDate: Date,
      veterinarian: String,
      batchNumber: String
    }],
    records: [medicalRecordSchema]
  },

  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },

  status: {
    type: String,
    enum: ['active', 'inactive', 'deceased'],
    default: 'active'
  },

  preferences: {
    foodBrand: String,
    specialDiet: String,
    exerciseNeeds: String,
    behaviorNotes: String,
    groomingPreferences: String
  },

  // Quick access stats
  lastVisit: Date,
  nextAppointment: Date,
  totalVisits: { type: Number, default: 0 },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for performance
petSchema.index({ business: 1, 'profile.name': 1 });
petSchema.index({ owner: 1, status: 1 });
petSchema.index({ 'profile.species': 1, status: 1 });
petSchema.index({ 'profile.microchipId': 1 }, { sparse: true });

// Virtual for age calculation
petSchema.virtual('age').get(function() {
  if (!this.profile.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.profile.dateOfBirth);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1;
  }
  return age;
});

// Ensure virtuals are included in JSON output
petSchema.set('toJSON', { virtuals: true });
petSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Pet', petSchema);