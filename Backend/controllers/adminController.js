const Client = require("../models/Client");
const Company = require("../models/Company");
const Admin = require("../models/Admin");
const { generatePresignedUrl, generatePresignedUrlFromS3Url } = require("../utils/s3Presigner");

// Client Management
exports.approveClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.status(200).json({ message: "Client approved", client });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.rejectClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { isApproved: false },
      { new: true }
    );
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.status(200).json({ message: "Client rejected", client });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getPendingClients = async (req, res) => {
  try {
    const clients = await Client.find({ isApproved: false });
    res.status(200).json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Enhanced client details endpoint with presigned URL support
exports.getClientDetails = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });

    // Create response object with client data
    const response = { ...client._doc };
    
    // Handle profile picture - try key first, then fall back to URL
    if (client.profilePictureKey) {
      try {
        response.profilePicture = await generatePresignedUrl(client.profilePictureKey);
      } catch (err) {
        console.error("Error generating presigned URL for profile picture:", err);
      }
    } else if (client.profilePicture) {
      try {
        response.profilePicture = await generatePresignedUrlFromS3Url(client.profilePicture);
      } catch (err) {
        console.error("Error generating presigned URL from profile picture URL:", err);
      }
    }
    
    // Handle NIC/Passport file - try key first, then fall back to URL
    if (client.nicPassportFileKey) {
      try {
        response.nicPassportFile = await generatePresignedUrl(client.nicPassportFileKey);
      } catch (err) {
        console.error("Error generating presigned URL for NIC/passport:", err);
      }
    } else if (client.nicPassportFile) {
      try {
        response.nicPassportFile = await generatePresignedUrlFromS3Url(client.nicPassportFile);
      } catch (err) {
        console.error("Error generating presigned URL from NIC/passport URL:", err);
      }
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching client details:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all clients
exports.getAllClients = async (req, res) => {
  try {
    const clients = await Client.find({})
      .sort({ createdAt: -1 })
      .select('-password');
    
    res.status(200).json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ message: "Server error while fetching clients" });
  }
};

// Company Management
exports.approveCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    );
    if (!company) return res.status(404).json({ message: "Company not found" });
    res.status(200).json({ message: "Company approved", company });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.rejectCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    res.status(200).json({ message: "Company rejected and deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getPendingCompanies = async (req, res) => {
  try {
    const companies = await Company.find({ isApproved: false });
    res.status(200).json(companies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Enhanced company details endpoint with presigned URL support
exports.getCompanyDetails = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });

    // Initialize response with company data
    const response = company.toObject(); // Convert Mongoose doc to plain object

    // Handle company logo
    if (company.companyLogo) {
      try {
        // Extract key from URL if stored as full URL
        const logoKey = company.companyLogo.includes('amazonaws.com/') 
          ? company.companyLogo.split('amazonaws.com/')[1]
          : company.companyLogo;
        
        response.companyLogo = await generatePresignedUrlFromS3Url(company.companyLogo);
      } catch (err) {
        console.error("Error generating logo URL:", err);
        response.companyLogo = company.companyLogo; // Fallback to original URL
      }
    }

    // Handle specialized licenses
    if (company.specializedLicenses?.length > 0) {
      response.specializedLicenses = await Promise.all(
        company.specializedLicenses.map(async (url) => {
          try {
            return await generatePresignedUrlFromS3Url(url);
          } catch (err) {
            console.error("Error generating license URL:", err);
            return url; // Fallback to original URL
          }
        })
      );
    }

    // Handle ISO certifications
    if (company.isoCertifications?.length > 0) {
      response.isoCertifications = await Promise.all(
        company.isoCertifications.map(async (url) => {
          try {
            return await generatePresignedUrlFromS3Url(url);
          } catch (err) {
            console.error("Error generating certification URL:", err);
            return url; // Fallback to original URL
          }
        })
      );
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching company details:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// Add this to your adminController.js
exports.getCompanies = async (req, res) => {
  try {
    const companies = await Company.find({})
      .sort({ createdAt: -1 })
      .select('-password');
    res.status(200).json(companies);
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ message: "Server error" });
  }
};
// Dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const stats = {
      totalClients: await Client.countDocuments(),
      totalCompanies: await Company.countDocuments(),
      pendingClients: await Client.countDocuments({ isApproved: false }),
      pendingCompanies: await Company.countDocuments({ isApproved: false }),
    };
    res.status(200).json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getRecentActivities = async (req, res) => {
  try {
    const activities = await Admin.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("username email createdAt");
    res.status(200).json(activities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};