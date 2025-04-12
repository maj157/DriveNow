const admin = require("firebase-admin");
const db = require("../firebase");

/**
 * Middleware to verify Firebase token and protect routes
 * Replaces both authenticate and verifyToken functions
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Check if the authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided, authorization denied",
      });
    }

    // Extract the token
    const token = authHeader.split(" ")[1];

    // Verify the token using Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Get user information from Firestore based on UID
    const userDoc = await db.collection("users").doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        message: "User not found, authorization denied",
      });
    }

    const userData = userDoc.data();

    // Attach user information to the request object
    req.user = {
      _id: decodedToken.uid, // Include _id for backward compatibility
      id: decodedToken.uid,
      uid: decodedToken.uid, // Include uid for backward compatibility
      email: decodedToken.email,
      name: userData.name || decodedToken.name,
      isAdmin: userData.role === "admin" || false,
      ...userData, // Include all other user data
    };

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid token, authorization denied",
      error: error.message,
    });
  }
};

/**
 * Alias for authenticate to maintain backward compatibility
 */
exports.verifyToken = exports.authenticate;

/**
 * Middleware to verify admin role
 */
exports.isAdmin = (req, res, next) => {
  // The authenticate middleware should run first
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required",
    });
  }

  if (!req.user.isAdmin && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Access denied: Admin privileges required",
    });
  }

  next();
};

/**
 * Verify Firebase ID token middleware (simplified version that only puts Firebase data in req.firebaseUser)
 * Used by the /auth routes
 */
exports.verifyFirebaseToken = async (req, res, next) => {
  try {
    const idToken = req.headers.authorization?.replace("Bearer ", "");

    if (!idToken) {
      return res.status(401).json({
        success: false,
        message: "No token provided, authorization denied",
      });
    }

    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(idToken);

    // Add Firebase user to request
    req.firebaseUser = decodedToken;

    next();
  } catch (error) {
    console.error("Firebase token verification error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid Firebase token, authorization denied",
      error: error.message,
    });
  }
};
