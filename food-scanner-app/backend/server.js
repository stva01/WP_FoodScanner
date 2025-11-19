// server/server.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');

dotenv.config();

connectDB();

const app = express();

app.use(cors()); // allow all origins by default (change for production)
app.use(express.json());

app.use('/api', productRoutes);

app.get('/', (req, res) => {
  res.send('Food Scanner API is running! 🚀');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
