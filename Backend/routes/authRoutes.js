const express = require("express");
const { login, registerAdmin } = require("../controllers/authController");

const router = express.Router();

// Login route for Admin, Client, and Company
router.post("/login", login);

// Admin Registration (For initial setup)
router.post("/admin/register", registerAdmin);

module.exports = router;
