const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Client = require("../models/Client"); // Ensure correct path
const Company = require("../models/Company"); // Ensure correct path
const Admin = require("../models/Admin"); // If you have an Admin model

const router = express.Router();

// Login Route for Admin, Client, and Company
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists in Client, Company, or Admin
    let user =
      (await Client.findOne({ email })) ||
      (await Company.findOne({ email })) ||
      (await Admin.findOne({ email }));

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if the user is approved (only for Client & Company)
    if (user.isApproved === false) {
      return res.status(403).json({ message: "Your account is pending approval" });
    }

    // Validate Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: user._id, role: user.role || "admin" }, // Default role for admin
      process.env.ACCESS_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token, role: user.role || "admin" });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;
