const db = require("../firebase");

// Reference to the reviews collection
const reviewsCollection = db.collection("reviews");

// Review Schema
const reviewSchema = {
  userId: String, // ID of the user who created the review
  userName: String, // Name of the user
  carId: String, // ID of the car being reviewed (changed from vehicle)
  rating: Number, // Rating from 1-5
  comment: String, // Review text
  date: Date, // Date of the review
  status: String, // Status (pending, approved, rejected)
  moderationComment: String, // Optional moderation comment
  moderatedBy: String, // ID of admin who moderated
  moderatedAt: Date, // Date of moderation
  createdAt: Date, // Creation timestamp
  updatedAt: Date, // Last update timestamp
};

/**
 * Create a new review
 * @param {Object} reviewData - The review data to create
 * @returns {Promise<Object>} - The created review with id
 */
const createReview = async (reviewData) => {
  try {
    // Validate review data
    validateReviewData(reviewData);

    // Add timestamps
    const now = new Date();
    const review = {
      ...reviewData,
      status: reviewData.status || "pending",
      date: reviewData.date || now,
      createdAt: now,
      updatedAt: now,
    };

    // Add to Firestore
    const docRef = await reviewsCollection.add(review);

    return {
      id: docRef.id,
      ...review,
    };
  } catch (error) {
    console.error("Error creating review:", error);
    throw error;
  }
};

/**
 * Get a review by ID
 * @param {string} id - The review ID
 * @returns {Promise<Object|null>} - The review document or null if not found
 */
const findById = async (id) => {
  try {
    const docRef = await reviewsCollection.doc(id).get();

    if (!docRef.exists) {
      return null;
    }

    return {
      id: docRef.id,
      ...docRef.data(),
    };
  } catch (error) {
    console.error(`Error getting review with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Find reviews that match the provided query
 * @param {Object} query - The search query
 * @param {Object} options - Search options (sort, pagination, etc.)
 * @returns {Promise<Array>} - Matching reviews
 */
const find = async (query = {}, options = {}) => {
  try {
    let ref = reviewsCollection;

    // Apply filters
    if (query.userId) ref = ref.where("userId", "==", query.userId);
    if (query.carId) ref = ref.where("carId", "==", query.carId); // Changed from vehicle
    if (query.rating) ref = ref.where("rating", "==", query.rating);
    if (query.status) ref = ref.where("status", "==", query.status);

    // Apply sort
    if (options.sort) {
      const [field, order] = Object.entries(options.sort)[0];
      ref = ref.orderBy(field, order === 1 ? "asc" : "desc");
    } else {
      ref = ref.orderBy("createdAt", "desc");
    }

    const snapshot = await ref.get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error finding reviews:", error);
    throw error;
  }
};

/**
 * Update a review
 * @param {string} id - The review ID
 * @param {Object} updateData - The data to update
 * @returns {Promise<Object>} - The updated review
 */
const updateReview = async (id, updateData) => {
  try {
    // Validate review exists
    const review = await findById(id);
    if (!review) {
      throw new Error(`Review with ID ${id} not found`);
    }

    // Add update timestamp
    const now = new Date();
    const updates = {
      ...updateData,
      updatedAt: now,
    };

    // Update in Firestore
    await reviewsCollection.doc(id).update(updates);

    // Get the updated document
    return await findById(id);
  } catch (error) {
    console.error(`Error updating review with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a review
 * @param {string} id - The review ID
 * @returns {Promise<boolean>} - Success status
 */
const deleteReview = async (id) => {
  try {
    // Validate review exists
    const review = await findById(id);
    if (!review) {
      throw new Error(`Review with ID ${id} not found`);
    }

    // Delete from Firestore
    await reviewsCollection.doc(id).delete();

    return true;
  } catch (error) {
    console.error(`Error deleting review with ID ${id}:`, error);
    throw error;
  }
};

/**
 * Find one review that matches the query
 * @param {Object} query - The search query
 * @returns {Promise<Object|null>} - Matching review or null
 */
const findOne = async (query = {}) => {
  try {
    const reviews = await find(query, { limit: 1 });
    return reviews.length > 0 ? reviews[0] : null;
  } catch (error) {
    console.error("Error finding review:", error);
    throw error;
  }
};

/**
 * Validate review data against schema
 * @param {Object} reviewData - The review data to validate
 * @returns {boolean} - Validation result
 */
const validateReviewData = (reviewData) => {
  const requiredFields = ["userId", "userName", "carId", "rating", "comment"]; // Changed from vehicle to carId

  // Check required fields
  for (const field of requiredFields) {
    if (!reviewData[field] && reviewData[field] !== 0) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Validate rating (1-5 stars)
  if (
    typeof reviewData.rating !== "number" ||
    reviewData.rating < 1 ||
    reviewData.rating > 5
  ) {
    throw new Error("Rating must be a number between 1 and 5");
  }

  // Validate comment length
  if (
    typeof reviewData.comment !== "string" ||
    reviewData.comment.trim().length < 2
  ) {
    throw new Error("Comment must be a valid string with meaningful content");
  }

  return true;
};

// Export the review model
module.exports = {
  reviewSchema,
  createReview,
  findById,
  find,
  findOne,
  updateReview,
  deleteReview,
  validateReviewData,
};
