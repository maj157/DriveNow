const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

// Import route files
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const carRoutes = require("./routes/cars");
const reviewRoutes = require("./routes/reviews");
const bookingRoutes = require("./routes/bookings");
const invoiceRoutes = require("./routes/invoiceRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/invoices", invoiceRoutes);

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({ message: "DriveNow API is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: true,
    message: err.message || "Something went wrong on the server",
  });
});

// Not found middleware
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
