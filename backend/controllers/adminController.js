const db = require("../firebase");
const admin = require("firebase-admin");
const { validationResult } = require("express-validator");
const userController = require("./userController");
const reviewController = require("./reviewController");
const bookingController = require("./bookingController");
const statsController = require("./statsController");

// ==================== Users Management ====================

/**
 * Get all users
 * @route GET /api/admin/users
 * @access Private (Admin only)
 */
exports.getAllUsers = async (req, res) => {
  try {
    // Log request for debugging
    console.log("[Admin API] Getting all users");

    // Get all users from Firestore
    const usersSnapshot = await db.collection("users").get();

    if (usersSnapshot.empty) {
      return res.status(200).json([]);
    }

    // Map users to array
    const users = usersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Don't send sensitive data
      password: undefined,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    }));

    console.log(`[Admin API] Retrieved ${users.length} users`);
    return res.status(200).json(users);
  } catch (error) {
    console.error("[Admin API] Error getting users:", error);
    return res.status(500).json({
      message: "Server error while fetching users",
      error: error.message,
    });
  }
};

/**
 * Update user status
 * @route PUT /api/admin/users/:userId/status
 * @access Private (Admin only)
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    console.log(`[Admin API] Updating user ${userId} status to ${status}`);

    // Validate input
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // Check if user exists
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user status
    await userRef.update({
      isActive: status === "active" ? true : false,
      updatedAt: new Date().toISOString(),
    });

    console.log(`[Admin API] User ${userId} status updated to ${status}`);
    return res.status(200).json({
      message: "User status updated successfully",
    });
  } catch (error) {
    console.error("[Admin API] Error updating user status:", error);
    return res.status(500).json({
      message: "Server error while updating user status",
      error: error.message,
    });
  }
};

// ==================== Reviews Management ====================

/**
 * Get all reviews
 * @route GET /api/admin/reviews
 * @access Private (Admin only)
 */
exports.getAllReviews = async (req, res) => {
  try {
    console.log("[Admin API] Getting all reviews");

    // Get all reviews from Firestore
    const reviewsSnapshot = await db.collection("reviews").get();

    if (reviewsSnapshot.empty) {
      return res.status(200).json([]);
    }

    // Get reviews with populated user and car data
    const reviews = await Promise.all(
      reviewsSnapshot.docs.map(async (doc) => {
        const review = {
          id: doc.id,
          ...doc.data(),
        };

        // Populate user data if userId exists
        if (review.userId) {
          const userDoc = await db.collection("users").doc(review.userId).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            review.user = {
              id: userDoc.id,
              name: userData.firstName + " " + userData.lastName,
              email: userData.email,
              // Don't include sensitive user data
              password: undefined,
            };
          }
        }

        // Populate car data if carId exists
        if (review.carId) {
          const carDoc = await db.collection("cars").doc(review.carId).get();
          if (carDoc.exists) {
            review.car = {
              id: carDoc.id,
              ...carDoc.data(),
            };
          }
        }

        return review;
      })
    );

    console.log(`[Admin API] Retrieved ${reviews.length} reviews`);
    return res.status(200).json(reviews);
  } catch (error) {
    console.error("[Admin API] Error getting reviews:", error);
    return res.status(500).json({
      message: "Server error while fetching reviews",
      error: error.message,
    });
  }
};

/**
 * Moderate a review
 * @route PUT /api/admin/reviews/:reviewId/moderate
 * @access Private (Admin only)
 */
