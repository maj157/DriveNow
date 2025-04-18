const db = require("../firebase");
const { v4: uuidv4 } = require("uuid");
const Review = require("../models/Review");
const Car = require("../models/car");
const Booking = require("../models/Booking");

// Explicitly declare all exports at the top
const reviewController = {
  getAllReviews: async (req, res) => {
    try {
      const {
        carId,
        userId,
        rating,
        sort = "date:desc",
        limit = 10,
        page = 1,
      } = req.query;

      // Create a reference to the reviews collection
      const reviewsCollection = db.collection("reviews");
      let query = reviewsCollection;

      // Apply filters
      if (carId) query = query.where("carId", "==", carId);
      if (userId) query = query.where("userId", "==", userId);
      if (rating) query = query.where("rating", "==", parseInt(rating));

      // Get total count
      const countSnapshot = await query.get();
      const totalCount = countSnapshot.size;

      // Apply sorting
      const [sortField, sortOrder] = sort.split(":");
      query = query.orderBy(sortField, sortOrder === "asc" ? "asc" : "desc");

      // Apply pagination
      const pageSize = parseInt(limit);
      const offset = (parseInt(page) - 1) * pageSize;
      query = query.limit(pageSize).offset(offset);

      // Execute query
      const snapshot = await query.get();

      // Map data
      const reviews = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json({
        success: true,
        count: reviews.length,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: parseInt(page),
        data: reviews,
      });
    } catch (error) {
      console.error("Error getting reviews:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving reviews",
        error: error.message,
      });
    }
  },

  getReviews: async (req, res) => {
    try {
      const {
        carId,
        userId,
        rating,
        sort = "date:desc",
        limit = 10,
        page = 1,
      } = req.query;

      // Create a reference to the reviews collection
      const reviewsCollection = db.collection("reviews");
      let query = reviewsCollection;

      // Apply filters
      if (carId) query = query.where("carId", "==", carId);
      if (userId) query = query.where("userId", "==", userId);
      if (rating) query = query.where("rating", "==", parseInt(rating));

      // Get total count
      const countSnapshot = await query.get();
      const totalCount = countSnapshot.size;

      // Apply sorting
      const [sortField, sortOrder] = sort.split(":");
      query = query.orderBy(sortField, sortOrder === "asc" ? "asc" : "desc");

      // Apply pagination
      const pageSize = parseInt(limit);
      const offset = (parseInt(page) - 1) * pageSize;
      query = query.limit(pageSize).offset(offset);

      // Execute query
      const snapshot = await query.get();

      // Map data
      const reviews = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json({
        success: true,
        count: reviews.length,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: parseInt(page),
        data: reviews,
      });
    } catch (error) {
      console.error("Error getting reviews:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving reviews",
        error: error.message,
      });
    }
  },

  getReviewById: async (req, res) => {
    try {
      const reviewDoc = await db.collection("reviews").doc(req.params.id).get();

      if (!reviewDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      res.status(200).json({
        success: true,
        data: {
          id: reviewDoc.id,
          ...reviewDoc.data(),
        },
      });
    } catch (error) {
      console.error(`Error getting review with ID ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: "Error retrieving review",
        error: error.message,
      });
    }
  },

  getVehicleReviews: async (req, res) => {
    try {
      const {
        sort = "date:desc",
        limit = 10,
        page = 1,
        minRating,
        maxRating,
      } = req.query;

      // Create a reference to the reviews collection and filter by carId
      const reviewsCollection = db.collection("reviews");
      let query = reviewsCollection.where("carId", "==", req.params.carId);

      // We can't directly use complex queries with Firestore, so we'll do some filtering in memory
      const snapshot = await query.get();
      let reviews = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Apply rating filters if provided
      if (minRating) {
        const minRatingValue = parseInt(minRating);
        reviews = reviews.filter((review) => review.rating >= minRatingValue);
      }

      if (maxRating) {
        const maxRatingValue = parseInt(maxRating);
        reviews = reviews.filter((review) => review.rating <= maxRatingValue);
      }

      // Calculate total count after filtering
      const totalCount = reviews.length;

      // Sort reviews
      const [sortField, sortOrder] = sort.split(":");
      reviews.sort((a, b) => {
        if (sortOrder === "asc") {
          return a[sortField] > b[sortField] ? 1 : -1;
        } else {
          return a[sortField] < b[sortField] ? 1 : -1;
        }
      });

      // Apply pagination
      const pageSize = parseInt(limit);
      const offset = (parseInt(page) - 1) * pageSize;
      const paginatedReviews = reviews.slice(offset, offset + pageSize);

      // Get car details
      const carDoc = await db.collection("cars").doc(req.params.carId).get();
      if (!carDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Car not found",
        });
      }
      const car = {
        id: carDoc.id,
        ...carDoc.data(),
      };

      // Calculate average rating
      let avgRating = 0;
      if (totalCount > 0) {
        const totalRating = reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        avgRating = totalRating / reviews.length;
      }

      res.status(200).json({
        success: true,
        count: paginatedReviews.length,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: parseInt(page),
        car: {
          id: car.id,
          make: car.make,
          model: car.model,
          year: car.year,
          avgRating,
        },
        data: paginatedReviews,
      });
    } catch (error) {
      console.error(
        `Error getting reviews for car ID ${req.params.carId}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Error retrieving car reviews",
        error: error.message,
      });
    }
  },

  getUserReviews: async (req, res) => {
    try {
      const { sort = "date:desc", limit = 10, page = 1 } = req.query;

      // Get reviews by user ID
      const reviewsCollection = db.collection("reviews");
      let query = reviewsCollection.where("userId", "==", req.params.userId);

      // Apply sorting
      const [sortField, sortOrder] = sort.split(":");
      query = query.orderBy(sortField, sortOrder === "asc" ? "asc" : "desc");

      // Execute query
      const snapshot = await query.get();
      const totalCount = snapshot.size;

      // Apply pagination
      const pageSize = parseInt(limit);
      const offset = (parseInt(page) - 1) * pageSize;
      const reviews = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const paginatedReviews = reviews.slice(offset, offset + pageSize);

      res.status(200).json({
        success: true,
        count: paginatedReviews.length,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
        currentPage: parseInt(page),
        data: paginatedReviews,
      });
    } catch (error) {
      console.error(
        `Error getting reviews for user ID ${req.params.userId}:`,
        error
      );
      res.status(500).json({
        success: false,
        message: "Error retrieving user reviews",
        error: error.message,
      });
    }
  },

  createReview: async (req, res) => {
    try {
      const { bookingId, rating, comment } = req.body;
      const userId = req.user.id; // Assuming authorization middleware sets req.user

      // Validate booking exists and belongs to the user
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      if (booking.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: "You can only review your own bookings",
        });
      }

      // Check if booking is completed
      if (booking.status !== "completed") {
        return res.status(400).json({
          success: false,
          message: "You can only review completed bookings",
        });
      }

      // Check if a review already exists for this booking
      const existingReview = await Review.findOne({
        userId,
        car: booking.carId,
        bookingId,
      });

      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: "You have already reviewed this booking",
        });
      }

      // Get user's name (assuming from auth middleware)
      const userName = req.user.name || "Anonymous User";

      // Create the review
      const reviewData = {
        userId,
        userName,
        car: booking.carId,
        bookingId,
        rating: parseInt(rating),
        comment,
        date: new Date(),
        status: "published",
      };

      const review = await Review.createReview(reviewData);

      // Update booking with reviewId
      await Booking.updateBooking(bookingId, { reviewId: review.id });

      // Update car's average rating
      const carReviews = await Review.find({ car: booking.carId });
      const totalRating = carReviews.reduce(
        (sum, review) => sum + review.rating,
        0
      );
      const avgRating = totalRating / carReviews.length;

      await Car.updateCar(booking.carId, { avgRating });

      res.status(201).json({
        success: true,
        message: "Review created successfully",
        data: review,
      });
    } catch (error) {
      console.error("Error creating review:", error);
      res.status(500).json({
        success: false,
        message: "Error creating review",
        error: error.message,
      });
    }
  },

  updateReview: async (req, res) => {
    try {
      const { rating, comment, status } = req.body;
      const userId = req.user.id; // Assuming authorization middleware sets req.user

      // Get the existing review
      const existingReview = await Review.findById(req.params.id);
      if (!existingReview) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      // Check if user owns the review or is an admin
      if (existingReview.userId !== userId && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "You can only update your own reviews",
        });
      }

      // Prepare update data
      const updateData = {};
      if (rating) updateData.rating = parseInt(rating);
      if (comment) updateData.comment = comment;

      // Only admins can update status
      if (status && req.user.role === "admin") {
        updateData.status = status;
      }

      // Update the review
      const updatedReview = await Review.updateReview(
        req.params.id,
        updateData
      );

      // If rating changed, update car's average rating
      if (rating && existingReview.rating !== parseInt(rating)) {
        const carReviews = await Review.find({
          car: existingReview.car,
        });
        const totalRating = carReviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        const avgRating = totalRating / carReviews.length;

        await Car.updateCar(existingReview.car, { avgRating });
      }

      res.status(200).json({
        success: true,
        message: "Review updated successfully",
        data: updatedReview,
      });
    } catch (error) {
      console.error(`Error updating review with ID ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: "Error updating review",
        error: error.message,
      });
    }
  },

  deleteReview: async (req, res) => {
    try {
      const userId = req.user.id; // Assuming authorization middleware sets req.user

      // Get the existing review
      const existingReview = await Review.findById(req.params.id);
      if (!existingReview) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      // Check if user owns the review or is an admin
      if (existingReview.userId !== userId && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "You can only delete your own reviews",
        });
      }

      // Delete the review
      await Review.deleteReview(req.params.id);

      // Update booking to remove reviewId
      if (existingReview.bookingId) {
        const booking = await Booking.findById(existingReview.bookingId);
        if (booking) {
          await Booking.updateBooking(existingReview.bookingId, {
            reviewId: null,
          });
        }
      }

      // Update car's average rating
      const carReviews = await Review.find({
        car: existingReview.car,
      });
      let avgRating = 0;
      if (carReviews.length > 0) {
        const totalRating = carReviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        avgRating = totalRating / carReviews.length;
      }

      await Car.updateCar(existingReview.car, { avgRating });

      res.status(200).json({
        success: true,
        message: "Review deleted successfully",
      });
    } catch (error) {
      console.error(`Error deleting review with ID ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: "Error deleting review",
        error: error.message,
      });
    }
  },

  getReviewStats: async (req, res) => {
    try {
      // Overall stats
      const totalReviews = await Review.countDocuments();

      // Rating distribution
      const ratingDistribution = {};
      for (let i = 1; i <= 5; i++) {
        const count = await Review.countDocuments({ rating: i });
        ratingDistribution[i] = count;
      }

      // Top rated cars (limit to 5)
      // In a real implementation, this would be more efficient with aggregation
      const cars = await Car.find();
      const carsWithRatings = await Promise.all(
        cars.map(async (car) => {
          const reviews = await Review.find({ car: car.id });
          if (reviews.length === 0)
            return { ...car, avgRating: 0, reviewCount: 0 };

          const totalRating = reviews.reduce(
            (sum, review) => sum + review.rating,
            0
          );
          return {
            id: car.id,
            make: car.make,
            model: car.model,
            year: car.year,
            avgRating: totalRating / reviews.length,
            reviewCount: reviews.length,
          };
        })
      );

      // Sort by average rating (descending) and get top 5
      const topRatedCars = carsWithRatings
        .filter((v) => v.reviewCount > 0)
        .sort((a, b) => b.avgRating - a.avgRating)
        .slice(0, 5);

      res.status(200).json({
        success: true,
        totalReviews,
        ratingDistribution,
        topRatedCars,
      });
    } catch (error) {
      console.error("Error getting review statistics:", error);
      res.status(500).json({
        success: false,
        message: "Error retrieving review statistics",
        error: error.message,
      });
    }
  },

  moderateReview: async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Only administrators can moderate reviews",
        });
      }

      const { status, moderationNote } = req.body;

      // Validate status
      if (!["published", "rejected", "pending"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status value",
        });
      }

      // Get the review
      const review = await Review.findById(req.params.id);
      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      // Update the review
      const updateData = {
        status,
        moderationNote,
      };

      const updatedReview = await Review.updateReview(
        req.params.id,
        updateData
      );

      // If rejecting review, update car's average rating
      if (status === "rejected" && review.status === "published") {
        const carReviews = await Review.find({
          car: review.car,
          status: "published",
        });

        let avgRating = 0;
        if (carReviews.length > 0) {
          const totalRating = carReviews.reduce(
            (sum, review) => sum + review.rating,
            0
          );
          avgRating = totalRating / carReviews.length;
        }

        await Car.updateCar(review.car, { avgRating });
      }

      // If publishing a previously rejected review, update car's avg rating
      if (status === "published" && review.status !== "published") {
        const carReviews = await Review.find({
          car: review.car,
          status: "published",
        });

        const totalRating = carReviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        const avgRating = totalRating / carReviews.length;

        await Car.updateCar(review.car, { avgRating });
      }

      res.status(200).json({
        success: true,
        message: `Review ${
          status === "published"
            ? "approved"
            : status === "rejected"
            ? "rejected"
            : "updated"
        }`,
        data: updatedReview,
      });
    } catch (error) {
      console.error(`Error moderating review with ID ${req.params.id}:`, error);
      res.status(500).json({
        success: false,
        message: "Error moderating review",
        error: error.message,
      });
    }
  },

  getRandomReviews: async (req, res) => {
    try {
      // Get all reviews from the collection without any filters
      const reviewsRef = db.collection("reviews");
      const snapshot = await reviewsRef.get();

      // Convert to array
      const allReviews = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // If we have no reviews, return empty array
      if (allReviews.length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
        });
      }

      // Shuffle and get 3 random reviews (or all if less than 3)
      const shuffled = [...allReviews].sort(() => 0.5 - Math.random());
      const randomReviews = shuffled.slice(0, Math.min(3, shuffled.length));

      // If we still don't have any reviews, use fallback to get reviews from the general API
      if (randomReviews.length === 0) {
        // Create a direct database query to get reviews
        const fallbackReviewsRef = db.collection("reviews");
        const fallbackSnapshot = await fallbackReviewsRef.limit(3).get();

        const fallbackReviews = fallbackSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        return res.status(200).json({
          success: true,
          data: fallbackReviews,
        });
      }

      res.status(200).json({
        success: true,
        data: randomReviews,
      });
    } catch (error) {
      console.error("Error getting random reviews:", error);
      res.status(500).json({
        success: false,
        message: "Error getting random reviews",
        error: error.message,
      });
    }
  },

  getPendingReviews: async (req, res) => {
    try {
      const reviewsRef = db.collection("reviews");
      const snapshot = await reviewsRef.where("status", "==", "pending").get();

      const reviews = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error getting pending reviews",
        error: error.message,
      });
    }
  },

  getModeratedReviews: async (req, res) => {
    try {
      const { status } = req.params;
      if (!["published", "rejected"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status parameter",
        });
      }

      const reviewsRef = db.collection("reviews");
      const snapshot = await reviewsRef.where("status", "==", status).get();

      const reviews = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error getting moderated reviews",
        error: error.message,
      });
    }
  },
};

// Export all controller functions
module.exports = reviewController;
