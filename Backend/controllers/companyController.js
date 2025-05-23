const Company = require("../models/Company");

// Create a new company
exports.createCompany = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      companyName,
      businessRegNumber,
      businessType,
      establishmentYear,
      registeredOfficeAddress,
      branchOfficeAddress,
      contactPersonName,
      contactPhoneNumber,
      websiteURL,
      cidaRegNumber,
      cidaGrade,
    } = req.body;

    // Retrieve uploaded files from AWS S3
    const companyLogo = req.files["companyLogo"] ? req.files["companyLogo"][0].location : null;
   // In controllers/companyController.js
const specializedLicenses = req.files["specializedLicenses"]
? req.files["specializedLicenses"].map((file) => file.location)
: [];
const isoCertifications = req.files["isoCertifications"]
? req.files["isoCertifications"].map((file) => file.location)
: [];

    // Check if email or username already exists
    const existingCompany = await Company.findOne({ $or: [{ email }, { username }] });

    if (existingCompany) {
      return res.status(400).json({ message: "Email or username already exists" });
    }

    // Create new company
    const newCompany = new Company({
      username,
      email,
      password,
      companyName,
      businessRegNumber,
      businessType,
      establishmentYear,
      registeredOfficeAddress,
      branchOfficeAddress,
      contactPersonName,
      contactPhoneNumber,
      websiteURL,
      cidaRegNumber,
      cidaGrade,
      companyLogo,
      specializedLicenses,
      isoCertifications,
    });

    await newCompany.save();
    res.status(201).json({ message: "Company created successfully", company: newCompany });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Fetch all companies
exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find();
    res.status(200).json(companies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Fetch a specific company by ID
exports.getCompanyById = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(200).json(company);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Add this to your companyController.js
exports.getCompanyProfile = async (req, res) => {
  try {
    const companyId = req.user._id;
    const company = await Company.findById(companyId).select('-password');
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }
    res.status(200).json({
      success: true,
      data: {
        companyName: company.companyName,
        email: company.email,
        companyLogo: company.companyLogo,
        contactPersonName: company.contactPersonName,
        isApproved: company.isApproved,
        hasPortfolio: !!company.hasPortfolio // ensure boolean
      }
    });
  } catch (error) {
    console.error('Error getting company profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/// Update this method in companyController.js
exports.updateCompanyProfile = async (req, res) => {
  try {
    const company = req.user;
    const updates = req.body;

    // Filter allowed fields to update
    const allowedUpdates = [
      'username',
      'email',
      'companyName',
      'contactPersonName',
      'contactPhoneNumber',
      'registeredOfficeAddress',
      'websiteURL'
    ];

    // Apply updates
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        company[field] = updates[field];
      }
    });

    await company.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: company
    });
  } catch (error) {
    console.error("Update Error:", error);
    res.status(400).json({
      success: false,
      message: "Failed to update profile"
    });
  }
};
// Delete a company
exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }
    res.status(200).json({ message: "Company deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

