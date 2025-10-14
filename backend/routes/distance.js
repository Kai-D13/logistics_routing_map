const express = require('express');
const router = express.Router();
const goongService = require('../services/goong.service');
const supabaseService = require('../services/supabase.service');

/**
 * POST /api/distance/calculate
 * Calculate distance between two points
 */
router.post('/calculate', async (req, res) => {
  try {
    const { origin, destination, vehicle } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Origin and destination are required',
      });
    }

    if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      return res.status(400).json({
        success: false,
        error: 'Origin and destination must have lat and lng properties',
      });
    }

    const result = await goongService.calculateDistance(origin, destination, vehicle);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/distance/matrix
 * Calculate distance matrix for multiple origins and destinations
 */
router.post('/matrix', async (req, res) => {
  try {
    const { origins, destinations, vehicle } = req.body;

    if (!origins || !destinations) {
      return res.status(400).json({
        success: false,
        error: 'Origins and destinations arrays are required',
      });
    }

    const result = await goongService.calculateDistanceMatrix(origins, destinations, vehicle);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/distance/routes/:departer_id
 * Get all routes for a departer
 */
router.get('/routes/:departer_id', async (req, res) => {
  try {
    const { departer_id } = req.params;

    const result = await supabaseService.getRoutesByDeparter(departer_id);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        count: result.data.length,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * GET /api/distance/route/:departer_id/:destination_id
 * Get specific route
 */
router.get('/route/:departer_id/:destination_id', async (req, res) => {
  try {
    const { departer_id, destination_id } = req.params;

    const result = await supabaseService.getRoute(departer_id, destination_id);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;

