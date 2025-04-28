const mongoose = require("mongoose");
const crypto = require("crypto");

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "default_key_1234567890123456"; // 32 bytes key
const IV_LENGTH = 16; // AES block size

// Validate encryption key length
if (ENCRYPTION_KEY.length !== 32) {
  throw new Error("ENCRYPTION_KEY must be exactly 32 characters long.");
}

function encrypt(text) {
  if (!text || typeof text !== "string") {
    console.error("Invalid input for encryption:", text);
    return text; // Return the original text if input is invalid
  }
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text, "utf8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  } catch (error) {
    console.error("Encryption error:", error);
    return text; // Return the original text if encryption fails
  }
}

function decrypt(text) {
  if (!text || typeof text !== "string") {
    console.error("Invalid input for decryption:", text);
    return text || ""; // Return an empty string if input is invalid
  }
  try {
    const textParts = text.split(":");
    const iv = Buffer.from(textParts[0], "hex");
    const encryptedText = Buffer.from(textParts[1], "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString("utf8");
  } catch (error) {
    console.error("Decryption error:", error);
    return text; // Return the encrypted text if decryption fails
  }
}

const ChatSchema = new mongoose.Schema({
  room: { type: String, required: true }, // Room identifier (e.g., project ID)
  messages: [
    {
      sender: { type: String, required: true }, // Sender's ID or name
      message: {
        type: String,
        required: true,
        set: encrypt, // Encrypt before saving
        get: decrypt, // Decrypt when retrieving
      },
      timestamp: { type: Date, default: Date.now },
      readBy: { type: [String], default: [] }, // Track users who have read the message
      fileUrl: { type: String }, // Optional file attachment URL
    },
  ],
}, { toJSON: { getters: true }, toObject: { getters: true } });

module.exports = mongoose.model("Chat", ChatSchema);