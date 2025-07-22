const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validateAppointment, validateMongoId } = require('../middleware/validation');
const { ROLES } = require('../config/constants');

// Create appointment
router.post('/',
  authenticate,
  // authorize(['appointments:write']),
  validateAppointment,
  appointmentController.createAppointment
);

// Get appointments
router.get('/',
  authenticate,
  // authorize(['appointments:read']),
  appointmentController.getAppointments
);

// Get specific appointment
router.get('/:id',
  authenticate,
  // authorize(['appointments:read']),
  validateMongoId('id'),
  appointmentController.getAppointment
);

// Update appointment
router.put('/:id',
  authenticate,
  // authorize(['appointments:write']),
  validateMongoId('id'),
  appointmentController.updateAppointment
);

// Cancel appointment
router.post('/:id/cancel',
  authenticate,
  // authorize(['appointments:write']),
  validateMongoId('id'),
  appointmentController.cancelAppointment
);

// Check-in appointment
router.post('/:id/checkin',
  authenticate,
  // authorize(['appointments:write']),
  validateMongoId('id'),
  appointmentController.checkinAppointment
);

// Start service
router.post('/:id/start',
  authenticate,
  // authorize(['appointments:write']),
  validateMongoId('id'),
  appointmentController.startService
);

// Complete service
router.post('/:id/complete',
  authenticate,
  // authorize(['appointments:write']),
  validateMongoId('id'),
  appointmentController.completeService
);

// Get appointment statistics
router.get('/stats/overview',
  authenticate,
  // authorize(['reports:read']),
  appointmentController.getStatistics
);


// Staff assignment routes
router.put('/:id/assign-staff', 
  authenticate,
  requireRole([ ROLES.BUSINESS_ADMIN]),
  appointmentController.assignStaffToAppointment
);

router.put('/:id/unassign-staff', 
  authenticate,
 requireRole([ ROLES.BUSINESS_ADMIN]),
  appointmentController.unassignStaffFromAppointment
);

router.put('/:id/reassign-staff', 
  authenticate,
 requireRole([ ROLES.BUSINESS_ADMIN]),
  appointmentController.assignStaffToAppointment // Can reuse the same method
);

router.get('/:id/available-staff', 
  authenticate,
 requireRole([ ROLES.BUSINESS_ADMIN]),
  appointmentController.getAvailableStaffForAppointment
);


module.exports = router;