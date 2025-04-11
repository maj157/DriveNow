const express = require("express");
const router = express.Router();
const vehicleController = require("../controllers/vehicleController");
const {
  authenticateUser,
  authorizeAdmin,
} = require("../middleware/authMiddleware");

/**
 * @route   GET /api/vehicles
 * @desc    Get all vehicles with filtering options
 * @access  Public
 */
router.get("/", vehicleController.getAllVehicles);

/**
 * @route   GET /api/vehicles/:id
 * @desc    Get vehicle by ID
 * @access  Public
 */
router.get("/:id", vehicleController.getVehicleById);

/**
 * @route   GET /api/vehicles/:id/availability
 * @desc    Check vehicle availability for a date range
 * @access  Public
 */
router.get("/:id/availability", vehicleController.getVehicleAvailability);

/**
 * @route   GET /api/vehicles/:id/reviews
 * @desc    Get vehicle reviews
 * @access  Public
 */
router.get("/:id/reviews", vehicleController.getVehicleReviews);

/**
 * @route   POST /api/vehicles
 * @desc    Create a new vehicle
 * @access  Admin only
 */
router.post(
  "/",
  authenticateUser,
  authorizeAdmin,
  vehicleController.createVehicle
);

/**
 * @route   PUT /api/vehicles/:id
 * @desc    Update a vehicle
 * @access  Admin only
 */
router.put(
  "/:id",
  authenticateUser,
  authorizeAdmin,
  vehicleController.updateVehicle
);

/**
 * @route   DELETE /api/vehicles/:id
 * @desc    Delete a vehicle
 * @access  Admin only
 */
router.delete(
  "/:id",
  authenticateUser,
  authorizeAdmin,
  vehicleController.deleteVehicle
);

/**
 * @route   POST /api/vehicles/:id/reviews
 * @desc    Add a review for a vehicle
 * @access  Authenticated users
 */
router.post(
  "/:id/reviews",
  authenticateUser,
  vehicleController.addVehicleReview
);

module.exports = router;
