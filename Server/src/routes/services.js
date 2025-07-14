// Server/src/routes/services.js
const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validateMongoId } = require('../middleware/validation');
const { validateServiceCreation, validateServiceUpdate, validateStatusToggle } = require('../middleware/validation');
const { ROLES } = require('../config/constants');

// ===================================
// SERVICE MANAGEMENT ROUTES
// ===================================

// Get all services
router.get('/',
  authenticate,
  requireRole([ROLES.BUSINESS_ADMIN, ROLES.STAFF, ROLES.SUPER_ADMIN, ROLES.CLIENT]),
  serviceController.getServices
);

// Get service categories
router.get('/categories',
  authenticate,
  requireRole([ROLES.BUSINESS_ADMIN, ROLES.STAFF, ROLES.SUPER_ADMIN]),
  serviceController.getServiceCategories
);

// Get service statistics
router.get('/stats',
  authenticate,
  requireRole([ROLES.BUSINESS_ADMIN, ROLES.SUPER_ADMIN]),
  serviceController.getServiceStats
);

// Get specific service
router.get('/:id',
  authenticate,
  validateMongoId('id'),
  requireRole([ROLES.BUSINESS_ADMIN, ROLES.STAFF, ROLES.SUPER_ADMIN]),
  serviceController.getService
);

// Create new service
router.post('/',
  authenticate,
  requireRole([ROLES.BUSINESS_ADMIN, ROLES.SUPER_ADMIN]),
  validateServiceCreation,
  serviceController.createService
);

// Update service
router.put('/:id',
  authenticate,
  validateMongoId('id'),
  requireRole([ROLES.BUSINESS_ADMIN, ROLES.SUPER_ADMIN]),
  validateServiceUpdate,
  serviceController.updateService
);

// Toggle service status
router.patch('/:id/status',
  authenticate,
  validateMongoId('id'),
  requireRole([ROLES.BUSINESS_ADMIN, ROLES.SUPER_ADMIN]),
  validateStatusToggle,
  serviceController.toggleServiceStatus
);

// Delete service
router.delete('/:id',
  authenticate,
  validateMongoId('id'),
  requireRole([ROLES.BUSINESS_ADMIN, ROLES.SUPER_ADMIN]),
  serviceController.deleteService
);

module.exports = router;