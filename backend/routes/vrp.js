const express = require('express');
const router = express.Router();
const goongService = require('../services/goong.service');
const supabaseService = require('../services/supabase.service');

/**
 * @route   POST /api/vrp/optimize
 * @desc    Optimize route using Goong Trip API or custom algorithm
 * @body    { departer_id, destination_ids[], vehicle }
 */
router.post('/optimize', async (req, res) => {
  try {
    const { departer_id, destination_ids, vehicle = 'truck' } = req.body;

    // Validation
    if (!departer_id || !destination_ids || destination_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'departer_id and destination_ids are required'
      });
    }

    // Get departer
    const departersResult = await supabaseService.getDeparters(false);
    if (!departersResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch departer'
      });
    }

    const departer = departersResult.data.find(d => d.id === departer_id);
    if (!departer) {
      return res.status(404).json({
        success: false,
        error: 'Departer not found'
      });
    }

    // Get destinations
    const destinationsResult = await supabaseService.getDestinations(false);
    if (!destinationsResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch destinations'
      });
    }

    const selectedDestinations = destinationsResult.data.filter(d => 
      destination_ids.includes(d.id)
    );

    if (selectedDestinations.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No valid destinations found'
      });
    }

    // Try Goong Trip API first
    const goongResult = await goongService.optimizeTrip(
      { lat: departer.lat, lng: departer.lng },
      selectedDestinations.map(d => ({ lat: d.lat, lng: d.lng, id: d.id, name: d.carrier_name })),
      vehicle
    );

    if (goongResult.success) {
      // Goong Trip API succeeded
      return res.json({
        success: true,
        method: 'goong_trip_api',
        data: goongResult.data
      });
    }

    // Fallback to Nearest Neighbor algorithm
    console.log('⚠️  Goong Trip API failed, using Nearest Neighbor algorithm');
    
    const nnResult = await optimizeWithNearestNeighbor(
      departer,
      selectedDestinations,
      vehicle
    );

    res.json({
      success: true,
      method: 'nearest_neighbor',
      data: nnResult
    });

  } catch (error) {
    console.error('Error in POST /api/vrp/optimize:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Nearest Neighbor Algorithm for VRP
 * Simple greedy algorithm: always go to the nearest unvisited destination
 */
async function optimizeWithNearestNeighbor(departer, destinations, vehicle) {
  const route = [];
  const unvisited = [...destinations];
  let currentLocation = { lat: departer.lat, lng: departer.lng };
  let totalDistance = 0;
  let totalDuration = 0;

  // Start from departer
  route.push({
    stop_number: 0,
    location: {
      id: departer.id,
      name: departer.name,
      lat: departer.lat,
      lng: departer.lng
    },
    distance_from_previous: 0,
    duration_from_previous: 0,
    cumulative_distance: 0,
    cumulative_duration: 0
  });

  // Visit each destination
  while (unvisited.length > 0) {
    let nearestIndex = 0;
    let minDistance = Infinity;
    let nearestDistanceData = null;

    // Find nearest unvisited destination
    for (let i = 0; i < unvisited.length; i++) {
      const dest = unvisited[i];
      
      // Calculate distance
      const distanceResult = await goongService.calculateDistance(
        currentLocation,
        { lat: dest.lat, lng: dest.lng },
        vehicle
      );

      if (distanceResult.success) {
        const distance = distanceResult.data.distance_meters;
        if (distance < minDistance) {
          minDistance = distance;
          nearestIndex = i;
          nearestDistanceData = distanceResult.data;
        }
      }
    }

    // Visit nearest destination
    const nearest = unvisited[nearestIndex];
    unvisited.splice(nearestIndex, 1);

    if (nearestDistanceData) {
      totalDistance += nearestDistanceData.distance_meters;
      totalDuration += nearestDistanceData.duration_seconds;

      route.push({
        stop_number: route.length,
        location: {
          id: nearest.id,
          name: nearest.carrier_name,
          lat: nearest.lat,
          lng: nearest.lng,
          address: nearest.address
        },
        distance_from_previous: nearestDistanceData.distance_meters,
        duration_from_previous: nearestDistanceData.duration_seconds,
        cumulative_distance: totalDistance,
        cumulative_duration: totalDuration
      });

      currentLocation = { lat: nearest.lat, lng: nearest.lng };
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  return {
    route,
    summary: {
      total_stops: route.length,
      total_distance_meters: totalDistance,
      total_distance_km: (totalDistance / 1000).toFixed(2),
      total_duration_seconds: totalDuration,
      total_duration_minutes: Math.round(totalDuration / 60),
      total_duration_formatted: formatDuration(totalDuration),
      vehicle_type: vehicle
    }
  };
}

/**
 * Format duration to HH:MM
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

module.exports = router;

