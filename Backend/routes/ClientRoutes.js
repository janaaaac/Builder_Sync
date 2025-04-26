const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const companyController = require('../controllers/companyController');
const { uploadFields } = require('../utils/upload');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

// Create a new client with file upload handling
router.post('/create', uploadFields, clientController.createClient);

// Get all clients (no auth required)
router.get('/', clientController.getClients);

// Get client profile - add auth middleware ONLY to this route
router.get('/profile', requireAuth, clientController.getClientProfile);

// New endpoint - Get all companies for client dashboard
router.get('/companies', requireAuth, companyController.getCompanies);

// Get client proposal notifications
router.get('/notifications/proposals', requireAuth, requireRole('client'), clientController.getProposalNotifications);

// Get all notifications for a client
router.get('/notifications/all', requireAuth, requireRole('client'), clientController.getAllNotifications);

// Mark notification as read
router.put('/notifications/:id/read', requireAuth, requireRole('client'), clientController.markNotificationAsRead);

// Get a specific client by ID (no auth required)
router.get('/:id', clientController.getClientById);

// Update client details with file upload handling (no auth required)
router.put('/:id', uploadFields, clientController.updateClient);

// Delete a client (no auth required)
router.delete('/:id', clientController.deleteClient);

module.exports = router;
