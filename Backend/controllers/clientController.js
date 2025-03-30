const Client = require("../models/Client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Create a new client
exports.createClient = async (req, res) => {
    try {
      const {
        username,
        email,
        password,
        fullName,
        companyName,
        clientType,
        nicPassportNumber,
        primaryContact,
        address,
        preferredCommunication,
      } = req.body;
  
      // Get the S3 file URLs or file paths from the request (based on multer-s3 configuration)
      const nicPassportFile = req.files['nicPassportFile'] ? req.files['nicPassportFile'][0].location : null;
      const profilePicture = req.files['profilePicture'] ? req.files['profilePicture'][0].location : null;
  
      // Check if email or username already exists
      const existingClient = await Client.findOne({
        $or: [{ email }, { username }],
      });
  
      if (existingClient) {
        return res.status(400).json({ message: "Email or username already exists" });
      }
  
      // Encrypt password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      // Create new client
      const newClient = new Client({
        username,
        email,
        password: hashedPassword,
        fullName,
        companyName,
        clientType,
        nicPassportNumber,
        nicPassportFile,  // Save the file URL from S3
        profilePicture,    // Save the file URL from S3
        primaryContact,
        address,
        preferredCommunication,
      });
  
      await newClient.save();
      res.status(201).json({ message: "Client created successfully", client: newClient });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  };
  

// Fetch all clients
exports.getClients = async (req, res) => {
  try {
    const clients = await Client.find();
    res.status(200).json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Fetch a specific client by ID
exports.getClientById = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.status(200).json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getClientProfile = async (req, res) => {
  try {
    console.log("Fetching profile for user ID:", req.user.id); // Add this line
    
    const client = await Client.findById(req.user.id).select('-password');
    
    if (!client) {
      console.log("Client not found for ID:", req.user.id); // Add this line
      return res.status(404).json({ message: "Client not found" });
    }

    console.log("Found client:", client); // Add this line
    
    res.status(200).json({
      fullName: client.fullName,
      email: client.email,
      profilePicture: client.profilePicture,
      username: client.username,
      companyName: client.companyName
    });
  } catch (error) {
    console.error("Detailed error:", {
      message: error.message,
      stack: error.stack,
      fullError: error
    }); // Enhanced error logging
    res.status(500).json({ 
      message: "Server error",
      error: error.message // Send the actual error message to client
    });
  }
};
// Update client details
exports.updateClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.status(200).json({ message: "Client updated successfully", client });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a client
exports.deleteClient = async (req, res) => {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.status(200).json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
