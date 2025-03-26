const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    companyName: { type: String },
    clientType: { type: String, required: true },
    nicPassportNumber: { type: String, required: true },
    nicPassportFile: { type: String, required: true }, // AWS S3 URL for NIC/Passport file
    profilePicture: { type: String, required: true }, // AWS S3 URL for profile picture
    primaryContact: { type: String, required: true },
    address: { type: String, required: true },
    preferredCommunication: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Client", clientSchema);
