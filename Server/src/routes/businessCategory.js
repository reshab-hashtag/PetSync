// Server/src/routes/businessCategory.js
const express = require('express');
const router = express.Router();
const businessCategoryController = require('../controllers/businessCategoryController');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { validateMongoId } = require('../middleware/validation');
const { ROLES } = require('../config/constants');

// ===================================
// PUBLIC ROUTES (for dropdown data)
// ===================================

// Get active categories for business registration dropdowns
router.get('/active', businessCategoryController.getActiveCategories);

// ===================================
// AUTHENTICATED ROUTES
// ===================================

// Get all categories with pagination and filtering
router.get('/', 
  authenticate, 
  requireRole([ROLES.SUPER_ADMIN]),
  businessCategoryController.getAllCategories
);

// Get single category with stats
router.get('/:id', 
  authenticate,
  validateMongoId('id'),
  businessCategoryController.getCategory
);

// ===================================
// SUPER ADMIN ONLY ROUTES
// ===================================

// Create new category
router.post('/', 
  authenticate,
  requireRole([ROLES.SUPER_ADMIN]),
  businessCategoryController.createCategory
);

// Update category
router.put('/:id', 
  authenticate,
  requireRole([ROLES.SUPER_ADMIN]),
  validateMongoId('id'),
  businessCategoryController.updateCategory
);

// Delete category
router.delete('/:id', 
  authenticate,
  requireRole([ROLES.SUPER_ADMIN]),
  validateMongoId('id'),
  businessCategoryController.deleteCategory
);

// Bulk update display order
router.put('/bulk/display-order', 
  authenticate,
  requireRole([ROLES.SUPER_ADMIN]),
  businessCategoryController.updateDisplayOrder
);

// Get category statistics
router.get('/admin/stats', 
  authenticate,
  requireRole([ROLES.SUPER_ADMIN]),
  businessCategoryController.getCategoryStats
);

module.exports = router;