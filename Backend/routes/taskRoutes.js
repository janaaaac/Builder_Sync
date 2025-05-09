const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const taskController = require('../controllers/taskController');

// Create a new task (authenticated staff)
router.post('/', requireAuth, taskController.createTask);

// Get all tasks created by current user
router.get('/', requireAuth, taskController.getTasks);

// Get single task by ID
router.get('/:id', requireAuth, taskController.getTaskById);

// Update task (project managers only)
router.put('/:id', requireAuth, requireRole('project_manager'), taskController.updateTask);

// Delete task (project managers only)
router.delete('/:id', requireAuth, requireRole('project_manager'), taskController.deleteTask);

// Assign staff to an existing task (project managers only)
router.post('/:id/assign-staff', requireAuth, requireRole('project_manager'), taskController.assignStaffToTask);

// Update task progress with title (assigned staff and creators)
router.post('/:id/update-progress', requireAuth, taskController.updateTaskProgress);

module.exports = router;