const fs = require('fs');

// Read JSON
const markers = JSON.parse(fs.readFileSync('database/new_marker.json', 'utf8'));

// Main departers
const mainDeparters = [
  'Hub VSIP II',
  'NVCT Hub Cần Thơ-Child',
  'NV công ty - Hub Tiên Du'
];

const invalidHubs = [];
const validHubs = [];

markers.forEach((marker, index) => {
  // Skip departers
  if (mainDeparters.includes(marker.carrier_name)) {
    return;
  }
  
  // Validate coordinates
  const lat = typeof marker.latitude === 'number' ? marker.latitude : parseFloat(marker.latitude);
  const lng = typeof marker.longitude === 'number' ? marker.longitude : parseFloat(marker.longitude);
  
  // Check if invalid
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    invalidHubs.push({
      index: index + 1,
      carrier_name: marker.carrier_name,
      address: marker.address,
      ward_name: marker.ward_name,
      district_name: marker.district_name,
      province_name: marker.province_name,
      latitude: marker.latitude,
      longitude: marker.longitude,
      original_lat: marker.latitude,
      original_lng: marker.longitude
    });
  } else {
    validHubs.push(marker);
  }
});

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('📊 ANALYSIS RESULTS');
console.log('═══════════════════════════════════════════════════════════════════');
console.log(`Total destinations: ${markers.length - 3}`);
console.log(`Valid: ${validHubs.length}`);
console.log(`Invalid: ${invalidHubs.length}`);
console.log('═══════════════════════════════════════════════════════════════════\n');

if (invalidHubs.length > 0) {
  console.log('❌ INVALID HUBS FOUND:\n');
  invalidHubs.forEach((hub, idx) => {
    console.log(`${idx + 1}. ${hub.carrier_name}`);
    console.log(`   Address: ${hub.address}`);
    console.log(`   Ward: ${hub.ward_name}`);
    console.log(`   District: ${hub.district_name}`);
    console.log(`   Province: ${hub.province_name}`);
    console.log(`   Lat: ${hub.original_lat} (${typeof hub.original_lat})`);
    console.log(`   Lng: ${hub.original_lng} (${typeof hub.original_lng})`);
    console.log('');
  });
  
  // Save to JSON for geocoding
  fs.writeFileSync('database/invalid-hubs.json', JSON.stringify(invalidHubs, null, 2), 'utf8');
  console.log('✅ Saved to: database/invalid-hubs.json\n');
}

console.log('═══════════════════════════════════════════════════════════════════\n');