exports.moderateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { status, moderationComment } = req.body;

    console.log(
      `[Admin API] Moderating review ${reviewId} with status ${status}`
    );

    // Validate input
    if (!reviewId) {
      return res.status(400).json({ message: "Review ID is required" });
    }

    if (!status || !["approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ message: "Valid status (approved or rejected) is required" });
    }

    // Check if review exists
    const reviewRef = db.collection("reviews").doc(reviewId);
    const reviewDoc = await reviewRef.get();

    if (!reviewDoc.exists) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Update review with moderation data
    await reviewRef.update({
      status,
      moderationComment: moderationComment || "",
      moderatedAt: new Date().toISOString(),
      moderatedBy: req.user.id,
    });

    // Get updated review with populated data for response
    const updatedReviewDoc = await reviewRef.get();
    const updatedReview = {
      id: updatedReviewDoc.id,
      ...updatedReviewDoc.data(),
    };

    // Populate user data
    if (updatedReview.userId) {
      const userDoc = await db
        .collection("users")
        .doc(updatedReview.userId)
        .get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        updatedReview.user = {
          id: userDoc.id,
          name: userData.firstName + " " + userData.lastName,
          email: userData.email,
        };
      }
    }

    // Populate car data
    if (updatedReview.carId) {
      const carDoc = await db.collection("cars").doc(updatedReview.carId).get();
      if (carDoc.exists) {
        updatedReview.car = {
          id: carDoc.id,
          ...carDoc.data(),
        };
      }
    }

    console.log(`[Admin API] Review ${reviewId} moderated successfully`);
    return res.status(200).json(updatedReview);
  } catch (error) {
    console.error("[Admin API] Error moderating review:", error);
    return res.status(500).json({
      message: "Server error while moderating review",
      error: error.message,
    });
  }
};

/**
 * Reset review moderation
 * @route PUT /api/admin/reviews/:reviewId/reset
 * @access Private (Admin only)
 */
exports.resetReviewModeration = async (req, res) => {
  try {
    const { reviewId } = req.params;

    console.log(`[Admin API] Resetting moderation for review ${reviewId}`);

    // Validate input
    if (!reviewId) {
      return res.status(400).json({ message: "Review ID is required" });
    }

    // Check if review exists
    const reviewRef = db.collection("reviews").doc(reviewId);
    const reviewDoc = await reviewRef.get();

    if (!reviewDoc.exists) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Reset review moderation
    await reviewRef.update({
      status: "pending",
      moderationComment: "",
      moderatedAt: null,
    });

    // Get updated review with populated data for response
    const updatedReviewDoc = await reviewRef.get();
    const updatedReview = {
      id: updatedReviewDoc.id,
      ...updatedReviewDoc.data(),
    };

    // Populate user data
    if (updatedReview.userId) {
      const userDoc = await db
        .collection("users")
        .doc(updatedReview.userId)
        .get();
      if (userDoc.exists) {
        const userData = userDoc.data();
        updatedReview.user = {
          id: userDoc.id,
          name: userData.firstName + " " + userData.lastName,
          email: userData.email,
        };
      }
    }

    // Populate car data
    if (updatedReview.carId) {
      const carDoc = await db.collection("cars").doc(updatedReview.carId).get();
      if (carDoc.exists) {
        updatedReview.car = {
          id: carDoc.id,
          ...carDoc.data(),
        };
      }
    }

    console.log(`[Admin API] Review ${reviewId} moderation reset successfully`);
    return res.status(200).json(updatedReview);
  } catch (error) {
    console.error("[Admin API] Error resetting review moderation:", error);
    return res.status(500).json({
      message: "Server error while resetting review moderation",
      error: error.message,
    });
  }
};

// ==================== Bookings Management ====================

/**
 * Get all bookings
 * @route GET /api/admin/bookings
 * @access Private (Admin only)
 */
