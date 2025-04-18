const admin = require("firebase-admin");
const db = require("../firebase");

// Collection reference
const usersCollection = db.collection("users");

/**
 * Register a new user
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    // Create user document in Firestore
    const userData = {
      firstName,
      lastName,
      email,
      phone: phone || "",
      role: "customer", // Default role
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Store user in Firestore
    await usersCollection.doc(userRecord.uid).set(userData);

    // Generate custom token for client-side login
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      token: customToken,
      user: {
        id: userRecord.uid,
        email: userRecord.email,
        firstName,
        lastName,
        role: "customer",
      },
    });
  } catch (error) {
    console.error("Error in register:", error);

    // Handle duplicate email
    if (error.code === "auth/email-already-exists") {
      return res.status(400).json({
        success: false,
        message: "Email already in use",
      });
    }

    // Handle weak password
    if (error.code === "auth/weak-password") {
      return res.status(400).json({
        success: false,
        message: "Password is too weak",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to register user",
      error: error.message,
    });
  }
};

/**
 * Login with email and password
 * This server-side login is optional since Firebase can handle auth directly on the client
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Get the user by email from Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(email);

    // Verify password (This is usually done by Firebase client SDK)
    // Note: Server-side password verification requires a custom identity platform
    // For a real app, consider using Firebase client SDK for login

    // For demo purposes, we'll create a custom token
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    // Get user data from Firestore
    const userDoc = await usersCollection.doc(userRecord.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: "User data not found",
      });
    }

    const userData = userDoc.data();

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token: customToken,
      user: {
        id: userRecord.uid,
        email: userRecord.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role || "customer",
      },
    });
  } catch (error) {
    console.error("Error in login:", error);

    // Handle invalid email
    if (
      error.code === "auth/user-not-found" ||
      error.code === "auth/invalid-email"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to login",
      error: error.message,
    });
  }
};

/**
 * Exchange Firebase ID token for user profile
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.getProfile = async (req, res) => {
  try {
    // The user is already verified and attached by the middleware
    if (!req.user || !req.user.uid) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // We already have all the user data from the middleware
    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        phone: req.user.phone,
        role: req.user.role || "customer",
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error in getProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
      error: error.message,
    });
  }
};

/**
 * Update user profile
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const uid = req.user.uid;

    // Validate input
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "First name and last name are required",
      });
    }

    // Update user in Firebase Auth
    await admin.auth().updateUser(uid, {
      displayName: `${firstName} ${lastName}`,
    });

    // Update user in Firestore
    const updateData = {
      firstName,
      lastName,
      phone: phone || "",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await usersCollection.doc(uid).update(updateData);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: uid,
        firstName,
        lastName,
        phone: phone || "",
      },
    });
  } catch (error) {
    console.error("Error in updateProfile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
};

/**
 * Change user password
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const uid = req.user.uid;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // For security, password changes should be done via Firebase client SDK
    // where the user must be freshly authenticated

    // Update password in Firebase Auth
    // This is a simplified version; in production, current password verification would be needed
    await admin.auth().updateUser(uid, {
      password: newPassword,
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error in changePassword:", error);

    if (error.code === "auth/weak-password") {
      return res.status(400).json({
        success: false,
        message: "New password is too weak",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error.message,
    });
  }
};

/**
 * Generate a custom token for a user
 * @param {string} userId - User ID to generate token for
 * @returns {Promise<string>} Custom authentication token
 */
exports.generateCustomToken = async (userId) => {
  try {
    console.log(`Generating new custom token for user ${userId}`);
    const customToken = await admin.auth().createCustomToken(userId);
    return customToken;
  } catch (error) {
    console.error("Error generating custom token:", error);
    throw new Error(`Failed to generate custom token: ${error.message}`);
  }
};
