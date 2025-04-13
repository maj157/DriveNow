const db = require("../firebase");

// Reference to the bookings collection
const bookingsCollection = db.collection("bookings");

// Booking Schema
const bookingSchema = {
  userId: String, // ID of the user making the booking
  carId: String, // ID of the car being booked (changed from vehicleId)
  startDate: Date, // Start date of booking
  endDate: Date, // End date of booking
  totalPrice: Number, // Total price of the booking
  status: String, // Status: pending, confirmed, active, completed, cancelled
  paymentId: String, // Payment reference ID
  paymentStatus: String, // Payment status: pending, paid, refunded
  pickupLocation: String, // Pickup location
  dropoffLocation: String, // Dropoff location
  driverDetails: {
    // Driver details
    name: String,
    license: String,
    age: Number,
  },
  additionalOptions: {
    // Additional options
    insurance: Boolean,
    gps: Boolean,
    childSeat: Boolean,
    additionalDriver: Boolean,
  },
  notes: String, // Special requests or notes
  cancellationReason: String, // Reason for cancellation
  reviewId: String, // ID of the review if one was left
  invoiceId: String, // ID of the invoice
  createdAt: Date, // Creation timestamp
  updatedAt: Date, // Last update timestamp
};

/**
 * Create a new booking
 * @param {Object} bookingData - The booking data to create
 * @returns {Promise<Object>} - The created booking with id
 */
const createBooking = async (bookingData) => {
  try {
    // Validate booking data
    validateBookingData(bookingData);

    // Add timestamps
    const now = new Date();
    const booking = {
      ...bookingData,
      status: bookingData.status || "pending",
      paymentStatus: bookingData.paymentStatus || "pending",
      createdAt: now,
      updatedAt: now,
    };

    // Add to Firestore
    const docRef = await bookingsCollection.add(booking);

    return {
      id: docRef.id,
      ...booking,
    };
  } catch (error) {
    console.error("Error creating booking:", error);
    throw error;
  }
};

/**
 * Get a booking by ID
 * @param {string} id - The booking ID
 * @returns {Promise<Object|null>} - The booking document or null if not found
 */
