const express = require('express');
const router = express.Router();
const goongService = require('../services/goong.service');

/**
 * POST /api/directions
 * Get directions (polyline) for multiple waypoints
 * 
 * Body:
 * {
 *   waypoints: [
 *     { lat: 10.123, lng: 106.456, name: "Hub Cần Thơ" },
 *     { lat: 10.234, lng: 106.567, name: "Hub An Thới" },
 *     { lat: 10.345, lng: 106.678, name: "Hub Phú Quốc" }
 *   ],
 *   vehicle: "truck" // optional, default: "truck"
 * }
 */
router.post('/', async (req, res) => {
  try {
    const { waypoints, vehicle = 'truck' } = req.body;

    // Validate input
    if (!waypoints || !Array.isArray(waypoints) || waypoints.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'At least 2 waypoints required (origin and destination)',
      });
    }

    // Validate waypoints format
    for (const wp of waypoints) {
      if (!wp.lat || !wp.lng) {
        return res.status(400).json({
          success: false,
          error: 'Each waypoint must have lat and lng properties',
        });
      }
    }

    // Call Goong Directions API
    const result = await goongService.getDirections(waypoints, vehicle);

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
    console.error('Error in POST /api/directions:', err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;

