const fs = require('fs');

// Read route.json
const routes = JSON.parse(fs.readFileSync('database/route.json', 'utf8'));

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('📊 ROUTE DATA ANALYSIS');
console.log('═══════════════════════════════════════════════════════════════════');

// Analysis
const stats = {
  totalSegments: routes.length,
  uniqueRoutes: new Set(routes.map(r => r.route_name)).size,
  uniqueDeparters: new Set(routes.map(r => r.hub_departer)).size,
  uniqueDestinations: new Set(routes.map(r => r.hub_destination)).size,
  noteDistribution: {},
  departerStats: {},
  routeStats: {}
};

// Analyze data
routes.forEach(route => {
  // Note distribution
  stats.noteDistribution[route.note] = (stats.noteDistribution[route.note] || 0) + 1;
  
  // Departer stats
  if (!stats.departerStats[route.hub_departer]) {
    stats.departerStats[route.hub_departer] = {
      routes: new Set(),
      destinations: new Set()
    };
  }
  stats.departerStats[route.hub_departer].routes.add(route.route_name);
  stats.departerStats[route.hub_departer].destinations.add(route.hub_destination);
  
  // Route stats
  if (!stats.routeStats[route.route_name]) {
    stats.routeStats[route.route_name] = {
      departer: route.hub_departer,
      destinations: new Set(),
      departureTime: route['Giờ xuất phát']
    };
  }
  stats.routeStats[route.route_name].destinations.add(route.hub_destination);
});

console.log(`Total Segments: ${stats.totalSegments}`);
console.log(`Unique Routes: ${stats.uniqueRoutes}`);
console.log(`Unique Departers: ${stats.uniqueDeparters}`);
console.log(`Unique Destinations: ${stats.uniqueDestinations}`);
console.log('\nNote Distribution:');
Object.entries(stats.noteDistribution).forEach(([note, count]) => {
  console.log(`  ${note}: ${count} segments`);
});

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('🏢 HUB DEPARTER ANALYSIS');
console.log('═══════════════════════════════════════════════════════════════════');

Object.entries(stats.departerStats).forEach(([departer, data]) => {
  console.log(`\n${departer}:`);
  console.log(`  Routes: ${data.routes.size}`);
  console.log(`  Destinations: ${data.destinations.size}`);
});

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('🚚 ROUTE ANALYSIS');
console.log('═══════════════════════════════════════════════════════════════════');

Object.entries(stats.routeStats).slice(0, 10).forEach(([routeName, data]) => {
  console.log(`\n${routeName}:`);
  console.log(`  Departer: ${data.departer}`);
  console.log(`  Departure: ${data.departureTime}`);
  console.log(`  Destinations: ${data.destinations.size}`);
});

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('🔍 SECONDARY HUB DETECTION');
console.log('═══════════════════════════════════════════════════════════════════');

// Find hubs that are both departer and destination
const allDeparters = new Set(routes.map(r => r.hub_departer));
const allDestinations = new Set(routes.map(r => r.hub_destination));

const secondaryHubs = [...allDeparters].filter(hub => allDestinations.has(hub));

console.log(`\nSecondary Hubs (${secondaryHubs.length}):`);
secondaryHubs.forEach(hub => {
  const asDeparter = routes.filter(r => r.hub_departer === hub).length;
  const asDestination = routes.filter(r => r.hub_destination === hub).length;
  console.log(`  • ${hub}`);
  console.log(`    - As Departer: ${asDeparter} segments`);
  console.log(`    - As Destination: ${asDestination} segments`);
});

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('📝 GENERATING SQL');
console.log('═══════════════════════════════════════════════════════════════════');

// Generate SQL
let sql = `-- ============================================================
-- IMPORT ROUTE DATA FROM route.json
-- Total Segments: ${stats.totalSegments}
-- Unique Routes: ${stats.uniqueRoutes}
-- ============================================================

TRUNCATE TABLE route_schedules CASCADE;

INSERT INTO route_schedules (
  route_name,
  hub_departer,
  hub_destination,
  departure_time,
  arrival_time,
  day_offset,
  distance_km,
  duration_hours,
  note
) VALUES\n`;

const values = routes.map(route => {
  const routeName = (route.route_name || '').replace(/'/g, "''");
  const departer = (route.hub_departer || '').replace(/'/g, "''");
  const destination = (route.hub_destination || '').replace(/'/g, "''");
  const departureTime = route['Giờ xuất phát'] || '00:00:00';
  const arrivalTime = route['Giờ đến hub destination'] || '00:00:00';
  const note = route.note || 'D';
  
  // Calculate day_offset from note
  let dayOffset = 0;
  if (note === 'D+1' || note === 'Ngày D+1') dayOffset = 1;
  else if (note === 'D+2' || note === 'Ngày D+2') dayOffset = 2;
  
  // Distance and duration (null for now)
  const distance = route['tổng quãng đường'] ? route['tổng quãng đường'] : 'NULL';
  const duration = route['tổng thời gian'] ? route['tổng thời gian'] : 'NULL';
  
  return `  ('${routeName}', '${departer}', '${destination}', '${departureTime}', '${arrivalTime}', ${dayOffset}, ${distance}, ${duration}, '${note}')`;
});

sql += values.join(',\n') + ';\n\n';

// Add verification queries
sql += `-- ============================================================
-- VERIFICATION
-- ============================================================

-- Total segments
SELECT COUNT(*) as total_segments FROM route_schedules;

-- Unique routes
SELECT COUNT(DISTINCT route_name) as total_routes FROM route_schedules;

-- Segments by departer
SELECT 
  hub_departer, 
  COUNT(*) as segment_count,
  COUNT(DISTINCT route_name) as route_count,
  COUNT(DISTINCT hub_destination) as destination_count
FROM route_schedules
GROUP BY hub_departer
ORDER BY segment_count DESC;

-- Segments by note
SELECT note, COUNT(*) as count FROM route_schedules GROUP BY note ORDER BY note;

-- Sample routes
SELECT * FROM route_summary LIMIT 10;
`;

// Write SQL file
fs.writeFileSync('database/import-routes.sql', sql, 'utf8');

console.log('\n✅ Generated: database/import-routes.sql');
console.log(`   Total segments: ${stats.totalSegments}`);
console.log(`   Unique routes: ${stats.uniqueRoutes}`);

console.log('\n═══════════════════════════════════════════════════════════════════');
console.log('✅ DONE!');
console.log('═══════════════════════════════════════════════════════════════════\n');

