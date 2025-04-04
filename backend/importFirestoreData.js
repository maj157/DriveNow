// importFirestoreData.js
const admin = require("firebase-admin");
const fs = require("fs");

// Load your Firebase service account key
const serviceAccount = require("./firebaseConfig.json");

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Read JSON data
const rawData = fs.readFileSync("./firestore_seed_data.json");
const data = JSON.parse(rawData);

// Function to import data
async function importCollection(collectionName, documents) {
  const collectionRef = db.collection(collectionName);
  for (const doc of documents) {
    await collectionRef.add(doc);
  }
  console.log(`✅ Imported ${documents.length} documents into '${collectionName}'`);
}

// Main import routine
async function runImport() {
  try {
    await importCollection("users", data.users);
    await importCollection("branches", data.branches);
    await importCollection("carGroups", data.carGroups);
    await importCollection("cars", data.cars);
    await importCollection("reviews", data.reviews);
    await importCollection("reservations", data.reservations);

    console.log("🎉 All data imported successfully!");
    process.exit();
  } catch (err) {
    console.error("❌ Error importing data:", err);
    process.exit(1);
  }
}

runImport();
