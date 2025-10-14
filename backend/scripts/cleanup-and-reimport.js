const supabaseService = require('../services/supabase.service');
const goongService = require('../services/goong.service');
const fs = require('fs');
const path = require('path');

/**
 * Script to cleanup duplicates and re-import destinations
 */

async function cleanupAndReimport() {
  console.log('🧹 Starting cleanup and re-import process...\n');

  try {
    // Step 1: Get all destinations
    console.log('📊 Step 1: Fetching all destinations...');
    const result = await supabaseService.getDestinations(false);
    
    if (!result.success) {
      throw new Error(`Failed to fetch destinations: ${result.error}`);
    }

    const destinations = result.data;
    console.log(`   Found ${destinations.length} destinations in database\n`);

    // Step 2: Delete all destinations
    console.log('🗑️  Step 2: Deleting all destinations...');
    let deletedCount = 0;
    
    for (const dest of destinations) {
      const deleteResult = await supabaseService.deleteDestination(dest.id);
      if (deleteResult.success) {
        deletedCount++;
        process.stdout.write(`\r   Deleted: ${deletedCount}/${destinations.length}`);
      }
    }
    console.log(`\n   ✅ Deleted ${deletedCount} destinations\n`);

    // Step 3: Load JSON file
    console.log('📂 Step 3: Loading destination.json...');
    const jsonPath = path.join(__dirname, '../../database/destination.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`   Found ${jsonData.length} destinations in JSON\n`);

    // Step 4: Get departer
    console.log('🏠 Step 4: Getting departer...');
    const departersResult = await supabaseService.getDeparters();
    
    if (!departersResult.success || departersResult.data.length === 0) {
      throw new Error('No departer found in database');
    }

    const departer = departersResult.data[0];
    console.log(`   Using departer: ${departer.name}\n`);

    // Step 5: Import destinations
    console.log('📥 Step 5: Importing destinations...');
    let importedCount = 0;
    let errorCount = 0;

    for (let i = 0; i < jsonData.length; i++) {
      const item = jsonData[i];
      
      try {
        // Geocode address
        const geocodeResult = await goongService.geocode(item.destination);
        
        if (!geocodeResult.success) {
          console.log(`\n   ⚠️  Geocoding failed for: ${item.carrier_name}`);
          errorCount++;
          continue;
        }

        const { lat, lng, formatted_address } = geocodeResult.data;

        // Create destination
        const destinationData = {
          carrier_name: item.carrier_name,
          address: item.destination,
          ward_name: item.ward_name,
          district_name: item.district_name,
          province_name: item.province_name,
          lat,
          lng,
          formatted_address,
          departer_id: departer.id,
        };

        const createResult = await supabaseService.createDestination(destinationData);
        
        if (!createResult.success) {
          console.log(`\n   ❌ Failed to create: ${item.carrier_name}`);
          errorCount++;
          continue;
        }

        // Calculate distance
        const distanceResult = await goongService.calculateDistance(
          { lat: departer.lat, lng: departer.lng },
          { lat, lng },
          'truck'
        );

        if (distanceResult.success) {
          const { distance_meters, duration_seconds } = distanceResult.data;
          
          // Create route
          await supabaseService.upsertRoute({
            departer_id: departer.id,
            destination_id: createResult.data.id,
            distance_km: (distance_meters / 1000).toFixed(2),
            distance_meters,
            duration_minutes: Math.round(duration_seconds / 60),
            duration_seconds,
            vehicle_type: 'truck',
          });
        }

        importedCount++;
        process.stdout.write(`\r   Imported: ${importedCount}/${jsonData.length} (Errors: ${errorCount})`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.log(`\n   ❌ Error processing ${item.carrier_name}: ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n\n✅ Import completed!`);
    console.log(`   - Successfully imported: ${importedCount}`);
    console.log(`   - Errors: ${errorCount}`);
    console.log(`   - Total in JSON: ${jsonData.length}\n`);

    // Step 6: Verify
    console.log('🔍 Step 6: Verifying...');
    const verifyResult = await supabaseService.getDestinations(false);
    console.log(`   Destinations in database: ${verifyResult.data.length}`);
    
    // Check for duplicates
    const carrierNames = verifyResult.data.map(d => d.carrier_name);
    const duplicates = carrierNames.filter((name, index) => carrierNames.indexOf(name) !== index);
    
    if (duplicates.length > 0) {
      console.log(`   ⚠️  Found ${duplicates.length} duplicates!`);
      console.log(`   Duplicates: ${[...new Set(duplicates)].join(', ')}`);
    } else {
      console.log(`   ✅ No duplicates found!`);
    }

    console.log('\n🎉 Cleanup and re-import process completed!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
cleanupAndReimport()
  .then(() => {
    console.log('✅ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

