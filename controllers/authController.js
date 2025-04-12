const admin = require("firebase-admin");
const db = require("../firebase");

// Collection reference
const usersCollection = db.collection("users");

exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone } = req.body;

    console.log("Registration attempt for email:", email);

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    // Create user in Firebase Auth
    console.log("Creating user in Firebase Auth...");
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });
    console.log("User created in Firebase Auth with ID:", userRecord.uid);

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
    console.log("Storing user in Firestore...");
    await usersCollection.doc(userRecord.uid).set(userData);
    console.log("User stored in Firestore");

    // Generate custom token for client-side login
    console.log("Generating custom token...");
    const customToken = await admin.auth().createCustomToken(userRecord.uid);
    console.log("Custom token generated");

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
    console.error("Error details:", JSON.stringify(error, null, 2));

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
