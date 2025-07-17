const express = require('express');
const router = express.Router();
const petController = require('../controllers/petController');
const { authenticate } = require('../middleware/auth');


// GET /api/pets - Get all pets for business
router.get('/', authenticate, petController.getPets);

// GET /api/pets/search - Search pets
router.get('/search', petController.searchPets);

// GET /api/pets/stats - Get pet statistics
router.get('/stats', petController.getPetStats);

// GET /api/pets/:id - Get specific pet
router.get('/:id', petController.getPetById);

// POST /api/pets - Create new pet
router.post('/', authenticate,  petController.createPet);

// PUT /api/pets/:id - Update pet
router.put('/:id', authenticate,  petController.updatePet);

// DELETE /api/pets/:id - Delete pet
router.delete('/:id',authenticate, petController.deletePet);

// Medical Records
router.post('/:id/medical-records', petController.addMedicalRecord);
router.get('/:id/medical-records', petController.getMedicalRecords);
router.put('/:id/medical-records/:recordId', petController.updateMedicalRecord);
router.delete('/:id/medical-records/:recordId', petController.deleteMedicalRecord);

module.exports = router;