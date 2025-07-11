const { body, param, query, validationResult } = require('express-validator');
const { ROLES, APPOINTMENT_STATUS } = require('../config/constants');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserRegistration = [
  body('firstName').trim().isLength({ min: 2, max: 50 }).withMessage('First name must be 2-50 characters'),
  body('lastName').trim().isLength({ min: 2, max: 50 }).withMessage('Last name must be 2-50 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase, and number'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number required'),
  body('role').isIn(Object.values(ROLES)).withMessage('Valid role is required'),
  handleValidationErrors
];

const validateUserLogin = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

// Business validation rules
const validateBusiness = [
  body('profile.name').trim().isLength({ min: 2, max: 100 }).withMessage('Business name must be 2-100 characters'),
  body('profile.email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('profile.phone').isMobilePhone().withMessage('Valid phone number required'),
  body('profile.address.street').notEmpty().withMessage('Street address is required'),
  body('profile.address.city').notEmpty().withMessage('City is required'),
  body('profile.address.state').notEmpty().withMessage('State is required'),
  body('profile.address.zipCode').isPostalCode('US').withMessage('Valid ZIP code is required'),
  handleValidationErrors
];

// Appointment validation rules
const validateAppointment = [
  body('businessId').isMongoId().withMessage('Valid business ID is required'),
  body('clientId').isMongoId().withMessage('Valid client ID is required'),
  body('petId').isMongoId().withMessage('Valid pet ID is required'),
  body('serviceName').trim().isLength({ min: 2, max: 100 }).withMessage('Service name is required'),
  body('duration').isInt({ min: 15, max: 480 }).withMessage('Duration must be 15-480 minutes'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time required (HH:MM)'),
  handleValidationErrors
];

// Pet validation rules
const validatePet = [
  body('profile.name').trim().isLength({ min: 1, max: 50 }).withMessage('Pet name is required'),
  body('profile.species').trim().isLength({ min: 2, max: 30 }).withMessage('Species is required'),
  body('profile.breed').optional().trim().isLength({ max: 50 }).withMessage('Breed must be under 50 characters'),
  body('profile.gender').optional().isIn(['male', 'female', 'unknown']).withMessage('Valid gender required'),
  body('profile.birthDate').optional().isISO8601().withMessage('Valid birth date required'),
  handleValidationErrors
];

// Invoice validation rules
const validateInvoice = [
  body('businessId').isMongoId().withMessage('Valid business ID is required'),
  body('clientId').isMongoId().withMessage('Valid client ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.description').trim().isLength({ min: 1 }).withMessage('Item description is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be positive'),
  body('items.*.unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be positive'),
  handleValidationErrors
];

// ID parameter validation
const validateMongoId = (paramName) => [
  param(paramName).isMongoId().withMessage(`Valid ${paramName} is required`),
  handleValidationErrors
];



// OTP request validation
const validateOTPRequest = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// OTP verification validation
const validateOTPVerification = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('otp')
    .isLength({ min: 6, max: 6 })
    .withMessage('OTP must be 6 digits')
    .isNumeric()
    .withMessage('OTP must contain only numbers'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];



// Service creation validation
const validateServiceCreation = [
  body('name')
    .notEmpty()
    .withMessage('Service name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Service name must be between 2 and 100 characters')
    .trim(),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),

  body('category')
    .notEmpty()
    .withMessage('Service category is required')
    .isIn(['grooming', 'veterinary', 'boarding', 'training', 'daycare', 'other'])
    .withMessage('Invalid service category'),

  // Pricing validation
  body('pricing.basePrice')
    .notEmpty()
    .withMessage('Base price is required')
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),

  body('pricing.currency')
    .optional()
    .isIn(['INR', 'USD', 'EUR', 'GBP'])
    .withMessage('Invalid currency'),

  body('pricing.priceType')
    .optional()
    .isIn(['fixed', 'variable'])
    .withMessage('Price type must be either fixed or variable'),

  body('pricing.variations')
    .optional()
    .isArray()
    .withMessage('Price variations must be an array'),

  body('pricing.variations.*.name')
    .if(body('pricing.variations').exists())
    .notEmpty()
    .withMessage('Variation name is required')
    .isLength({ max: 50 })
    .withMessage('Variation name cannot exceed 50 characters'),

  body('pricing.variations.*.price')
    .if(body('pricing.variations').exists())
    .isFloat({ min: 0 })
    .withMessage('Variation price must be a positive number'),

  // Duration validation
  body('duration.estimated')
    .notEmpty()
    .withMessage('Estimated duration is required')
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 minutes and 8 hours'),

  body('duration.buffer')
    .optional()
    .isInt({ min: 0, max: 60 })
    .withMessage('Buffer time must be between 0 and 60 minutes'),

  // Requirements validation
  body('requirements.vaccinationRequired')
    .optional()
    .isBoolean()
    .withMessage('Vaccination required must be a boolean'),

  body('requirements.requiredVaccines')
    .optional()
    .isArray()
    .withMessage('Required vaccines must be an array'),

  body('requirements.ageRestrictions.minAge')
    .optional()
    .isInt({ min: 0, max: 300 })
    .withMessage('Minimum age must be between 0 and 300 months'),

  body('requirements.ageRestrictions.maxAge')
    .optional()
    .isInt({ min: 0, max: 300 })
    .withMessage('Maximum age must be between 0 and 300 months'),

  body('requirements.specialRequirements')
    .optional()
    .isArray()
    .withMessage('Special requirements must be an array'),

  // Staff validation
  body('staff')
    .optional()
    .isArray()
    .withMessage('Staff must be an array'),

  // body('staff.*.user')
  //   .if(body('staff').exists())
  //   .isMongoId()
  //   .withMessage('Staff user ID must be a valid MongoDB ObjectId'),

  // body('staff.*.skillLevel')
  //   .if(body('staff').exists())
  //   .isIn(['beginner', 'intermediate', 'expert'])
  //   .withMessage('Skill level must be beginner, intermediate, or expert'),

  // Middleware to check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Service update validation (similar but with optional fields)
const validateServiceUpdate = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Service name must be between 2 and 100 characters')
    .trim(),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
    .trim(),

  body('category')
    .optional()
    .isIn(['grooming', 'veterinary', 'boarding', 'training', 'daycare', 'other'])
    .withMessage('Invalid service category'),

  body('pricing.basePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Base price must be a positive number'),

  body('pricing.currency')
    .optional()
    .isIn(['INR', 'USD', 'EUR', 'GBP'])
    .withMessage('Invalid currency'),

  body('pricing.priceType')
    .optional()
    .isIn(['fixed', 'variable'])
    .withMessage('Price type must be either fixed or variable'),

  body('duration.estimated')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 minutes and 8 hours'),

  body('duration.buffer')
    .optional()
    .isInt({ min: 0, max: 60 })
    .withMessage('Buffer time must be between 0 and 60 minutes'),

  body('requirements.vaccinationRequired')
    .optional()
    .isBoolean()
    .withMessage('Vaccination required must be a boolean'),

  body('requirements.ageRestrictions.minAge')
    .optional()
    .isInt({ min: 0, max: 300 })
    .withMessage('Minimum age must be between 0 and 300 months'),

  body('requirements.ageRestrictions.maxAge')
    .optional()
    .isInt({ min: 0, max: 300 })
    .withMessage('Maximum age must be between 0 and 300 months'),

  body('staff.*.user')
    .if(body('staff').exists())
    .isMongoId()
    .withMessage('Staff user ID must be a valid MongoDB ObjectId'),

  body('staff.*.skillLevel')
    .if(body('staff').exists())
    .isIn(['beginner', 'intermediate', 'expert'])
    .withMessage('Skill level must be beginner, intermediate, or expert'),

  // Middleware to check validation results
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

// Status toggle validation
const validateStatusToggle = [
  body('isActive')
    .notEmpty()
    .withMessage('isActive field is required')
    .isBoolean()
    .withMessage('isActive must be a boolean'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  }
];

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateBusiness,
  validateAppointment,
  validatePet,
  validateInvoice,
  validateMongoId,
  handleValidationErrors,
  validateOTPRequest,
  validateOTPVerification,
  validateServiceCreation,
  validateServiceUpdate,
  validateStatusToggle
};
