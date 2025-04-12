const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { authenticate, isAdmin } = require("../middleware/auth");

// Public routes
router.get("/", reviewController.getAllReviews); // Changed from getReviews
router.get("/car/:carId", reviewController.getVehicleReviews); // Using the correct method name
router.get("/random", reviewController.getRandomReviews);

// Protected routes - require authentication
router.get("/user/:userId", authenticate, reviewController.getUserReviews);
router.post("/", authenticate, reviewController.createReview);
router.put("/:id", authenticate, reviewController.updateReview);
router.delete("/:id", authenticate, reviewController.deleteReview);

// Admin routes
router.get(
  "/pending",
  authenticate,
  isAdmin,
  reviewController.getPendingReviews
);
router.get(
  "/status/:status",
  authenticate,
  isAdmin,
  reviewController.getModeratedReviews
);
router.patch(
  "/:id/moderate",
  authenticate,
  isAdmin,
  reviewController.moderateReview
);

module.exports = router;
