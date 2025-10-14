const express = require('express');
const router = express.Router();
const supabaseService = require('../services/supabase.service');
const goongService = require('../services/goong.service');

/**
 * GET /api/locations/departers
 * Get all departers
 */
router.get('/departers', async (req, res) => {
  try {
    const result = await supabaseService.getDeparters();
    
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
 * GET /api/locations/destinations
 * Get all destinations
 */
router.get('/destinations', async (req, res) => {
  try {
    const { departer_id } = req.query;
    const result = await supabaseService.getDestinations(true, departer_id);
    
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
 * GET /api/locations/destinations/:id
 * Get destination by ID
 */
router.get('/destinations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await supabaseService.getDestinationById(id);
    
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
 * POST /api/locations/destination
 * Create new destination
 */
router.post('/destination', async (req, res) => {
  try {
    const {
      carrier_name,
      address,
      ward_name,
      district_name,
      province_name,
      departer_id,
    } = req.body;

    // Validate required fields
    if (!carrier_name || !address || !departer_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: carrier_name, address, departer_id',
      });
    }

    // Geocode address
    const geocodeResult = await goongService.geocode(address);
    if (!geocodeResult.success) {
      return res.status(400).json({
        success: false,
        error: `Geocoding failed: ${geocodeResult.error}`,
      });
    }

    const { lat, lng, formatted_address } = geocodeResult.data;

    // Create destination
    const destinationData = {
      carrier_name,
      address,
      ward_name,
      district_name,
      province_name,
      lat,
      lng,
      formatted_address,
      departer_id,
    };

    const createResult = await supabaseService.createDestination(destinationData);
    
    if (!createResult.success) {
      return res.status(500).json({
        success: false,
        error: createResult.error,
      });
    }

    // Get departer coordinates
    const departerResult = await supabaseService.getDeparterById(departer_id);
    if (departerResult.success) {
      // Calculate distance
      const distanceResult = await goongService.calculateDistance(
        { lat: departerResult.data.lat, lng: departerResult.data.lng },
        { lat, lng }
      );

      if (distanceResult.success) {
        const { distance_meters, duration_seconds } = distanceResult.data;

        // Create route
        await supabaseService.upsertRoute({
          departer_id,
          destination_id: createResult.data.id,
          distance_km: (distance_meters / 1000).toFixed(2),
          distance_meters,
          duration_minutes: Math.round(duration_seconds / 60),
          duration_seconds,
          vehicle_type: 'truck', // Default vehicle type
        });
      }
    }

    res.status(201).json({
      success: true,
      data: createResult.data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

/**
 * POST /api/locations/departer
 * Create new departer
 */
router.post('/departer', async (req, res) => {
  try {
    const { name, address } = req.body;

    if (!name || !address) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, address',
      });
    }

    // Geocode address
    const geocodeResult = await goongService.geocode(address);
    if (!geocodeResult.success) {
      return res.status(400).json({
        success: false,
        error: `Geocoding failed: ${geocodeResult.error}`,
      });
    }

    const { lat, lng, formatted_address } = geocodeResult.data;

    const departerData = {
      name,
      address,
      lat,
      lng,
      formatted_address,
    };

    const result = await supabaseService.createDeparter(departerData);
    
    if (result.success) {
      res.status(201).json({
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

/**
 * PUT /api/locations/:id
 * Update location (departer or destination)
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // If address is updated, re-geocode
    if (updates.address) {
      const geocodeResult = await goongService.geocode(updates.address);
      if (geocodeResult.success) {
        updates.lat = geocodeResult.data.lat;
        updates.lng = geocodeResult.data.lng;
        updates.formatted_address = geocodeResult.data.formatted_address;
      }
    }

    // Try updating as destination first
    let result = await supabaseService.updateDestination(id, updates);
    
    // If not found, try as departer
    if (!result.success) {
      result = await supabaseService.updateDeparter(id, updates);
    }

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
 * DELETE /api/locations/:id
 * Soft delete location
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try deleting as destination first
    let result = await supabaseService.deleteDestination(id);
    
    // If not found, try as departer
    if (!result.success) {
      result = await supabaseService.deleteDeparter(id);
    }

    if (result.success) {
      res.json({
        success: true,
        message: 'Location deleted successfully',
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

