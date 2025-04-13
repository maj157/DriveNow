const db = require("../firebase");

// Collection reference
const usersCollection = db.collection("users");

/**
 * Find user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object>} - User object
 */
const findById = async (id) => {
  try {
    const userDoc = await usersCollection.doc(id).get();

    if (!userDoc.exists) {
      return null;
    }

    return {
      id: userDoc.id,
      ...userDoc.data(),
    };
  } catch (error) {
    console.error(`Error in User.findById: ${error}`);
    throw error;
  }
};

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object>} - User object
 */
const findByEmail = async (email) => {
  try {
    const querySnapshot = await usersCollection
      .where("email", "==", email)
      .limit(1)
      .get();

    if (querySnapshot.empty) {
      return null;
    }

    const userDoc = querySnapshot.docs[0];
    return {
      id: userDoc.id,
      ...userDoc.data(),
    };
  } catch (error) {
    console.error(`Error in User.findByEmail: ${error}`);
    throw error;
  }
};

/**
 * Get all users
 * @param {Object} options - Query options
 * @returns {Promise<Array>} - Array of user objects
 */
const find = async (options = {}) => {
  try {
    let query = usersCollection;

    // Apply limit if provided
    if (options.limit) {
      query = query.limit(options.limit);
    }

    // Apply ordering if provided
    if (options.orderBy) {
      query = query.orderBy(options.orderBy, options.orderDirection || "asc");
    }

    const querySnapshot = await query.get();
    const users = [];

    querySnapshot.forEach((doc) => {
      users.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return users;
  } catch (error) {
    console.error(`Error in User.find: ${error}`);
    throw error;
  }
};

module.exports = {
  findById,
  findByEmail,
  find,
};
