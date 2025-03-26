const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const requireAuth = require("../middleware/requireAuth"); // Ensure admin is authenticated
const requireRole = require("../middleware/requireRole"); // Ensure only admin can access

router.post("/admin/register", async (req, res) => {
    try {
      const { username, email, password } = req.body;
  
      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ email });
      if (existingAdmin) {
        return res.status(400).json({ message: "Admin already exists" });
      }
  
      // Create new admin
      const admin = new Admin({ username, email, password });
      await admin.save();
  
      res.status(201).json({ message: "Admin registered successfully" });
    } catch (error) {
      console.error("Admin Registration Error:", error);
      res.status(500).json({ message: "Server Error" });
    }
  });
  

// Middleware to ensure only admin can approve/reject
const isAdmin = requireRole("admin");

// Approve or Reject Clients
router.put("/clients/approve/:id", requireAuth, isAdmin, adminController.approveClient);
router.delete("/clients/reject/:id", requireAuth, isAdmin, adminController.rejectClient);

// Approve or Reject Companies
router.put("/companies/approve/:id", requireAuth, isAdmin, adminController.approveCompany);
router.delete("/companies/reject/:id", requireAuth, isAdmin, adminController.rejectCompany);

module.exports = router;
