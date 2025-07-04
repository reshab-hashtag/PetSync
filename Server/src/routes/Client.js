// Server/src/routes/clients.js
const express = require('express');
const router = express.Router();
const clientController = require('../controllers/ClientController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validateMongoId } = require('../middleware/validation');
const { ROLES } = require('../config/constants');

// Get all clients
router.get('/',
  authenticate,
  requireRole([ ROLES.BUSINESS_ADMIN, ROLES.STAFF]),
  clientController.getClients
);

// Get specific client
router.get('/:id',
  authenticate,
  validateMongoId('id'),
  clientController.getClient
);

// Create new client
router.post('/',
  authenticate,
  requireRole([ROLES.BUSINESS_ADMIN]),
  clientController.createClient
);

// Update client
router.put('/:id',
  authenticate,
  validateMongoId('id'),
  clientController.updateClient
);

// Delete client
router.delete('/:id',
  authenticate,
  requireRole([ ROLES.BUSINESS_ADMIN]),
  validateMongoId('id'),
  clientController.deleteClient
);

// Toggle client status
router.patch('/:id/status',
  authenticate,
  requireRole([ ROLES.BUSINESS_ADMIN]),
  validateMongoId('id'),
  clientController.toggleClientStatus
);

module.exports = router;