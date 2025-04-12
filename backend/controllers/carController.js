const db = require("../firebase");
const Car = require("../models/car");
const Review = require("../models/Review");
const Booking = require("../models/Booking");

/**
 * Get all cars with filtering
 */
const getAllCars = async (req, res) => {
  try {
    const {
      brand,
      model,
      type,
      location,
      minPrice,
      maxPrice,
      available,
      sort = "createdAt:desc",
    } = req.query;

    let ref = db.collection("vehicles");

    // Apply filters
    if (brand) ref = ref.where("make", "==", brand);
    if (model) ref = ref.where("model", "==", model);
    if (type) ref = ref.where("type", "==", type);
    if (location) ref = ref.where("location", "==", location);
    if (available !== undefined)
      ref = ref.where("available", "==", available === "true");

    // Apply sort
    const [sortField, sortOrder] = sort.split(":");
    ref = ref.orderBy(sortField, sortOrder === "desc" ? "desc" : "asc");

    const snapshot = await ref.get();
    const cars = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by price in memory (Firestore limitation)
    let filteredCars = cars;
    if (minPrice)
      filteredCars = filteredCars.filter(
        (car) => car.pricePerDay >= Number(minPrice)
      );
    if (maxPrice)
      filteredCars = filteredCars.filter(
        (car) => car.pricePerDay <= Number(maxPrice)
      );

    res.status(200).json({
      success: true,
      count: filteredCars.length,
      data: filteredCars,
    });
  } catch (error) {
    console.error("Error getting cars:", error);
    res.status(500).json({
      success: false,
      error: "Error retrieving cars",
    });
  }
};

/**
 * Get car by ID
 */
const getCarById = async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    if (!car) {
      return res.status(404).json({
        success: false,
        error: "Car not found",
      });
    }

    // Get reviews for the car
    const reviews = await Review.find({ carId: car.id });
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.status(200).json({
      success: true,
      data: {
        ...car,
        avgRating,
        reviewCount: reviews.length,
      },
    });
  } catch (error) {
    console.error("Error getting car:", error);
    res.status(500).json({
      success: false,
      error: "Error retrieving car",
    });
  }
};

/**
 * Create new car
 */
const createCar = async (req, res) => {
  try {
    const car = await Car.createCar(req.body);
    res.status(201).json({
      success: true,
      data: car,
    });
  } catch (error) {
    console.error("Error creating car:", error);
    res.status(500).json({
      success: false,
      error: "Error creating car",
    });
  }
};

/**
 * Update car
 */
const updateCar = async (req, res) => {
  try {
    const car = await Car.updateCar(req.params.id, req.body);
    res.status(200).json({
      success: true,
      data: car,
    });
  } catch (error) {
    console.error("Error updating car:", error);
    res.status(500).json({
      success: false,
      error: "Error updating car",
    });
  }
};

/**
 * Delete car
 */
const deleteCar = async (req, res) => {
  try {
    // Check for active bookings
    const activeBookings = await Booking.find({
      carId: req.params.id,
      status: { $in: ["confirmed", "active"] },
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete car with active bookings",
      });
    }

    await Car.deleteCar(req.params.id);
    res.status(200).json({
      success: true,
      message: "Car deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting car:", error);
    res.status(500).json({
      success: false,
      error: "Error deleting car",
    });
  }
};

/**
 * Get cars by group
 */
const getCarsByGroup = async (req, res) => {
  try {
    const cars = await Car.find({ groupId: req.params.groupId });
    res.status(200).json({
      success: true,
      data: cars,
    });
  } catch (error) {
    console.error("Error getting cars by group:", error);
    res.status(500).json({
      success: false,
      error: "Error retrieving cars by group",
    });
  }
};

/**
 * Get car groups
 */
const getCarGroups = async (req, res) => {
  try {
    const snapshot = await db.collection("carGroups").get();
    const groups = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    console.error("Error getting car groups:", error);
    res.status(500).json({
      success: false,
      error: "Error retrieving car groups",
    });
  }
};

