// Server/src/models/BusinessCategory.js
const mongoose = require('mongoose');

const BusinessCategorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true,
    unique: true 
  },
  slug: { 
    type: String, 
    // required: true, 
    unique: true,
    lowercase: true 
  },
  description: { 
    type: String, 
    trim: true 
  },
  icon: { 
    type: String, 
    default: 'BuildingOfficeIcon' 
  },
  color: { 
    type: String, 
    default: '#3B82F6' 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  displayOrder: { 
    type: Number, 
    default: 0 
  },
  metadata: {
    tags: [String],
    allowCustomServices: { 
      type: Boolean, 
      default: true 
    },
    requiresSpecialLicense: { 
      type: Boolean, 
      default: false 
    }
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
  timestamps: true
});

// Create slug from name before saving
BusinessCategorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }
  next();
});

// Indexes
BusinessCategorySchema.index({ name: 1 });
BusinessCategorySchema.index({ slug: 1 });
BusinessCategorySchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('BusinessCategory', BusinessCategorySchema);