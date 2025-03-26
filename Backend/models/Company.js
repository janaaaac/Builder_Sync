const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const CompanySchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  companyName: { type: String, required: true },
  businessRegNumber: { type: String, required: true },
  businessType: { type: String, required: true },
  establishmentYear: { type: String, required: true },
  companyLogo: { type: String }, // AWS S3 URL
  registeredOfficeAddress: { type: String, required: true },
  branchOfficeAddress: { type: String },
  contactPersonName: { type: String, required: true },
  contactPhoneNumber: { type: String, required: true },
  websiteURL: { type: String },
  cidaRegNumber: { type: String, required: true },
  cidaGrade: { type: String, required: true },
  specializedLicenses: [{ type: String }], // Array for multiple licenses
  isoCertifications: [{ type: String }], // Array for multiple certifications
});

// Hash password before saving
CompanySchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare Password
CompanySchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Company", CompanySchema);
