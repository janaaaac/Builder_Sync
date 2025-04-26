const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const multer = require('multer');
const path = require('path');
const { ensureUploadDirectoryExists } = require('../utils/uploadProposal');

// Ensure the upload directory exists
const uploadDir = ensureUploadDirectoryExists();

// Configure multer for temporary file storage before S3 upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    // Accept commonly used document and image file types
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/gif'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only documents and images are allowed.'), false);
    }
  }
});

// Client routes
router.post('/submit', requireAuth, requireRole('client'), upload.array('attachments', 5), proposalController.submitProposal);
router.get('/client', requireAuth, requireRole('client'), proposalController.getClientProposals);
router.delete('/:id', requireAuth, requireRole('client'), proposalController.deleteProposal);

// Company routes
// Updated to include query parameter for complete client data population
router.get('/company', requireAuth, requireRole('company'), proposalController.getCompanyProposals);

// Add a new route specifically for getting full client details with proposals
router.get('/company/complete', requireAuth, requireRole('company'), (req, res, next) => {
  req.populateOptions = {
    path: 'client',
    select: 'username email fullName companyName clientType nicPassportNumber primaryContact address preferredCommunication' 
    // Excludes password and other sensitive fields
  };
  next();
}, proposalController.getCompanyProposals);

router.put('/:id/status', requireAuth, requireRole('company'), (req, res, next) => {
  // Handle the status translation between frontend and backend
  if (req.body.status === 'approved') {
    req.body.status = 'accepted';
  }
  next();
}, proposalController.updateProposalStatus);

// Shared routes - updated to ensure complete client data population
router.get('/:id', requireAuth, (req, res, next) => {
  req.populateOptions = {
    path: 'client',
    select: 'username email fullName companyName clientType nicPassportNumber primaryContact address preferredCommunication'
  };
  next();
}, proposalController.getProposalById);

module.exports = router;
