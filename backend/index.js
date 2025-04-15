const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

// Set default environment if not specified
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = "development";
}

// Log application startup information
console.log(`Starting DriveNow API in ${process.env.NODE_ENV} mode`);
console.log(`Server time: ${new Date().toISOString()}`);

// Import route files
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const carRoutes = require("./routes/cars");
const reviewRoutes = require("./routes/reviews");
const bookingRoutes = require("./routes/bookings");
const invoiceRoutes = require("./routes/invoiceRoutes");
const locationRoutes = require("./routes/locations");
const contactRoutes = require("./routes/contact");
const discountRoutes = require("./routes/discounts");
const statsRoutes = require("./routes/stats");

const app = express();

// Middleware
app.use(cors());
app.use(helmet());

// Enhanced logging in development mode
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Increase JSON payload limit for large requests
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging middleware for debugging in development
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cars", carRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/discountCoupons", discountRoutes);
app.use("/api/stats", statsRoutes);

// Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "DriveNow API is running",
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  console.error("Error stack:", err.stack);

  // Send different error format in development vs production
  if (process.env.NODE_ENV === "development") {
    res.status(500).json({
      error: true,
      message: err.message || "Something went wrong on the server",
      stack: err.stack,
      path: req.path,
    });
  } else {
    res.status(500).json({
      error: true,
      message: "Internal server error",
    });
  }
});

// Not found middleware
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    error: true,
    message: "Route not found",
    path: req.originalUrl,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
  console.log(`http://localhost:${PORT}`);
});

module.exports = app;
