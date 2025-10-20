const fs = require('fs');

console.log('\n📊 ANALYZING NEW_MARKER.JSON\n');
console.log('═'.repeat(70));

// Read JSON
const markers = JSON.parse(fs.readFileSync('database/new_marker.json', 'utf8'));

console.log(`\n📋 Total hubs: ${markers.length}`);

// Identify 3 main departers
const mainDeparters = [
  'Hub VSIP II',
  'NVCT Hub Cần Thơ-Child',
  'NV công ty - Hub Tiên Du'
];

console.log('\n🏢 MAIN DEPARTERS (3):');
console.log('─'.repeat(70));

const departerHubs = [];
const destinationHubs = [];
const invalidHubs = [];

// Helper function to parse and validate coordinates
function parseCoordinate(value, type) {
  // If already a valid number
  if (typeof value === 'number' && !isNaN(value)) {
    if (type === 'lat' && value >= -90 && value <= 90) return value;
    if (type === 'lng' && value >= -180 && value <= 180) return value;
  }

  // If string, try to parse
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      if (type === 'lat' && parsed >= -90 && parsed <= 90) return parsed;
      if (type === 'lng' && parsed >= -180 && parsed <= 180) return parsed;
    }
  }

  return null;
}

markers.forEach((marker, index) => {
  // Parse coordinates
  const lat = parseCoordinate(marker.latitude, 'lat');
  const lng = parseCoordinate(marker.longitude, 'lng');

  // Skip invalid coordinates
  if (lat === null || lng === null) {
    invalidHubs.push({
      carrier_name: marker.carrier_name,
      latitude: marker.latitude,
      longitude: marker.longitude,
      reason: 'Invalid coordinates'
    });
    return;
  }

  // Update marker with parsed coordinates
  marker.latitude = lat;
  marker.longitude = lng;

  if (mainDeparters.includes(marker.carrier_name)) {
    departerHubs.push(marker);
    console.log(`✅ ${marker.carrier_name}`);
    console.log(`   Hub Name: ${marker.Hub_name}`);
    console.log(`   Address: ${marker.address}`);
    console.log(`   Location: ${marker.latitude}, ${marker.longitude}`);
    console.log(`   Departer: ${marker.departer}`);
    console.log('');
  } else {
    destinationHubs.push(marker);
  }
});

if (invalidHubs.length > 0) {
  console.log(`\n⚠️  SKIPPED ${invalidHubs.length} INVALID HUBS:`);
  console.log('─'.repeat(70));
  invalidHubs.forEach(hub => {
    console.log(`❌ ${hub.carrier_name}`);
    console.log(`   Lat: ${hub.latitude}, Lng: ${hub.longitude}`);
    console.log(`   Reason: ${hub.reason}\n`);
  });
}

console.log(`\n📍 DESTINATION HUBS: ${destinationHubs.length}`);

// Group by departer
const byDeparter = {};
destinationHubs.forEach(hub => {
  const departer = hub.departer || 'Unknown';
  if (!byDeparter[departer]) {
    byDeparter[departer] = [];
  }
  byDeparter[departer].push(hub);
});

console.log('\n📊 GROUPED BY DEPARTER:');
console.log('─'.repeat(70));
Object.keys(byDeparter).forEach(departer => {
  console.log(`${departer}: ${byDeparter[departer].length} hubs`);
});

// Generate SQL for DEPARTERS table
console.log('\n\n🔧 GENERATING SQL SCRIPTS...\n');

let departerSQL = `-- ============================================================
-- STEP 1: CLEAR AND INSERT DEPARTERS (3 MAIN HUBS)
-- ============================================================
-- Schema: departers (name, address, lat, lng, formatted_address, is_active)
-- ============================================================

-- Clear existing departers
TRUNCATE TABLE departers CASCADE;

-- Insert 3 main departers
INSERT INTO departers (
  name,
  address,
  lat,
  lng,
  is_active
) VALUES
`;

