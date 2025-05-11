const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const projectController = require('../controllers/projectController');
const { handlePlanUploadErrors } = require('../utils/uploadPlans');

// Auth middleware
router.use(requireAuth);

// Get all projects for the logged-in client
router.get('/client', requireAuth, requireRole('client'), projectController.getClientProjects);

// Get all projects for the logged-in company
router.get('/company', requireAuth, requireRole('company'), projectController.getCompanyProjects);

// Get all projects for authenticated staff
router.get('/staff', requireAuth, projectController.getStaffProjects);
// Get single project detail for authenticated staff
router.get('/staff/:projectId', requireAuth, projectController.getStaffProjectDetail);

// Add staff to a project (company only)
router.post('/:projectId/add-staff', requireAuth, requireRole('company'), projectController.addStaffToProject);

// Get staff assigned to a project
router.get('/:projectId/staff', requireAuth, projectController.getProjectStaff);

// Create a project from a proposal (client only)
router.post('/from-proposal/:proposalId', requireAuth, requireRole('client'), projectController.createProjectFromProposal);

// Plan upload routes
router.post('/:projectId/plans', 
  handlePlanUploadErrors, 
  projectController.uploadProjectPlans
);

router.get('/:projectId/plans', projectController.getProjectPlans);
router.get('/:projectId/plans/:planId', projectController.getPlanById);
router.delete('/:projectId/plans/:planId', projectController.deletePlan);

// Get project statistics for the dashboard
router.get('/stats', requireAuth, projectController.getProjectStats);

module.exports = router;
