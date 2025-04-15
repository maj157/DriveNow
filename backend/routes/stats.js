const express = require("express");
const router = express.Router();
const statsController = require("../controllers/statsController");

// GET /api/stats/rental - Get rental statistics
router.get("/rental", statsController.getRentalStats);

module.exports = router;
