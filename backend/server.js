const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const protect = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully ✅'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'TaskFlow server is running 🚀' });
});

app.get('/api/protected', protect, (req, res) => {
  res.json({ message: 'You accessed a protected route!', userId: req.userId });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});