exports.getAllBookings = async (req, res) => {
  try {
    console.log("[Admin API] Getting all bookings");

    // Get all bookings from Firestore - NOTE: Using reservations collection instead of bookings
    const bookingsSnapshot = await db.collection("reservations").get();

    if (bookingsSnapshot.empty) {
      console.log("[Admin API] No bookings found in database");
      return res.status(200).json([]);
    }

    // Get bookings with populated user and car data
    const bookings = await Promise.all(
      bookingsSnapshot.docs.map(async (doc) => {
        const booking = {
          id: doc.id,
          ...doc.data(),
        };

        // Populate user data if userId exists
        if (booking.userId) {
          const userDoc = await db
            .collection("users")
            .doc(booking.userId)
            .get();
          if (userDoc.exists) {
            const userData = userDoc.data();

            // Extract or construct firstName and lastName for the frontend
            let firstName = "";
            let lastName = "";

            if (userData.firstName && userData.lastName) {
              firstName = userData.firstName;
              lastName = userData.lastName;
            } else if (userData.name) {
              // If only full name is available, split it
              const nameParts = userData.name.split(" ");
              firstName = nameParts[0] || "";
              lastName = nameParts.slice(1).join(" ") || "";
            }

            booking.user = {
              id: userDoc.id,
              firstName,
              lastName,
              name: userData.firstName
                ? `${userData.firstName} ${userData.lastName}`
                : userData.name || "Unknown",
              email: userData.email,
              // Don't include sensitive user data
              password: undefined,
            };
          }
        }

        // Populate car data if carId exists
        if (booking.carId) {
          const carDoc = await db.collection("cars").doc(booking.carId).get();
          if (carDoc.exists) {
            const carData = carDoc.data();
            booking.car = {
              id: carDoc.id,
              brand: carData.brand || carData.make || "",
              model: carData.model || "",
              ...carData,
            };
          }
        }

        return booking;
      })
    );

    console.log(`[Admin API] Retrieved ${bookings.length} bookings`);
    return res.status(200).json(bookings);
  } catch (error) {
    console.error("[Admin API] Error getting bookings:", error);
    return res.status(500).json({
      message: "Server error while fetching bookings",
      error: error.message,
    });
  }
};

/**
 * Update booking status
 * @route PUT /api/admin/bookings/:bookingId/status
 * @access Private (Admin only)
 */
exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    console.log(
      `[Admin API] Updating booking ${bookingId} status to ${status}`
    );

    // Validate input
    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    if (!status || !["active", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({
        message: "Valid status (active, completed, or cancelled) is required",
      });
    }

    // Check if booking exists - NOTE: Using reservations collection instead of bookings
    const bookingRef = db.collection("reservations").doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Update booking status
    await bookingRef.update({
      status,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.id,
    });

    console.log(`[Admin API] Booking ${bookingId} status updated to ${status}`);
    return res.status(200).json({
      message: "Booking status updated successfully",
    });
  } catch (error) {
    console.error("[Admin API] Error updating booking status:", error);
    return res.status(500).json({
      message: "Server error while updating booking status",
      error: error.message,
    });
  }
};

// ==================== Dashboard Stats ====================

/**
 * Get dashboard stats
 * @route GET /api/admin/dashboard/stats
 * @access Private (Admin only)
 */
exports.getDashboardStats = async (req, res) => {
  try {
    console.log("[Admin API] Getting dashboard stats");

    // Get active bookings count - NOTE: Using reservations collection instead of bookings
    const activeBookingsQuery = db
      .collection("reservations")
      .where("status", "==", "active");
    const activeBookingsSnapshot = await activeBookingsQuery.get();
    const activeBookingsCount = activeBookingsSnapshot.size;

    // Get pending reviews count
    const pendingReviewsQuery = db
      .collection("reviews")
      .where("status", "==", "pending");
    const pendingReviewsSnapshot = await pendingReviewsQuery.get();
    const pendingReviewsCount = pendingReviewsSnapshot.size;

    // Get available cars count - NOTE: Using 'available' field instead of 'status'
    const availableCarsQuery = db
      .collection("cars")
      .where("available", "==", true);
    const availableCarsSnapshot = await availableCarsQuery.get();
    const availableCarsCount = availableCarsSnapshot.size;

    // Get total users count
    const usersSnapshot = await db.collection("users").get();
    const totalUsersCount = usersSnapshot.size;

    // Construct stats object
    const stats = {
      activeBookings: activeBookingsCount,
      pendingReviews: pendingReviewsCount,
      availableCars: availableCarsCount,
      totalUsers: totalUsersCount,
      // Include additional stats
      stats: [
        activeBookingsCount,
        totalUsersCount,
        pendingReviewsCount,
        availableCarsCount,
      ],
    };

    console.log("[Admin API] Dashboard stats retrieved successfully", stats);
    return res.status(200).json(stats);
  } catch (error) {
    console.error("[Admin API] Error getting dashboard stats:", error);
    return res.status(500).json({
      message: "Server error while fetching dashboard stats",
      error: error.message,
    });
  }
};
