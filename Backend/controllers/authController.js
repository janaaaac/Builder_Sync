const User = require("../models/User");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// @desc Register a new user (Client or Construction Company)
// @route POST /api/auth/register
// @access Public
const registerUser = async (req, res) => {
  const { username, email, password, role } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const newUser = new User({ username, email, password, role, isApproved: false });
    await newUser.save();

    res.status(201).json({ message: "Registration successful, pending admin approval" });
  } catch (error) {
    res.status(500).json({ message: "Error registering user", error });
  }
};

// @desc Login user
// @route POST /api/auth/login
// @access Public
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.isApproved) {
      return res.status(403).json({ message: "Account pending admin approval" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    res.json({
      _id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      token: generateToken(user.id),
    });
  } catch (error) {
    res.status(500).json({ message: "Error logging in", error });
  }
};

// @desc Admin approve/reject user
// @route PUT /api/auth/approve/:id
// @access Admin Only
const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isApproved = req.body.isApproved;
    await user.save();

    res.json({ message: `User ${req.body.isApproved ? "approved" : "rejected"}` });
  } catch (error) {
    res.status(500).json({ message: "Error updating user approval", error });
  }
};

module.exports = { registerUser, loginUser, approveUser };
