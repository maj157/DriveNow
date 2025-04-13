const express = require("express");
const router = express.Router();
const db = require("../firebase");
const { verifyToken, isAdmin } = require("../middleware/auth");
const carController = require("../controllers/carController");

// Public routes - Get cars
// Root route should be first to avoid conflicting with other routes
router.get("/", carController.getAllCars);

// Fixed/static routes (no parameters) need to be before dynamic parameter routes
router.get("/random-distinct", carController.getRandomCarsFromDistinctGroups);
router.get("/filter", carController.filterCars);
router.get("/groups", carController.getCarGroups);
router.get("/group/:groupId", carController.getCarsByGroup);
router.get("/stats/most-rented", carController.getMostRentedCar);
router.get("/stats/average-fee", carController.getAverageDailyFee);

// Dynamic parameter routes last
router.get("/:id/availability", carController.getCarAvailability);
router.get("/:id/reviews", carController.getCarReviews);
router.get("/:id", carController.getCarById);

// Protected routes - require authentication
router.post("/:id/reviews", verifyToken, carController.addCarReview);

// Admin only routes
router.post("/", verifyToken, isAdmin, carController.createCar);
router.put("/:id", verifyToken, isAdmin, carController.updateCar);
router.delete("/:id", verifyToken, isAdmin, carController.deleteCar);

module.exports = router;
