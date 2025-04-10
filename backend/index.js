const express = require('express');
const cors = require('cors');
require('dotenv').config();

const carsRouter = require('./routes/cars');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/cars', carsRouter);

// Sample route
app.get('/', (req, res) => {
  res.send('API is running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
