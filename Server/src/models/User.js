const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../config/constants');

const UserSchema = new mongoose.Schema({
  role: { 
    type: String, 
    enum: Object.values(ROLES), 
    required: true 
  },
  designation: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'Designation',
  // Only required for staff members, not for business admins or super admins
  required: function() {
    return this.role === 'STAFF';
  }
},
  business: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Business' }],
  profile: {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phone: { type: String, trim: true },
    createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index: true
    },
    avatar: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: 'India' }
    }
  },
  auth: {
    passwordHash: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    twoFactorEnabled: { type: Boolean, default: false },
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date
  },
  permissions: [{
    module: String,
    actions: [String]
  }],
  settings: {
    timezone: { type: String, default: 'GMT+5:30' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    language: { type: String, default: 'en' }
  },
  // For pet owners
  pets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pet' }],
  
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;

    // Guard clause to prevent crash
    if (ret.profile && ret.profile.firstName && ret.profile.lastName) {
      ret.fullName = `${ret.profile.firstName} ${ret.profile.lastName}`;
    } else {
      ret.fullName = '';
    }

    return ret;
  }
},
  toObject: { virtuals: true }
});

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Indexes
UserSchema.index({ 'profile.email': 1 });
UserSchema.index({ business: 1, role: 1 });

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('auth.passwordHash')) return next();
  this.auth.passwordHash = await bcrypt.hash(this.auth.passwordHash, 12);
  next();
});

// Method to check password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.auth.passwordHash);
};

// Method to check if user has permission
UserSchema.methods.hasPermission = function(permission) {
  if (this.role === ROLES.SUPER_ADMIN) return true;
  
  const [module, action] = permission.split(':');
  const userPermission = this.permissions.find(p => p.module === module);
  return userPermission && userPermission.actions.includes(action);
};



UserSchema.methods.hasPermission = async function(permission) {
  // Super admin has all permissions
  if (this.role === ROLES.SUPER_ADMIN) return true;
  
  // Business admin has all permissions within their business
  if (this.role === ROLES.BUSINESS_ADMIN) return true;
  
  // For staff, check designation permissions first, then individual permissions
  if (this.role === ROLES.STAFF) {
    // If user has a designation, check designation permissions
    if (this.designation) {
      // Populate designation if not already populated
      if (typeof this.designation === 'string' || this.designation instanceof mongoose.Types.ObjectId) {
        await this.populate('designation');
      }
      
      if (this.designation && this.designation.permissions) {
        const [module, action] = permission.split(':');
        const designationPermission = this.designation.permissions.find(p => p.module === module);
        if (designationPermission && designationPermission.actions.includes(action)) {
          return true;
        }
      }
    }
    
    // Fallback to individual permissions
    const [module, action] = permission.split(':');
    const userPermission = this.permissions.find(p => p.module === module);
    return userPermission && userPermission.actions.includes(action);
  }
  
  return false;
};


module.exports = mongoose.model('User', UserSchema);