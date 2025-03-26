const express = require("express");
const connectDB = require("./config/db");
const cors = require("cors");
require("dotenv").config();


const clientRouter = require("./routes/ClientRoutes");
const companyRouter = require("./routes/companyRoutes");

const app = express();
app.use(express.json());
app.use(cors());

connectDB();


// Register the client routes
app.use("/api/clients", clientRouter);
app.use("/api/companies", companyRouter);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
