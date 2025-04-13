const db = require("../firebase");

/**
 * Calculate the most popular car based on reservations
 * @returns {Promise<Object>} The most popular car object
 */
const getMostPopularCar = async () => {
  try {
    // Get all reservations
    const reservationsSnapshot = await db
      .collection("reservations")
      .where("status", "==", "finalized")
      .get();

    if (reservationsSnapshot.empty) {
      return null;
    }

    // Count car occurrences in reservations
    const carCounts = {};

    reservationsSnapshot.forEach((doc) => {
      const reservation = doc.data();
      const cars = reservation.cars || [];

      cars.forEach((carName) => {
        if (carCounts[carName]) {
          carCounts[carName]++;
        } else {
          carCounts[carName] = 1;
        }
      });
    });

    // Find the car with the highest count
    let mostPopularCarName = null;
    let highestCount = 0;

    for (const [carName, count] of Object.entries(carCounts)) {
      if (count > highestCount) {
        mostPopularCarName = carName;
        highestCount = count;
      }
    }

    if (!mostPopularCarName) {
      return null;
    }

    // Get the car details
    const carModelName = mostPopularCarName.split(" ")[1]; // Extract the model name
    const carsSnapshot = await db
      .collection("cars")
      .where("model", "==", carModelName)
      .limit(1)
      .get();

    if (carsSnapshot.empty) {
      return {
        name: mostPopularCarName,
        count: highestCount,
      };
    }

    const carData = carsSnapshot.docs[0].data();
    return {
      ...carData,
      name: mostPopularCarName,
      count: highestCount,
    };
  } catch (error) {
    console.error("Error getting most popular car:", error);
    throw error;
  }
};

/**
 * Calculate the average daily rental fee
 * @returns {Promise<number>} The average daily rental fee
 */
const getAverageDailyFee = async () => {
  try {
    // Get all cars
    const carsSnapshot = await db.collection("cars").get();

    if (carsSnapshot.empty) {
      return 0;
    }

    // Calculate the average price per day
    let totalPrice = 0;
    let carCount = 0;

    carsSnapshot.forEach((doc) => {
      const car = doc.data();
      if (car.pricePerDay) {
        totalPrice += car.pricePerDay;
        carCount++;
      }
    });

    return carCount > 0 ? Math.round(totalPrice / carCount) : 0;
  } catch (error) {
    console.error("Error getting average daily fee:", error);
    throw error;
  }
};

/**
 * Get reservation statistics
 * @returns {Promise<Object>} Reservation statistics
 */
const getReservationStats = async () => {
  try {
    // Get all reservations
    const reservationsSnapshot = await db.collection("reservations").get();

    if (reservationsSnapshot.empty) {
      return {
        totalReservations: 0,
        finalizedReservations: 0,
        savedReservations: 0,
        cancelledReservations: 0,
        totalRevenue: 0,
      };
    }

    let totalReservations = 0;
    let finalizedReservations = 0;
    let savedReservations = 0;
    let cancelledReservations = 0;
    let totalRevenue = 0;

    reservationsSnapshot.forEach((doc) => {
      const reservation = doc.data();
      totalReservations++;

      if (reservation.status === "finalized") {
        finalizedReservations++;
        totalRevenue += reservation.totalPrice || 0;
      } else if (reservation.status === "saved") {
        savedReservations++;
      } else if (reservation.status === "cancelled") {
        cancelledReservations++;
      }
    });

    return {
      totalReservations,
      finalizedReservations,
      savedReservations,
      cancelledReservations,
      totalRevenue,
    };
  } catch (error) {
    console.error("Error getting reservation stats:", error);
    throw error;
  }
};

/**
 * Get user statistics
 * @returns {Promise<Object>} User statistics
 */
const getUserStats = async () => {
  try {
    // Get all users
    const usersSnapshot = await db.collection("users").get();

    if (usersSnapshot.empty) {
      return {
        totalUsers: 0,
        averagePoints: 0,
        totalPoints: 0,
      };
    }

    let totalUsers = 0;
    let totalPoints = 0;

    usersSnapshot.forEach((doc) => {
      const user = doc.data();
      totalUsers++;
      totalPoints += user.points || 0;
    });

    const averagePoints =
      totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0;

    return {
      totalUsers,
      averagePoints,
      totalPoints,
    };
  } catch (error) {
    console.error("Error getting user stats:", error);
    throw error;
  }
};

/**
 * Get all statistics for dashboard
 * @returns {Promise<Object>} All statistics
 */
const getAllStats = async () => {
  try {
    const [mostPopularCar, averageDailyFee, reservationStats, userStats] =
      await Promise.all([
        getMostPopularCar(),
        getAverageDailyFee(),
        getReservationStats(),
        getUserStats(),
      ]);

    return {
      mostPopularCar,
      averageDailyFee,
      reservationStats,
      userStats,
    };
  } catch (error) {
    console.error("Error getting all stats:", error);
    throw error;
  }
};

module.exports = {
  getMostPopularCar,
  getAverageDailyFee,
  getReservationStats,
  getUserStats,
  getAllStats,
};
