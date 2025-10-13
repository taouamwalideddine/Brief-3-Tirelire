const express = require('express');
const connectDB = require('.config/database');
const UserRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const kycRoutes = require('./routes/kycRoutes');

require('dotenv').config();

const app = express();

connectDB();

app.use(express.json());

app.use('/api/users',UserRoutes);

app.use('/api/kyc', kycRoutes);

app.get('/', (req, res) => res.send('API is running'));

app.use('/api/groups', groupRoutes);

const PORT =process.env.PORT || 5000;
app.listen(PORT, () => console.log('Server running on port ${PORT}'));