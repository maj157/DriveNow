const db = require("../firebase");

/**
 * Get user profile information
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get user data from Firestore
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();

    // Remove sensitive information
    delete userData.password;

    res.status(200).json(userData);
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({ error: "Failed to get user profile" });
  }
};

/**
 * Update user profile information
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.uid;
    const updateData = req.body;

    // Prevent updating sensitive fields
    delete updateData.points;
    delete updateData.role;
    delete updateData.email; // Email should be updated through Firebase Auth
    delete updateData.password;

    // Get user reference
    const userRef = db.collection("users").doc(userId);

    // Update user data
    await userRef.update(updateData);

    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Failed to update user profile" });
  }
};

/**
 * Get user loyalty points
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getUserPoints = async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get user data from Firestore
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();

    res.status(200).json({
      points: userData.points || 0,
      pointsHistory: userData.pointsHistory || [],
    });
  } catch (error) {
    console.error("Error getting user points:", error);
    res.status(500).json({ error: "Failed to get user points" });
  }
};

/**
 * Get user bookings
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get user bookings from Firestore
    const bookingsSnapshot = await db
      .collection("reservations")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    if (bookingsSnapshot.empty) {
      return res.status(200).json([]);
    }

    const bookings = [];

    bookingsSnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error getting user bookings:", error);
    res.status(500).json({ error: "Failed to get user bookings" });
  }
};

/**
 * Get user invoices
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const getUserInvoices = async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get user invoices from Firestore
    const invoicesSnapshot = await db
      .collection("invoices")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    if (invoicesSnapshot.empty) {
      return res.status(200).json([]);
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
    console.error("Error getting user invoices:", error);
    res.status(500).json({ error: "Failed to get user invoices" });
  }
};

/**
 * Delete user booking
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const deleteBooking = async (req, res) => {
  try {
    const userId = req.user.uid;
    const bookingId = req.params.id;

    // Get booking
    const bookingRef = db.collection("reservations").doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return res.status(404).json({ error: "Booking not found" });
    }

    const bookingData = bookingDoc.data();

    // Check if booking belongs to user
    if (bookingData.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this booking" });
    }

    // Check if booking is already finalized
    if (bookingData.status === "finalized") {
      return res.status(400).json({ error: "Cannot delete finalized booking" });
    }

    // Update booking status to cancelled
    await bookingRef.update({
      status: "cancelled",
      cancelledAt: new Date().toISOString(),
    });

    res.status(200).json({ message: "Booking cancelled successfully" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ error: "Failed to delete booking" });
  }
};

/**
 * Apply discount code
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const applyDiscount = async (req, res) => {
  try {
    const { discountCode, reservationId } = req.body;

    if (!discountCode || !reservationId) {
      return res
        .status(400)
        .json({ error: "Discount code and reservation ID are required" });
    }

    // Get discount code from Firestore
    const discountSnapshot = await db
      .collection("discounts")
      .where("code", "==", discountCode)
      .where("isActive", "==", true)
      .get();

    if (discountSnapshot.empty) {
      return res
        .status(404)
        .json({ error: "Invalid or expired discount code" });
    }

    // Get the discount data
    const discountData = discountSnapshot.docs[0].data();

    // Check if discount code has expired
    const currentDate = new Date();
    if (
      discountData.expiryDate &&
      new Date(discountData.expiryDate) < currentDate
    ) {
      return res.status(400).json({ error: "Discount code has expired" });
    }

    // Get reservation
    const reservationRef = db.collection("reservations").doc(reservationId);
    const reservationDoc = await reservationRef.get();

    if (!reservationDoc.exists) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    const reservationData = reservationDoc.data();

    // Check if reservation belongs to user
    if (reservationData.userId !== req.user.uid) {
      return res
        .status(403)
        .json({ error: "Unauthorized to apply discount to this reservation" });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discountData.type === "percentage") {
      discountAmount = (reservationData.totalPrice * discountData.value) / 100;
    } else if (discountData.type === "fixed") {
      discountAmount = discountData.value;
    }

    // Calculate new total price
    const newTotalPrice = Math.max(
      0,
      reservationData.totalPrice - discountAmount
    );

    // Update reservation with discount
    await reservationRef.update({
      discountCode: discountCode,
      discountAmount: discountAmount,
      totalPrice: newTotalPrice,
      updatedAt: new Date().toISOString(),
    });

    res.status(200).json({
      message: "Discount applied successfully",
      discountAmount,
      newTotalPrice,
    });
  } catch (error) {
    console.error("Error applying discount:", error);
    res.status(500).json({ error: "Failed to apply discount" });
  }
};

/**
 * Redeem loyalty points
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const redeemPoints = async (req, res) => {
  try {
    const userId = req.user.uid;
    const { points, reservationId } = req.body;

    if (!points || !reservationId) {
      return res
        .status(400)
        .json({ error: "Points and reservation ID are required" });
    }

    // Check if points is a valid number
    const pointsToRedeem = parseInt(points);
    if (isNaN(pointsToRedeem) || pointsToRedeem <= 0) {
      return res.status(400).json({ error: "Invalid points value" });
    }

    // Get user data
    const userRef = db.collection("users").doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = userDoc.data();
    const userPoints = userData.points || 0;

    // Check if user has enough points
    if (userPoints < pointsToRedeem) {
      return res.status(400).json({ error: "Not enough points to redeem" });
    }

    // Get reservation
    const reservationRef = db.collection("reservations").doc(reservationId);
    const reservationDoc = await reservationRef.get();

    if (!reservationDoc.exists) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    const reservationData = reservationDoc.data();

    // Check if reservation belongs to user
    if (reservationData.userId !== userId) {
      return res
        .status(403)
        .json({ error: "Unauthorized to redeem points for this reservation" });
    }

    // Calculate discount amount (1 point = $1)
    const discountAmount = pointsToRedeem;

    // Calculate new total price
    const newTotalPrice = Math.max(
      0,
      reservationData.totalPrice - discountAmount
    );

    // Update user points
    await userRef.update({
      points: userPoints - pointsToRedeem,
      pointsHistory: [
        ...(userData.pointsHistory || []),
        {
          type: "redeem",
          amount: pointsToRedeem,
          date: new Date().toISOString(),
          description: `Redeemed for reservation ${reservationId}`,
        },
      ],
    });

    // Update reservation with points redemption
    await reservationRef.update({
      pointsRedeemed: pointsToRedeem,
      totalPrice: newTotalPrice,
      updatedAt: new Date().toISOString(),
    });

    res.status(200).json({
      message: "Points redeemed successfully",
      pointsRedeemed: pointsToRedeem,
      newTotalPrice,
      remainingPoints: userPoints - pointsToRedeem,
    });
  } catch (error) {
    console.error("Error redeeming points:", error);
    res.status(500).json({ error: "Failed to redeem points" });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserPoints,
  getUserBookings,
  getUserInvoices,
  deleteBooking,
  applyDiscount,
  redeemPoints,
};
