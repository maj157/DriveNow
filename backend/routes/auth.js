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

// Refresh token endpoint
router.get("/refresh-token", authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found",
      });
    }

    // Generate a new token using the authController
    const token = await authController.generateCustomToken(userId);

    res.status(200).json({
      success: true,
      token,
      message: "Token refreshed successfully",
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({
      success: false,
      message: "Failed to refresh token",
      error: error.message,
    });
  }
});

module.exports = router;
