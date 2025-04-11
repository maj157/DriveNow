const jwt = require("jsonwebtoken");
const admin = require("firebase-admin");
const db = require("../firebase");

/**
 * Middleware to verify the JWT token and protect routes
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        error: true,
        message: "No token provided, authorization denied",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user exists in Firebase
    const userRef = db.collection("users").doc(decoded.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(401).json({
        error: true,
        message: "User not found, authorization denied",
      });
    }

    // Add user data to request object
    req.user = {
      uid: decoded.uid,
      email: decoded.email,
      ...userDoc.data(),
    };

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({
      error: true,
      message: "Invalid token, authorization denied",
    });
  }
};

/**
 * Middleware to verify admin role
 */
exports.isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: "User not authenticated",
      });
    }

    // Check if user has admin role
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: true,
        message: "Access denied: Admin privileges required",
      });
    }

    next();
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    res.status(500).json({
      error: true,
      message: "Server error in admin verification",
    });
  }
};

/**
 * Verify Firebase ID token middleware
 */
exports.verifyFirebaseToken = async (req, res, next) => {
  try {
    const idToken = req.header("Authorization")?.replace("Bearer ", "");

    if (!idToken) {
      return res.status(401).json({
        error: true,
        message: "No token provided, authorization denied",
      });
    }

    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Add Firebase user to request
    req.firebaseUser = decodedToken;

    next();
  } catch (error) {
    console.error("Firebase auth middleware error:", error);
    res.status(401).json({
      error: true,
      message: "Invalid Firebase token, authorization denied",
    });
  }
};
