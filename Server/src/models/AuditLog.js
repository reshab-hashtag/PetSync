const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  business: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  
  action: { type: String, required: true }, // 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'
  resource: { type: String, required: true }, // 'appointment', 'user', 'invoice'
  resourceId: mongoose.Schema.Types.ObjectId,
  
  details: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed,
    changes: [String]
  },
  
  metadata: {
    ipAddress: String,
    userAgent: String,
    location: String
  },
  
  createdAt: { type: Date, default: Date.now }
});

// Indexes for performance
AuditLogSchema.index({ user: 1, createdAt: -1 });
AuditLogSchema.index({ business: 1, createdAt: -1 });
AuditLogSchema.index({ resource: 1, action: 1 });

module.exports = mongoose.model('AuditLog', AuditLogSchema);