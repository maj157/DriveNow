const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { authenticate, isAdmin } = require("../middleware/auth");
// Import the Firestore database directly
const db = require("../firebase");
const admin = require("firebase-admin");

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

// Get all reviews
router.get("/all-reviews", async (req, res) => {
  try {
    const reviewsRef = db.collection("reviews");
    const snapshot = await reviewsRef.get();

    const reviews = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(reviews);
  } catch (error) {
    console.error("Error getting reviews:", error);
    res.status(500).json({ error: true, message: "Failed to get reviews" });
  }
});

// Submit a new review
router.post("/submit", authenticate, async (req, res) => {
  try {
    // Get user info from authentication token
    const { userId } = req.user;

    if (!userId) {
      console.error("No userId found in authenticated request");
      return res.status(401).json({
        error: true,
        message: "Authentication failed - no user ID found",
      });
    }

    console.log("Authenticated user submitting review:", userId);

    // Validate required fields
    const { comment, stars } = req.body;
    if (!comment || !stars) {
      return res.status(400).json({
        error: true,
        message: "Comment and star rating are required fields",
      });
    }

    // Format the review data
    const reviewData = {
      ...req.body,
      userId,
      status: "pending",
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().split("T")[0], // Format as YYYY-MM-DD
    };

    console.log("Review data being submitted:", reviewData);

    // Add to Firestore using admin SDK
    const docRef = await db.collection("reviews").add(reviewData);

    console.log("Review successfully added to Firestore with ID:", docRef.id);

    res.status(201).json({
      success: true,
      reviewId: docRef.id,
      message: "Review submitted successfully and pending approval",
    });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({
      error: true,
      message: "Failed to submit review",
      details: error.message,
    });
  }
});

// Test endpoint for debugging - TEMPORARY, DO NOT USE IN PRODUCTION
router.post("/test-submit", async (req, res) => {
  try {
    console.log("Received test review submission data:", req.body);

    // Validate required fields
    const { comment, stars, userId } = req.body;
    if (!comment || !stars || !userId) {
      return res.status(400).json({
        error: true,
        message: "Comment, stars, and userId are required fields",
      });
    }

    // Format the review data
    const reviewData = {
      ...req.body,
      status: "pending",
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().split("T")[0], // Format as YYYY-MM-DD
    };

    console.log("Test review data being submitted:", reviewData);

    // Add to Firestore using admin SDK
    const docRef = await db.collection("reviews").add(reviewData);

    console.log(
      "Test review successfully added to Firestore with ID:",
      docRef.id
    );

    res.status(201).json({
      success: true,
      reviewId: docRef.id,
      message: "Test review submitted successfully and pending approval",
    });
  } catch (error) {
    console.error("Error submitting test review:", error);
    res.status(500).json({
      error: true,
      message: "Failed to submit test review",
      details: error.message,
    });
  }
});

// Get reviews for a specific car
router.get("/car/:carId", async (req, res) => {
  try {
    const { carId } = req.params;

    const reviewsRef = db.collection("reviews");
    const snapshot = await reviewsRef
      .where("carId", "==", carId)
      .where("status", "==", "approved")
      .get();

    const reviews = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(reviews);
  } catch (error) {
    console.error("Error getting car reviews:", error);
    res.status(500).json({ error: true, message: "Failed to get car reviews" });
  }
});

// Get user's reviews (requires authentication)
router.get("/user", authenticate, async (req, res) => {
  try {
    const { userId } = req.user;

    const reviewsRef = db.collection("reviews");
    const snapshot = await reviewsRef.where("userId", "==", userId).get();

    const reviews = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(reviews);
  } catch (error) {
    console.error("Error getting user reviews:", error);
    res
      .status(500)
      .json({ error: true, message: "Failed to get user reviews" });
  }
});

// Get reviews by status (admin only)
router.get("/moderated/:status", authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        error: true,
        message: "Unauthorized access: Admin privileges required",
      });
    }

    const { status } = req.params;
    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        error: true,
        message: "Invalid status parameter",
      });
    }

    const reviewsRef = db.collection("reviews");
    const snapshot = await reviewsRef.where("status", "==", status).get();

    const reviews = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(reviews);
  } catch (error) {
    console.error("Error getting reviews by status:", error);
    res
      .status(500)
      .json({ error: true, message: "Failed to get reviews by status" });
  }
});

// Moderate a review (admin only)
router.put("/:reviewId/moderate", authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({
        error: true,
        message: "Unauthorized access: Admin privileges required",
      });
    }

    const { reviewId } = req.params;
    const { status, moderationComment } = req.body;

    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({
        error: true,
        message: "Invalid status parameter",
      });
    }

    const reviewRef = db.collection("reviews").doc(reviewId);
    const reviewDoc = await reviewRef.get();

    if (!reviewDoc.exists) {
      return res.status(404).json({
        error: true,
        message: "Review not found",
      });
    }

    // Update the review with moderation data
    await reviewRef.update({
      status,
      moderationComment: moderationComment || "",
      moderatedAt: new Date().toISOString(),
    });

    // Get the updated review
    const updatedReviewDoc = await reviewRef.get();

    res.json({
      id: updatedReviewDoc.id,
      ...updatedReviewDoc.data(),
    });
  } catch (error) {
    console.error("Error moderating review:", error);
    res.status(500).json({ error: true, message: "Failed to moderate review" });
  }
});

module.exports = router;
