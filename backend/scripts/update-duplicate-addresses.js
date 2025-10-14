const supabaseService = require('../services/supabase.service');
const goongService = require('../services/goong.service');

/**
 * Script to update addresses for destinations with duplicate coordinates
 */

const UPDATED_ADDRESSES = [
  {
    carrier_name: 'NVCT Hub Trà Ôn-CT',
    new_address: 'Đường Tỉnh 904 Xã Ngãi Tứ Huyện Tam Bình Vĩnh Long',
    google_maps_link: 'https://maps.app.goo.gl/BvnVbVUsTnojQtQU8'
  },
  {
    carrier_name: 'NVCT Hub Bình Minh-CT',
    new_address: 'Nguyễn Văn Thảnh Thị xã Bình Minh Vĩnh Long Việt Nam',
    google_maps_link: 'https://maps.app.goo.gl/VYU7yqg6t2bFjMbh8'
  },
  {
    carrier_name: 'NVCT Hub Vĩnh Long-CT',
    new_address: 'Quốc lộ 53 Phường 4 Thành phố Vĩnh Long Vĩnh Long',
    google_maps_link: 'https://maps.app.goo.gl/waWZLpktBkXqHwyp9'
  },
  {
    carrier_name: 'NVCT Hub Thành Phố Cà Mau_Child',
    new_address: 'đường số 2 Xã Lý Văn Lâm Thành Phố Cà Mau Tỉnh Cà Mau',
    google_maps_link: 'https://maps.app.goo.gl/YeRCdDqSiWBRqazE6'
  },
  {
    carrier_name: 'NVCT Hub Cà Mau_Child',
    new_address: 'Ấp 2 Xã Tắc Vân Thành phố Cà Mau Tỉnh Cà Mau',
    google_maps_link: 'https://maps.app.goo.gl/mMSwPmRrJgiuN4Y3A'
  },
  {
    carrier_name: 'NVCT Hub Vĩnh Tường-CT',
    new_address: '399 QL 61B Phường Vĩnh Tường Thị Xã Long Mỹ Tỉnh Hậu Giang',
    google_maps_link: 'https://maps.app.goo.gl/EfyNi6kx7pEb1Ty17'
  },
  {
    carrier_name: 'NVCT Hub Thốt Nốt-CT',
    new_address: '108 Trần Hoàng Na Phường Hưng Phú Quận Cái Răng Thành phố Cần Thơ',
    google_maps_link: 'https://maps.app.goo.gl/5G1c6GdFVTmncwt27'
  }
];

async function updateDuplicateAddresses() {
  console.log('🔄 Starting address update process...\n');

  try {
    // Get departer
    const departersResult = await supabaseService.getDeparters();
    if (!departersResult.success || departersResult.data.length === 0) {
      throw new Error('No departer found in database');
    }
    const departer = departersResult.data[0];
    console.log(`🏠 Using departer: ${departer.name}\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < UPDATED_ADDRESSES.length; i++) {
      const item = UPDATED_ADDRESSES[i];
      
      console.log(`\n📍 [${i + 1}/${UPDATED_ADDRESSES.length}] Processing: ${item.carrier_name}`);
      console.log(`   Old address: (will be replaced)`);
      console.log(`   New address: ${item.new_address}`);
      console.log(`   Google Maps: ${item.google_maps_link}`);

      try {
        // Step 1: Find destination by carrier_name
        const destinationsResult = await supabaseService.getDestinations(false);
        if (!destinationsResult.success) {
          throw new Error('Failed to fetch destinations');
        }

        const destination = destinationsResult.data.find(
          d => d.carrier_name === item.carrier_name
        );

        if (!destination) {
          console.log(`   ⚠️  Destination not found: ${item.carrier_name}`);
          errorCount++;
          continue;
        }

        console.log(`   ✅ Found destination ID: ${destination.id}`);
        console.log(`   📊 Old coordinates: ${destination.lat}, ${destination.lng}`);

        // Step 2: Geocode new address
        console.log(`   🔍 Geocoding new address...`);
        const geocodeResult = await goongService.geocode(item.new_address);

        if (!geocodeResult.success) {
          console.log(`   ❌ Geocoding failed: ${geocodeResult.error}`);
          errorCount++;
          continue;
        }

        const { lat, lng, formatted_address } = geocodeResult.data;
        console.log(`   ✅ New coordinates: ${lat}, ${lng}`);
        console.log(`   📝 Formatted address: ${formatted_address}`);

        // Step 3: Update destination
        console.log(`   💾 Updating destination...`);
        const updateResult = await supabaseService.updateDestination(destination.id, {
          address: item.new_address,
          lat,
          lng,
          formatted_address
        });

        if (!updateResult.success) {
          console.log(`   ❌ Update failed: ${updateResult.error}`);
          errorCount++;
          continue;
        }

        console.log(`   ✅ Destination updated successfully!`);

        // Step 4: Recalculate distance
        console.log(`   📏 Recalculating distance...`);
        const distanceResult = await goongService.calculateDistance(
          { lat: departer.lat, lng: departer.lng },
          { lat, lng },
          'truck'
        );

        if (distanceResult.success) {
          const { distance_meters, duration_seconds } = distanceResult.data;
          
          // Update route
          const routeResult = await supabaseService.upsertRoute({
            departer_id: departer.id,
            destination_id: destination.id,
            distance_km: (distance_meters / 1000).toFixed(2),
            distance_meters,
            duration_minutes: Math.round(duration_seconds / 60),
            duration_seconds,
            vehicle_type: 'truck',
          });

          if (routeResult.success) {
            console.log(`   ✅ Route updated: ${(distance_meters / 1000).toFixed(2)} km, ${Math.round(duration_seconds / 60)} minutes`);
          }
        }

        successCount++;
        console.log(`   ✅ COMPLETED: ${item.carrier_name}`);

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('📊 UPDATE SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully updated: ${successCount}/${UPDATED_ADDRESSES.length}`);
    console.log(`❌ Errors: ${errorCount}/${UPDATED_ADDRESSES.length}`);
    console.log('='.repeat(60));

    // Verify unique coordinates
    console.log('\n🔍 Verifying unique coordinates...');
    const verifyResult = await supabaseService.getDestinations(false);
    const destinations = verifyResult.data;
    
    const coordsMap = new Map();
    destinations.forEach(d => {
      const key = `${d.lat},${d.lng}`;
      if (!coordsMap.has(key)) {
        coordsMap.set(key, []);
      }
      coordsMap.get(key).push(d.carrier_name);
    });

    const duplicates = Array.from(coordsMap.entries()).filter(([_, names]) => names.length > 1);
    
    if (duplicates.length > 0) {
      console.log(`\n⚠️  Still have ${duplicates.length} duplicate coordinates:`);
      duplicates.forEach(([coords, names]) => {
        console.log(`   - ${coords}: ${names.join(', ')}`);
      });
    } else {
      console.log('\n✅ All coordinates are now unique!');
    }

    console.log(`\n📍 Total unique coordinates: ${coordsMap.size}/${destinations.length}`);
    console.log('\n🎉 Update process completed!\n');

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
updateDuplicateAddresses()
  .then(() => {
    console.log('✅ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

