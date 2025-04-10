const express = require('express');
const router = express.Router();
const db = require('../firebase');

// Get all cars
router.get('/', async (req, res) => {
  try {
    const carsSnapshot = await db.collection('cars').get();
    const cars = [];
    carsSnapshot.forEach(doc => {
      cars.push({ id: doc.id, ...doc.data() });
    });
    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars:', error);
    res.status(500).json({ error: 'Failed to fetch cars' });
  }
});

// Get car by ID
router.get('/:id', async (req, res) => {
  try {
    const carDoc = await db.collection('cars').doc(req.params.id).get();
    if (!carDoc.exists) {
      return res.status(404).json({ error: 'Car not found' });
    }
    res.json({ id: carDoc.id, ...carDoc.data() });
  } catch (error) {
    console.error('Error fetching car:', error);
    res.status(500).json({ error: 'Failed to fetch car' });
  }
});

// Get cars by group
router.get('/group/:groupId', async (req, res) => {
  try {
    const carsSnapshot = await db.collection('cars')
      .where('groupId', '==', req.params.groupId)
      .get();
    const cars = [];
    carsSnapshot.forEach(doc => {
      cars.push({ id: doc.id, ...doc.data() });
    });
    res.json(cars);
  } catch (error) {
    console.error('Error fetching cars by group:', error);
    res.status(500).json({ error: 'Failed to fetch cars by group' });
  }
});

// Get car groups
router.get('/groups', async (req, res) => {
  try {
    const groupsSnapshot = await db.collection('carGroups').get();
    const groups = [];
    groupsSnapshot.forEach(doc => {
      groups.push({ id: doc.id, ...doc.data() });
    });
    res.json(groups);
  } catch (error) {
    console.error('Error fetching car groups:', error);
    res.status(500).json({ error: 'Failed to fetch car groups' });
  }
});

// Filter cars
router.get('/filter', async (req, res) => {
  try {
    let query = db.collection('cars');
    
    // Apply filters
    if (req.query.seats) query = query.where('specs.seats', '==', parseInt(req.query.seats));
    if (req.query.gearbox) query = query.where('specs.gearbox', '==', req.query.gearbox);
    if (req.query.fuelType) query = query.where('specs.fuelType', '==', req.query.fuelType);
    if (req.query.ac !== undefined) query = query.where('specs.ac', '==', req.query.ac === 'true');
    if (req.query.electricWindows !== undefined) query = query.where('specs.electricWindows', '==', req.query.electricWindows === 'true');
    if (req.query.minPrice) query = query.where('price', '>=', parseFloat(req.query.minPrice));
    if (req.query.maxPrice) query = query.where('price', '<=', parseFloat(req.query.maxPrice));

    const carsSnapshot = await query.get();
    const cars = [];
    carsSnapshot.forEach(doc => {
      cars.push({ id: doc.id, ...doc.data() });
    });
    res.json(cars);
  } catch (error) {
    console.error('Error filtering cars:', error);
    res.status(500).json({ error: 'Failed to filter cars' });
  }
});

// Get most rented car
router.get('/most-rented', async (req, res) => {
  try {
    const carsSnapshot = await db.collection('cars')
      .orderBy('rentalCount', 'desc')
      .limit(1)
      .get();
    
    if (carsSnapshot.empty) {
      return res.status(404).json({ error: 'No cars found' });
    }

    const carDoc = carsSnapshot.docs[0];
    res.json({ id: carDoc.id, ...carDoc.data() });
  } catch (error) {
    console.error('Error fetching most rented car:', error);
    res.status(500).json({ error: 'Failed to fetch most rented car' });
  }
});

// Get average daily rental fee
router.get('/average-fee', async (req, res) => {
  try {
    const carsSnapshot = await db.collection('cars').get();
    let totalPrice = 0;
    let count = 0;

    carsSnapshot.forEach(doc => {
      totalPrice += doc.data().price;
      count++;
    });

    const average = count > 0 ? totalPrice / count : 0;
    res.json({ averageFee: average });
  } catch (error) {
    console.error('Error calculating average fee:', error);
    res.status(500).json({ error: 'Failed to calculate average fee' });
  }
});

module.exports = router; 