const departerValues = departerHubs.map((hub, index) => {
  const name = (hub.carrier_name || '').replace(/'/g, "''");
  const address = (hub.address || '').replace(/'/g, "''");
  const wardName = (hub.ward_name || '').replace(/'/g, "''");
  const districtName = (hub.district_name || '').replace(/'/g, "''");
  const provinceName = (hub.province_name || '').replace(/'/g, "''");

  // Combine full address
  const fullAddress = `${address}, ${wardName}, ${districtName}, ${provinceName}`;

  return `  ('${name}', '${fullAddress}', ${hub.latitude}, ${hub.longitude}, true)`;
});

departerSQL += departerValues.join(',\n');
departerSQL += ';\n\n';
departerSQL += '-- Verify departers\n';
departerSQL += 'SELECT COUNT(*) as total_departers FROM departers;\n';
departerSQL += 'SELECT name, address, lat, lng FROM departers ORDER BY name;\n';

fs.writeFileSync('database/step1-insert-departers.sql', departerSQL, 'utf8');
console.log('✅ Generated: database/step1-insert-departers.sql');

// Generate SQL for DESTINATIONS table
let destinationSQL = `-- ============================================================
-- STEP 2: CLEAR AND INSERT DESTINATIONS (${destinationHubs.length} HUBS)
-- ============================================================
-- Schema: destinations (carrier_name, address, ward_name, district_name,
--                       province_name, lat, lng, formatted_address, is_active)
-- ============================================================

-- Clear existing destinations
TRUNCATE TABLE destinations CASCADE;

-- Insert destinations in batches
`;

// Split into batches of 100
const batchSize = 100;
const batches = [];
for (let i = 0; i < destinationHubs.length; i += batchSize) {
  batches.push(destinationHubs.slice(i, i + batchSize));
}

batches.forEach((batch, batchIndex) => {
  destinationSQL += `\n-- Batch ${batchIndex + 1}/${batches.length} (${batch.length} records)\n`;
  destinationSQL += `INSERT INTO destinations (\n`;
  destinationSQL += `  carrier_name,\n`;
  destinationSQL += `  address,\n`;
  destinationSQL += `  ward_name,\n`;
  destinationSQL += `  district_name,\n`;
  destinationSQL += `  province_name,\n`;
  destinationSQL += `  lat,\n`;
  destinationSQL += `  lng,\n`;
  destinationSQL += `  is_active\n`;
  destinationSQL += `) VALUES\n`;

  const values = batch.map((hub, index) => {
    const carrierName = (hub.carrier_name || '').replace(/'/g, "''");
    const address = (hub.address || '').replace(/'/g, "''");
    const wardName = (hub.ward_name || '').replace(/'/g, "''");
    const districtName = (hub.district_name || '').replace(/'/g, "''");
    const provinceName = (hub.province_name || '').replace(/'/g, "''");

    return `  ('${carrierName}', '${address}', '${wardName}', '${districtName}', '${provinceName}', ${hub.latitude}, ${hub.longitude}, true)`;
  });

  destinationSQL += values.join(',\n');
  destinationSQL += ';\n';
});

destinationSQL += '\n-- Verify destinations\n';
destinationSQL += 'SELECT COUNT(*) as total_destinations FROM destinations;\n';
destinationSQL += 'SELECT carrier_name, address, lat, lng FROM destinations ORDER BY carrier_name LIMIT 10;\n';

fs.writeFileSync('database/step2-insert-destinations.sql', destinationSQL, 'utf8');
console.log('✅ Generated: database/step2-insert-destinations.sql');

// Generate summary
const summary = `
═══════════════════════════════════════════════════════════════════
📊 IMPORT SUMMARY
═══════════════════════════════════════════════════════════════════

📁 Source File: database/new_marker.json
📊 Total Hubs: ${markers.length}

🏢 DEPARTERS (Main Hubs): ${departerHubs.length}
   1. ${departerHubs[0]?.carrier_name} (${departerHubs[0]?.Hub_name})
   2. ${departerHubs[1]?.carrier_name} (${departerHubs[1]?.Hub_name})
   3. ${departerHubs[2]?.carrier_name} (${departerHubs[2]?.Hub_name})

📍 DESTINATIONS: ${destinationHubs.length}

📋 GROUPED BY DEPARTER:
${Object.keys(byDeparter).map(dep => `   - ${dep}: ${byDeparter[dep].length} hubs`).join('\n')}

═══════════════════════════════════════════════════════════════════
📝 NEXT STEPS:
═══════════════════════════════════════════════════════════════════

1. Open Supabase SQL Editor
2. Run: database/step1-insert-departers.sql
3. Verify: Should see 3 departers
4. Run: database/step2-insert-destinations.sql
5. Verify: Should see ${destinationHubs.length} destinations
6. Test on map interface

═══════════════════════════════════════════════════════════════════
`;

fs.writeFileSync('database/IMPORT_SUMMARY.txt', summary, 'utf8');
console.log('✅ Generated: database/IMPORT_SUMMARY.txt');

console.log(summary);

