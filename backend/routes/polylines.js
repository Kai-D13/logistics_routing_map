const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const config = require('../config/keys');
const goongService = require('../services/goong.service');

// Initialize Supabase Client
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

/**
 * GET /api/polylines/:hubFrom/:hubTo
 * Get cached polyline for a segment
 * 
 * Query params:
 * - vehicle: 'truck' (default), 'car', 'bike'
 */
router.get('/:hubFrom/:hubTo', async (req, res) => {
  try {
    const { hubFrom, hubTo } = req.params;
    const { vehicle = 'truck' } = req.query;

    console.log(`🔍 Looking for cached polyline: ${hubFrom} → ${hubTo} (${vehicle})`);

    // Query cache
    const { data, error } = await supabase
      .from('route_polylines')
      .select('*')
      .eq('hub_from', hubFrom)
      .eq('hub_to', hubTo)
      .eq('vehicle_type', vehicle)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No cache found
        console.log('❌ No cache found');
        return res.status(404).json({
          success: false,
          error: 'Cache not found',
          message: 'No cached polyline for this segment'
        });
      }
      throw error;
    }

    // Update cache usage statistics
    await supabase
      .from('route_polylines')
      .update({
        last_used_at: new Date().toISOString(),
        use_count: data.use_count + 1
      })
      .eq('id', data.id);

    console.log(`✅ Cache hit! Used ${data.use_count + 1} times`);

    res.json({
      success: true,
      data: {
        polyline_encoded: data.polyline_encoded,
        distance_meters: data.distance_meters,
        distance_km: parseFloat(data.distance_km),
        duration_seconds: data.duration_seconds,
        duration_minutes: data.duration_minutes,
        duration_text: data.duration_text,
        vehicle_type: data.vehicle_type,
        cached_at: data.created_at,
        cache_age_days: Math.floor((Date.now() - new Date(data.created_at)) / (1000 * 60 * 60 * 24))
      }
    });
  } catch (error) {
    console.error('Error fetching cached polyline:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/polylines
 * Save polyline to cache
 * 
 * Body:
 * {
 *   route_name: "Bắc Ninh - Sơn La...",
 *   hub_from: "Hub VSIP Bắc Ninh",
 *   hub_to: "NV Công ty - Hub Minh Khai",
 *   polyline_encoded: "encoded_string...",
 *   distance_meters: 45200,
 *   distance_km: 45.2,
 *   duration_seconds: 7200,
 *   duration_minutes: 120,
 *   duration_text: "2 giờ",
 *   vehicle_type: "truck",
 *   api_response: { ... }  // Optional: full API response
 * }
 */
router.post('/', async (req, res) => {
  try {
    const {
      route_name,
      hub_from,
      hub_to,
      polyline_encoded,
      distance_meters,
      distance_km,
      duration_seconds,
      duration_minutes,
      duration_text,
      vehicle_type = 'truck',
      api_response
    } = req.body;

    // Validation
    if (!hub_from || !hub_to || !polyline_encoded) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: hub_from, hub_to, polyline_encoded'
      });
    }

    console.log(`💾 Saving polyline to cache: ${hub_from} → ${hub_to}`);

    // Upsert (insert or update if exists)
    const { data, error } = await supabase
      .from('route_polylines')
      .upsert([{
        route_name,
        hub_from,
        hub_to,
        polyline_encoded,
        distance_meters: distance_meters || 0,
        distance_km: distance_km || 0,
        duration_seconds: duration_seconds || 0,
        duration_minutes: duration_minutes || 0,
        duration_text: duration_text || '',
        vehicle_type,
        api_response: api_response || null,
        use_count: 0,
        last_used_at: new Date().toISOString()
      }], {
        onConflict: 'hub_from,hub_to,vehicle_type'
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Polyline cached successfully`);

    res.json({
      success: true,
      data: data,
      message: 'Polyline cached successfully'
    });
  } catch (error) {
    console.error('Error saving polyline to cache:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/polylines/fetch-and-cache
 * Fetch polyline from Goong API and cache it
 * 
 * Body:
 * {
 *   route_name: "Bắc Ninh - Sơn La...",
 *   hub_from: "Hub VSIP Bắc Ninh",
 *   hub_to: "NV Công ty - Hub Minh Khai",
 *   from_coords: { lat: 21.121, lng: 106.111 },
 *   to_coords: { lat: 21.234, lng: 105.987 },
 *   vehicle: "truck"
 * }
 */
router.post('/fetch-and-cache', async (req, res) => {
  try {
    const {
      route_name,
      hub_from,
      hub_to,
      from_coords,
      to_coords,
      vehicle = 'truck'
    } = req.body;

    // Validation
    if (!hub_from || !hub_to || !from_coords || !to_coords) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: hub_from, hub_to, from_coords, to_coords'
      });
    }

    console.log(`📡 Fetching polyline from Goong API: ${hub_from} → ${hub_to}`);

    // Call Goong Directions API
    const waypoints = [
      { lat: from_coords.lat, lng: from_coords.lng, name: hub_from },
      { lat: to_coords.lat, lng: to_coords.lng, name: hub_to }
    ];

    const result = await goongService.getDirections(waypoints, vehicle);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: `Goong API error: ${result.error}`
      });
    }

    console.log(`✅ Goong API response received`);

    // Save to cache
    const { data, error } = await supabase
      .from('route_polylines')
      .upsert([{
        route_name,
        hub_from,
        hub_to,
        polyline_encoded: result.data.overview_polyline,
        distance_meters: result.data.total_distance_meters,
        distance_km: parseFloat(result.data.total_distance_km),
        duration_seconds: result.data.total_duration_seconds,
        duration_minutes: result.data.total_duration_minutes || Math.round(result.data.total_duration_seconds / 60),
        duration_text: result.data.total_duration_text,
        vehicle_type: vehicle,
        api_response: result.data,
        use_count: 0,
        last_used_at: new Date().toISOString()
      }], {
        onConflict: 'hub_from,hub_to,vehicle_type'
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`💾 Polyline cached successfully`);

    res.json({
      success: true,
      data: {
        polyline_encoded: result.data.overview_polyline,
        distance_meters: result.data.total_distance_meters,
        distance_km: parseFloat(result.data.total_distance_km),
        duration_seconds: result.data.total_duration_seconds,
        duration_minutes: result.data.total_duration_minutes || Math.round(result.data.total_duration_seconds / 60),
        duration_text: result.data.total_duration_text,
        vehicle_type: vehicle,
        cached: true
      },
      message: 'Polyline fetched from Goong API and cached'
    });
  } catch (error) {
    console.error('Error fetching and caching polyline:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/polylines/clear
 * Clear polyline cache
 * 
 * Query params:
 * - route_name: Clear cache for specific route
 * - hub: Clear cache for specific hub (as from or to)
 * - all: true to clear all cache
 */
router.delete('/clear', async (req, res) => {
  try {
    const { route_name, hub, all } = req.query;

    let query = supabase.from('route_polylines').delete();

    if (all === 'true') {
      console.log('🗑️ Clearing ALL polyline cache');
      // Delete all
    } else if (route_name) {
      console.log(`🗑️ Clearing cache for route: ${route_name}`);
      query = query.eq('route_name', route_name);
    } else if (hub) {
      console.log(`🗑️ Clearing cache for hub: ${hub}`);
      query = query.or(`hub_from.eq.${hub},hub_to.eq.${hub}`);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Specify route_name, hub, or all=true'
      });
    }

    const { data, error } = await query.select();

    if (error) throw error;

    console.log(`✅ Cleared ${data?.length || 0} cached polylines`);

    res.json({
      success: true,
      message: `Cleared ${data?.length || 0} cached polylines`,
      count: data?.length || 0
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

