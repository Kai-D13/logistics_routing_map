/**
 * Import destinations from JSON file
 * Run: node backend/scripts/import-destinations.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const config = require('../config/keys');
const goongService = require('../services/goong.service');

// Initialize Supabase
const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

async function importDestinations() {
  console.log('='.repeat(70));
  console.log('📦 IMPORTING DESTINATIONS FROM JSON');
  console.log('='.repeat(70));

  try {
    // Read JSON file
    const jsonPath = path.join(__dirname, '../../database/destination.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    
    console.log(`\n📄 Found ${jsonData.length} destinations in JSON file`);

    // Get main departer
    console.log('\n🏠 Fetching main departer...');
    const { data: departer, error: departerError } = await supabase
      .from('departers')
      .select('*')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (departerError || !departer) {
      console.error('❌ No active departer found. Please create one first.');
      return;
    }

    console.log(`✅ Main departer: ${departer.name}`);

    // Import destinations
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < jsonData.length; i++) {
      const item = jsonData[i];
      console.log(`\n[${i + 1}/${jsonData.length}] Processing: ${item.carrier_name}`);

      try {
        // Geocode destination address
        console.log(`   📍 Geocoding: ${item.destination}`);
        const geocodeResult = await goongService.geocode(item.destination);

        if (!geocodeResult.success) {
          console.error(`   ❌ Geocoding failed: ${geocodeResult.error}`);
          errorCount++;
          continue;
        }

        const { lat, lng, formatted_address } = geocodeResult.data;
        console.log(`   ✅ Coordinates: ${lat}, ${lng}`);

        // Insert destination
        const { data: destination, error: insertError } = await supabase
          .from('destinations')
          .insert([{
            carrier_name: item.carrier_name,
            address: item.destination,
            ward_name: item.ward_name,
            district_name: item.district_name,
            province_name: item.province_name,
            lat: lat,
            lng: lng,
            formatted_address: formatted_address,
            departer_id: departer.id,
            is_active: true,
          }])
          .select()
          .single();

        if (insertError) {
          console.error(`   ❌ Insert failed: ${insertError.message}`);
          errorCount++;
          continue;
        }

        console.log(`   ✅ Destination created: ${destination.id}`);

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

          // Insert route
          const { error: routeError } = await supabase
            .from('routes')
            .insert([{
              departer_id: departer.id,
              destination_id: destination.id,
              distance_km: distance_km,
              distance_meters: distance_meters,
              duration_minutes: duration_minutes,
              duration_seconds: duration_seconds,
            }]);

          if (routeError) {
            console.error(`   ⚠️  Route insert failed: ${routeError.message}`);
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
    console.log('📊 IMPORT SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📦 Total: ${jsonData.length}`);
    console.log('='.repeat(70));

  } catch (err) {
    console.error('❌ Fatal error:', err);
  }
}

// Run import
importDestinations().catch(console.error);

