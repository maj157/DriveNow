require("dotenv").config();
const admin = require("firebase-admin");
const serviceAccount = require("../drivenow-de92f-firebase-adminsdk-fbsvc-81f215092a.json");

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function makeUserAdmin(email) {
  try {
    // Get the user by email
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`Found user: ${userRecord.uid} (${email})`);

    // Update user in Firestore
    await db.collection("users").doc(userRecord.uid).update({
      role: "admin",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Successfully made ${email} an admin!`);

    // Verify update
    const updatedDoc = await db.collection("users").doc(userRecord.uid).get();
    console.log("Updated user data:", updatedDoc.data());
  } catch (error) {
    console.error("Error making user admin:", error);
  } finally {
    process.exit();
  }
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.error("Please provide an email address as an argument");
  console.log("Usage: node makeAdmin.js user@example.com");
  process.exit(1);
}

makeUserAdmin(email);
