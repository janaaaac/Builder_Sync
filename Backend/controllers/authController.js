const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Client = require("../models/Client");
const Company = require("../models/Company");

// Generate JWT Token with enhanced user information
const generateToken = (user, role) => {
  return jwt.sign(
    {
      id: user._id,
      role,
      isApproved: user.isApproved || role === 'admin', // Include approval status
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Admin, Client, and Company Login with improved responses
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user;
    let role;

    // Check in Admins, Clients, and Companies
    if ((user = await Admin.findOne({ email }))) {
      role = "admin";
    } else if ((user = await Client.findOne({ email }))) {
      role = "client";
      if (!user.isApproved) {
        return res.status(403).json({ 
          success: false,
          message: "Your account is pending approval" 
        });
      }
    } else if ((user = await Company.findOne({ email }))) {
      role = "company";
      if (!user.isApproved) {
        return res.status(403).json({ 
          success: false,
          message: "Your account is pending approval" 
        });
      }
    } else {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid email or password" 
      });
    }

    // Generate JWT Token with enhanced user info
    const token = generateToken(user, role);

    // Create response with role-specific data
    const responseData = {
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role,
        isApproved: user.isApproved || role === 'admin'
      }
    };

    // Add role-specific information
    if (role === 'company') {
      responseData.user.companyName = user.companyName;
      responseData.user.companyLogo = user.companyLogo;
      responseData.user.contactPersonName = user.contactPersonName;
    } else if (role === 'client') {
      responseData.user.fullName = user.fullName;
      responseData.user.profilePicture = user.profilePicture;
    } else if (role === 'admin') {
      responseData.user.username = user.username;
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error" 
    });
  }
};

// Admin Registration (For first-time setup, can be removed later)
const registerAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ 
        success: false,
        message: "Admin already exists" 
      });
    }

    // Create Admin
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
      message: "Server Error" 
    });
  }
};

// Verify token validity
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check which model to use based on role
    let Model;
    switch(decoded.role) {
      case 'admin': Model = Admin; break;
      case 'client': Model = Client; break;
      case 'company': Model = Company; break;
      default: throw new Error('Invalid role');
    }

    const user = await Model.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        valid: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      valid: true,
      user: {
        id: user._id,
        email: user.email,
        role: decoded.role,
        isApproved: user.isApproved || decoded.role === 'admin',
        // Include role-specific information
        ...(decoded.role === 'company' && {
          companyName: user.companyName,
          companyLogo: user.companyLogo,
          contactPersonName: user.contactPersonName
        }),
        ...(decoded.role === 'client' && {
          fullName: user.fullName,
          profilePicture: user.profilePicture
        }),
        ...(decoded.role === 'admin' && {
          username: user.username
        })
      }
    });

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
