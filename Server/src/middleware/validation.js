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

module.exports = {
  validateUserRegistration,
  validateUserLogin,
  validateBusiness,
  validateAppointment,
  validatePet,
  validateInvoice,
  validateMongoId,
  handleValidationErrors
};
