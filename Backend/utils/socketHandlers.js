const Chat = require("../models/Chat");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const s3Presigner = require("./s3Presigner");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "../uploads/chat");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Handle Socket.IO connection events
function handleConnection(socket, io) {
  console.log("A user connected: ", socket.id);

  // Join a room (e.g., chat room for a specific project)
  socket.on("joinRoom", (room) => {
    socket.join(room);
    console.log(`User ${socket.id} joined room: ${room}`);
  });

  // Handle sending messages
  socket.on("sendMessage", async (data) => {
    const { room, message, sender } = data;

    try {
      // Find or create a chat room
      let chat = await Chat.findOne({ room });
      if (!chat) {
        chat = new Chat({ room, messages: [] });
      }

      // Add the new message to the chat
      chat.messages.push({ sender, message }); // Encryption happens automatically in the model
      await chat.save();

      // Emit the message to all users in the room
      io.to(room).emit("receiveMessage", { message, sender, timestamp: new Date() });
    } catch (error) {
      console.error("Error saving message: ", error);
    }
  });

  // Handle typing indicators
  socket.on("typing", (data) => {
    const { room, user } = data;
    socket.to(room).emit("userTyping", { user });
  });

  // Handle read receipts
  socket.on("messageRead", async ({ room, messageId, user }) => {
    try {
      await Chat.updateOne(
        { room, "messages._id": messageId },
        { $addToSet: { "messages.$.readBy": user } }
      );
      // Optionally emit an update to the room
      io.to(room).emit("messageReadUpdate", { messageId, user });
    } catch (error) {
      console.error("Error updating read receipt:", error);
    }
  });

  // Handle fetching messages
  socket.on("fetchMessages", async (room, callback) => {
    try {
      const chat = await Chat.findOne({ room });
      if (chat) {
        callback(chat.messages); // Decryption happens automatically in the model
      } else {
        callback([]); // Return an empty array if no chat exists
      }
    } catch (error) {
      console.error("Error fetching messages: ", error);
      callback([]); // Return an empty array on error
    }
  });

  // Register this ONCE per connection, not inside fileUpload
  socket.on("fileUploaded", async (data) => {
    const { room, sender, fileUrl } = data;
    try {
      let chat = await Chat.findOne({ room });
      if (!chat) {
        chat = new Chat({ room, messages: [] });
      }
      chat.messages.push({
        sender,
        message: "File shared",
        fileUrl,
        timestamp: new Date(),
      });
      await chat.save();

      // Emit the file message to the room
      io.to(room).emit("fileShared", {
        sender,
        fileUrl,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error("Error saving file metadata: ", error);
    }
  });

  // Handle file sharing with AWS S3
  socket.on("fileUpload", async (data, callback) => {
    const { room, sender, fileName, fileType } = data;

    try {
      // Generate a pre-signed URL for uploading the file to S3
      const presignedUrl = await s3Presigner.getPresignedUrl(fileName, fileType);

      // Emit the pre-signed URL back to the client
      callback({ success: true, presignedUrl });
    } catch (error) {
      console.error("Error generating presigned URL: ", error);
      callback({ success: false, error: "Failed to generate presigned URL" });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected: ", socket.id);
  });
}

module.exports = { handleConnection };