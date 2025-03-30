const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Client = require("../models/Client");
const Company = require("../models/Company");
const Staff = require("../models/Staff"); // Make sure to import Staff model

// Generate JWT Token with enhanced user information
const generateToken = (user, role) => {
  // Base payload for all user types
  const payload = {
    id: user._id,
    role,
    isApproved: user.isApproved || role === 'admin',
    email: user.email
  };
  
  // Add staff-specific data to the token
  if (role === 'staff') {
    payload.isFirstLogin = user.isFirstLogin;
    payload.staffRole = user.role;  // The specific role within staff (engineer, manager, etc.)
    payload.company = user.company;  // Company ID that staff belongs to
  }

  return jwt.sign(
    payload,
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Unified login for Admin, Client, Company, and Staff
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Trim and validate input
    const trimmedEmail = email?.trim();
    const trimmedPassword = password?.trim();
    
    if (!trimmedEmail || !trimmedPassword) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    let user;
    let role;

    // Check in all user types with case-insensitive email
    const emailRegex = new RegExp(`^${trimmedEmail}$`, 'i');
    
    if ((user = await Admin.findOne({ email: emailRegex }))) {
      role = "admin";
    } else if ((user = await Client.findOne({ email: emailRegex }))) {
      role = "client";
      if (!user.isApproved) {
        return res.status(403).json({ 
          success: false,
          message: "Your account is pending approval" 
        });
      }
    } else if ((user = await Company.findOne({ email: emailRegex }))) {
      role = "company";
      if (!user.isApproved) {
        return res.status(403).json({ 
          success: false,
          message: "Your account is pending approval" 
        });
      }
    } else if ((user = await Staff.findOne({ email: emailRegex }))) {
      role = "staff";
      
      // Staff approval check
      if (!user.isApproved) {
        return res.status(403).json({ 
          success: false,
          message: "Your staff account is pending approval" 
        });
      }
    } else {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Check Password
    const isMatch = await user.matchPassword(trimmedPassword);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Generate JWT Token
    const token = generateToken(user, role);

    // Create standardized response
    const responseData = {
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role,
        isApproved: role === 'staff' || role === 'admin' ? true : user.isApproved,
        isFirstLogin: role === 'staff' ? user.isFirstLogin : undefined // Make sure this is included
      }
    };
    

    // Add role-specific properties
    switch(role) {
      case 'company':
        responseData.user.companyName = user.companyName;
        responseData.user.companyLogo = user.companyLogo;
        responseData.user.contactPersonName = user.contactPersonName;
        break;
      case 'client':
        responseData.user.fullName = user.fullName;
        responseData.user.profilePicture = user.profilePicture;
        break;
      case 'admin':
        responseData.user.username = user.username;
        break;
      case 'staff':
        responseData.user.fullName = user.fullName;
        responseData.user.role = user.role; // Specific staff role (engineer, etc.)
        responseData.user.company = user.company;
        responseData.user.profilePicture = user.profilePicture;
        break;
    }

    res.status(200).json(responseData);

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error",
      error: error.message 
    });
  }
};

// Admin Registration (For initial setup)
const registerAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "All fields are required" 
      });
    }

    // Check for existing admin
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ 
        success: false,
        message: "Admin already exists" 
      });
    }

    // Create and save admin
    const admin = new Admin({ username, email, password });
    await admin.save();

    res.status(201).json({ 
      success: true,
      message: "Admin registered successfully" 
    });

  } catch (error) {
    console.error("Admin Registration Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server Error",
      error: error.message 
    });
  }
};

// Token verification for all roles
const verifyToken = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        valid: false,
        message: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Determine which model to use
    let Model;
    switch(decoded.role) {
      case 'admin': Model = Admin; break;
      case 'client': Model = Client; break;
      case 'company': Model = Company; break;
      case 'staff': Model = Staff; break;
      default: 
        return res.status(401).json({
          success: false,
          valid: false,
          message: 'Invalid role in token'
        });
    }

    // Find user without password field
    const user = await Model.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'User not found'
      });
    }

    // Prepare response
    const response = {
      success: true,
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        role: decoded.role,
        isApproved: decoded.role === 'staff' || decoded.role === 'admin' ? true : user.isApproved,
        ...(decoded.role === 'staff' && { isFirstLogin: user.isFirstLogin })
      }
    };

    // Add role-specific fields
    switch(decoded.role) {
      case 'company':
        response.user.companyName = user.companyName;
        response.user.contactPersonName = user.contactPersonName;
        break;
      case 'client':
        response.user.fullName = user.fullName;
        break;
      case 'admin':
        response.user.username = user.username;
        break;
      case 'staff':
        response.user.fullName = user.fullName;
        response.user.role = user.role;
        response.user.company = user.company;
        break;
    }

    res.json(response);

  } catch (error) {
    console.error("Token verification error:", error.message);
    res.status(401).json({
      success: false,
      valid: false,
      message: 'Invalid token',
      error: error.message
    });
  }
};

module.exports = { login, registerAdmin, verifyToken };