const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  content: {
    text: String,
    type: { type: String, enum: ['text', 'image', 'file'], default: 'text' },
    fileUrl: String,
    fileName: String
  },
  
  status: {
    sent: { type: Boolean, default: true },
    delivered: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    readAt: Date
  },
  
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes
MessageSchema.index({ from: 1, to: 1, createdAt: -1 });
MessageSchema.index({ appointment: 1, createdAt: -1 });

module.exports = mongoose.model('Message', MessageSchema);