/**
 * Check car availability for dates
 */
const getCarAvailability = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const carId = req.params.id;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: "Start and end dates are required",
      });
    }

    // Check for overlapping bookings
    const bookings = await Booking.find({
      carId,
      status: { $in: ["confirmed", "active"] },
      endDate: { $gte: new Date(startDate) },
      startDate: { $lte: new Date(endDate) },
    });

    res.status(200).json({
      success: true,
      available: bookings.length === 0,
    });
  } catch (error) {
    console.error("Error checking car availability:", error);
    res.status(500).json({
      success: false,
      error: "Error checking availability",
    });
  }
};

/**
 * Get car reviews
 */
const getCarReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      car: req.params.id,
      status: "published",
    });

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    res.status(200).json({
      success: true,
      data: {
        reviews,
        averageRating,
        totalReviews: reviews.length,
      },
    });
  } catch (error) {
    console.error("Error getting car reviews:", error);
    res.status(500).json({
      success: false,
      error: "Error retrieving reviews",
    });
  }
};

/**
 * Add a review for a car
 */
const addCarReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const carId = req.params.id;
    const userId = req.user.id;

    const review = await Review.createReview({
      userId,
      vehicle: carId,
      rating,
      comment,
      status: "pending",
    });

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error("Error adding car review:", error);
    res.status(500).json({
      success: false,
      error: "Error adding review",
    });
  }
};

/**
 * Get most rented car
 */
const getMostRentedCar = async (req, res) => {
  try {
    const cars = await Car.find();
    const rentals = await Booking.find({ status: "completed" });

    const rentalCounts = rentals.reduce((acc, rental) => {
      acc[rental.carId] = (acc[rental.carId] || 0) + 1;
      return acc;
    }, {});

    const mostRented = cars.sort(
      (a, b) => (rentalCounts[b.id] || 0) - (rentalCounts[a.id] || 0)
    )[0];

    res.status(200).json({
      success: true,
      data: mostRented,
    });
  } catch (error) {
    console.error("Error getting most rented car:", error);
    res.status(500).json({
      success: false,
      error: "Error getting most rented car",
    });
  }
};

/**
 * Get average daily rental fee
 */
const getAverageDailyFee = async (req, res) => {
  try {
    const cars = await Car.find();
    const totalFee = cars.reduce((sum, car) => sum + car.pricePerDay, 0);
    const averageFee = cars.length > 0 ? totalFee / cars.length : 0;

    res.status(200).json({
      success: true,
      data: averageFee,
    });
  } catch (error) {
    console.error("Error calculating average fee:", error);
    res.status(500).json({
      success: false,
      error: "Error calculating average fee",
    });
  }
};

/**
 * Filter cars by criteria
 */
const filterCars = async (req, res) => {
  try {
    const {
      seats,
      gearbox,
      fuelType,
      ac,
      electricWindows,
      minPrice,
      maxPrice,
    } = req.query;

    let query = {};
    if (seats) query["specs.seats"] = parseInt(seats);
    if (gearbox) query["specs.gearbox"] = gearbox;
    if (fuelType) query["specs.fuelType"] = fuelType;
    if (ac !== undefined) query["specs.ac"] = ac === "true";
    if (electricWindows !== undefined)
      query["specs.electricWindows"] = electricWindows === "true";
    if (minPrice) query.pricePerDay = { $gte: parseFloat(minPrice) };
    if (maxPrice)
      query.pricePerDay = { ...query.pricePerDay, $lte: parseFloat(maxPrice) };

    const cars = await Car.find(query);
    res.status(200).json({
      success: true,
      data: cars,
    });
  } catch (error) {
    console.error("Error filtering cars:", error);
    res.status(500).json({
      success: false,
      error: "Error filtering cars",
    });
  }
};

module.exports = {
  getAllCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  getCarsByGroup,
  getCarGroups,
  getCarAvailability,
  getCarReviews,
  addCarReview,
  getMostRentedCar,
  getAverageDailyFee,
  filterCars,
};
