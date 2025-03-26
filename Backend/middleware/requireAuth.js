const jwt = require("jsonwebtoken");
const Client = require("../models/Client");
const Company = require("../models/Company");

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized - No token provided" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.ACCESS_SECRET);
    
    // Try to find user in Client model first
    let user = await Client.findById(decoded.id).select("-password");
    
    // If not found in Client, check Company model
    if (!user) {
      user = await Company.findById(decoded.id).select("-password");
    }

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.isApproved) {
      return res.status(403).json({ message: "Account not approved by admin" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = requireAuth;
