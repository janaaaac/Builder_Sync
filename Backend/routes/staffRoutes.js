const express = require("express");
const router = express.Router();
const staffController = require("../controllers/staffController");
const { uploadStaffFiles } = require("../utils/staffUpload");
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');

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

module.exports = router;