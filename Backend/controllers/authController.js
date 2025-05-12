const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Client = require("../models/Client");
const Company = require("../models/Company");
const Staff = require("../models/Staff"); // Make sure to import Staff model

// Generate JWT Token with enhanced user information
const generateToken = (user, role) => {
  console.log(`Generating token for ${role} with ID ${user._id}`);
  
  // Base payload for all user types
  const payload = {
    id: user._id,
    role,
    isApproved: user.isApproved || role === 'admin',
    email: user.email,
    createdAt: new Date().getTime()
  };
  
  // Add role-specific data to the token
  if (role === 'staff') {
    payload.isFirstLogin = user.isFirstLogin;
    payload.staffRole = user.role;  // The specific role within staff (engineer, manager, etc.)
    payload.company = user.company;  // Company ID that staff belongs to
  } else if (role === 'company') {
    payload.companyName = user.companyName;
  } else if (role === 'client') {
    payload.fullName = user.fullName;
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
    console.log("Login attempt received:", req.body);
    const { email, password } = req.body;

    // Trim and validate input
    const trimmedEmail = email?.trim();
    const trimmedPassword = password?.trim();
    
    if (!trimmedEmail || !trimmedPassword) {
      console.log("Missing email or password in request");
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    let user;
    let role;
    let specificRole = null;

    // Check in all user types with case-insensitive email
    const emailRegex = new RegExp(`^${trimmedEmail}$`, 'i');
    console.log("Searching for user with email pattern:", emailRegex);
    
    if ((user = await Admin.findOne({ email: emailRegex }))) {
      role = "admin";
      console.log("Found user in Admin collection");
    } else if ((user = await Client.findOne({ email: emailRegex }))) {
      role = "client";
      console.log("Found user in Client collection");
      if (!user.isApproved) {
        console.log("Client account not approved");
        return res.status(403).json({ 
          success: false,
          message: "Your account is pending approval" 
        });
      }
    } else if ((user = await Company.findOne({ email: emailRegex }))) {
      role = "company";
      console.log("Found user in Company collection");
      if (!user.isApproved) {
        console.log("Company account not approved");
        return res.status(403).json({ 
          success: false,
          message: "Your account is pending approval" 
        });
      }
    } else if ((user = await Staff.findOne({ email: emailRegex }))) {
      role = "staff"; // Always use "staff" for the main role
      specificRole = user.role; // Store the specific staff role (project_manager, architect, etc.)
      console.log(`Found user in Staff collection with specific role: ${specificRole}`);
      
      // Staff approval check
      if (!user.isApproved) {
        console.log("Staff account not approved");
        return res.status(403).json({ 
          success: false,
          message: "Your staff account is pending approval" 
        });
      }
    } else {
      console.log("No user found with the provided email");
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Check Password
    console.log("Validating password...");
    const isMatch = await user.matchPassword(trimmedPassword);
    if (!isMatch) {
      console.log("Password validation failed");
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }
    console.log("Password validation successful");

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
        isApproved: user.isApproved || role === 'admin',
        isFirstLogin: role === 'staff' ? user.isFirstLogin : false
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
        responseData.user.staffRole = user.role; // Store specific staff role (engineer, etc.)
        responseData.user.specificRole = user.role; // Additional property for clarity
        responseData.user.role = 'staff'; // Make sure the main role is always 'staff'
        responseData.user.company = user.company;
        responseData.user.profilePicture = user.profilePicture;
        responseData.user.isFirstLogin = user.isFirstLogin;
        break;
    }

    console.log("Login successful, responding with:", {
      success: responseData.success,
      role: responseData.user.role,
      staffRole: responseData.user.staffRole,
      specificRole: responseData.user.specificRole,
      isFirstLogin: responseData.user.isFirstLogin
    });

    res.status(200).json(responseData);

  } catch (error) {
    console.error("Login Error:", error);
    const errorMessage = error.message || "An unexpected error occurred";
    console.log("Responding with error:", errorMessage);
    res.status(500).json({ 
      success: false,
      message: "Server error during login process",
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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