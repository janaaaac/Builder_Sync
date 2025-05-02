const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const { uploadStaffFiles } = require("../utils/staffUpload");
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const Staff = require('../models/Staff');
const Company = require('../models/Company');
const Client = require('../models/Client');
const Proposal = require('../models/Proposal');

// Routes that require company role (admin operations)
router.post("/create", 
  requireAuth, 
  requireRole("company"), 
  staffController.createStaff
);

router.get("/company-staff", 
  requireAuth, 
  requireRole("company"), 
  staffController.getCompanyStaff
);

// Add this to staffRoutes.js

// Delete staff member (company role required)
router.delete("/:id", 
  requireAuth, 
  requireRole("company"), 
  staffController.deleteStaff
);

// Fetch staff by clientId (admin only)
router.get("/by-client/:clientId",
  requireAuth,
  requireRole("admin"),
  staffController.getStaffByClient
);

// Staff-specific routes (require staff role)
// These routes are for staff members to manage their own profiles
router.get("/profile", 
  requireAuth,
  requireRole("staff"),
  staffController.getStaffProfile
);

router.put("/profile",
  requireAuth,
  requireRole("staff"),
  uploadStaffFiles,
  staffController.updateStaffProfile
);

// Dashboard data
router.get("/dashboard", 
  requireAuth,
  requireRole("staff"),
  staffController.getDashboard
);

// First login setup route - doesn't need role check since it's verified by token
router.post("/first-login", 
  requireAuth,
  uploadStaffFiles,
  staffController.firstLoginSetup
);

// Get all staff for the logged-in company
router.get('/', requireAuth, requireRole('company'), async (req, res) => {
  try {
    const staff = await Staff.find({ company: req.user._id }).select('fullName email role profilePicture');
    res.json({ success: true, data: staff });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching staff', error: err.message });
  }
});

// Get staff statistics for dashboard
router.get('/stats', requireAuth, requireRole('company'), staffController.getStaffStats);

module.exports = router;