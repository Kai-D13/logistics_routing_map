// Vercel Serverless Function - Main API Handler
const express = require('express');
const cors = require('cors');

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Logistics Routing System API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API is working!',
    env: {
      supabase: process.env.SUPABASE_URL ? '✅ Configured' : '❌ Missing',
      goong: process.env.GOONG_API_KEY ? '✅ Configured' : '❌ Missing',
    }
  });
});

// Import routes
try {
  app.use('/api/locations', require('../backend/routes/locations'));
  app.use('/api/geocode', require('../backend/routes/geocoding'));
  app.use('/api/distance', require('../backend/routes/distance'));
  app.use('/api/directions', require('../backend/routes/directions'));
  app.use('/api/trips', require('../backend/routes/trips'));
  app.use('/api/vrp', require('../backend/routes/vrp'));
  app.use('/api/route-segments', require('../backend/routes/route-segments'));
  app.use('/api/routes', require('../backend/routes/routes'));
} catch (error) {
  console.error('Error loading routes:', error);
}

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Export for Vercel
module.exports = app;

