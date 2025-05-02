const Client = require("../models/Client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Notification = require('../models/Notification');

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
    // Check if req.user exists before attempting to access properties
    if (!req.user) {
      console.error("Auth middleware failure: req.user is undefined");
      return res.status(401).json({ 
        message: "Authentication failed. Please login again.",
        error: "NO_USER_IN_REQUEST"
      });
    }

    console.log("Fetching profile for user ID:", req.user.id);
    
    const client = await Client.findById(req.user.id).select('-password');
    
    if (!client) {
      console.log("Client not found for ID:", req.user.id);
      return res.status(404).json({ message: "Client not found" });
    }
    
    // Just use the profilePicture field directly without modification
    // S3 URLs are already complete URLs that don't need modification
    const profilePictureUrl = client.profilePicture || null;
    
    // Log the profile picture URL for debugging
    console.log("Profile picture URL:", profilePictureUrl);
    
    res.status(200).json({
      success: true,
      data: {
        _id: client._id,
        fullName: client.fullName,
        email: client.email,
        profilePicture: profilePictureUrl,
        username: client.username,
        companyName: client.companyName || "",
        clientType: client.clientType || "individual",
        primaryContact: client.primaryContact || "",
        address: client.address || "",
        preferredCommunication: client.preferredCommunication || "email"
      }
    });
  } catch (error) {
    console.error("Detailed error:", {
      message: error.message,
      stack: error.stack,
      fullError: error
    });
    res.status(500).json({ 
      success: false,
      message: "Server error retrieving profile",
      error: error.message
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

// Update client profile
exports.updateClientProfile = async (req, res) => {
  try {
    // Only allow specific fields to be updated
    const { fullName, email, address, primaryContact } = req.body;
    
    // Find the client by ID from the authenticated user
    const client = await Client.findById(req.user.id);
    
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    // Update only the provided fields
    if (fullName) client.fullName = fullName;
    if (email) client.email = email;
    if (address) client.address = address;
    if (primaryContact) client.primaryContact = primaryContact;
    
    await client.save();
    
    res.status(200).json({ 
      success: true, 
      message: "Profile updated successfully",
      data: {
        fullName: client.fullName,
        email: client.email,
        address: client.address,
        primaryContact: client.primaryContact,
        profilePicture: client.profilePicture
      }
    });
    
  } catch (error) {
    console.error("Error updating client profile:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Update client password
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Both current and new password are required" 
      });
    }
    
    // Find the client by ID
    const client = await Client.findById(req.user.id);
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, client.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }
    
    // Validate new password
    if (newPassword.length < 8) {
      return res.status(400).json({ 
        success: false, 
        message: "New password must be at least 8 characters long" 
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    client.password = await bcrypt.hash(newPassword, salt);
    
    await client.save();
    
    res.status(200).json({ success: true, message: "Password updated successfully" });
    
  } catch (error) {
    console.error("Error updating password:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Upload profile picture
exports.uploadProfilePicture = async (req, res) => {
  try {
    console.log("Upload request received", { 
      file: req.file, 
      body: req.body
    });
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: "No profile picture file found in the request" 
      });
    }
    
    // With S3, multer-s3 will add a 'location' property to the file object with the S3 URL
    const profilePictureUrl = req.file.location;
    
    // Update client with new profile picture
    const client = await Client.findByIdAndUpdate(
      req.user.id,
      { profilePicture: profilePictureUrl },
      { new: true }
    );
    
    if (!client) {
      return res.status(404).json({ success: false, message: "Client not found" });
    }
    
    res.status(200).json({ 
      success: true, 
      message: "Profile picture uploaded successfully",
      profilePictureUrl
    });
    
  } catch (error) {
    console.error("Error uploading profile picture:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// Get proposal status notifications for a client
exports.getProposalNotifications = async (req, res) => {
  try {
    const clientId = req.user._id;
    
    // Find notifications related to client's proposals
    const notifications = await Notification.find({ 
      userId: clientId,
      type: { $in: ['proposal_approved', 'proposal_rejected'] }
    })
    .populate('proposal', 'projectTitle status')
    .sort({ createdAt: -1 })
    .limit(10);
    
    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error getting proposal notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving notifications',
      error: error.message
    });
  }
};

// Get all notifications for a client
exports.getAllNotifications = async (req, res) => {
  try {
    const clientId = req.user._id;
    
    const notifications = await Notification.find({ userId: clientId })
      .populate('proposal', 'projectTitle status')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error getting all notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving notifications',
      error: error.message
    });
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const clientId = req.user._id;
    
    const notification = await Notification.findOne({ 
      _id: id,
      userId: clientId
    });
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification',
      error: error.message
    });
  }
};
