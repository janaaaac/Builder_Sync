const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const requireAuth = require('../middleware/requireAuth');

// Create a new notification
router.post('/', requireAuth, notificationController.createNotification);

// Get all notifications for a user
router.get('/user/:userId', requireAuth, notificationController.getUserNotifications);

// Mark a notification as read
router.put('/:id/read', requireAuth, notificationController.markAsRead);

module.exports = router;
