const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
const path = require("path"); // Add path module import
require("dotenv").config();

const clientRouter = require("./routes/ClientRoutes");
const companyRouter = require("./routes/companyRoutes");
const adminRouter = require("./routes/adminRoutes");
const authRouter = require("./routes/authRoutes");
const utilRoutes = require('./routes/utilRoutes');
const staffRouter = require("./routes/staffRoutes");
const portfolioRoutes = require('./routes/portfolioRoutes');
const publicRoutes = require('./routes/publicRoutes');
const ProposalRoutes = require('./routes/proposalRoutes');
const notificationRoutes = require('./routes/notificationRoutes'); // Import the notification routes
const chatRoutes = require('./routes/chatRoutes'); // Import the chat routes
const projectRoutes = require('./routes/projectRoutes'); // Import the project routes
const meetingRoutes = require('./routes/meetingRoutes'); // Import the meeting routes
const app = express();
app.use(express.json());

app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
connectDB();

// In server.js
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Register the client routes
app.use("/api/clients", clientRouter);
app.use("/api/companies", companyRouter);
app.use("/api/admin", adminRouter);
app.use("/api/auth", authRouter);
app.use('/api/utils', utilRoutes);
app.use("/api/staff", staffRouter);
app.use('/api/proposal', ProposalRoutes);


// Remove the duplicate - keep only one portfolio route registration
// app.use('/api/companies/portfolio', portfolioRoutes);
app.use('/api/portfolio', portfolioRoutes);

app.use('/api/public', publicRoutes);
app.use('/api/notifications', notificationRoutes); // Add the notification routes
app.use('/api/chat', chatRoutes); // Add the chat routes
app.use('/api/projects', projectRoutes); // Add the project routes
app.use('/api/meetings', meetingRoutes); // Add the meeting routes

// Make uploads directory static so files can be accessed
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const http = require("http");
const { Server } = require("socket.io");
const socketHandlers = require("./utils/socketHandlers"); // Import socket handlers

// Create an HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Use socket handlers
io.on("connection", (socket) => {
  console.log("A user connected: ", socket.id);
  socketHandlers.handleConnection(socket, io);
});

// Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
