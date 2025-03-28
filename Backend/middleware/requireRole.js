const Admin = require("../models/Admin");
const Client = require("../models/Client");
const Company = require("../models/Company");

const requireRole = (role) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // We already have the user from requireAuth middleware
    // Just check if the role matches
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Forbidden - Insufficient permissions" });
    }

    next();
  } catch (error) {
    console.error("Role verification error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = requireRole;
