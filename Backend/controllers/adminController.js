const Client = require("../models/Client");
const Company = require("../models/Company");
const Admin = require("../models/Admin");

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

exports.getClientDetails = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: "Client not found" });
    res.status(200).json(client);
  } catch (error) {
    console.error(error);
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

exports.getCompanyDetails = async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ message: "Company not found" });
    res.status(200).json(company);
  } catch (error) {
    console.error(error);
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