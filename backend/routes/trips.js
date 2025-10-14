const express = require('express');
const router = express.Router();
const supabaseService = require('../services/supabase.service');

/**
 * @route   GET /api/trips/routes
 * @desc    Get unique route names
 * NOTE: Must be BEFORE /:id route to avoid matching "routes" as an ID
 */
router.get('/routes', async (req, res) => {
  try {
    const result = await supabaseService.getUniqueRouteNames();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error in GET /api/trips/routes:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/trips/route/:routeName
 * @desc    Get trips by route name
 * NOTE: Must be BEFORE /:id route to avoid matching "route" as an ID
 */
router.get('/route/:routeName', async (req, res) => {
  try {
    const { routeName } = req.params;
    const result = await supabaseService.getTripsByRouteName(routeName);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error in GET /api/trips/route/:routeName:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/trips
 * @desc    Get all trips
 */
router.get('/', async (req, res) => {
  try {
    const result = await supabaseService.getTrips();

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error in GET /api/trips:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * @route   GET /api/trips/:id
 * @desc    Get trip by ID with destinations
 * NOTE: Must be AFTER specific routes like /routes and /route/:routeName
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await supabaseService.getTripById(id);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error in GET /api/trips/:id:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

