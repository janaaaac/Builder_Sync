const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const requireAuth = require("../middleware/requireAuth");
const requireRole = require("../middleware/requireRole");

// Admin registration (initial setup only)
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin already exists" });
    }
    const admin = new Admin({ username, email, password });
    await admin.save();
    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    console.error("Admin Registration Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Apply auth middleware to all following routes
router.use(requireAuth);
router.use(requireRole("admin"));

// Client Management
router.patch("/clients/:id/approve", adminController.approveClient);
router.patch("/clients/:id/reject", adminController.rejectClient);
router.get("/clients", adminController.getAllClients);
router.get("/clients/pending", adminController.getPendingClients);
router.get("/clients/:id", adminController.getClientDetails);

// Company Management
router.patch("/companies/:id/approve", adminController.approveCompany);
router.delete("/companies/:id/reject", adminController.rejectCompany);
router.get("/companies/pending", adminController.getPendingCompanies);
router.get("/companies/:id", adminController.getCompanyDetails);

// Dashboard
router.get("/dashboard/stats", adminController.getDashboardStats);
router.get("/dashboard/activities", adminController.getRecentActivities);

module.exports = router;