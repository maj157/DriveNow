const Vehicle = require("../models/Vehicle");
const Review = require("../models/Review");
const Booking = require("../models/Booking");
const {
  uploadToCloudinary,
  deleteFromCloudinary,
} = require("../utils/cloudinary");
const ApiError = require("../utils/ApiError");
const catchAsync = require("../utils/catchAsync");

/**
 * Get all vehicles with optional filtering
 */
const getAllVehicles = catchAsync(async (req, res) => {
  const {
    make,
    model,
    type,
    location,
    minPrice,
    maxPrice,
    minYear,
    maxYear,
    available,
    startDate,
    endDate,
    sortBy,
    page = 1,
    limit = 10,
  } = req.query;

  // Build query
  const query = {};

  if (make) query.make = new RegExp(make, "i");
  if (model) query.model = new RegExp(model, "i");
  if (type) query.type = type;
  if (location) query.location = new RegExp(location, "i");
  if (minPrice) query.pricePerDay = { $gte: Number(minPrice) };
  if (maxPrice)
    query.pricePerDay = { ...query.pricePerDay, $lte: Number(maxPrice) };
  if (minYear) query.year = { $gte: Number(minYear) };
  if (maxYear) query.year = { ...query.year, $lte: Number(maxYear) };

  // Check availability if dates are provided
  if (startDate && endDate && available === "true") {
    const bookings = await Booking.find({
      $or: [
        {
          startDate: { $lte: new Date(endDate) },
          endDate: { $gte: new Date(startDate) },
        },
      ],
      status: { $ne: "cancelled" },
    }).distinct("vehicle");

    query._id = { $nin: bookings };
  }

  // Build sort
  let sort = {};
  if (sortBy) {
    const [field, order] = sortBy.split(":");
    sort[field] = order === "desc" ? -1 : 1;
  } else {
    sort = { createdAt: -1 }; // Default sort
  }

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Execute query with pagination
  const vehicles = await Vehicle.find(query)
    .sort(sort)
    .skip(skip)
    .limit(Number(limit))
    .populate("reviews", "rating")
    .lean();

  // Calculate average rating for each vehicle
  const vehiclesWithAvgRating = vehicles.map((vehicle) => {
    const ratings = vehicle.reviews
      ? vehicle.reviews.map((review) => review.rating)
      : [];
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : 0;

    return {
      ...vehicle,
      avgRating,
      reviewCount: ratings.length,
    };
  });

  // Get total count for pagination
  const totalCount = await Vehicle.countDocuments(query);

  res.status(200).json({
    success: true,
    count: totalCount,
    pages: Math.ceil(totalCount / Number(limit)),
    data: vehiclesWithAvgRating,
  });
});

/**
 * Get vehicle by ID
 */
const getVehicleById = catchAsync(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
    .populate({
      path: "owner",
      select: "name email avatar",
    })
    .lean();

  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  // Get average rating
  const reviews = await Review.find({ vehicle: req.params.id });
  const ratings = reviews.map((review) => review.rating);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : 0;

  vehicle.avgRating = avgRating;
  vehicle.reviewCount = reviews.length;

  res.status(200).json({
    success: true,
    data: vehicle,
  });
});

/**
 * Check vehicle availability for a date range
 */
const getVehicleAvailability = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw new ApiError(400, "Start date and end date are required");
  }

  // Validate vehicle exists
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  // Check if there are any bookings for this period
  const existingBooking = await Booking.findOne({
    vehicle: id,
    status: { $ne: "cancelled" },
    $or: [
      {
        startDate: { $lte: new Date(endDate) },
        endDate: { $gte: new Date(startDate) },
      },
    ],
  });

  res.status(200).json({
    success: true,
    data: {
      isAvailable: !existingBooking,
      vehicle: id,
      startDate,
      endDate,
    },
  });
});

/**
 * Get vehicle reviews
 */
