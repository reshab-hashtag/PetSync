const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const businessController = require('../controllers/businessController');

// Register
router.post('/register', authLimiter,authenticate, businessController.createBusiness );
// Update business details
router.put('/update', authLimiter,authenticate, businessController.updateBusiness );

// Get all businesses
router.get('/get', authLimiter,authenticate, businessController.getAllBusinesses );

// get business details
router.get('/get/:businessId', authLimiter, authenticate, businessController.getBusiness );

// Add staff to business
router.post('/add-staff/:businessId', authLimiter, authenticate, businessController.addStaff );


module.exports = router;