const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet' },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  
  name: { type: String, required: true },
  description: String,
  type: { 
    type: String, 
    enum: ['vaccination_record', 'medical_report', 'photo', 'consent_form', 'invoice', 'other'],
    required: true 
  },
  
  file: {
    originalName: String,
    filename: String,
    path: String,
    size: Number,
    mimeType: String,
    url: String
  },
  
  metadata: {
    tags: [String],
    isPublic: { type: Boolean, default: false },
    expirationDate: Date
  },
  
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
DocumentSchema.index({ owner: 1, type: 1 });
DocumentSchema.index({ business: 1, createdAt: -1 });
DocumentSchema.index({ pet: 1 });

module.exports = mongoose.model('Document', DocumentSchema);