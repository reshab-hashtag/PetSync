const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { validatePet, validateMongoId } = require('../middleware/validation');

// Create pet
router.post('/',
  authenticate,
  authorize(['clients:write']),
  validatePet,
  petController.createPet
);

// Get pets
router.get('/',
  authenticate,
  authorize(['clients:read']),
  petController.getPets
);

// Get specific pet
router.get('/:id',
  authenticate,
  authorize(['clients:read']),
  validateMongoId('id'),
  petController.getPet
);

// Update pet
router.put('/:id',
  authenticate,
  authorize(['clients:write']),
  validateMongoId('id'),
  petController.updatePet
);

// Delete pet
router.delete('/:id',
  authenticate,
  authorize(['clients:delete']),
  validateMongoId('id'),
  petController.deletePet
);

// Add medical record
router.post('/:id/medical',
  authenticate,
  authorize(['clients:write']),
  validateMongoId('id'),
  petController.addMedicalRecord
);

// Get pet's appointments
router.get('/:id/appointments',
  authenticate,
  authorize(['appointments:read']),
  validateMongoId('id'),
  petController.getPetAppointments
);

module.exports = router;