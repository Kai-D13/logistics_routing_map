/**
 * Update coordinates for existing destinations
 * Run: node backend/scripts/update-coordinates.js
 */

const { createClient } = require('@supabase/supabase-js');
const config = require('../config/keys');
const goongService = require('../services/goong.service');

// Initialize Supabase
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

async function updateCoordinates() {
  console.log('='.repeat(70));
  console.log('🔄 UPDATING COORDINATES FOR EXISTING DESTINATIONS');
  console.log('='.repeat(70));

  try {
    // Get all destinations without coordinates
    console.log('\n📍 Fetching destinations without coordinates...');
    const { data: destinations, error } = await supabase
      .from('destinations')
      .select('*')
      .is('lat', null);

    if (error) {
      console.error('❌ Error fetching destinations:', error.message);
      return;
    }

    console.log(`✅ Found ${destinations.length} destinations to update`);

    if (destinations.length === 0) {
      console.log('✅ All destinations already have coordinates!');
      return;
    }

    // Get main departer
    const { data: departer, error: departerError } = await supabase
      .from('departers')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (departerError || !departer) {
      console.error('❌ No active departer found');
      return;
    }

    console.log(`🏠 Main departer: ${departer.name}`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < destinations.length; i++) {
      const dest = destinations[i];
      console.log(`\n[${i + 1}/${destinations.length}] Processing: ${dest.carrier_name}`);

      try {
        // Geocode address
        console.log(`   📍 Geocoding: ${dest.address}`);
        const geocodeResult = await goongService.geocode(dest.address);

        if (!geocodeResult.success) {
          console.error(`   ❌ Geocoding failed: ${geocodeResult.error}`);
          errorCount++;
          continue;
        }

        const { lat, lng, formatted_address } = geocodeResult.data;
        console.log(`   ✅ Coordinates: ${lat}, ${lng}`);

        // Update destination
        const { error: updateError } = await supabase
          .from('destinations')
          .update({
            lat: lat,
            lng: lng,
            formatted_address: formatted_address,
          })
          .eq('id', dest.id);

        if (updateError) {
          console.error(`   ❌ Update failed: ${updateError.message}`);
          errorCount++;
          continue;
        }

        console.log(`   ✅ Destination updated`);

        // Calculate distance
        console.log(`   🧮 Calculating distance...`);
        const distanceResult = await goongService.calculateDistance(
          { lat: departer.lat, lng: departer.lng },
          { lat: lat, lng: lng }
        );

        if (distanceResult.success) {
          const { distance_meters, duration_seconds } = distanceResult.data;
          const distance_km = (distance_meters / 1000).toFixed(2);
          const duration_minutes = Math.round(duration_seconds / 60);

          // Upsert route
          const { error: routeError } = await supabase
            .from('routes')
            .upsert([{
              departer_id: departer.id,
              destination_id: dest.id,
              distance_km: distance_km,
              distance_meters: distance_meters,
              duration_minutes: duration_minutes,
              duration_seconds: duration_seconds,
            }], {
              onConflict: 'departer_id,destination_id',
            });

          if (routeError) {
            console.error(`   ⚠️  Route upsert failed: ${routeError.message}`);
          } else {
            console.log(`   ✅ Route created: ${distance_km} km, ${duration_minutes} min`);
          }
        } else {
          console.error(`   ⚠️  Distance calculation failed: ${distanceResult.error}`);
        }

        successCount++;
        
        // Rate limiting: wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (err) {
        console.error(`   ❌ Error: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 UPDATE SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📦 Total: ${destinations.length}`);
    console.log('='.repeat(70));

  } catch (err) {
    console.error('❌ Fatal error:', err);
  }
}

// Run update
updateCoordinates().catch(console.error);

