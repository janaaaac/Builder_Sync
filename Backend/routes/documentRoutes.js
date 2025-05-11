const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const documentController = require('../controllers/documentController');
const { handleDocumentUpload } = require('../utils/uploadDocuments');

// Debug middleware to log requests
router.use((req, res, next) => {
  console.log(`Document API Request: ${req.method} ${req.originalUrl}`);
  next();
});

// Auth middleware for all routes
router.use(requireAuth);

// Create a new document
router.post(
  '/', 
  handleDocumentUpload,
  documentController.createDocument
);

// Get all documents (with filtering)
router.get('/', documentController.getAllDocuments);

// Get document by ID
router.get('/:documentId', documentController.getDocumentById);

// Update document
router.put(
  '/:documentId',
  handleDocumentUpload,
  documentController.updateDocument
);

// Delete document
router.delete('/:documentId', documentController.deleteDocument);

// Get documents for a specific project
router.get('/project/:projectId', documentController.getProjectDocuments);

module.exports = router;