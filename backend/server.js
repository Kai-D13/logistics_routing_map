const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config/keys');

// Initialize Express App
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Logistics Routing System API is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// Test API keys endpoint (for development only)
app.get('/api/config/test', (req, res) => {
  res.json({
    supabase: {
      url: config.SUPABASE_URL ? '✅ Configured' : '❌ Missing',
      key: config.SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Missing',
    },
    goong: {
      apiKey: config.GOONG_API_KEY ? '✅ Configured' : '❌ Missing',
      maptilesKey: config.GOONG_MAPTILES_KEY ? '✅ Configured' : '❌ Missing',
    },
  });
});

// API Routes
app.use('/api/locations', require('./routes/locations'));
app.use('/api/geocode', require('./routes/geocoding'));
app.use('/api/distance', require('./routes/distance'));
app.use('/api/trips', require('./routes/trips'));
app.use('/api/vrp', require('./routes/vrp'));
app.use('/api/route-segments', require('./routes/route-segments'));

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
    ...(config.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start Server
const PORT = config.PORT;
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 Logistics Routing System Server Started');
  console.log('='.repeat(50));
  console.log(`📍 Environment: ${config.NODE_ENV}`);
  console.log(`🌐 Server running on: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 Config test: http://localhost:${PORT}/api/config/test`);
  console.log('='.repeat(50));
});

module.exports = app;

