const express = require('express');
const router = express.Router();
const goongService = require('../services/goong.service');

/**
 * POST /api/geocode
 * Geocode an address to coordinates
 */
router.post('/', async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required',
      });
    }

    const result = await goongService.geocode(address);

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
 * POST /api/geocode/reverse
 * Reverse geocode coordinates to address
 */
router.post('/reverse', async (req, res) => {
  try {
    const { lat, lng } = req.body;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required',
      });
    }

    const result = await goongService.reverseGeocode(lat, lng);

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
 * GET /api/geocode/autocomplete
 * Get autocomplete suggestions for an address
 */
router.get('/autocomplete', async (req, res) => {
  try {
    const { input } = req.query;

    if (!input) {
      return res.status(400).json({
        success: false,
        error: 'Input is required',
      });
    }

    const result = await goongService.autocomplete(input);

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

module.exports = router;

