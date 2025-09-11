const mongoose = require('mongoose');

const DesignationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  business: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true
  },
  permissions: [{
    module: {
      type: String,
      required: true
    },
    actions: [{
      type: String,
      required: true
    }]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes
DesignationSchema.index({ business: 1, name: 1 }, { unique: true });
DesignationSchema.index({ business: 1, isActive: 1 });

module.exports = mongoose.model('Designation', DesignationSchema);