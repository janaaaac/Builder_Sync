const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const projectController = require('../controllers/projectController');

// Get all projects for the logged-in client
router.get('/client', requireAuth, requireRole('client'), projectController.getClientProjects);

// Get all projects for the logged-in company
router.get('/company', requireAuth, requireRole('company'), projectController.getCompanyProjects);

// Get all projects for the logged-in staff
router.get('/staff', requireAuth, requireRole('staff'), projectController.getStaffProjects);

// Add staff to a project (company only)
router.post('/:projectId/add-staff', requireAuth, requireRole('company'), projectController.addStaffToProject);

// Create a project from a proposal (client only)
router.post('/from-proposal/:proposalId', requireAuth, requireRole('client'), projectController.createProjectFromProposal);

// Get project statistics for the dashboard
router.get('/stats', requireAuth, projectController.getProjectStats);

module.exports = router;
