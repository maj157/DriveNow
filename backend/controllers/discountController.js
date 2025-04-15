const db = require("../firebase");
const { v4: uuidv4 } = require("uuid");

// Collection reference
const couponsCollection = db.collection("discountCoupons");

// Get all coupons or filter by code
exports.getCoupons = async (req, res) => {
  try {
    let query = couponsCollection;

    // Filter by code if provided
    if (req.query.code) {
      query = query.where("code", "==", req.query.code);
    }

    // Filter by active status if provided
    if (req.query.isActive !== undefined) {
      const isActive = req.query.isActive === "true";
      query = query.where("isActive", "==", isActive);
    }

    const snapshot = await query.get();
    const coupons = [];

    snapshot.forEach((doc) => {
      const coupon = {
        id: doc.id,
        ...doc.data(),
      };

      // Convert Firestore Timestamp to Date
      if (coupon.expiryDate) {
        coupon.expiryDate = coupon.expiryDate.toDate();
      }

      coupons.push(coupon);
    });

    res.status(200).json(coupons);
  } catch (error) {
    console.error("Error fetching discount coupons:", error);
    res.status(500).json({ error: "Failed to fetch discount coupons" });
  }
};

// Get coupon by ID
exports.getCouponById = async (req, res) => {
  try {
    const couponId = req.params.id;
    const couponDoc = await couponsCollection.doc(couponId).get();

    if (!couponDoc.exists) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    const coupon = {
      id: couponDoc.id,
      ...couponDoc.data(),
    };

    // Convert Firestore Timestamp to Date
    if (coupon.expiryDate) {
      coupon.expiryDate = coupon.expiryDate.toDate();
    }

    res.status(200).json(coupon);
  } catch (error) {
    console.error("Error fetching coupon:", error);
    res.status(500).json({ error: "Failed to fetch coupon" });
  }
};

// Create a new coupon
exports.createCoupon = async (req, res) => {
  try {
    const couponData = {
      code: req.body.code,
      discountAmount: req.body.discountAmount || 0,
      discountPercentage: req.body.discountPercentage || 0,
      expiryDate: new Date(req.body.expiryDate),
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      minimumOrderAmount: req.body.minimumOrderAmount || 0,
      maxUsage: req.body.maxUsage || null,
      currentUsage: 0,
      createdAt: new Date(),
    };

    // Check if code already exists
    const existingCoupons = await couponsCollection
      .where("code", "==", couponData.code)
      .get();
    if (!existingCoupons.empty) {
      return res.status(400).json({ error: "Coupon code already exists" });
    }

    // Create new coupon
    const newCouponRef = await couponsCollection.add(couponData);
    const newCoupon = await newCouponRef.get();

    res.status(201).json({
      id: newCoupon.id,
      ...newCoupon.data(),
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ error: "Failed to create coupon" });
  }
};

// Update a coupon
exports.updateCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const couponDoc = await couponsCollection.doc(couponId).get();

    if (!couponDoc.exists) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    const updatedData = {};

    // Only update provided fields
    if (req.body.code !== undefined) updatedData.code = req.body.code;
    if (req.body.discountAmount !== undefined)
      updatedData.discountAmount = req.body.discountAmount;
    if (req.body.discountPercentage !== undefined)
      updatedData.discountPercentage = req.body.discountPercentage;
    if (req.body.expiryDate !== undefined)
      updatedData.expiryDate = new Date(req.body.expiryDate);
    if (req.body.isActive !== undefined)
      updatedData.isActive = req.body.isActive;
    if (req.body.minimumOrderAmount !== undefined)
      updatedData.minimumOrderAmount = req.body.minimumOrderAmount;
    if (req.body.maxUsage !== undefined)
      updatedData.maxUsage = req.body.maxUsage;

    // If updating code, check if it already exists
    if (updatedData.code) {
      const existingCoupons = await couponsCollection
        .where("code", "==", updatedData.code)
        .get();

      let codeExists = false;
      existingCoupons.forEach((doc) => {
        if (doc.id !== couponId) {
          codeExists = true;
        }
      });

      if (codeExists) {
        return res.status(400).json({ error: "Coupon code already exists" });
      }
    }

    // Update the document
    await couponsCollection.doc(couponId).update({
      ...updatedData,
      updatedAt: new Date(),
    });

    // Get updated data
    const updatedCoupon = await couponsCollection.doc(couponId).get();

    res.status(200).json({
      id: updatedCoupon.id,
      ...updatedCoupon.data(),
    });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({ error: "Failed to update coupon" });
  }
};

// Apply coupon (increment usage count)
exports.applyCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const couponDoc = await couponsCollection.doc(couponId).get();

    if (!couponDoc.exists) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    const couponData = couponDoc.data();

    // Check if coupon is active
    if (!couponData.isActive) {
      return res.status(400).json({ error: "Coupon is not active" });
    }

    // Check if coupon is expired
    const expiryDate = couponData.expiryDate.toDate();
    if (expiryDate < new Date()) {
      return res.status(400).json({ error: "Coupon has expired" });
    }

    // Check if coupon has reached max usage
    if (couponData.maxUsage && couponData.currentUsage >= couponData.maxUsage) {
      return res
        .status(400)
        .json({ error: "Coupon has reached maximum usage limit" });
    }

    // Increment usage count
    await couponsCollection.doc(couponId).update({
      currentUsage: (couponData.currentUsage || 0) + 1,
      updatedAt: new Date(),
    });

    res.status(200).json({ message: "Coupon applied successfully" });
  } catch (error) {
    console.error("Error applying coupon:", error);
    res.status(500).json({ error: "Failed to apply coupon" });
  }
};

// Delete a coupon
exports.deleteCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const couponDoc = await couponsCollection.doc(couponId).get();

    if (!couponDoc.exists) {
      return res.status(404).json({ error: "Coupon not found" });
    }

    await couponsCollection.doc(couponId).delete();

    res.status(200).json({ message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ error: "Failed to delete coupon" });
  }
};

// Validate coupon by code
exports.validateCoupon = async (req, res) => {
  try {
    const code = req.params.code;
    const query = couponsCollection.where("code", "==", code);

    const snapshot = await query.get();
    if (snapshot.empty) {
      return res.status(404).json({ error: "Invalid coupon code" });
    }

    const couponDoc = snapshot.docs[0];
    const coupon = {
      id: couponDoc.id,
      ...couponDoc.data(),
    };

    // Convert Firestore Timestamp to Date
    if (coupon.expiryDate) {
      coupon.expiryDate = coupon.expiryDate.toDate();
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      return res.status(400).json({ error: "Coupon is not active" });
    }

    // Check if coupon is expired
    if (coupon.expiryDate < new Date()) {
      return res.status(400).json({ error: "Coupon has expired" });
    }

    // Check if coupon has reached max usage
    if (coupon.maxUsage && coupon.currentUsage >= coupon.maxUsage) {
      return res
        .status(400)
        .json({ error: "Coupon has reached maximum usage limit" });
    }

    res.status(200).json(coupon);
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({ error: "Failed to validate coupon" });
  }
};
