const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticate } = require('../middleware/auth');
const { authorize, checkBusinessAccess } = require('../middleware/rbac');
const { validateAppointment, validateMongoId } = require('../middleware/validation');

// Create appointment
router.post('/',
  authenticate,
  authorize(['appointments:write']),
  validateAppointment,
  appointmentController.createAppointment
);

// Get appointments
router.get('/',
  authenticate,
  authorize(['appointments:read']),
  appointmentController.getAppointments
);

// Get specific appointment
router.get('/:id',
  authenticate,
  authorize(['appointments:read']),
  validateMongoId('id'),
  appointmentController.getAppointment
);

// Update appointment
router.put('/:id',
  authenticate,
  authorize(['appointments:write']),
  validateMongoId('id'),
  appointmentController.updateAppointment
);

// Cancel appointment
router.post('/:id/cancel',
  authenticate,
  authorize(['appointments:write']),
  validateMongoId('id'),
  appointmentController.cancelAppointment
);

// Check-in appointment
router.post('/:id/checkin',
  authenticate,
  authorize(['appointments:write']),
  validateMongoId('id'),
  appointmentController.checkinAppointment
);

// Start service
router.post('/:id/start',
  authenticate,
  authorize(['appointments:write']),
  validateMongoId('id'),
  appointmentController.startService
);

// Complete service
router.post('/:id/complete',
  authenticate,
  authorize(['appointments:write']),
  validateMongoId('id'),
  appointmentController.completeService
);

// Get appointment statistics
router.get('/stats/overview',
  authenticate,
  authorize(['reports:read']),
  appointmentController.getStatistics
);

module.exports = router;