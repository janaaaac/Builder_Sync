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