const findById = async (id) => {
  try {
    const docRef = await bookingsCollection.doc(id).get();

    if (!docRef.exists) {
      return null;
    }

    return {
      id: docRef.id,
      ...docRef.data(),
    };
  } catch (error) {
    console.error(`Error getting booking with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Find bookings that match the provided query
 * @param {Object} query - The search query
 * @param {Object} options - Search options (sort, pagination, etc.)
 * @returns {Promise<Array>} - Matching bookings
 */
const find = async (query = {}, options = {}) => {
  try {
    let ref = bookingsCollection;

    // Apply filters
    if (query.userId) ref = ref.where("userId", "==", query.userId);
    if (query.carId) ref = ref.where("carId", "==", query.carId);
    if (query.status) ref = ref.where("status", "==", query.status);

    // Handle date range queries
    if (query.dateRange) {
      if (query.dateRange.start) {
        ref = ref.where("startDate", ">=", query.dateRange.start);
      }
      if (query.dateRange.end) {
        ref = ref.where("endDate", "<=", query.dateRange.end);
      }
    }

    // Apply sort
    if (options.sort) {
      const [field, order] = Object.entries(options.sort)[0];
      ref = ref.orderBy(field, order === 1 ? "asc" : "desc");
    }

    const snapshot = await ref.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error finding bookings:", error);
    throw error;
  }
};

/**
 * Check car availability for specified dates
 * @param {string} carId - The car ID
 * @param {Date} startDate - Start date to check
 * @param {Date} endDate - End date to check
 * @param {string} [excludeBookingId] - Optional booking ID to exclude from check
 * @returns {Promise<boolean>} - Whether the car is available
 */
const checkCarAvailability = async (
  carId,
  startDate,
  endDate,
  excludeBookingId = null
) => {
  try {
    // Find overlapping bookings for this car
    let query = bookingsCollection
      .where("carId", "==", carId)
      .where("status", "in", ["pending", "confirmed", "active"])
      // Find bookings where:
      // 1. booking starts during requested period OR
      // 2. booking ends during requested period OR
      // 3. booking spans the entire requested period
      .where("startDate", "<=", endDate);

    const snapshot = await query.get();

    // Check if any bookings overlap with requested dates
    const overlapping = snapshot.docs.some((doc) => {
      // Skip the current booking if we're updating
      if (excludeBookingId && doc.id === excludeBookingId) {
        return false;
      }

      const booking = doc.data();
      // Convert Firestore timestamps to JavaScript Dates
      const bookingStart = booking.startDate.toDate();
      const bookingEnd = booking.endDate.toDate();

      // Check if bookings overlap
      return bookingEnd >= startDate;
    });

    return !overlapping;
  } catch (error) {
    console.error("Error checking car availability:", error);
    throw error;
  }
};

/**
 * Update a booking
 * @param {string} id - The booking ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} - The updated booking
 */
const updateBooking = async (id, updateData) => {
  try {
    // Validate booking exists
    const booking = await findById(id);
    if (!booking) {
      throw new Error(`Booking with ID ${id} not found`);
    }

    // Add update timestamp
    const now = new Date();
    const updates = {
      ...updateData,
      updatedAt: now,
    };

    // Update in Firestore
    await bookingsCollection.doc(id).update(updates);

    // Get the updated document
    return await findById(id);
  } catch (error) {
    console.error(`Error updating booking with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Cancel a booking
 * @param {string} id - The booking ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} - The cancelled booking
 */
const cancelBooking = async (id, reason = "") => {
  try {
    const updates = {
      status: "cancelled",
      cancellationReason: reason,
      updatedAt: new Date(),
    };

    return await updateBooking(id, updates);
  } catch (error) {
    console.error(`Error cancelling booking with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a booking
 * @param {string} id - The booking ID
 * @returns {Promise<boolean>} - Success status
 */
const deleteBooking = async (id) => {
  try {
    // Validate booking exists
    const booking = await findById(id);
    if (!booking) {
      throw new Error(`Booking with ID ${id} not found`);
    }

    // Delete from Firestore
    await bookingsCollection.doc(id).delete();

    return true;
  } catch (error) {
    console.error(`Error deleting booking with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Get active bookings for a car
 * @param {string} carId - The car ID
 * @returns {Promise<Array>} - Active bookings
 */
const getActiveBookingsForCar = async (carId) => {
  return find(
    {
      carId,
      status: { $in: ["pending", "confirmed", "active"] },
    },
    { sort: { startDate: 1 } }
  );
};

/**
 * Get user's bookings
 * @param {string} userId - The user ID
 * @param {Object} options - Filter options
 * @returns {Promise<Array>} - User's bookings
 */
const getUserBookings = async (userId, options = {}) => {
  const query = { userId };

  if (options.status) {
    query.status = options.status;
  }

  return find(query, {
    sort: options.sort || { createdAt: -1 },
    limit: options.limit,
    skip: options.skip,
  });
};

/**
 * Find one booking that matches the query
 * @param {Object} query - The search query
 * @returns {Promise<Object|null>} - Matching booking or null
 */
const findOne = async (query = {}) => {
  try {
    const bookings = await find(query, { limit: 1 });
    return bookings.length > 0 ? bookings[0] : null;
  } catch (error) {
    console.error("Error finding booking:", error);
    throw error;
  }
};

/**
 * Count bookings matching the query
 * @param {Object} query - The query to match
 * @returns {Promise<number>} - Count of matching bookings
 */
const countDocuments = async (query = {}) => {
  try {
    let firestoreQuery = bookingsCollection;

    // Apply filters (same as in find function)
    if (query.userId) {
      firestoreQuery = firestoreQuery.where("userId", "==", query.userId);
    }

    if (query.carId) {
      firestoreQuery = firestoreQuery.where("carId", "==", query.carId);
    }

    if (query.status) {
      firestoreQuery = firestoreQuery.where("status", "==", query.status);
    }

    // Execute query
    const snapshot = await firestoreQuery.get();
    return snapshot.size;
  } catch (error) {
    console.error("Error counting bookings:", error);
    throw error;
  }
};

/**
 * Validate booking data against schema
 * @param {Object} bookingData - The booking data to validate
 * @returns {boolean} - Validation result
 */
const validateBookingData = (bookingData) => {
  const requiredFields = [
    "userId",
    "carId",
    "startDate",
    "endDate",
    "totalPrice",
  ];

  // Check required fields
  for (const field of requiredFields) {
    if (!bookingData[field] && bookingData[field] !== 0) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate dates
  const startDate = new Date(bookingData.startDate);
  const endDate = new Date(bookingData.endDate);
  const now = new Date();

  if (isNaN(startDate.getTime())) {
    throw new Error("Invalid start date");
  }

  if (isNaN(endDate.getTime())) {
    throw new Error("Invalid end date");
  }

  if (startDate < now) {
    throw new Error("Start date cannot be in the past");
  }

  if (endDate <= startDate) {
    throw new Error("End date must be after start date");
  }

  // Validate price
  if (
    typeof bookingData.totalPrice !== "number" ||
    bookingData.totalPrice <= 0
  ) {
    throw new Error("Total price must be a positive number");
  }

  return true;
};

// Export all functions at module end
module.exports = {
  bookingSchema,
  createBooking,
  findById,
  find,
  checkCarAvailability,
  updateBooking,
  cancelBooking,
  deleteBooking,
  getActiveBookingsForCar,
  getUserBookings,
  findOne,
  countDocuments,
  validateBookingData,
};
