const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { requireRole, checkBusinessAccess } = require('../middleware/rbac');
const { validateMongoId } = require('../middleware/validation');
const { ROLES } = require('../config/constants');

// ===================================
// DASHBOARD ROUTES
// ===================================
router.get('/dashboard', 
  authenticate, 
  requireRole([ROLES.SUPER_ADMIN, ROLES.BUSINESS_ADMIN]), 
  adminController.getDashboardOverview
);

// ===================================
// USER MANAGEMENT ROUTES
// ===================================
router.get('/users', 
  authenticate, 
  requireRole([ROLES.SUPER_ADMIN, ROLES.BUSINESS_ADMIN, ROLES.STAFF]), 
  adminController.getUsers
);

// Get single user by ID - ADD THIS ROUTE
router.get('/users/:id', 
  authenticate, 
  requireRole([ROLES.BUSINESS_ADMIN, ROLES.STAFF]), 
  validateMongoId('id'),
  adminController.getUser
);

router.post('/users', 
  authenticate, 
  requireRole([ROLES.BUSINESS_ADMIN]), 
  adminController.createUser
);


router.delete('/users/:id', 
  authenticate, 
  requireRole([ROLES.BUSINESS_ADMIN]), 
  validateMongoId('id'),
  adminController.deleteClient
);

router.put('/users/:id', 
  authenticate, 
  requireRole([ROLES.SUPER_ADMIN, ROLES.BUSINESS_ADMIN]), 
  validateMongoId('id'),
  adminController.updateUser
);

router.patch('/users/:id/status', 
  authenticate, 
  requireRole([ROLES.BUSINESS_ADMIN]), 
  validateMongoId('id'),
  adminController.toggleClientStatus
);

router.post('/users/:id/reset-password', 
  authenticate, 
  requireRole([ROLES.SUPER_ADMIN, ROLES.BUSINESS_ADMIN]), 
  validateMongoId('id'),
  adminController.resetUserPassword
);

router.post('/users/bulk-update', 
  authenticate, 
  requireRole([ROLES.SUPER_ADMIN, ROLES.BUSINESS_ADMIN]), 
  adminController.bulkUpdateUsers
);

// ===================================
// BUSINESS MANAGEMENT ROUTES
// ===================================
router.get('/businesses', 
  authenticate, 
  requireRole([ROLES.SUPER_ADMIN]), 
  adminController.getBusinesses
);

router.post('/businesses', 
  authenticate, 
  requireRole([ROLES.SUPER_ADMIN]), 
  adminController.createBusiness
);

// router.get('/businesses/:id', 
//   authenticate, 
//   requireRole([ROLES.SUPER_ADMIN, ROLES.BUSINESS_ADMIN]), 
//   validateMongoId('id'),
//   checkBusinessAccess,
//   adminController.getBusiness
// );

router.put('/businesses/:id', 
  authenticate, 
  requireRole([ROLES.SUPER_ADMIN, ROLES.BUSINESS_ADMIN]), 
  validateMongoId('id'),
  checkBusinessAccess,
  adminController.updateBusiness
);

router.patch('/businesses/:id/status', 
  authenticate, 
  requireRole([ROLES.SUPER_ADMIN]), 
  validateMongoId('id'),
  adminController.toggleBusinessStatus
);

// ===================================
// SYSTEM MANAGEMENT ROUTES
// ===================================
router.get('/system/stats', 
  authenticate, 
  requireRole([ROLES.SUPER_ADMIN]), 
  adminController.getSystemStats
);

router.get('/system/health', 
  authenticate, 
  requireRole([ROLES.SUPER_ADMIN]), 
  adminController.getSystemHealthCheck
);

router.get('/audit-logs', 
  authenticate, 
  requireRole([ROLES.SUPER_ADMIN, ROLES.BUSINESS_ADMIN]), 
  adminController.getAuditLogs
);

router.post('/maintenance', 
  authenticate, 
  requireRole([ROLES.SUPER_ADMIN]), 
  adminController.performMaintenance
);

// ===================================
// COMMUNICATION ROUTES
// ===================================
router.post('/notifications/bulk', 
  authenticate, 
  requireRole([ROLES.SUPER_ADMIN, ROLES.BUSINESS_ADMIN]), 
  adminController.sendBulkNotifications
);

module.exports = router;