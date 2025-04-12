const db = require("../firebase");
const { v4: uuidv4 } = require("uuid");
const Review = require("../models/Review");
const Car = require("../models/car");
const Booking = require("../models/Booking");

// Collection reference
const reviewsCollection = db.collection("reviews");

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

      // Build the query object
      const query = {};
      if (carId) query.car = carId;
      if (userId) query.userId = userId;
      if (rating) query.rating = parseInt(rating);

      // Build sort object
      const sortObj = {};
      const [sortField, sortOrder] = sort.split(":");
      sortObj[sortField] = sortOrder === "asc" ? 1 : -1;

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const options = {
        sort: sortObj,
        limit: parseInt(limit),
        skip,
      };

      // Get reviews
      const reviews = await Review.find(query, options);
      const totalCount = await Review.countDocuments(query);

      res.status(200).json({
        success: true,
        count: reviews.length,
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
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

      // Build the query object
      const query = {};
      if (carId) query.car = carId;
      if (userId) query.userId = userId;
      if (rating) query.rating = parseInt(rating);

      // Build sort object
      const sortObj = {};
      const [sortField, sortOrder] = sort.split(":");
      sortObj[sortField] = sortOrder === "asc" ? 1 : -1;

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const options = {
        sort: sortObj,
        limit: parseInt(limit),
        skip,
      };

      // Get reviews
      const reviews = await Review.find(query, options);
      const totalCount = await Review.countDocuments(query);

      res.status(200).json({
        success: true,
        count: reviews.length,
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
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
      const review = await Review.findById(req.params.id);

      if (!review) {
        return res.status(404).json({
          success: false,
          message: "Review not found",
        });
      }

      res.status(200).json({
        success: true,
        data: review,
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

      // Build the query object
      const query = { car: req.params.carId };

      // Add rating filters if provided
      if (minRating) {
        query.rating = { $gte: parseInt(minRating) };
      }

      if (maxRating) {
        if (query.rating) {
          query.rating.$lte = parseInt(maxRating);
        } else {
          query.rating = { $lte: parseInt(maxRating) };
        }
      }

      // Build sort object
      const sortObj = {};
      const [sortField, sortOrder] = sort.split(":");
      sortObj[sortField] = sortOrder === "asc" ? 1 : -1;

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const options = {
        sort: sortObj,
        limit: parseInt(limit),
        skip,
      };

      // Get reviews
      const reviews = await Review.find(query, options);
      const totalCount = await Review.countDocuments(query);

      // Get car details
      const car = await Car.findById(req.params.carId);
      if (!car) {
        return res.status(404).json({
          success: false,
          message: "Car not found",
        });
      }

      // Calculate average rating
      let avgRating = 0;
      if (totalCount > 0) {
        const allReviews = await Review.find({ car: req.params.carId });
        const totalRating = allReviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        avgRating = totalRating / allReviews.length;
      }

      res.status(200).json({
        success: true,
        count: reviews.length,
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        currentPage: parseInt(page),
        car: {
          id: car.id,
          make: car.make,
          model: car.model,
          year: car.year,
          avgRating,
        },
        data: reviews,
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

      // Build sort object
      const sortObj = {};
      const [sortField, sortOrder] = sort.split(":");
      sortObj[sortField] = sortOrder === "asc" ? 1 : -1;

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const options = {
        sort: sortObj,
        limit: parseInt(limit),
        skip,
      };

      // Get reviews by user ID
      const reviews = await Review.find({ userId: req.params.userId }, options);
      const totalCount = await Review.countDocuments({
        userId: req.params.userId,
      });

      res.status(200).json({
        success: true,
        count: reviews.length,
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        currentPage: parseInt(page),
        data: reviews,
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
      const reviews = await Review.find({ status: "published" })
        .limit(5)
        .sort({ date: -1 });

      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error getting random reviews",
        error: error.message,
      });
    }
  },

  getPendingReviews: async (req, res) => {
    try {
      const reviews = await Review.find({ status: "pending" });
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

      const reviews = await Review.find({ status });
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
