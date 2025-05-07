const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const ClientSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, required: true },
  companyName: { type: String },
  clientType: { type: String, required: true },
  nicPassportNumber: { type: String, required: true },
  nicPassportFile: { type: String },
  profilePicture: { type: String }, 
  primaryContact: { type: String, required: true },
  address: { type: String, required: true },
  preferredCommunication: { type: String },
  isApproved: { type: Boolean, default: false }, // Admin Approval
});

// Hash password before saving
ClientSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare Password - Fixed implementation
ClientSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    // Using direct comparison with the stored hash
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (error) {
    console.error("Password comparison error:", error);
    return false;
  }
};

module.exports = mongoose.model("Client", ClientSchema);
