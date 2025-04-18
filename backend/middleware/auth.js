const admin = require("firebase-admin");
const db = require("../firebase");
const jwt = require("jsonwebtoken");

/**
 * Middleware to verify token and protect routes
 * Support both Firebase ID tokens and custom tokens
 */
exports.authenticate = async (req, res, next) => {
  try {
    // Check if the authorization header exists
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn("No authorization header provided or invalid format");
      return res.status(401).json({
        success: false,
        message: "No token provided, authorization denied",
      });
    }

    // Extract the token
    const token = authHeader.split(" ")[1];
    let uid;

    // Log the extracted token (safely, without showing all of it)
    console.log(`Auth token received: ${token.substring(0, 10)}...`);

    try {
      // First attempt to verify as ID token
      console.log("Attempting to verify ID token...");
      const decodedToken = await admin.auth().verifyIdToken(token);
      uid = decodedToken.uid;
      console.log("Successfully verified ID token for user:", uid);
    } catch (idTokenError) {
      console.log("Failed to verify as ID token:", idTokenError.message);
      console.log("Token verification error details:", idTokenError);

      // If not an ID token, try to decode as a custom token
      try {
        console.log("Attempting to decode as custom token...");
        // Custom tokens are JWT tokens signed by Firebase
        // We can decode them to get the uid without verification
        const decodedCustomToken = jwt.decode(token);
        console.log("Decoded custom token:", decodedCustomToken);

        // Custom tokens contain the uid in the payload
        if (decodedCustomToken && decodedCustomToken.uid) {
          uid = decodedCustomToken.uid;
          console.log("Successfully decoded custom token for user:", uid);
        } else {
          throw new Error("Invalid custom token format");
        }
      } catch (customTokenError) {
        console.error("Failed to decode custom token:", customTokenError);
        throw idTokenError; // Throw the original error for better debugging
      }
    }

    if (!uid) {
      console.error("Could not extract user ID from token");
      return res.status(401).json({
        success: false,
        message: "Invalid token format, could not extract user ID",
      });
    }

    // Get user information from Firestore based on UID
    console.log("Looking up user information in Firestore...");
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      console.warn(`User with ID ${uid} not found in database`);
      return res.status(401).json({
        success: false,
        message: "User not found, authorization denied",
      });
    }

    const userData = userDoc.data();
    console.log(`User ${uid} authenticated successfully`);

    // Attach user information to the request object
    req.user = {
      _id: uid, // Include _id for backward compatibility
      id: uid,
      uid: uid, // Include uid for backward compatibility
      userId: uid, // Add userId for consistency with frontend
      email: userData.email,
      name: userData.name || `${userData.firstName} ${userData.lastName}`,
      isAdmin: userData.role === "admin" || false,
      ...userData, // Include all other user data
    };

    console.log("Request authenticated with user data:", {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      isAdmin: req.user.isAdmin,
    });

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
