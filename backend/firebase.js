require("dotenv").config();
const admin = require("firebase-admin");

// Load the service account key
const serviceAccount = require("./drivenow-de92f-firebase-adminsdk-fbsvc-81f215092a.json");

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    throw error;
  }
}

// Get Firestore instance
const db = admin.firestore();

// Test the connection
db.collection("cars")
  .limit(1)
  .get()
  .then((snapshot) => {
    console.log("Firestore connection test successful");
    console.log(`Found ${snapshot.size} documents in 'cars' collection`);
  })
  .catch((error) => {
    console.error("Firestore connection test failed:", error);
  });

module.exports = db;
