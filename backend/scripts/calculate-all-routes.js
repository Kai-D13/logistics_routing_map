const supabaseService = require('../services/supabase.service');
const goongService = require('../services/goong.service');
require('dotenv').config();

console.log('\n🛣️  CALCULATE ALL ROUTES (Distance & Duration)\n');
console.log('═'.repeat(70));

/**
 * Delay function for rate limiting
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Format duration to HH:MM
 */
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

async function calculateAllRoutes() {
  try {
    // Step 1: Get all departers
    console.log('\n📊 STEP 1: Loading departers...');
    const departersResult = await supabaseService.getDeparters(true);
    
    if (!departersResult.success) {
      throw new Error('Failed to load departers: ' + departersResult.error);
    }

    const departers = departersResult.data;
    console.log(`   ✅ Loaded ${departers.length} departers\n`);

    // Step 2: Get all destinations
    console.log('📊 STEP 2: Loading destinations...');
    const destinationsResult = await supabaseService.getDestinations(true);
    
    if (!destinationsResult.success) {
      throw new Error('Failed to load destinations: ' + destinationsResult.error);
    }

    const destinations = destinationsResult.data;
    console.log(`   ✅ Loaded ${destinations.length} destinations\n`);

    // Step 3: Calculate routes
    console.log('📊 STEP 3: Calculating routes...\n');
    console.log('⏳ This may take a few minutes (rate limiting: 300ms/request)\n');

    let totalRoutes = 0;
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const departer of departers) {
      console.log(`\n🏠 Processing departer: ${departer.name}`);
      console.log('─'.repeat(70));

      // Get destinations for this departer
      const departerDestinations = destinations.filter(
        d => d.departer_id === departer.id
      );

      console.log(`   Found ${departerDestinations.length} destinations for this departer\n`);

      for (const destination of departerDestinations) {
        totalRoutes++;
        console.log(`   ${totalRoutes}. ${destination.carrier_name}`);

        // Check if route already exists
        const existingRoute = await supabaseService.getRoute(
          departer.id,
          destination.id
        );

        if (existingRoute.success && existingRoute.data) {
          console.log(`      ⏭️  Route already exists (${existingRoute.data.distance_km} km, ${existingRoute.data.duration_minutes} min)`);
          skippedCount++;
          continue;
        }

        // Calculate distance using Goong API
        const distanceResult = await goongService.calculateDistance(
          { lat: departer.lat, lng: departer.lng },
          { lat: destination.lat, lng: destination.lng },
          'truck'
        );

        if (!distanceResult.success) {
          console.log(`      ❌ Failed: ${distanceResult.error}`);
          errorCount++;
          await delay(300);
          continue;
        }

        const { distance_meters, duration_seconds } = distanceResult.data;
        const distance_km = parseFloat((distance_meters / 1000).toFixed(2));
        const duration_minutes = Math.round(duration_seconds / 60);

        // Save route to database
        const routeData = {
          departer_id: departer.id,
          destination_id: destination.id,
          distance_km,
          distance_meters,
          duration_minutes,
          duration_seconds,
        };

        const upsertResult = await supabaseService.upsertRoute(routeData);

        if (upsertResult.success) {
          console.log(`      ✅ ${distance_km} km, ${duration_minutes} min (${formatDuration(duration_seconds)})`);
          successCount++;
        } else {
          console.log(`      ❌ Failed to save: ${upsertResult.error}`);
          errorCount++;
        }

        // Rate limiting (Goong API: max 300 requests/minute)
        await delay(300);
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(70));
    console.log('✅ CALCULATION COMPLETE!');
    console.log('═'.repeat(70));
    console.log(`\n📊 Summary:`);
    console.log(`   Total routes processed: ${totalRoutes}`);
    console.log(`   ✅ Successfully calculated: ${successCount}`);
    console.log(`   ⏭️  Skipped (already exists): ${skippedCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`\n🎉 All routes have been calculated and saved!\n`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
calculateAllRoutes();

