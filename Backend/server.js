const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const logger = require('./config/logger');
const adminRoutes = require('./routes/adminRoutes');
const clientRoutes = require('./routes/clientRoutes');
const apiLogger = require('./middlewares/logger');
const { apiErrorLogger, globalErrorHandler } = require('./middlewares/apiErrorLogger');
const { startTimezoneWorker } = require('./services/timezoneScheduler');

const app = express();

// Database Connection
connectDB();

// Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(apiLogger);
app.use(apiErrorLogger);

// Static uploads directory for app icons & marketing posters
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'App Junction Backend API',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes (supporting both /api/v1 and /api)
app.use('/api/v1/admin', adminRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api/v1/client', clientRoutes);
app.use('/api/client', clientRoutes);

// Global Error Handler
app.use(globalErrorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`🚀 App Junction API Server running on port ${PORT}`);
  logger.info(`🌐 Base URL: ${process.env.BASE_URL || 'http://localhost:' + PORT}`);

  // Start background timezone notification dispatcher
  startTimezoneWorker();
});
