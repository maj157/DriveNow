const express = require("express");
const router = express.Router();
const discountController = require("../controllers/discountController");
const { authenticate, isAdmin } = require("../middleware/auth");

// Get all coupons - admin only
router.get("/", authenticate, isAdmin, discountController.getCoupons);

// Validate coupon by code - allows anonymous access
router.get("/validate/:code", discountController.validateCoupon);

// Create a new coupon - admin only
router.post("/", authenticate, isAdmin, discountController.createCoupon);

// Apply a coupon (increment usage) - requires authentication (legacy route format)
router.put("/apply/:id", authenticate, discountController.applyCoupon);

// Apply a coupon (increment usage) - allows anonymous access for checkout
router.put("/:id/apply", discountController.applyCoupon);

// Update a coupon - admin only
router.put("/:id", authenticate, isAdmin, discountController.updateCoupon);

// Get single coupon by ID - admin only
router.get("/:id", authenticate, isAdmin, discountController.getCouponById);

// Delete a coupon - admin only
router.delete("/:id", authenticate, isAdmin, discountController.deleteCoupon);

module.exports = router;
