const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const config = require('../config/keys');
const goongService = require('../services/goong.service');
const routeValidation = require('../services/route-validation.service');

// Initialize Supabase Client
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

// ============================================================
// GET /api/routes - List all routes with summary
// ============================================================
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('route_summary')
      .select('*')
      .order('route_name');

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      total: data.length
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET /api/routes/search - Search routes with filters
// ============================================================
router.get('/search', async (req, res) => {
  try {
    const { 
      route_name, 
      hub_departer, 
      hub_destination,
      departure_time_from,
      departure_time_to,
      note 
    } = req.query;

    let query = supabase
      .from('route_schedules')
      .select('*');

    // Apply filters
    if (route_name) {
      query = query.ilike('route_name', `%${route_name}%`);
    }
    if (hub_departer) {
      query = query.eq('hub_departer', hub_departer);
    }
    if (hub_destination) {
      query = query.ilike('hub_destination', `%${hub_destination}%`);
    }
    if (departure_time_from) {
      query = query.gte('departure_time', departure_time_from);
    }
    if (departure_time_to) {
      query = query.lte('departure_time', departure_time_to);
    }
    if (note) {
      query = query.eq('note', note);
    }

    query = query.order('route_name').order('departure_time');

    const { data, error } = await query;

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      total: data.length,
      filters: req.query
    });
  } catch (error) {
    console.error('Error searching routes:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET /api/routes/departers - Get all unique departers
// ============================================================
router.get('/departers', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('route_schedules')
      .select('hub_departer')
      .order('hub_departer');

    if (error) throw error;

    // Get unique departers
    const uniqueDeparters = [...new Set(data.map(d => d.hub_departer))];

    res.json({
      success: true,
      data: uniqueDeparters,
      total: uniqueDeparters.length
    });
  } catch (error) {
    console.error('Error fetching departers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET /api/routes/:routeName - Get route details by name
// ============================================================
router.get('/:routeName', async (req, res) => {
  try {
    const { routeName } = req.params;

    // Get route segments
    const { data: segments, error: segmentsError } = await supabase
      .from('route_schedules')
      .select('*')
      .eq('route_name', routeName)
      .order('departure_time')
      .order('arrival_time');

    if (segmentsError) throw segmentsError;

    if (!segments || segments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }

    // Get route summary
    const { data: summary, error: summaryError } = await supabase
      .from('route_summary')
      .select('*')
      .eq('route_name', routeName)
      .single();

    if (summaryError && summaryError.code !== 'PGRST116') {
      throw summaryError;
    }

    res.json({
      success: true,
      data: {
        route_name: routeName,
        summary: summary,
        segments: segments,
        total_segments: segments.length
      }
    });
  } catch (error) {
    console.error('Error fetching route details:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// GET /api/routes/:routeName/segments - Get route segments
// ============================================================
router.get('/:routeName/segments', async (req, res) => {
  try {
    const { routeName } = req.params;

    const { data, error } = await supabase
      .from('route_schedules')
      .select('*')
      .eq('route_name', routeName)
      .order('departure_time')
      .order('arrival_time');

    if (error) throw error;

    res.json({
      success: true,
      data: data,
      total: data.length
    });
  } catch (error) {
    console.error('Error fetching route segments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// POST /api/routes - Create new route
// ============================================================
router.post('/', async (req, res) => {
  try {
    const { route_name, segments } = req.body;

    // Validate route
    const validation = await routeValidation.validateRoute(route_name, segments);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    // Check if route already exists
    const { data: existing, error: checkError } = await supabase
      .from('route_schedules')
      .select('id')
      .eq('route_name', route_name)
      .limit(1);

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Route with this name already exists'
      });
    }

    // Prepare segments for insertion
    const segmentsToInsert = segments.map(seg => ({
      route_name: route_name,
      hub_departer: seg.hub_departer,
      hub_destination: seg.hub_destination,
      departure_time: seg.departure_time,
      arrival_time: seg.arrival_time,
      day_offset: seg.day_offset || 0,
      distance_km: seg.distance_km || null,
      duration_hours: seg.duration_hours || null,
      note: seg.note || 'D'
    }));

    // Insert segments
    const { data, error } = await supabase
      .from('route_schedules')
      .insert(segmentsToInsert)
      .select();

    if (error) throw error;

    res.status(201).json({
      success: true,
      message: 'Route created successfully',
      warnings: validation.warnings,
      data: {
        route_name: route_name,
        segments: data,
        total_segments: data.length
      }
    });
  } catch (error) {
    console.error('Error creating route:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// PUT /api/routes/:routeName - Update route
// ============================================================
router.put('/:routeName', async (req, res) => {
  try {
    const { routeName } = req.params;
    const { new_route_name } = req.body;

    if (!new_route_name) {
      return res.status(400).json({
        success: false,
        error: 'new_route_name is required'
      });
    }

    // Check if new name already exists
    const { data: existing, error: checkError } = await supabase
      .from('route_schedules')
      .select('id')
      .eq('route_name', new_route_name)
      .limit(1);

    if (checkError) throw checkError;

    if (existing && existing.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Route with this name already exists'
      });
    }

    // Update all segments with new route name
    const { data, error } = await supabase
      .from('route_schedules')
      .update({
        route_name: new_route_name,
        updated_at: new Date().toISOString()
      })
      .eq('route_name', routeName)
      .select();

    if (error) throw error;

    res.json({
      success: true,
      message: 'Route updated successfully',
      data: {
        old_route_name: routeName,
        new_route_name: new_route_name,
        updated_segments: data.length
      }
    });
  } catch (error) {
    console.error('Error updating route:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// DELETE /api/routes/:routeName - Delete route
// ============================================================
router.delete('/:routeName', async (req, res) => {
  try {
    const { routeName } = req.params;

    // Delete all segments for this route
    const { data, error } = await supabase
      .from('route_schedules')
      .delete()
      .eq('route_name', routeName)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }

    res.json({
      success: true,
      message: 'Route deleted successfully',
      data: {
        route_name: routeName,
        deleted_segments: data.length
      }
    });
  } catch (error) {
    console.error('Error deleting route:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// PUT /api/routes/:routeName/segments/:segmentId - Update segment
// ============================================================
router.put('/:routeName/segments/:segmentId', async (req, res) => {
  try {
    const { routeName, segmentId } = req.params;
    const updates = req.body;

    // Remove fields that shouldn't be updated
    delete updates.id;
    delete updates.created_at;

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('route_schedules')
      .update(updates)
      .eq('id', segmentId)
      .eq('route_name', routeName)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Segment not found'
      });
    }

    res.json({
      success: true,
      message: 'Segment updated successfully',
      data
    });
  } catch (error) {
    console.error('Error updating segment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// DELETE /api/routes/:routeName/segments/:segmentId - Delete segment
// ============================================================
router.delete('/:routeName/segments/:segmentId', async (req, res) => {
  try {
    const { routeName, segmentId } = req.params;

    const { data, error } = await supabase
      .from('route_schedules')
      .delete()
      .eq('id', segmentId)
      .eq('route_name', routeName)
      .select()
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Segment not found'
      });
    }

    res.json({
      success: true,
      message: 'Segment deleted successfully',
      data
    });
  } catch (error) {
    console.error('Error deleting segment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// POST /api/routes/validate - Validate route without creating
// ============================================================
router.post('/validate', async (req, res) => {
  try {
    const { route_name, segments } = req.body;

    const validation = await routeValidation.validateRoute(route_name, segments);

    res.json({
      success: true,
      validation: {
        valid: validation.valid,
        errors: validation.errors,
        warnings: validation.warnings
      }
    });
  } catch (error) {
    console.error('Error validating route:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// POST /api/routes/calculate-distance - Calculate distance for segment
// ============================================================
router.post('/calculate-distance', async (req, res) => {
  try {
    const { hub_departer, hub_destination } = req.body;

    if (!hub_departer || !hub_destination) {
      return res.status(400).json({
        success: false,
        error: 'hub_departer and hub_destination are required'
      });
    }

    // Get coordinates for departer
    const { data: departerData, error: departerError } = await supabase
      .from('destinations')
      .select('lat, lng, carrier_name')
      .eq('carrier_name', hub_departer)
      .single();

    if (departerError || !departerData) {
      // Try departers table
      const { data: departerData2, error: departerError2 } = await supabase
        .from('departers')
        .select('lat, lng, name')
        .eq('name', hub_departer)
        .single();

      if (departerError2 || !departerData2) {
        return res.status(404).json({
          success: false,
          error: `Hub departer '${hub_departer}' not found`
        });
      }

      var origin = { lat: departerData2.lat, lng: departerData2.lng };
    } else {
      var origin = { lat: departerData.lat, lng: departerData.lng };
    }

    // Get coordinates for destination
    const { data: destinationData, error: destinationError } = await supabase
      .from('destinations')
      .select('lat, lng, carrier_name')
      .eq('carrier_name', hub_destination)
      .single();

    if (destinationError || !destinationData) {
      return res.status(404).json({
        success: false,
        error: `Hub destination '${hub_destination}' not found`
      });
    }

    const destination = { lat: destinationData.lat, lng: destinationData.lng };

    // Calculate distance using Goong API
    const result = await goongService.calculateDistance(origin, destination, 'truck');

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }

    // Convert to km and hours
    const distance_km = (result.data.distance_meters / 1000).toFixed(2);
    const duration_hours = (result.data.duration_seconds / 3600).toFixed(2);

    res.json({
      success: true,
      data: {
        hub_departer,
        hub_destination,
        distance_km: parseFloat(distance_km),
        duration_hours: parseFloat(duration_hours),
        distance_text: result.data.distance_text,
        duration_text: result.data.duration_text,
        raw: result.data
      }
    });
  } catch (error) {
    console.error('Error calculating distance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================
// POST /api/routes/:routeName/calculate-distances - Calculate all segments
// ============================================================
router.post('/:routeName/calculate-distances', async (req, res) => {
  try {
    const { routeName } = req.params;

    // Get all segments for this route
    const { data: segments, error: segmentsError } = await supabase
      .from('route_schedules')
      .select('*')
      .eq('route_name', routeName);

    if (segmentsError) throw segmentsError;

    if (!segments || segments.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Route not found'
      });
    }

    const results = [];
    let successCount = 0;
    let failCount = 0;

    // Calculate distance for each segment
    for (const segment of segments) {
      try {
        // Get departer coordinates
        const { data: departerData } = await supabase
          .from('destinations')
          .select('lat, lng')
          .eq('carrier_name', segment.hub_departer)
          .single();

        let origin;
        if (!departerData) {
          const { data: departerData2 } = await supabase
            .from('departers')
            .select('lat, lng')
            .eq('name', segment.hub_departer)
            .single();
          origin = { lat: departerData2?.lat, lng: departerData2?.lng };
        } else {
          origin = { lat: departerData.lat, lng: departerData.lng };
        }

        // Get destination coordinates
        const { data: destinationData } = await supabase
          .from('destinations')
          .select('lat, lng')
          .eq('carrier_name', segment.hub_destination)
          .single();

        if (!origin || !destinationData) {
          results.push({
            segment_id: segment.id,
            hub_departer: segment.hub_departer,
            hub_destination: segment.hub_destination,
            success: false,
            error: 'Hub coordinates not found'
          });
          failCount++;
          continue;
        }

        const destination = { lat: destinationData.lat, lng: destinationData.lng };

        // Calculate distance
        const result = await goongService.calculateDistance(origin, destination, 'truck');

        if (result.success) {
          const distance_km = parseFloat((result.data.distance_meters / 1000).toFixed(2));
          const duration_hours = parseFloat((result.data.duration_seconds / 3600).toFixed(2));

          // Update segment in database
          const { error: updateError } = await supabase
            .from('route_schedules')
            .update({
              distance_km,
              duration_hours,
              updated_at: new Date().toISOString()
            })
            .eq('id', segment.id);

          if (updateError) {
            results.push({
              segment_id: segment.id,
              hub_departer: segment.hub_departer,
              hub_destination: segment.hub_destination,
              success: false,
              error: updateError.message
            });
            failCount++;
          } else {
            results.push({
              segment_id: segment.id,
              hub_departer: segment.hub_departer,
              hub_destination: segment.hub_destination,
              success: true,
              distance_km,
              duration_hours
            });
            successCount++;
          }
        } else {
          results.push({
            segment_id: segment.id,
            hub_departer: segment.hub_departer,
            hub_destination: segment.hub_destination,
            success: false,
            error: result.error
          });
          failCount++;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (err) {
        results.push({
          segment_id: segment.id,
          hub_departer: segment.hub_departer,
          hub_destination: segment.hub_destination,
          success: false,
          error: err.message
        });
        failCount++;
      }
    }

    res.json({
      success: true,
      message: `Calculated distances for ${successCount}/${segments.length} segments`,
      data: {
        route_name: routeName,
        total_segments: segments.length,
        success_count: successCount,
        fail_count: failCount,
        results
      }
    });
  } catch (error) {
    console.error('Error calculating route distances:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

