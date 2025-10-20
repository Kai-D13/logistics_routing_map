const fs = require('fs');

// Read JSON files
const markers = JSON.parse(fs.readFileSync('database/new_marker.json', 'utf8'));
const geocodedHubs = JSON.parse(fs.readFileSync('database/geocoded-hubs.json', 'utf8'));

// Main departers
const mainDeparters = [
  'Hub VSIP II',
  'NVCT Hub Cần Thơ-Child',
  'NV công ty - Hub Tiên Du'
];

// Create a map of geocoded hubs by carrier_name
const geocodedMap = {};
geocodedHubs.forEach(hub => {
  geocodedMap[hub.carrier_name] = hub;
});

const departerHubs = [];
const destinationHubs = [];
const skipped = [];

// Process markers
markers.forEach(marker => {
  // Check if this hub was geocoded
  if (geocodedMap[marker.carrier_name]) {
    const geocoded = geocodedMap[marker.carrier_name];
    marker.latitude = geocoded.latitude;
    marker.longitude = geocoded.longitude;
    if (geocoded.formatted_address) {
      marker.formatted_address = geocoded.formatted_address;
    }
  }
  
  // Validate coordinates
  let lat = typeof marker.latitude === 'number' ? marker.latitude : parseFloat(marker.latitude);
  let lng = typeof marker.longitude === 'number' ? marker.longitude : parseFloat(marker.longitude);
  
  // Skip if still invalid
  if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    skipped.push(marker.carrier_name);
    return;
  }
  
  marker.latitude = lat;
  marker.longitude = lng;
  
  if (mainDeparters.includes(marker.carrier_name)) {
    departerHubs.push(marker);
  } else {
    destinationHubs.push(marker);
  }
});

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('📊 FINAL SQL GENERATION');
console.log('═══════════════════════════════════════════════════════════════════');
console.log(`Total markers: ${markers.length}`);
console.log(`Departers: ${departerHubs.length}`);
console.log(`Destinations: ${destinationHubs.length}`);
console.log(`Skipped: ${skipped.length}`);
if (skipped.length > 0) {
  console.log(`Skipped hubs: ${skipped.join(', ')}`);
}
console.log('═══════════════════════════════════════════════════════════════════\n');

// Generate STEP 1 SQL
let sql1 = `-- ============================================================
-- STEP 1: INSERT 3 DEPARTERS
-- ============================================================
TRUNCATE TABLE departers CASCADE;

INSERT INTO departers (name, address, lat, lng, is_active) VALUES\n`;

const departerValues = departerHubs.map(h => {
  const name = (h.carrier_name || '').replace(/'/g, "''");
  const addr = `${h.address}, ${h.ward_name}, ${h.district_name}, ${h.province_name}`.replace(/'/g, "''");
  return `  ('${name}', '${addr}', ${h.latitude}, ${h.longitude}, true)`;
});

sql1 += departerValues.join(',\n') + ';\n\n-- Verify\nSELECT COUNT(*) as total FROM departers;\nSELECT name, lat, lng FROM departers ORDER BY name;\n';

fs.writeFileSync('database/step1-insert-departers.sql', sql1, 'utf8');
console.log('✅ Generated: database/step1-insert-departers.sql');

// Generate STEP 2 SQL
let sql2 = `-- ============================================================
-- STEP 2: INSERT ${destinationHubs.length} DESTINATIONS
-- ============================================================
TRUNCATE TABLE destinations CASCADE;

INSERT INTO destinations (carrier_name, address, ward_name, district_name, province_name, lat, lng, is_active) VALUES\n`;

const destValues = destinationHubs.map(h => {
  const name = (h.carrier_name || '').replace(/'/g, "''");
  const addr = (h.address || '').replace(/'/g, "''");
  const ward = (h.ward_name || '').replace(/'/g, "''");
  const dist = (h.district_name || '').replace(/'/g, "''");
  const prov = (h.province_name || '').replace(/'/g, "''");
  return `  ('${name}', '${addr}', '${ward}', '${dist}', '${prov}', ${h.latitude}, ${h.longitude}, true)`;
});

sql2 += destValues.join(',\n') + ';\n\n-- Verify\nSELECT COUNT(*) as total FROM destinations;\n';

fs.writeFileSync('database/step2-insert-destinations.sql', sql2, 'utf8');
console.log('✅ Generated: database/step2-insert-destinations.sql');

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('✅ DONE!');
console.log('═══════════════════════════════════════════════════════════════════');
console.log(`📍 Departers: ${departerHubs.length}`);
console.log(`📍 Destinations: ${destinationHubs.length}`);
console.log(`📍 Total: ${departerHubs.length + destinationHubs.length}`);
console.log('═══════════════════════════════════════════════════════════════════\n');

