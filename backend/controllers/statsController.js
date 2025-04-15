const db = require("../firebase");

/**
 * Get rental statistics
 * Includes most popular car and average daily rental fee
 */
exports.getRentalStats = async (req, res) => {
  try {
    console.log("Fetching rental statistics...");

    // Get all reservations with the status "Confirmed"
    const reservationsSnapshot = await db
      .collection("reservations")
      .where("status", "==", "Confirmed")
      .get();

    if (reservationsSnapshot.empty) {
      console.log("No reservations found with status 'Confirmed'");
      return res.status(200).json({
        mostPopularCar: null,
        averageDailyRental: 0,
        totalBookings: 0,
      });
    }

    console.log(`Found ${reservationsSnapshot.size} reservations`);

    // Extract reservation data
    const reservations = [];
    reservationsSnapshot.forEach((doc) => {
      reservations.push({ id: doc.id, ...doc.data() });
    });

    // Calculate statistics
    const stats = calculateRentalStatistics(reservations);

    // Get most popular car details
    let mostPopularCar = null;
    if (stats.mostPopularCarId) {
      const carDoc = await db
        .collection("cars")
        .doc(stats.mostPopularCarId)
        .get();

      if (carDoc.exists) {
        mostPopularCar = {
          id: carDoc.id,
          ...carDoc.data(),
          bookingCount: stats.mostPopularCarCount,
          bookingPercentage: Math.round(
            (stats.mostPopularCarCount / reservations.length) * 100
          ),
        };
      } else {
        console.log(
          `Car with ID ${stats.mostPopularCarId} not found in cars collection`
        );
      }
    }

    // Get additional statistics
    const { totalCarModels, totalUniqueUsers } = await getAdditionalStats(
      reservations
    );

    res.status(200).json({
      mostPopularCar,
      averageDailyRental: stats.averageDailyRental,
      medianDailyRental: stats.medianDailyRental,
      totalBookings: reservations.length,
      totalCarModels,
      totalUniqueUsers,
      averageDuration: stats.averageDuration,
    });
  } catch (error) {
    console.error("Error fetching rental statistics:", error);
    res.status(500).json({ error: "Failed to fetch rental statistics" });
  }
};

/**
 * Get additional statistics such as total car models and unique users
 */
async function getAdditionalStats(reservations) {
  // Count unique car models
  const uniqueCarIds = new Set(
    reservations.map((reservation) => reservation.carId)
  );
  const totalCarModels = uniqueCarIds.size;

  // Count unique users
  const uniqueUserIds = new Set(
    reservations.map((reservation) => reservation.userId)
  );
  const totalUniqueUsers = uniqueUserIds.size;

  return {
    totalCarModels,
    totalUniqueUsers,
  };
}

/**
 * Calculate rental statistics from reservation data
 */
function calculateRentalStatistics(reservations) {
  // Find most popular car
  const carCounts = {};
  const dailyRates = [];
  let totalDays = 0;

  reservations.forEach((reservation) => {
    // Count car bookings by model/make since IDs might be inconsistent
    const carId = reservation.carId || "";
    const carKey = carId || `${reservation.carMake} ${reservation.carModel}`;

    carCounts[carId] = (carCounts[carId] || 0) + 1;

    // Calculate rental duration
    let durationDays = reservation.durationDays || 0;

    // If we have explicit duration days, use that
    if (!durationDays && reservation.startDate && reservation.endDate) {
      const startDate = new Date(reservation.startDate);
      const endDate = new Date(reservation.endDate);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      durationDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      durationDays = Math.max(1, durationDays); // Minimum 1 day
    }

    // Calculate daily rate
    let dailyRate = 0;
    if (durationDays > 0) {
      if (reservation.basePrice) {
        dailyRate = reservation.basePrice / durationDays;
      } else if (reservation.totalPrice) {
        // If only total price is available, estimate daily rate
        // by subtracting any known additional charges
        let baseAmount = reservation.totalPrice;
        if (
          reservation.additionalServices &&
          Array.isArray(reservation.additionalServices)
        ) {
          const additionalServicesTotal = reservation.additionalServices.reduce(
            (sum, service) => sum + (service.price || 0),
            0
          );
          baseAmount -= additionalServicesTotal;
        }
        dailyRate = baseAmount / durationDays;
      }
    }

    if (dailyRate > 0) {
      dailyRates.push(dailyRate);
      totalDays += durationDays;
    }
  });

  // Find most popular car
  let mostPopularCarId = null;
  let mostPopularCarCount = 0;

  Object.entries(carCounts).forEach(([carId, count]) => {
    if (count > mostPopularCarCount) {
      mostPopularCarId = carId;
      mostPopularCarCount = count;
    }
  });

  // Calculate average daily rental
  const totalRentalAmount = dailyRates.reduce((sum, rate) => sum + rate, 0);
  const averageDailyRental =
    dailyRates.length > 0 ? totalRentalAmount / dailyRates.length : 0;

  // Calculate median daily rental
  let medianDailyRental = 0;
  if (dailyRates.length > 0) {
    dailyRates.sort((a, b) => a - b);
    const mid = Math.floor(dailyRates.length / 2);
    medianDailyRental =
      dailyRates.length % 2 === 0
        ? (dailyRates[mid - 1] + dailyRates[mid]) / 2
        : dailyRates[mid];
  }

  // Calculate average rental duration
  const averageDuration =
    reservations.length > 0 ? totalDays / reservations.length : 0;

  return {
    mostPopularCarId,
    mostPopularCarCount,
    averageDailyRental: parseFloat(averageDailyRental.toFixed(2)),
    medianDailyRental: parseFloat(medianDailyRental.toFixed(2)),
    averageDuration: parseFloat(averageDuration.toFixed(1)),
  };
}
