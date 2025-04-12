const db = require("../firebase");
const { v4: uuidv4 } = require("uuid");

/**
 * Create a new booking
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const createBooking = async (req, res) => {
  try {
    const userId = req.user.uid;
    const {
      carId,
      startDate,
      endDate,
      pickupLocation,
      returnLocation,
      insuranceOption,
      additionalDrivers,
      additionalServices,
    } = req.body;

    // Validate required fields
    if (
      !carId ||
      !startDate ||
      !endDate ||
      !pickupLocation ||
      !returnLocation
    ) {
      return res
        .status(400)
        .json({ error: "Missing required booking information" });
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
    const car = await db.collection("vehicles").doc(carId).get();

    if (!car.exists) {
      return res.status(404).json({ error: "Car not found" });
    }

    const carData = car.data();

    // Check if car is available for the requested dates
    const conflictingBookings = await db
      .collection("reservations")
      .where("carId", "==", carId)
      .where("status", "in", ["confirmed", "active"])
      .where("endDate", ">", startDate)
      .where("startDate", "<", endDate)
      .get();

    if (!conflictingBookings.empty) {
      return res
        .status(400)
        .json({ error: "Car is not available for the selected dates" });
    }

    // Calculate rental duration in days
    const durationMs = end.getTime() - start.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    // Calculate base price
    let basePrice = carData.pricePerDay * durationDays;

    // Calculate additional costs
    let additionalCosts = 0;

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
    const additionalDriversCost = (additionalDrivers || 0) * 10 * durationDays;

    // Additional services cost
    let servicesCost = 0;
    if (additionalServices && additionalServices.length > 0) {
      additionalServices.forEach((service) => {
        if (service.id === "gps") {
          servicesCost += 5 * durationDays;
        } else if (service.id === "childSeat") {
          servicesCost += 7 * durationDays;
        } else if (service.id === "wifi") {
          servicesCost += 8 * durationDays;
        }
      });
    }

    // Different pickup and return location fee
    const locationFee = pickupLocation !== returnLocation ? 50 : 0;

    // Calculate total additional costs
    additionalCosts =
      insuranceCost + additionalDriversCost + servicesCost + locationFee;

    // Calculate total price
    const totalPrice = basePrice + additionalCosts;

    // Create booking record
    const bookingData = {
      id: uuidv4(),
      userId,
      carId,
      carModel: carData.model,
      carMake: carData.make,
      carImage: carData.images[0] || null,
      startDate,
      endDate,
      pickupLocation,
      returnLocation,
      insuranceOption: insuranceOption || "none",
      additionalDrivers: additionalDrivers || 0,
      additionalServices: additionalServices || [],
      status: "pending",
      basePrice,
      additionalCosts,
      totalPrice,
      durationDays,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save booking to Firestore
    const bookingRef = db.collection("reservations").doc(bookingData.id);
    await bookingRef.set(bookingData);

    res.status(201).json({
      message: "Booking created successfully",
      bookingId: bookingData.id,
      booking: bookingData,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Failed to create booking" });
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
    const car = await Car.findById(carId);

    if (!car) {
      return res.status(404).json({ error: "Car not found" });
    }

    // Check car availability for the dates
    const conflictingBookings = await db
      .collection("reservations")
      .where("carId", "==", carId)
      .where("status", "in", ["confirmed", "active"])
      .where("endDate", ">", startDate)
      .where("startDate", "<", endDate)
      .get();

    if (!conflictingBookings.empty) {
      return res
        .status(400)
        .json({ error: "Car is not available for the selected dates" });
    }

    res.status(200).json({ available: true });
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
    const conflictingBookings = await db
      .collection("reservations")
      .where("carId", "==", bookingData.carId)
      .where("status", "in", ["confirmed", "active"])
      .where("id", "!=", bookingId)
      .where("startDate", "<", newEndDate)
      .where("startDate", ">", bookingData.endDate)
      .get();

    if (!conflictingBookings.empty) {
      return res
        .status(400)
        .json({ error: "Car is not available for the extension period" });
    }

    // Get car price
    const carRef = db.collection("vehicles").doc(bookingData.carId);
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
};
