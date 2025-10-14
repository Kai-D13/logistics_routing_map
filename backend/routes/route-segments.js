const express = require('express');
const router = express.Router();
const supabaseService = require('../services/supabase.service');

/**
 * GET /api/route-segments/:route_name
 * Get all segments for a specific route
 */
router.get('/:route_name', async (req, res) => {
  try {
    const { route_name } = req.params;

    const result = await supabaseService.getRouteSegments(route_name);

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

/**
 * GET /api/route-segments
 * Get all route segments
 */
router.get('/', async (req, res) => {
  try {
    const result = await supabaseService.getAllRouteSegments();

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
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

module.exports = router;

