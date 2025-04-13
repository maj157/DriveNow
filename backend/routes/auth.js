const express = require("express");
const router = express.Router();
const { authenticate, verifyFirebaseToken } = require("../middleware/auth");
const authController = require("../controllers/authController");

// Auth routes
router.post("/register", authController.register);
router.post("/login", authController.login);

// Protected profile routes
router.get("/me", authenticate, authController.getProfile);
router.put("/profile", authenticate, authController.updateProfile);
router.put("/password", authenticate, authController.changePassword);

// Verify token validity
router.get("/verify", authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    valid: true,
    user: req.user,
  });
});

module.exports = router;
