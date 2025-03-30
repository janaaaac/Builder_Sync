// requireAuth.js
const jwt = require("jsonwebtoken");
const Client = require("../models/Client");
const Company = require("../models/Company");
const Admin = require("../models/Admin");

const requireAuth = async (req, res, next) => {
  // Extract token with improved logging
  console.log("Auth check for path:", req.path);
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    console.log("Missing or invalid Authorization header");
    return res.status(401).json({ 
      success: false,
      message: 'Authorization token required' 
    });
  }

  const token = authHeader.split(' ')[1];
  console.log("Incoming token:", token ? `${token.substring(0, 15)}...` : "missing");
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", {
      id: decoded.id,
      role: decoded.role,
      isApproved: decoded.isApproved,
      exp: new Date(decoded.exp * 1000).toISOString()
    });
    
    // Role-specific model selection
    let Model;
    switch(decoded.role) {
      case 'admin': Model = Admin; break;
      case 'client': Model = Client; break;
      case 'company': Model = Company; break;
      default: throw new Error('Invalid role');
    }

    const user = await Model.findById(decoded.id).select('-password');
    if (!user) {
      console.log(`User not found: ${decoded.id} (${decoded.role})`);
      throw new Error('User not found');
    }

    console.log("User found:", {
      id: user._id,
      role: decoded.role,
      isApproved: user.isApproved || decoded.role === 'admin'
    });

    // Verify approval status matches token
    if (decoded.isApproved !== (user.isApproved || decoded.role === 'admin')) {
      console.log("Approval status mismatch:", {
        tokenApproval: decoded.isApproved,
        dbApproval: user.isApproved || decoded.role === 'admin'
      });
      throw new Error('Approval status mismatch');
    }

    // Attach user to request
    req.user = user;
    // Also attach role and token info for convenience
    req.user.role = decoded.role;
    req.tokenData = {
      id: decoded.id,
      role: decoded.role,
      isApproved: decoded.isApproved,
      exp: decoded.exp
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
};

module.exports = requireAuth;