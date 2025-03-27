const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
require("dotenv").config();


const clientRouter = require("./routes/ClientRoutes");
const companyRouter = require("./routes/companyRoutes");
const adminRouter = require("./routes/adminRoutes");
const authRouter = require("./routes/authRoutes");
const app = express();
app.use(express.json());
app.use(cors());

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

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
