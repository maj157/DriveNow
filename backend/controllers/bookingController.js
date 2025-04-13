const db = require("../firebase");
const { v4: uuidv4 } = require("uuid");

/**
 * Get all bookings for the current user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.uid;
    console.log(`Getting bookings for user: ${userId}`);

    // Parse query parameters
    const status = req.query.status;
    const startDate = req.query.startDate
      ? new Date(req.query.startDate)
      : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const sortBy = req.query.sortBy || "newest"; // Default sort by newest

    // Build the query
    let query = db.collection("reservations").where("userId", "==", userId);

    // Add status filter if provided
    if (status && status !== "all") {
      query = query.where("status", "==", status);
    }

    // Execute the query
    const bookingsSnapshot = await query.get();

    if (bookingsSnapshot.empty) {
      console.log("No bookings found for user");
      return res.status(200).json([]);
    }

    // Process bookings
    let bookings = [];

    bookingsSnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Apply date filters in memory (since Firestore can't handle multiple range filters)
    if (startDate) {
      bookings = bookings.filter(
        (booking) => new Date(booking.startDate) >= startDate
      );
    }

    if (endDate) {
      bookings = bookings.filter(
        (booking) => new Date(booking.endDate) <= endDate
      );
    }

    // Apply sorting
    switch (sortBy) {
      case "newest":
        bookings.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case "oldest":
        bookings.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        break;
      case "price-asc":
        bookings.sort((a, b) => a.totalPrice - b.totalPrice);
        break;
      case "price-desc":
        bookings.sort((a, b) => b.totalPrice - a.totalPrice);
        break;
    }

    console.log(`Found ${bookings.length} bookings for user`);
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({
      error: "Failed to fetch user bookings",
      message: error.message,
    });
  }
};

/**
 * Create a new booking
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createBooking = async (req, res) => {
  try {
    console.log("⭐ Creating new booking, user:", req.user);
    console.log("📝 Request body:", JSON.stringify(req.body, null, 2));

    const userId = req.user.uid;

    // Extract and normalize data from request body
    let {
      carId,
      startDate,
      endDate,
      pickupDate,
      returnDate,
      pickupLocation,
      returnLocation,
      insuranceOption,
      additionalDrivers,
      additionalServices,
      extraServices,
      status,
      totalPrice,
      car: carObject,
      customerDetails,
    } = req.body;

    // Handle different field names between frontend and backend
    startDate = startDate || pickupDate;
    endDate = endDate || returnDate;

    // If carId is not directly provided but car object is
    if (!carId && carObject && carObject.id) {
      carId = carObject.id;
    }

    console.log("🚗 Using car ID:", carId);

    // Validate required fields
    if (!carId) {
      return res.status(400).json({ error: "Missing car ID" });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: "Missing rental dates" });
    }

    if (!pickupLocation || !returnLocation) {
      return res.status(400).json({ error: "Missing location information" });
    }

    // Normalize additionalServices - use extraServices if additionalServices is not provided
    if (!additionalServices && extraServices) {
      additionalServices = extraServices;
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    if (start < now) {
      return res
        .status(400)
        .json({ error: "Start date cannot be in the past" });
    }

    if (end <= start) {
      return res
        .status(400)
        .json({ error: "End date must be after start date" });
    }

    // Check car availability
    console.log("🔍 Checking car in database...");
    const carDoc = await db.collection("cars").doc(carId).get();

    if (!carDoc.exists) {
      console.error("❌ Car not found with ID:", carId);
      return res.status(404).json({ error: "Car not found" });
    }

    console.log("✅ Car found in database");
    const carData = carDoc.data();

    // Check if car is available for the requested dates
    try {
      console.log("🔍 Checking car availability...");

      // Temporary workaround for the missing Firestore index
      // Query with fewer filters and filter the rest in code
      const reservationsQuery = await db
        .collection("reservations")
        .where("carId", "==", carId)
        .where("status", "in", ["confirmed", "active"])
        .get();

      const conflictingBookings = [];

      // Manual filtering
      if (!reservationsQuery.empty) {
        reservationsQuery.forEach((doc) => {
          const booking = doc.data();
          const bookingStartDate = new Date(booking.startDate);
          const bookingEndDate = new Date(booking.endDate);

          // Check for date conflicts
          if (
            bookingEndDate > new Date(startDate) &&
            bookingStartDate < new Date(endDate)
          ) {
            conflictingBookings.push(booking);
          }
        });
      }

      console.log(
        `Found ${conflictingBookings.length} potentially conflicting bookings`
      );

      if (conflictingBookings.length > 0) {
        return res
          .status(400)
          .json({ error: "Car is not available for the selected dates" });
      }
    } catch (availabilityError) {
      console.error("Error checking availability:", availabilityError);
      // For development purposes, continue with the booking creation
      if (process.env.NODE_ENV === "development") {
        console.warn("⚠️ Bypassing availability check in development mode!");
      } else {
        throw availabilityError;
      }
    }

    // Calculate rental duration in days
    const durationMs = end.getTime() - start.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    // Calculate base price - use provided totalPrice if available, otherwise calculate
    let basePrice = totalPrice
      ? totalPrice * 0.8
      : carData.pricePerDay * durationDays;

    // Calculate additional costs
    let additionalCosts = 0;

    // If we already have a totalPrice, set additionalCosts as 20% of it
    if (totalPrice) {
      additionalCosts = totalPrice * 0.2;
    } else {
      // Insurance cost
      let insuranceCost = 0;
      if (insuranceOption === "basic") {
        insuranceCost = 15 * durationDays;
      } else if (insuranceOption === "premium") {
        insuranceCost = 30 * durationDays;
      } else if (insuranceOption === "full") {
        insuranceCost = 45 * durationDays;
      }

      // Additional drivers cost
      const additionalDriversCost =
        (additionalDrivers || 0) * 10 * durationDays;

      // Additional services cost
      let servicesCost = 0;
      if (additionalServices && additionalServices.length > 0) {
        additionalServices.forEach((service) => {
          servicesCost += service.price || 0;
        });
      }

      // Different pickup and return location fee
      let locationFee = 0;
      try {
        const pickupName =
          typeof pickupLocation === "string"
            ? pickupLocation
            : pickupLocation.name || "";

        const returnName =
          typeof returnLocation === "string"
            ? returnLocation
            : returnLocation.name || "";

        locationFee = pickupName !== returnName ? 50 : 0;
      } catch (locErr) {
        console.error("Error processing location fee:", locErr);
        // Default to no fee if there's an error
        locationFee = 0;
      }

      // Calculate total additional costs
      additionalCosts =
        insuranceCost + additionalDriversCost + servicesCost + locationFee;

      // If there's no totalPrice, calculate it
      if (!totalPrice) {
        totalPrice = basePrice + additionalCosts;
      }
    }

    // Process location objects
    let pickupLocationValue, returnLocationValue;

    try {
      if (typeof pickupLocation === "string") {
        pickupLocationValue = pickupLocation;
      } else if (pickupLocation && typeof pickupLocation === "object") {
        pickupLocationValue =
          pickupLocation.name || JSON.stringify(pickupLocation);
      } else {
        pickupLocationValue = "Unknown Location";
      }
    } catch (err) {
      console.error("Error processing pickup location:", err);
      pickupLocationValue = "Unknown Location";
    }

    try {
      if (typeof returnLocation === "string") {
        returnLocationValue = returnLocation;
      } else if (returnLocation && typeof returnLocation === "object") {
        returnLocationValue =
          returnLocation.name || JSON.stringify(returnLocation);
      } else {
        returnLocationValue = "Unknown Location";
      }
    } catch (err) {
      console.error("Error processing return location:", err);
      returnLocationValue = "Unknown Location";
    }

    // Create booking record
    const bookingData = {
      id: uuidv4(),
      userId,
      carId,
      carModel: carData.model || (carObject && carObject.model) || "Unknown",
      carMake:
        carData.brand ||
        carData.make ||
        (carObject && carObject.brand) ||
        "Unknown",
      carImage:
        carData.imageURL || (carData.images && carData.images[0]) || null,
      startDate,
      endDate,
      pickupLocation: pickupLocationValue,
      returnLocation: returnLocationValue,
      insuranceOption: insuranceOption || "none",
      additionalDrivers: additionalDrivers || 0,
      additionalServices: additionalServices || [],
      status: status || "confirmed", // Default to confirmed instead of pending
      basePrice,
      additionalCosts,
      totalPrice,
      durationDays,
      customerDetails: customerDetails || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log(
      "📋 Creating booking with data:",
      JSON.stringify(bookingData, null, 2)
    );

    // Save booking to Firestore
    const bookingRef = db.collection("reservations").doc(bookingData.id);
    await bookingRef.set(bookingData);

    console.log("✅ Booking created successfully with ID:", bookingData.id);

    res.status(201).json({
      message: "Booking created successfully",
      bookingId: bookingData.id,
      booking: bookingData,
    });
  } catch (error) {
    console.error("❌ Error creating booking:", error);
    console.error("📝 Request body:", JSON.stringify(req.body, null, 2));
    console.error("🔍 Error stack:", error.stack);
    res
      .status(500)
      .json({ error: "Failed to create booking", details: error.message });
  }
};

/**
 * Get booking by ID
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.uid;

    // Get booking from Firestore
    const bookingRef = db.collection("reservations").doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const bookingData = bookingDoc.data();

    // Check if booking belongs to the user (unless admin)
    if (bookingData.userId !== userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized to access this booking" });
    }

    res.status(200).json(bookingData);
  } catch (error) {
    console.error("Error getting booking:", error);
    res.status(500).json({ error: "Failed to get booking" });
  }
};

/**
 * Update booking
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.uid;
    const updateData = req.body;

    // Get booking from Firestore
    const bookingRef = db.collection("reservations").doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const bookingData = bookingDoc.data();

    // Check if booking belongs to the user (unless admin)
    if (bookingData.userId !== userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized to update this booking" });
    }

    // Prevent updating certain fields
    delete updateData.id;
    delete updateData.userId;
    delete updateData.carId;
    delete updateData.status;
    delete updateData.createdAt;
    delete updateData.basePrice;
    delete updateData.totalPrice;

    // Update booking
    updateData.updatedAt = new Date().toISOString();

    await bookingRef.update(updateData);

    res.status(200).json({ message: "Booking updated successfully" });
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).json({ error: "Failed to update booking" });
  }
};

/**
 * Process payment for a booking
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const processPayment = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.uid;
    const paymentInfo = req.body;

    // Get booking from Firestore
    const bookingRef = db.collection("reservations").doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const bookingData = bookingDoc.data();

    // Check if booking belongs to the user
    if (bookingData.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to process payment for this booking" });
    }

    // Check if booking is already paid
    if (bookingData.status === "confirmed" || bookingData.status === "active") {
      return res.status(400).json({ error: "Booking is already paid" });
    }

    // In a real application, you would process the payment through a payment gateway here
    // For this demo, we'll simulate a successful payment

    // Update booking status
    await bookingRef.update({
      status: "confirmed",
      paymentMethod: paymentInfo.paymentMethod,
      paymentDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create invoice
    const invoiceData = {
      id: uuidv4(),
      userId,
      bookingId,
      amount: bookingData.totalPrice,
      currency: "USD",
      items: [
        {
          description: `Car rental: ${bookingData.carMake} ${bookingData.carModel}`,
          amount: bookingData.basePrice,
        },
        {
          description: "Additional costs",
          amount: bookingData.additionalCosts,
        },
      ],
      status: "paid",
      paymentMethod: paymentInfo.paymentMethod,
      createdAt: new Date().toISOString(),
    };

    // Save invoice to Firestore
    await db.collection("invoices").doc(invoiceData.id).set(invoiceData);

    // Add loyalty points to user (1 point for each $10 spent)
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      const currentPoints = userData.points || 0;
      const pointsToAdd = Math.floor(bookingData.totalPrice / 10);

      await userRef.update({
        points: currentPoints + pointsToAdd,
        pointsHistory: [
          ...(userData.pointsHistory || []),
          {
            type: "earn",
            amount: pointsToAdd,
            date: new Date().toISOString(),
            description: `Booking ${bookingId}`,
          },
        ],
      });
    }

    res.status(200).json({
      message: "Payment processed successfully",
      invoiceId: invoiceData.id,
      status: "confirmed",
      pointsEarned: Math.floor(bookingData.totalPrice / 10),
    });
  } catch (error) {
    console.error("Error processing payment:", error);
    res.status(500).json({ error: "Failed to process payment" });
  }
};

/**
 * Check car availability
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const checkAvailability = async (req, res) => {
  try {
    const { carId, startDate, endDate } = req.query;

    // Validate required fields
    if (!carId || !startDate || !endDate) {
      return res.status(400).json({ error: "Missing required information" });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    if (end <= start) {
      return res
        .status(400)
        .json({ error: "End date must be after start date" });
    }

    // Check if car exists
    const carRef = db.collection("cars").doc(carId);
    const carDoc = await carRef.get();

    if (!carDoc.exists) {
      return res.status(404).json({ error: "Car not found" });
    }

    try {
      // Temporary workaround for the missing Firestore index
      // Query with fewer filters and filter the rest in code
      const reservationsQuery = await db
        .collection("reservations")
        .where("carId", "==", carId)
        .where("status", "in", ["confirmed", "active"])
        .get();

      const conflictingBookings = [];

      // Manual filtering
      if (!reservationsQuery.empty) {
        reservationsQuery.forEach((doc) => {
          const booking = doc.data();
          const bookingStartDate = new Date(booking.startDate);
          const bookingEndDate = new Date(booking.endDate);

          // Check for date conflicts
          if (bookingEndDate > start && bookingStartDate < end) {
            conflictingBookings.push(booking);
          }
        });
      }

      if (conflictingBookings.length > 0) {
        return res
          .status(400)
          .json({ error: "Car is not available for the selected dates" });
      }

      res.status(200).json({ available: true });
    } catch (availabilityError) {
      console.error("Error checking availability:", availabilityError);
      if (process.env.NODE_ENV === "development") {
        // In development, return available as true to allow testing
        console.warn("⚠️ Bypassing availability check in development mode!");
        res.status(200).json({ available: true });
      } else {
        throw availabilityError;
      }
    }
  } catch (error) {
    console.error("Error checking availability:", error);
    res.status(500).json({ error: "Failed to check availability" });
  }
};

/**
 * Extend booking duration
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const extendBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.uid;
    const { newEndDate } = req.body;

    if (!newEndDate) {
      return res.status(400).json({ error: "New end date is required" });
    }

    // Validate new end date
    const end = new Date(newEndDate);

    if (isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    // Get booking from Firestore
    const bookingRef = db.collection("reservations").doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const bookingData = bookingDoc.data();

    // Check if booking belongs to the user
    if (bookingData.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to extend this booking" });
    }

    // Check if booking is confirmed or active
    if (bookingData.status !== "confirmed" && bookingData.status !== "active") {
      return res.status(400).json({
        error: "Cannot extend booking that is not confirmed or active",
      });
    }

    // Check if new end date is after current end date
    const currentEndDate = new Date(bookingData.endDate);

    if (end <= currentEndDate) {
      return res
        .status(400)
        .json({ error: "New end date must be after current end date" });
    }

    // Check if car is available for the extension period
    try {
      // Temporary workaround for the missing Firestore index
      // Query with fewer filters and filter the rest in code
      const reservationsQuery = await db
        .collection("reservations")
        .where("carId", "==", bookingData.carId)
        .where("status", "in", ["confirmed", "active"])
        .where("id", "!=", bookingId)
        .get();

      const conflictingBookings = [];

      // Manual filtering
      if (!reservationsQuery.empty) {
        reservationsQuery.forEach((doc) => {
          const booking = doc.data();
          const bookingStartDate = new Date(booking.startDate);

          // Check if any booking starts during our extension period
          if (
            bookingStartDate > new Date(bookingData.endDate) &&
            bookingStartDate < new Date(newEndDate)
          ) {
            conflictingBookings.push(booking);
          }
        });
      }

      if (conflictingBookings.length > 0) {
        return res
          .status(400)
          .json({ error: "Car is not available for the extension period" });
      }
    } catch (availabilityError) {
      console.error(
        "Error checking availability for extension:",
        availabilityError
      );
      // For development purposes, continue with the booking extension
      if (process.env.NODE_ENV === "development") {
        console.warn("⚠️ Bypassing availability check in development mode!");
      } else {
        throw availabilityError;
      }
    }

    // Get car price
    const carRef = db.collection("cars").doc(bookingData.carId);
    const carDoc = await carRef.get();
    const carData = carDoc.data();

    // Calculate additional days
    const additionalDaysMs = end.getTime() - currentEndDate.getTime();
    const additionalDays = Math.ceil(additionalDaysMs / (1000 * 60 * 60 * 24));

    // Calculate additional costs
    const additionalBasePrice = carData.pricePerDay * additionalDays;

    // Calculate other additional costs
    let additionalCosts = 0;

    // Insurance cost
    if (bookingData.insuranceOption === "basic") {
      additionalCosts += 15 * additionalDays;
    } else if (bookingData.insuranceOption === "premium") {
      additionalCosts += 30 * additionalDays;
    } else if (bookingData.insuranceOption === "full") {
      additionalCosts += 45 * additionalDays;
    }

    // Additional drivers cost
    additionalCosts += bookingData.additionalDrivers * 10 * additionalDays;

    // Additional services cost
    if (
      bookingData.additionalServices &&
      bookingData.additionalServices.length > 0
    ) {
      bookingData.additionalServices.forEach((service) => {
        if (service.id === "gps") {
          additionalCosts += 5 * additionalDays;
        } else if (service.id === "childSeat") {
          additionalCosts += 7 * additionalDays;
        } else if (service.id === "wifi") {
          additionalCosts += 8 * additionalDays;
        }
      });
    }

    // Calculate total additional price
    const additionalTotalPrice = additionalBasePrice + additionalCosts;

    // Update booking
    const updatedData = {
      endDate: newEndDate,
      durationDays: bookingData.durationDays + additionalDays,
      basePrice: bookingData.basePrice + additionalBasePrice,
      additionalCosts: bookingData.additionalCosts + additionalCosts,
      totalPrice: bookingData.totalPrice + additionalTotalPrice,
      updatedAt: new Date().toISOString(),
      extensionHistory: [
        ...(bookingData.extensionHistory || []),
        {
          previousEndDate: bookingData.endDate,
          newEndDate,
          additionalDays,
          additionalCost: additionalTotalPrice,
          date: new Date().toISOString(),
        },
      ],
    };

    await bookingRef.update(updatedData);

    // Create additional invoice for the extension
    const invoiceData = {
      id: uuidv4(),
      userId,
      bookingId,
      amount: additionalTotalPrice,
      currency: "USD",
      items: [
        {
          description: `Extension: ${bookingData.carMake} ${bookingData.carModel} (${additionalDays} days)`,
          amount: additionalBasePrice,
        },
        {
          description: "Additional costs for extension",
          amount: additionalCosts,
        },
      ],
      status: "paid",
      paymentMethod: "extension",
      createdAt: new Date().toISOString(),
    };

    // Save invoice to Firestore
    await db.collection("invoices").doc(invoiceData.id).set(invoiceData);

    res.status(200).json({
      message: "Booking extended successfully",
      previousEndDate: bookingData.endDate,
      newEndDate,
      additionalDays,
      additionalCost: additionalTotalPrice,
      invoiceId: invoiceData.id,
    });
  } catch (error) {
    console.error("Error extending booking:", error);
    res.status(500).json({ error: "Failed to extend booking" });
  }
};

/**
 * Cancel booking
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.uid;

    // Get booking from Firestore
    const bookingRef = db.collection("reservations").doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const bookingData = bookingDoc.data();

    // Check if booking belongs to the user
    if (bookingData.userId !== userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized to cancel this booking" });
    }

    // Check if booking can be cancelled
    if (bookingData.status === "cancelled") {
      return res.status(400).json({ error: "Booking is already cancelled" });
    }

    if (bookingData.status === "completed") {
      return res.status(400).json({ error: "Cannot cancel completed booking" });
    }

    // Calculate cancellation fee
    let cancellationFee = 0;
    let refundAmount = bookingData.totalPrice;

    // Check cancellation policy
    const startDate = new Date(bookingData.startDate);
    const now = new Date();
    const daysUntilStart = Math.ceil(
      (startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilStart < 1) {
      // Less than 24 hours before start - 100% fee
      cancellationFee = bookingData.totalPrice;
      refundAmount = 0;
    } else if (daysUntilStart < 3) {
      // Less than 3 days before start - 50% fee
      cancellationFee = bookingData.totalPrice * 0.5;
      refundAmount = bookingData.totalPrice * 0.5;
    } else if (daysUntilStart < 7) {
      // Less than 7 days before start - 25% fee
      cancellationFee = bookingData.totalPrice * 0.25;
      refundAmount = bookingData.totalPrice * 0.75;
    } else {
      // More than 7 days before start - no fee
      cancellationFee = 0;
      refundAmount = bookingData.totalPrice;
    }

    // Update booking status
    await bookingRef.update({
      status: "cancelled",
      cancellationDate: new Date().toISOString(),
      cancellationFee,
      refundAmount,
      updatedAt: new Date().toISOString(),
    });

    // In a real application, you would process the refund through a payment gateway here

    res.status(200).json({
      message: "Booking cancelled successfully",
      cancellationFee,
      refundAmount,
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    res.status(500).json({ error: "Failed to cancel booking" });
  }
};

/**
 * Get booking invoice
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getBookingInvoice = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.uid;

    // Get booking from Firestore
    const bookingRef = db.collection("reservations").doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const bookingData = bookingDoc.data();

    // Check if booking belongs to the user (unless admin)
    if (bookingData.userId !== userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Unauthorized to access this booking invoice" });
    }

    // Get invoice from Firestore
    const invoicesSnapshot = await db
      .collection("invoices")
      .where("bookingId", "==", bookingId)
      .orderBy("createdAt", "desc")
      .get();

    if (invoicesSnapshot.empty) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const invoices = [];

    invoicesSnapshot.forEach((doc) => {
      invoices.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.status(200).json(invoices);
  } catch (error) {
    console.error("Error getting booking invoice:", error);
    res.status(500).json({ error: "Failed to get booking invoice" });
  }
};

module.exports = {
  createBooking,
  getBookingById,
  updateBooking,
  processPayment,
  checkAvailability,
  extendBooking,
  cancelBooking,
  getBookingInvoice,
  getUserBookings,
};
