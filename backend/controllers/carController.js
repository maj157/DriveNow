const db = require("../firebase");
const Car = require("../models/car");
const Review = require("../models/Review");
const Booking = require("../models/Booking");

/**
 * Get all cars with filtering
 */
const getAllCars = async (req, res) => {
  try {
    console.log("getAllCars: Starting query execution");

    // Get base reference to cars collection
    let ref = db.collection("cars");
    console.log("getAllCars: Got reference to 'cars' collection");

    // Get all documents
    const snapshot = await ref.get();
    console.log(
      `getAllCars: Retrieved ${snapshot.size} documents from Firestore`
    );

    if (snapshot.empty) {
      console.log("getAllCars: No documents found in collection");
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // Map the documents to cars with default values for missing required fields
    const cars = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        brand: data.brand,
        model: data.model,
        group: data.group,
        pricePerDay: data.pricePerDay,
        imageURL: data.imageURL,
        // Add required specs with default values if not present
        specs: {
          engineSize: data.specs?.engineSize || 2.0,
          seats: data.specs?.seats || 5,
          doors: data.specs?.doors || 4,
          gearbox: data.specs?.gearbox || "Automatic",
          fuelType: data.group || "Gasoline", // Use group as fuelType if not specified
          trunkCapacity: data.specs?.trunkCapacity || 400,
          ac: data.specs?.ac !== undefined ? data.specs.ac : true,
          electricWindows:
            data.specs?.electricWindows !== undefined
              ? data.specs.electricWindows
              : true,
          mileage: data.specs?.mileage || 0,
          additionalFeatures: data.specs?.additionalFeatures || [],
        },
        // Optional fields
        year: data.year || new Date().getFullYear(),
        location: data.location || "Available at all locations",
        category: data.group, // Use group as category
        availability: data.available !== undefined ? data.available : true,
      };
    });

    console.log(`getAllCars: Successfully mapped ${cars.length} cars`);
    console.log("getAllCars: First car in results:", cars[0]);

    res.status(200).json({
      success: true,
      count: cars.length,
      data: cars,
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
    const groupId = req.params.groupId;

    // First get the group to get its groupName
    const groupDoc = await db.collection("carGroups").doc(groupId).get();

    if (!groupDoc.exists) {
      return res.status(404).json({
        success: false,
        error: "Group not found",
      });
    }

    const groupData = groupDoc.data();
    const groupName = groupData.groupName;

    // Now get cars with matching group field
    const carsSnapshot = await db
      .collection("cars")
      .where("group", "==", groupName)
      .get();

    if (carsSnapshot.empty) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const cars = carsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

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

/**
 * Get random cars from distinct groups
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getRandomCarsFromDistinctGroups = async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 3;

    // Get all car groups first
    const groupsRef = db.collection("cars").select("group");
    const groupsSnapshot = await groupsRef.get();

    if (groupsSnapshot.empty) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    // Extract unique groups
    const uniqueGroups = new Set();
    groupsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.group) {
        uniqueGroups.add(data.group);
      }
    });

    // Convert to array and shuffle
    const shuffledGroups = Array.from(uniqueGroups).sort(
      () => 0.5 - Math.random()
    );

    // Take only the number of groups we need
    const selectedGroups = shuffledGroups.slice(0, count);

    // For each selected group, get one random car
    const randomCars = [];

    for (const group of selectedGroups) {
      const carsRef = db
        .collection("cars")
        .where("group", "==", group)
        .limit(5);
      const carsSnapshot = await carsRef.get();

      if (!carsSnapshot.empty) {
        // Get random index within the range of returned cars
        const randomIndex = Math.floor(Math.random() * carsSnapshot.size);
        const randomDoc = carsSnapshot.docs[randomIndex];
        const carData = randomDoc.data();

        // Format the car data
        randomCars.push({
          id: randomDoc.id,
          brand: carData.brand,
          model: carData.model,
          group: carData.group,
          pricePerDay: carData.pricePerDay,
          imageURL: carData.imageURL,
          // Add required specs with default values if not present
          specs: {
            engineSize: carData.specs?.engineSize || 2.0,
            seats: carData.specs?.seats || 5,
            doors: carData.specs?.doors || 4,
            gearbox: carData.specs?.gearbox || "Automatic",
            fuelType: carData.group || "Gasoline", // Use group as fuelType if not specified
            trunkCapacity: carData.specs?.trunkCapacity || 400,
            ac: carData.specs?.ac !== undefined ? carData.specs.ac : true,
            electricWindows:
              carData.specs?.electricWindows !== undefined
                ? carData.specs.electricWindows
                : true,
            mileage: carData.specs?.mileage || 0,
            additionalFeatures: carData.specs?.additionalFeatures || [],
          },
          // Optional fields
          year: carData.year || new Date().getFullYear(),
          location: carData.location || "Available at all locations",
          category: carData.group, // Use group as category
          availability:
            carData.available !== undefined ? carData.available : true,
        });
      }
    }

    res.status(200).json({
      success: true,
      data: randomCars,
    });
  } catch (error) {
    console.error("Error getting random cars from distinct groups:", error);
    res.status(500).json({
      success: false,
      error: "Error retrieving random cars",
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
  getRandomCarsFromDistinctGroups,
};
