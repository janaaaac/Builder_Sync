const Admin = require("../models/Admin");
const Client = require("../models/Client");
const Company = require("../models/Company");

const requireRole = (role) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: "Unauthorized" 
      });
    }

    console.log("Role Check:", {
      expected: role,
      actual: req.user.role,
      isApproved: req.user.isApproved
    });

    if (req.user.role !== role) {
      return res.status(403).json({ 
        success: false,
        message: `Forbidden - Requires ${role} role` 
      });
    }

    // Additional approval check for non-admins
    if (role !== 'admin' && !req.user.isApproved) {
      return res.status(403).json({ 
        success: false,
        message: "Account pending approval" 
      });
    }

    next();
  } catch (error) {
    console.error("Role verification error:", error);
    return res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

module.exports = requireRole;
