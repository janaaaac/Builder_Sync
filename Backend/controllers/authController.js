const Client = require("../models/Client");
const Company = require("../models/Company");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user exists in Client or Company collections
    let user = await Client.findOne({ email });
    let role = "client";

    if (!user) {
      user = await Company.findOne({ email });
      role = "company";
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if user is approved
    if (!user.isApproved) {
      return res.status(403).json({ message: "Account pending approval by admin" });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Generate JWT Token
    const token = jwt.sign({ id: user._id, role }, process.env.ACCESS_SECRET, {
      expiresIn: "1d",
    });

    res.status(200).json({ token, role, message: "Login successful" });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { login };
