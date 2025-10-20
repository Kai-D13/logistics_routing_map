const fs = require('fs');
const axios = require('axios');
require('dotenv').config();

const GOONG_API_KEY = process.env.GOONG_API_KEY;
const invalidHubs = JSON.parse(fs.readFileSync('database/invalid-hubs.json', 'utf8'));

async function geocodeAddress(hub) {
  try {
    // Build full address
    const fullAddress = `${hub.address}, ${hub.ward_name}, ${hub.district_name}, ${hub.province_name}`;
    
    console.log(`\n🔍 Geocoding: ${hub.carrier_name}`);
    console.log(`   Address: ${fullAddress}`);
    console.log(`   Original: lat=${hub.original_lat}, lng=${hub.original_lng}`);
    
    // Call Goong Geocoding API
    const response = await axios.get('https://rsapi.goong.io/geocode', {
      params: {
        address: fullAddress,
        api_key: GOONG_API_KEY
      }
    });
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      const location = result.geometry.location;
      
      console.log(`   ✅ Found: lat=${location.lat}, lng=${location.lng}`);
      console.log(`   Formatted: ${result.formatted_address}`);
      
      return {
        ...hub,
        latitude: location.lat,
        longitude: location.lng,
        formatted_address: result.formatted_address,
        geocoded: true
      };
    } else {
      console.log(`   ❌ No results found`);
      
      // Try swapping lat/lng as fallback
      console.log(`   🔄 Trying to swap lat/lng...`);
      return {
        ...hub,
        latitude: hub.original_lng,
        longitude: hub.original_lat,
        geocoded: false,
        swapped: true
      };
    }
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    
    // Fallback: swap lat/lng
    return {
      ...hub,
      latitude: hub.original_lng,
      longitude: hub.original_lat,
      geocoded: false,
      swapped: true,
      error: error.message
    };
  }
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('🌍 GEOCODING INVALID HUBS WITH GOONG API');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`Total hubs to geocode: ${invalidHubs.length}\n`);
  
  const geocodedHubs = [];
  
  for (const hub of invalidHubs) {
    const geocoded = await geocodeAddress(hub);
    geocodedHubs.push(geocoded);
    
    // Wait 500ms between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Save results
  fs.writeFileSync('database/geocoded-hubs.json', JSON.stringify(geocodedHubs, null, 2), 'utf8');
  
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('✅ GEOCODING COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log(`Saved to: database/geocoded-hubs.json\n`);
  
  // Summary
  const geocodedCount = geocodedHubs.filter(h => h.geocoded).length;
  const swappedCount = geocodedHubs.filter(h => h.swapped).length;
  
  console.log('📊 SUMMARY:');
  console.log(`   Geocoded successfully: ${geocodedCount}`);
  console.log(`   Swapped lat/lng: ${swappedCount}`);
  console.log(`   Total: ${geocodedHubs.length}\n`);
  
  // Display results
  console.log('📍 RESULTS:\n');
  geocodedHubs.forEach((hub, idx) => {
    console.log(`${idx + 1}. ${hub.carrier_name}`);
    console.log(`   Lat: ${hub.latitude}, Lng: ${hub.longitude}`);
    console.log(`   Status: ${hub.geocoded ? '✅ Geocoded' : '🔄 Swapped'}`);
    console.log('');
  });
}

main().catch(console.error);

