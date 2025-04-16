const express = require("express");
const router = express.Router();
const { authenticate, isAdmin } = require("../middleware/auth");
const adminController = require("../controllers/adminController");

// Middleware to ensure all admin routes are authenticated AND admin
router.use(authenticate, isAdmin);

// ==================== Users Management ====================
router.get("/users", adminController.getAllUsers);
router.put("/users/:userId/status", adminController.updateUserStatus);

// ==================== Reviews Management ====================
router.get("/reviews", adminController.getAllReviews);
router.put("/reviews/:reviewId/moderate", adminController.moderateReview);
router.put("/reviews/:reviewId/reset", adminController.resetReviewModeration);

// ==================== Bookings Management ====================
router.get("/bookings", adminController.getAllBookings);
router.put("/bookings/:bookingId/status", adminController.updateBookingStatus);

// ==================== Dashboard Stats ====================
router.get("/dashboard/stats", adminController.getDashboardStats);

module.exports = router;
