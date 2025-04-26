const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const multer = require('multer');

// Configure local storage for development
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// PUBLIC ROUTES - These should be placed BEFORE authentication middleware
// Get a company's portfolio by company ID (accessible to clients)
router.get('/public/:companyId', portfolioController.getPublicPortfolio);

// Protected routes (company access only)
router.use(requireAuth); // First verify token
router.use(requireRole('company')); // Then check role

// Get company's own portfolio
router.get('/', portfolioController.getPortfolio);

// Create or update entire portfolio
router.post('/', portfolioController.savePortfolio);

// Update specific section
router.put('/:section', portfolioController.updateSection);

// Section updates
router.post('/section/:section', portfolioController.updateSection);

// Project routes
router.post('/projects', portfolioController.addProject);
router.delete('/projects/:projectId', portfolioController.deleteProject);

// ADD: Update a single project
router.put('/projects/:projectId', portfolioController.updateProject);

// ADD: Get a single project by ID (for frontend direct fetch)
router.get('/projects/:projectId', portfolioController.getProjectById);

// Service routes
router.post('/services', portfolioController.addService);
router.delete('/services/:serviceId', portfolioController.deleteService);

// Statistics routes
router.post('/statistics', portfolioController.addStatistic);
router.delete('/statistics/:statId', portfolioController.deleteStatistic);

// Handle file uploads for portfolio images
router.post('/upload', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }
    
    // For local storage, construct URLs for the uploaded files
    const imageUrls = req.files.map(file => {
      return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
    });
    
    res.status(200).json({
      success: true,
      data: imageUrls,
      message: 'Files uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading images'
    });
  }
});

module.exports = router;
