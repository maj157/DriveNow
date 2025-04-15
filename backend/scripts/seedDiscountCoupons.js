const admin = require("firebase-admin");
const path = require("path");

// Initialize Firebase Admin
const serviceAccount = require("../drivenow-de92f-firebase-adminsdk-fbsvc-81f215092a.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Collection reference
const couponsCollection = db.collection("discountCoupons");

// Sample discount coupons
const discountCoupons = [
  {
    code: "WELCOME10",
    discountPercentage: 10,
    discountAmount: 0,
    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // 1 year from now
    isActive: true,
    minimumOrderAmount: 100,
    maxUsage: 1000,
    currentUsage: 0,
    createdAt: new Date(),
  },
  {
    code: "SUMMER25",
    discountPercentage: 25,
    discountAmount: 0,
    expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 months from now
    isActive: true,
    minimumOrderAmount: 200,
    maxUsage: 500,
    currentUsage: 0,
    createdAt: new Date(),
  },
  {
    code: "FLAT50",
    discountPercentage: 0,
    discountAmount: 50,
    expiryDate: new Date(new Date().setMonth(new Date().getMonth() + 2)), // 2 months from now
    isActive: true,
    minimumOrderAmount: 250,
    maxUsage: 200,
    currentUsage: 0,
    createdAt: new Date(),
  },
  {
    code: "TEST20",
    discountPercentage: 20,
    discountAmount: 0,
    expiryDate: new Date(new Date().setDate(new Date().getDate() + 7)), // 7 days from now
    isActive: true,
    minimumOrderAmount: 0,
    maxUsage: null, // unlimited usage
    currentUsage: 0,
    createdAt: new Date(),
  },
];

// Function to seed discount coupons
async function seedDiscountCoupons() {
  try {
    console.log("Starting to seed discount coupons...");

    // First check if coupons already exist
    const existingCoupons = await couponsCollection.get();
    if (!existingCoupons.empty) {
      console.log(
        `${existingCoupons.size} discount coupons already exist. Skipping seed.`
      );
      return;
    }

    // Add each coupon to the database
    const promises = discountCoupons.map(async (coupon) => {
      const docRef = await couponsCollection.add(coupon);
      console.log(
        `Added discount coupon with code ${coupon.code} (ID: ${docRef.id})`
      );
      return docRef;
    });

    await Promise.all(promises);
    console.log(`${discountCoupons.length} discount coupons have been added.`);
  } catch (error) {
    console.error("Error seeding discount coupons:", error);
  }
}

// Execute the seed function
seedDiscountCoupons()
  .then(() => {
    console.log("Discount coupon seeding complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error in seed script:", error);
    process.exit(1);
  });
