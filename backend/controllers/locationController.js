const db = require("../firebase");

// Collection reference
const locationsCollection = db.collection("branches");

/**
 * Get all branches/locations
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllLocations = async (req, res) => {
  try {
    const locationsSnapshot = await locationsCollection.get();
    
    if (locationsSnapshot.empty) {
      return res.status(200).json([]);
    }
    
    const locations = [];
    locationsSnapshot.forEach(doc => {
      const locationData = doc.data();
      
      locations.push({
        id: doc.id,
        name: locationData.name,
        address: locationData.address,
        latitude: locationData.lat,
        longitude: locationData.lng,
        phoneNumber: locationData.phone,
        openingHours: {
          open: locationData.open,
          close: locationData.close
        }
      });
    });
    
    res.status(200).json(locations);
  } catch (error) {
    console.error("Error getting locations:", error);
    res.status(500).json({ 
      error: true, 
      message: "Error retrieving locations" 
    });
  }
};

/**
 * Get a location by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getLocationById = async (req, res) => {
  try {
    const locationId = req.params.id;
    const locationDoc = await locationsCollection.doc(locationId).get();
    
    if (!locationDoc.exists) {
      return res.status(404).json({ 
        error: true, 
        message: "Location not found" 
      });
    }
    
    const locationData = locationDoc.data();
    
    res.status(200).json({
      id: locationDoc.id,
      name: locationData.name,
      address: locationData.address,
      latitude: locationData.lat,
      longitude: locationData.lng,
      phoneNumber: locationData.phone,
      openingHours: {
        open: locationData.open,
        close: locationData.close
      }
    });
  } catch (error) {
    console.error("Error getting location:", error);
    res.status(500).json({ 
      error: true, 
      message: "Error retrieving location" 
    });
  }
};

module.exports = {
  getAllLocations,
  getLocationById
}; 