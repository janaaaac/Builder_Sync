const Client = require("../models/Client");
const Company = require("../models/Company");

const requireRole = (role) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check role based on the model (Admin, Client, or Company)
    const user = await Client.findById(req.user._id) || await Company.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== role) {
      return res.status(403).json({ message: "Forbidden - You do not have permission" });
    }

    next();
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = requireRole;
