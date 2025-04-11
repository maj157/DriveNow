const db = require('../firebase');

// Car Group Schema
const carGroupSchema = {
  id: String,
  name: String,
  description: String,
  image: String,
  carCount: Number
};

// Car Schema
const carSchema = {
  groupId: String,
  brand: String,
  model: String,
  year: Number,
  price: Number,
  image: [String], // Array of image URLs
  specs: {
    seats: Number,
    doors: Number,
    gearbox: String, // 'Automatic' or 'Manual'
    fuelType: String, // 'Gasoline', 'Diesel', 'Electric', 'Hybrid'
    trunkCapacity: Number,
    ac: Boolean,
    electricWindows: Boolean,
    mileage: Number,
    additionalFeatures: [String]
  },
  availability: Boolean,
  averageRating: Number,
  rentalCount: Number
};

// Create collections if they don't exist
async function initializeCollections() {
  try {
    // Check if collections exist
    const carGroupsSnapshot = await db.collection('carGroups').limit(1).get();
    const carsSnapshot = await db.collection('cars').limit(1).get();

    // Create collections if they don't exist
    if (carGroupsSnapshot.empty) {
      console.log('Creating carGroups collection...');
      await db.collection('carGroups').doc('dummy').set({});
      await db.collection('carGroups').doc('dummy').delete();
    }

    if (carsSnapshot.empty) {
      console.log('Creating cars collection...');
      await db.collection('cars').doc('dummy').set({});
      await db.collection('cars').doc('dummy').delete();
    }

    console.log('Collections initialized successfully');
  } catch (error) {
    console.error('Error initializing collections:', error);
    throw error;
  }
}

// Validate car data against schema
function validateCarData(carData) {
  const requiredFields = ['groupId', 'brand', 'model', 'year', 'price', 'image', 'specs'];
  const requiredSpecs = ['seats', 'doors', 'gearbox', 'fuelType', 'trunkCapacity', 'ac', 'electricWindows'];

  // Check required fields
  for (const field of requiredFields) {
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
  if (typeof carData.year !== 'number' || carData.year < 1900 || carData.year > new Date().getFullYear() + 1) {
    throw new Error('Invalid year');
  }

  if (typeof carData.price !== 'number' || carData.price <= 0) {
    throw new Error('Invalid price');
  }

  if (!Array.isArray(carData.image) || carData.image.length === 0) {
    throw new Error('Invalid image array');
  }

  if (!['Automatic', 'Manual'].includes(carData.specs.gearbox)) {
    throw new Error('Invalid gearbox type');
  }

  if (!['Gasoline', 'Diesel', 'Electric', 'Hybrid'].includes(carData.specs.fuelType)) {
    throw new Error('Invalid fuel type');
  }

  return true;
}

// Validate car group data against schema
function validateCarGroupData(groupData) {
  const requiredFields = ['id', 'name', 'description', 'image', 'carCount'];

  // Check required fields
  for (const field of requiredFields) {
    if (!groupData[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate data types
  if (typeof groupData.carCount !== 'number' || groupData.carCount < 0) {
    throw new Error('Invalid car count');
  }

  return true;
}

module.exports = {
  carSchema,
  carGroupSchema,
  initializeCollections,
  validateCarData,
  validateCarGroupData
}; 