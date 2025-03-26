const express = require('express');
const router = express.Router();
const clientController = require('../controllers/clientController');
const { uploadFields } = require('../utils/upload'); // Ensure this path is correct

// Create a new client with file upload handling
router.post('/create', uploadFields, clientController.createClient);

// Get all clients
router.get('/', clientController.getClients);

// Get a specific client by ID
router.get('/:id', clientController.getClientById);

// Update client details with file upload handling
router.put('/:id', uploadFields, clientController.updateClient);

// Delete a client
router.delete('/:id', clientController.deleteClient);

module.exports = router;
