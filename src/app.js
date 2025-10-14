const express = require('express');
const connectDB = require('./config/database');
const UserRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const kycRoutes = require('./routes/kycRoutes');

require('dotenv').config();
 
const app = express();

// connectDB();

app.use(express.json());

app.use('/api/users',UserRoutes);

app.use('/api/kyc', kycRoutes);

app.get('/', (req, res) => res.send('API is running'));

app.use('/api/groups', groupRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
console.log('Starting server...');
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test with: http://localhost:${PORT}`);
});