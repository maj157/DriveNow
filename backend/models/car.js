const db = require("../firebase");

// Car Schema
const carSchema = {
  brand: String,
  model: String,
  year: Number,
  type: String,
  pricePerDay: Number,
  location: String,
  images: [String],
  available: Boolean, // renamed from availability for consistency
  specs: {
    engineSize: Number, // changed to Number for consistency
    seats: Number,
    doors: Number,
    gearbox: String,
    fuelType: String,
    trunkCapacity: Number,
    ac: Boolean,
    electricWindows: Boolean,
    mileage: Number,
    additionalFeatures: [String],
  },
  reviews: [String], // Added from Vehicle model
  owner: String, // Added from Vehicle model
  createdAt: Date,
  updatedAt: Date,
};

// Collection reference
const carsCollection = db.collection("cars");

/**
 * Create a new car
 * @param {Object} carData - The car data to create
 */
const createCar = async (carData) => {
  try {
    validateCarData(carData);

    const now = new Date();
    const car = {
      ...carData,
      createdAt: now,
      updatedAt: now,
      available: true,
    };

    const docRef = await carsCollection.add(car);
    return { id: docRef.id, ...car };
  } catch (error) {
    console.error("Error creating car:", error);
    throw error;
  }
};

/**
 * Find car by ID
 */
const findById = async (id) => {
  try {
    const doc = await carsCollection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error finding car:", error);
    throw error;
  }
};

/**
 * Find cars by query
 */
const find = async (query = {}, options = {}) => {
  try {
    let ref = carsCollection;

    if (query.brand) ref = ref.where("make", "==", query.brand); // align field names
    if (query.model) ref = ref.where("model", "==", query.model);
    if (query.type) ref = ref.where("type", "==", query.type);
    if (query.availability !== undefined)
      ref = ref.where("available", "==", query.availability); // align field names

    // Apply sort
    const [field, order] = (options.sort || "createdAt:desc").split(":");
    ref = ref.orderBy(field, order === "desc" ? "desc" : "asc");

    const snapshot = await ref.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error finding cars:", error);
    throw error;
  }
};

/**
 * Update a car
 */
const updateCar = async (id, updateData) => {
  try {
    const car = await findById(id);
    if (!car) throw new Error("Car not found");

    const updates = {
      ...updateData,
      updatedAt: new Date(),
    };

    await carsCollection.doc(id).update(updates);
    return await findById(id);
  } catch (error) {
    console.error("Error updating car:", error);
    throw error;
  }
};

/**
 * Delete a car
 */
const deleteCar = async (id) => {
  try {
    await carsCollection.doc(id).delete();
    return true;
  } catch (error) {
    console.error("Error deleting car:", error);
    throw error;
  }
};

/**
 * Validate car data
 */
function validateCarData(carData) {
  const required = ["brand", "model", "year", "pricePerDay", "type", "specs"];
  const requiredSpecs = ["seats", "doors", "gearbox", "fuelType"];

  // Check required fields
  for (const field of required) {
    if (!carData[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Check required specs
  for (const spec of requiredSpecs) {
    if (!carData.specs[spec]) {
      throw new Error(`Missing required spec: ${spec}`);
    }
  }

  // Validate data types
  if (
    typeof carData.year !== "number" ||
    carData.year < 1900 ||
    carData.year > new Date().getFullYear() + 1
  ) {
    throw new Error("Invalid year");
  }

  if (typeof carData.pricePerDay !== "number" || carData.pricePerDay <= 0) {
    throw new Error("Invalid price");
  }

  if (!["Automatic", "Manual"].includes(carData.specs.gearbox)) {
    throw new Error("Invalid gearbox type");
  }

  if (
    !["Gasoline", "Diesel", "Electric", "Hybrid"].includes(
      carData.specs.fuelType
    )
  ) {
    throw new Error("Invalid fuel type");
  }

  return true;
}

module.exports = {
  carSchema,
  createCar,
  findById,
  find,
  updateCar,
  deleteCar,
};
