const express = require("express");
const { login, registerAdmin, verifyToken } = require("../controllers/authController");

const router = express.Router();

// Login route for Admin, Client, and Company
router.post("/login", login);

// Admin Registration (For initial setup)
router.post("/register", registerAdmin); // Simplified route path

// Token verification endpoint
router.get("/verify", verifyToken);

// router.post('/create', uploadFields, clientController.createClient);

module.exports = router;
