const fs = require("fs");
const path = require("path");
require("dotenv").config();

console.log("Running environment configuration script...");

// Get environment values with fallbacks
const isProd = process.env.NODE_ENV === "production";
const apiUrl = isProd ? "/api" : "http://localhost:3000/api";
const firebaseApiKey = process.env.FIREBASE_API_KEY || "YOUR_API_KEY";
const firebaseAuthDomain =
  process.env.FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com";
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID";
const firebaseStorageBucket =
  process.env.FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com";
const firebaseMessagingSenderId =
  process.env.FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID";
const firebaseAppId = process.env.FIREBASE_APP_ID || "YOUR_APP_ID";

// Define base environment file content with actual values substituted
const environmentFileContent = `
export const environment = {
  production: ${isProd},
  apiUrl: '${apiUrl}',
  firebase: {
    apiKey: "${firebaseApiKey}",
    authDomain: "${firebaseAuthDomain}",
    projectId: "${firebaseProjectId}",
    storageBucket: "${firebaseStorageBucket}",
    messagingSenderId: "${firebaseMessagingSenderId}",
    appId: "${firebaseAppId}"
  }
};
`;

// Ensure environments directory exists
const envDirectory = path.join(__dirname, "src", "environments");
if (!fs.existsSync(envDirectory)) {
  fs.mkdirSync(envDirectory, { recursive: true });
}

// Write the environment file
const targetPath = path.join(envDirectory, "environment.ts");
fs.writeFileSync(targetPath, environmentFileContent);

console.log(`Environment file generated at ${targetPath}`);

// If in production mode, also write production environment file
if (isProd) {
  const prodTargetPath = path.join(envDirectory, "environment.prod.ts");
  fs.writeFileSync(prodTargetPath, environmentFileContent);
  console.log(`Production environment file generated at ${prodTargetPath}`);
}
