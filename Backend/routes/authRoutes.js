const express = require("express");
const { registerUser, loginUser, approveUser } = require("../controllers/authController");
const { protect, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.put("/approve/:id", protect, isAdmin, approveUser);

module.exports = router;
