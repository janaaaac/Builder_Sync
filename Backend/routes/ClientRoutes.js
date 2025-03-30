const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { uploadFields } = require('../utils/upload');
const requireAuth = require('../middleware/requireAuth');

// Remove global auth middleware
// router.use(requireAuth);

// Create a new client with file upload handling
router.post('/create', uploadFields, clientController.createClient);

// Get all clients (no auth required)
router.get('/', clientController.getClients);

// Get client profile - add auth middleware ONLY to this route
router.get('/profile', requireAuth, clientController.getClientProfile);

// Get a specific client by ID (no auth required)
router.get('/:id', clientController.getClientById);

// Update client details with file upload handling (no auth required)
router.put('/:id', uploadFields, clientController.updateClient);

// Delete a client (no auth required)
router.delete('/:id', clientController.deleteClient);

module.exports = router;