const getVehicleReviews = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Check if vehicle exists
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);

  // Get reviews
  const reviews = await Review.find({ vehicle: id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate("user", "name avatar")
    .lean();

  // Get total count
  const totalCount = await Review.countDocuments({ vehicle: id });

  // Calculate average rating
  const ratings = await Review.find({ vehicle: id }).select("rating");
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, item) => sum + item.rating, 0) / ratings.length
      : 0;

  res.status(200).json({
    success: true,
    count: totalCount,
    pages: Math.ceil(totalCount / Number(limit)),
    avgRating,
    data: reviews,
  });
});

/**
 * Create a new vehicle
 */
const createVehicle = catchAsync(async (req, res) => {
  const {
    make,
    model,
    year,
    type,
    description,
    features,
    location,
    pricePerDay,
    transmission,
    fuelType,
    seats,
  } = req.body;

  // Validate required fields
  if (!make || !model || !year || !pricePerDay || !location) {
    throw new ApiError(400, "Missing required fields");
  }

  // Process images if they exist
  let images = [];
  if (req.files && req.files.length > 0) {
    // Upload each image to Cloudinary
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.path);
      images.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
    }
  }

  // Create vehicle
  const vehicle = await Vehicle.create({
    make,
    model,
    year,
    type,
    description,
    features: features ? JSON.parse(features) : [],
    images,
    location,
    pricePerDay,
    transmission,
    fuelType,
    seats,
    owner: req.user.id,
  });

  res.status(201).json({
    success: true,
    data: vehicle,
  });
});

/**
 * Update a vehicle
 */
const updateVehicle = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  // Check if the vehicle exists
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  // Process images if they exist
  if (req.files && req.files.length > 0) {
    // Upload each new image to Cloudinary
    const newImages = [];
    for (const file of req.files) {
      const result = await uploadToCloudinary(file.path);
      newImages.push({
        url: result.secure_url,
        publicId: result.public_id,
      });
    }

    updateData.images = [...vehicle.images, ...newImages];
  }

  // Parse features if they exist
  if (updateData.features && typeof updateData.features === "string") {
    updateData.features = JSON.parse(updateData.features);
  }

  // Update the vehicle
  const updatedVehicle = await Vehicle.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: updatedVehicle,
  });
});

/**
 * Delete a vehicle
 */
const deleteVehicle = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Check if the vehicle exists
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  // Check for active bookings
  const activeBookings = await Booking.findOne({
    vehicle: id,
    status: { $in: ["confirmed", "active"] },
    endDate: { $gte: new Date() },
  });

  if (activeBookings) {
    throw new ApiError(400, "Cannot delete vehicle with active bookings");
  }

  // Delete images from cloudinary
  if (vehicle.images && vehicle.images.length > 0) {
    for (const image of vehicle.images) {
      if (image.publicId) {
        await deleteFromCloudinary(image.publicId);
      }
    }
  }

  // Delete vehicle
  await Vehicle.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Vehicle deleted successfully",
  });
});

/**
 * Add a review for a vehicle
 */
const addVehicleReview = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  // Check if the vehicle exists
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) {
    throw new ApiError(404, "Vehicle not found");
  }

  // Check if user has rented this vehicle before
  const hasRented = await Booking.findOne({
    user: userId,
    vehicle: id,
    status: "completed",
  });

  if (!hasRented) {
    throw new ApiError(400, "You can only review vehicles you have rented");
  }

  // Check if user has already reviewed this vehicle
  const existingReview = await Review.findOne({
    user: userId,
    vehicle: id,
  });

  if (existingReview) {
    // Update existing review
    existingReview.rating = rating;
    existingReview.comment = comment;
    await existingReview.save();

    res.status(200).json({
      success: true,
      data: existingReview,
    });
  } else {
    // Create new review
    const review = await Review.create({
      user: userId,
      vehicle: id,
      rating,
      comment,
    });

    // Add review to vehicle
    vehicle.reviews.push(review._id);
    await vehicle.save();

    res.status(201).json({
      success: true,
      data: review,
    });
  }
});

module.exports = {
  getAllVehicles,
  getVehicleById,
  getVehicleAvailability,
  getVehicleReviews,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  addVehicleReview,
};
