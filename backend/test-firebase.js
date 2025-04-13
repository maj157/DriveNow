require("dotenv").config();
const admin = require("firebase-admin");

console.log("Testing Firebase Authentication...");
console.log("Firebase environment variables:");
console.log("PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
console.log("CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
console.log("PRIVATE_KEY set:", !!process.env.FIREBASE_PRIVATE_KEY);

try {
  // Format the private key correctly
  const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
  
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: privateKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
  };

  console.log("Service account object structure:", Object.keys(serviceAccount));
  
  // Initialize Firebase Admin
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log("Firebase Admin SDK initialized successfully!");
  
  // Test creating a user
  async function testCreateUser() {
    try {
      const userEmail = `test-${Date.now()}@example.com`;
      const userRecord = await admin.auth().createUser({
        email: userEmail,
        password: 'Test123!',
        displayName: 'Test User'
      });
      
      console.log("Successfully created new user:", userRecord.uid);
      
      // Clean up by deleting the test user
      await admin.auth().deleteUser(userRecord.uid);
      console.log("Successfully deleted test user");
      
    } catch (error) {
      console.error("Error creating test user:", error);
    }
  }
  
  // Run the test
  testCreateUser();
  
} catch (error) {
  console.error("Firebase initialization error:", error);
} 