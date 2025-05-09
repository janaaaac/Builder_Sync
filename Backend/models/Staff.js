const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const StaffSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: ['project_manager', 'architect', 'engineer', 'quantity_surveyor', ]
  },
  profilePicture: { type: String },
  company: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company',
    required: true 
  },
  isFirstLogin: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  isApproved: { 
    type: Boolean, 
    default: true // Set to false if staff need manual approval
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: false // Only set if staff is assigned to a client
  }
});

// Hash password before saving

StaffSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
  });
// Compare Password

StaffSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    // Using direct comparison with the stored hash
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
};

module.exports = mongoose.model("Staff", StaffSchema);