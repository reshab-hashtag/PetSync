// Server/src/routes/staff.js
const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validateMongoId } = require('../middleware/validation');
const { body } = require('express-validator');
const { ROLES } = require('../config/constants');

// Validation middleware for staff creation
const validateStaffCreation = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('role')
    .optional()
    .isIn([ROLES.STAFF, ROLES.BUSINESS_ADMIN])
    .withMessage('Invalid role specified'),
  body('specializations')
    .optional()
    .isArray()
    .withMessage('Specializations must be an array'),
  body('permissions')
    .optional()
    .isObject()
    .withMessage('Permissions must be an object'),
  body('schedule')
    .optional()
    .isObject()
    .withMessage('Schedule must be an object'),
  body('emergencyContact')
    .optional()
    .isObject()
    .withMessage('Emergency contact must be an object')
];

// Validation middleware for staff updates
const validateStaffUpdate = [
  body('profile.firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('profile.lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('profile.phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('specializations')
    .optional()
    .isArray()
    .withMessage('Specializations must be an array'),
  body('permissions')
    .optional()
    .isObject()
    .withMessage('Permissions must be an object'),
  body('schedule')
    .optional()
    .isObject()
    .withMessage('Schedule must be an object'),
  body('emergencyContact')
    .optional()
    .isObject()
    .withMessage('Emergency contact must be an object')
];

// ===================================
// STAFF MANAGEMENT ROUTES
// ===================================

// Get all staff members with enhanced details (e.g., businesses, roles)
router.get('/enhanced', 
  authenticate,
  staffController.getAllStaffMembersEnhanced
);

// Alternative endpoint for staff with businesses
router.get('/with-businesses', 
  authenticate,
  staffController.getAllStaffWithBusinesses
);

// Get all staff members in a business
router.get('/:businessId', 
  authenticate, 
  requireRole([ROLES.BUSINESS_ADMIN]), 
  staffController.getStaffMembers
);

// Get all staff members across all businesses
router.get('/', 
  authenticate, 
  requireRole([ROLES.BUSINESS_ADMIN]), 
  staffController.getAllStaffMembers
);



// Get staff statistics
router.get('/stats', 
  authenticate, 
  requireRole([ROLES.BUSINESS_ADMIN]), 
  staffController.getStaffStats
);

// Get single staff member
router.get('/:id', 
  authenticate, 
  requireRole([ROLES.BUSINESS_ADMIN]), 
  validateMongoId('id'),
  staffController.getStaffMember
);

// Create new staff member
router.post('/', 
  authenticate, 
  requireRole([ROLES.BUSINESS_ADMIN]),
  validateStaffCreation,
  staffController.createStaffMember
);

// Update staff member
router.put('/:id', 
  authenticate, 
  requireRole([ROLES.BUSINESS_ADMIN]), 
  validateMongoId('id'),
  validateStaffUpdate,
  staffController.updateStaffMember
);

// Toggle staff status (activate/deactivate)
router.patch('/:id/status', 
  authenticate, 
  requireRole([ROLES.BUSINESS_ADMIN]), 
  validateMongoId('id'),
  body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  staffController.toggleStaffStatus
);

// Reset staff password
router.post('/:id/reset-password', 
  authenticate, 
  requireRole([ROLES.BUSINESS_ADMIN]), 
  validateMongoId('id'),
  staffController.resetStaffPassword
);

// Delete staff member (soft delete)
router.delete('/:id', 
  authenticate, 
  requireRole([ROLES.BUSINESS_ADMIN]), 
  validateMongoId('id'),
  staffController.deleteStaffMember
);

module.exports = router;