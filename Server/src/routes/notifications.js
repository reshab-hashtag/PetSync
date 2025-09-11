// Server/src/routes/notifications.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const { validateMongoId } = require('../middleware/validation');

// ===================================
// NOTIFICATION ROUTES
// ===================================

// GET /api/notifications - Get user notifications with filters
router.get('/', 
  authenticate, 
  notificationController.getNotifications
);

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', 
  authenticate, 
  notificationController.getUnreadCount
);

// GET /api/notifications/:id - Get specific notification
router.get('/:id', 
  authenticate, 
  validateMongoId('id'),
  notificationController.getNotificationById
);

// POST /api/notifications - Create notification (admin/system use)
router.post('/', 
  authenticate, 
  notificationController.createNotification
);

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', 
  authenticate, 
  validateMongoId('id'),
  notificationController.markAsRead
);

// PATCH /api/notifications/mark-all-read - Mark all notifications as read
router.patch('/mark-all-read', 
  authenticate, 
  notificationController.markAllAsRead
);

// DELETE /api/notifications/:id - Delete specific notification
router.delete('/:id', 
  authenticate, 
  validateMongoId('id'),
  notificationController.deleteNotification
);

// DELETE /api/notifications/clear-all - Clear all notifications
router.delete('/clear-all', 
  authenticate, 
  notificationController.clearAllNotifications
);

// POST /api/notifications/preferences - Update notification preferences
router.post('/preferences', 
  authenticate, 
  notificationController.updateNotificationPreferences
);

// GET /api/notifications/preferences - Get notification preferences
router.get('/preferences', 
  authenticate, 
  notificationController.getNotificationPreferences
);


router.post('/bulk', 
  authenticate, 
  notificationController.sendBulkNotification
);

module.exports = router;