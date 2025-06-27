const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const { authorize, requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/constants');

// ===================================
// MAIN DASHBOARD ROUTES
// ===================================

// Get main dashboard overview (role-specific)
router.get('/overview', 
  authenticate, 
  dashboardController.getDashboardOverview
);

// Get quick stats
router.get('/stats', 
  authenticate, 
  dashboardController.getQuickStats
);

// Get recent activity
router.get('/activity', 
  authenticate, 
  dashboardController.getRecentActivity
);

// ===================================
// ANALYTICS ROUTES
// ===================================

// Get appointment analytics
router.get('/analytics/appointments', 
  authenticate, 
  requireRole([ROLES.SUPER_ADMIN, ROLES.BUSINESS_ADMIN, ROLES.STAFF]), 
  dashboardController.getAppointmentAnalytics
);

// Get financial analytics
router.get('/analytics/financial', 
  authenticate, 
  requireRole([ROLES.SUPER_ADMIN, ROLES.BUSINESS_ADMIN]), 
  dashboardController.getFinancialAnalytics
);

module.exports = router;