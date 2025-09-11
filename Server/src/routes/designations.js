const express = require('express');
const router  = express.Router();
// const { body, param } = require('express-validator');
const designationController = require('../controllers/designationController');
const { authenticate } = require('../middleware/auth');

// const { validateMongoId } = require('../middleware/validation');
// const { ROLES } = require('../config/constants');

// Validation middleware for designation creation
// const validateDesignationCreation = [
//   body('name')
//     .trim()
//     .isLength({ min: 2, max: 50 })
//     .withMessage('Designation name must be between 2 and 50 characters'),
//   body('description')
//     .optional()
//     .trim()
//     .isLength({ max: 200 })
//     .withMessage('Description must not exceed 200 characters'),
//   body('permissions')
//     .isArray()
//     .withMessage('Permissions must be an array')
//     .custom((permissions) => {
//       // Validate permission structure
//       for (const permission of permissions) {
//         if (!permission.module || !Array.isArray(permission.actions)) {
//           throw new Error('Each permission must have module and actions array');
//         }
//       }
//       return true;
//     })
// ];

// // Validation middleware for designation update
// const validateDesignationUpdate = [
//   body('name')
//     .optional()
//     .trim()
//     .isLength({ min: 2, max: 50 })
//     .withMessage('Designation name must be between 2 and 50 characters'),
//   body('description')
//     .optional()
//     .trim()
//     .isLength({ max: 200 })
//     .withMessage('Description must not exceed 200 characters'),
//   body('permissions')
//     .optional()
//     .isArray()
//     .withMessage('Permissions must be an array')
// ];



// Routes
router.post('/', 
  authenticate,
//   requireRole([ROLES.BUSINESS_ADMIN]),
//   validateDesignationCreation,
  designationController.createDesignation
);

// router.get('/',
//   authenticate,
// //   requireRole([ROLES.BUSINESS_ADMIN]),
//   designationController.getDesignations
// );

// router.get('/:id',
//   authenticate,
// //   requireRole([ROLES.BUSINESS_ADMIN]),
// //   validateMongoId('id'),
//   designationController.getDesignation
// );

// router.put('/:id',
//   authenticate,
// //   requireRole([ROLES.BUSINESS_ADMIN]),
// //   validateMongoId('id'),
// //   validateDesignationUpdate,
//   designationController.updateDesignation
// );

// router.delete('/:id',
//   authenticate,
// //   requireRole([ROLES.BUSINESS_ADMIN]),
// //   validateMongoId('id'),
//   designationController.deleteDesignation
// );

module.exports = router;
