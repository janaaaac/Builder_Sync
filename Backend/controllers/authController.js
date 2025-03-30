const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");
const Client = require("../models/Client");
const Company = require("../models/Company");

// Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// Admin, Client, and Company Login
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
        return res.status(403).json({ message: "Your account is pending approval" });
      }
    } else if ((user = await Company.findOne({ email }))) {
      role = "company";
      if (!user.isApproved) {
        return res.status(403).json({ message: "Your account is pending approval" });
      }
    } else {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    // Generate JWT Token
    const token = generateToken(user._id, role);

    res.status(200).json({
      message: "Login successful",
      user: { id: user._id, email: user.email, role },
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin Registration (For first-time setup, can be removed later)
const registerAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) return res.status(400).json({ message: "Admin already exists" });

    // Create Admin
    const admin = new Admin({ username, email, password });
    await admin.save();

    res.status(201).json({ message: "Admin registered successfully" });
  } catch (error) {
    console.error("Admin Registration Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Verify token validity
const verifyToken = async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ valid: false });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false });
  }
};



module.exports = { login, registerAdmin, verifyToken };
