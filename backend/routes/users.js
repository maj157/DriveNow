const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const userController = require("../controllers/userController");

// GET /api/users/profile - Get user profile
router.get("/profile", authenticate, userController.getUserProfile);

// PUT /api/users/profile - Update user profile
router.put("/profile", authenticate, userController.updateUserProfile);

// GET /api/users/points - Get user loyalty points
router.get("/points", authenticate, userController.getUserPoints);

// GET /api/users/bookings - Get user bookings
router.get("/bookings", authenticate, userController.getUserBookings);

// GET /api/users/invoices - Get user invoices
router.get("/invoices", authenticate, userController.getUserInvoices);

// DELETE /api/users/bookings/:id - Delete user booking
router.delete("/bookings/:id", authenticate, userController.deleteBooking);

// POST /api/users/discount - Apply discount code
router.post("/discount", authenticate, userController.applyDiscount);

// POST /api/users/redeem-points - Redeem loyalty points
router.post("/redeem-points", authenticate, userController.redeemPoints);

module.exports = router;
