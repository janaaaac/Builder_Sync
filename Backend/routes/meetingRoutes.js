const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const meetingController = require('../controllers/meetingController');

// Company creates a meeting
router.post('/', requireAuth, requireRole('company'), meetingController.createMeeting);
// Update an existing meeting
router.put('/:id', requireAuth, meetingController.updateMeeting);
// Get meetings for the logged-in user
router.get('/my', requireAuth, meetingController.getMyMeetings);
// Confirm attendance for a meeting
router.post('/:id/confirm', requireAuth, meetingController.confirmMeeting);
// Get the last created meeting
router.get('/last', requireAuth, meetingController.getLastCreatedMeeting);

module.exports = router;
