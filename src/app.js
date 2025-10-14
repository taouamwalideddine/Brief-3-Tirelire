const express = require('express');
const connectDB = require('./config/database');
const UserRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const kycRoutes = require('./routes/kycRoutes');
const auditRoutes = require('./routes/auditRoutes');
const { globalErrorHandler, handleNotFound } = require('./middlewares/errorHandler');

require('dotenv').config();
 
const app = express();

connectDB();

app.use(express.json());

app.use('/api/users', UserRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/audit', auditRoutes);

app.get('/', (req, res) => res.send('API is running'));

// Handle unhandled routes
app.all('*', handleNotFound);

// Global error handling middleware
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));