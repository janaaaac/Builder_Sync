const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const { uploadCompanyFields } = require("../utils/uploadCompany"); // Ensure this path is correct

// Create a new company with file upload handling
router.post("/create", uploadCompanyFields, companyController.createCompany);

// Get all companies
router.get("/", companyController.getCompanies);

// Get a specific company by ID
router.get("/:id", companyController.getCompanyById);

// Delete a company
router.delete("/:id", companyController.deleteCompany);

module.exports = router;
