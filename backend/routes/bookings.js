const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const bookingController = require("../controllers/bookingController");

// POST /api/bookings - Create a new booking
router.post("/", authenticate, bookingController.createBooking);

// GET /api/bookings/check-availability - Check vehicle availability
router.get("/check-availability", bookingController.checkAvailability);

// GET /api/bookings/:id - Get booking details
router.get("/:id", authenticate, bookingController.getBookingById);

// PUT /api/bookings/:id - Update booking details
router.put("/:id", authenticate, bookingController.updateBooking);

// POST /api/bookings/:id/payment - Process payment for a booking
router.post("/:id/payment", authenticate, bookingController.processPayment);

// POST /api/bookings/:id/extend - Extend booking duration
router.post("/:id/extend", authenticate, bookingController.extendBooking);

// POST /api/bookings/:id/cancel - Cancel booking
router.post("/:id/cancel", authenticate, bookingController.cancelBooking);

// GET /api/bookings/:id/invoice - Get booking invoice
router.get("/:id/invoice", authenticate, bookingController.getBookingInvoice);

module.exports = router;
