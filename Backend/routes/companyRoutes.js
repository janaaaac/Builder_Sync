// companyRoutes.js
const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const { uploadCompanyFields } = require("../utils/uploadCompany");
const requireAuth = require('../middleware/requireAuth');
const requireRole = require('../middleware/requireRole');
const Company = require("../models/Company");
const Client = require("../models/Client");
const Staff = require("../models/Staff");
const Proposal = require("../models/Proposal");

// Apply auth middleware to all company routes
router.use(requireAuth); // First verify token
router.use(requireRole('company')); // Then check role

// Protected routes
router.get("/profile", companyController.getCompanyProfile);
// Create a new company with file upload handling
router.post("/create", uploadCompanyFields, companyController.createCompany);

// Get all companies
router.get("/", companyController.getCompanies);

// Get company profile
router.get("/profile", companyController.getCompanyProfile);

// Get a specific company by ID
router.get("/:id", companyController.getCompanyById);

// Add this route before the other routes
router.put("/profile", companyController.updateCompanyProfile);

// Delete a company
router.delete("/:id", companyController.deleteCompany);

// Add this route for company profile (must be after requireAuth and requireRole)
router.get('/profile', requireAuth, requireRole('company'), companyController.getCompanyProfile);


module.exports = router;