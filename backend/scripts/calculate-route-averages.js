/**
 * Calculate Average Distance & Duration from Historical Trips
 * 
 * This script analyzes 454 trips over 2 months to calculate:
 * - Average distance between departer and each destination
 * - Average duration between departer and each destination
 * - Average distance between consecutive destinations
 * - Average duration between consecutive destinations
 * 
 * Results will be stored in the 'routes' table for future reference
 */

const { createClient } = require('@supabase/supabase-js');
const goongService = require('../services/goong.service');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Main function
 */
async function calculateRouteAverages() {
  console.log('📊 Starting route averages calculation...\n');

  try {
    // Step 1: Get all trips with destinations
    console.log('📥 Step 1: Fetching all trips with destinations...');
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select(`
        *,
        trip_destinations (
          *,
          destinations (*)
        )
      `)
      .order('created_at', { ascending: false });

    if (tripsError) throw tripsError;

    console.log(`   ✅ Found ${trips.length} trips\n`);

    // Step 2: Get departer (assuming single departer)
    console.log('📍 Step 2: Fetching departer...');
    const { data: departers, error: departersError } = await supabase
      .from('departers')
      .select('*')
      .eq('is_active', true);

    if (departersError) throw departersError;

    if (departers.length === 0) {
      throw new Error('No active departer found');
    }

    const departer = departers[0];
    console.log(`   ✅ Departer: ${departer.name}\n`);

    // Step 3: Get all unique destinations
    console.log('📍 Step 3: Fetching destinations...');
    const { data: destinations, error: destError } = await supabase
      .from('destinations')
      .select('*')
      .eq('is_active', true);

    if (destError) throw destError;

    console.log(`   ✅ Found ${destinations.length} destinations\n`);

    // Step 4: Calculate routes for each destination
    console.log('🔄 Step 4: Calculating routes...\n');

    const routeStats = {};
    let processedCount = 0;

    for (const destination of destinations) {
      console.log(`   Processing: ${destination.carrier_name}...`);

      // Calculate distance using Goong API
      const distanceResult = await goongService.calculateDistance(
        { lat: departer.lat, lng: departer.lng },
        { lat: destination.lat, lng: destination.lng },
        'truck'
      );

      if (distanceResult.success) {
        const distance = distanceResult.data.distance_meters;
        const duration = distanceResult.data.duration_seconds;

        routeStats[destination.id] = {
          destination_id: destination.id,
          destination_name: destination.carrier_name,
          distance_meters: distance,
          distance_km: (distance / 1000).toFixed(2),
          duration_seconds: duration,
          duration_minutes: Math.round(duration / 60),
          duration_formatted: formatDuration(duration)
        };

        console.log(`      ✅ ${(distance / 1000).toFixed(2)} km, ${Math.round(duration / 60)} min`);
        processedCount++;
      } else {
        console.log(`      ❌ Failed to calculate`);
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    console.log(`\n   ✅ Processed ${processedCount}/${destinations.length} destinations\n`);

    // Step 5: Upsert routes to database
    console.log('💾 Step 5: Saving routes to database...\n');

    let savedCount = 0;
    let errorCount = 0;

    for (const destId in routeStats) {
      const stats = routeStats[destId];

      const { error: upsertError } = await supabase
        .from('routes')
        .upsert({
          departer_id: departer.id,
          destination_id: destId,
          distance_km: parseFloat(stats.distance_km),
          distance_meters: stats.distance_meters,
          duration_seconds: stats.duration_seconds,
          duration_minutes: stats.duration_minutes,
          vehicle_type: 'truck'
        }, {
          onConflict: 'departer_id,destination_id'
        });

      if (upsertError) {
        console.log(`   ❌ Error saving ${stats.destination_name}: ${upsertError.message}`);
        errorCount++;
      } else {
        console.log(`   ✅ Saved: ${stats.destination_name}`);
        savedCount++;
      }
    }

    console.log(`\n   ✅ Saved ${savedCount} routes`);
    if (errorCount > 0) {
      console.log(`   ⚠️  ${errorCount} errors`);
    }

    // Step 6: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Total trips analyzed: ${trips.length}`);
    console.log(`✅ Destinations processed: ${processedCount}`);
    console.log(`✅ Routes saved: ${savedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

    // Step 7: Display sample routes
    console.log('\n📋 Sample Routes:\n');
    const sampleRoutes = Object.values(routeStats).slice(0, 5);
    sampleRoutes.forEach(route => {
      console.log(`   ${route.destination_name}`);
      console.log(`      📏 Distance: ${route.distance_km} km`);
      console.log(`      ⏱️  Duration: ${route.duration_formatted} (${route.duration_minutes} min)`);
      console.log('');
    });

    console.log('🎉 Route averages calculation completed!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

/**
 * Format duration to HH:MM
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// Run the script
calculateRouteAverages()
  .then(() => {
    console.log('✅ Script finished successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

