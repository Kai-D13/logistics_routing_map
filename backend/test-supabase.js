/**
 * Test Supabase Connection V2
 * Run: node backend/test-supabase.js
 */

const supabaseService = require('./services/supabase.service');

async function testSupabase() {
  console.log('='.repeat(70));
  console.log('🧪 Testing Supabase Connection V2 (New Schema)');
  console.log('='.repeat(70));

  // Test 1: Connection
  console.log('\n📡 Test 1: Testing connection...');
  const connectionTest = await supabaseService.testConnection();
  if (connectionTest.success) {
    console.log('✅ Connection successful');
  } else {
    console.log('❌ Connection failed:', connectionTest.error);
    console.log('\n⚠️  Please make sure:');
    console.log('   1. You have run the SQL schema from database/schema-v2.sql');
    console.log('   2. Tables "departers", "destinations", "routes" exist');
    console.log('   3. Check your SUPABASE_URL and SUPABASE_ANON_KEY in .env');
    return;
  }

  // Test 2: Get departers
  console.log('\n🏠 Test 2: Fetching departers...');
  const departersResult = await supabaseService.getDeparters();
  if (departersResult.success) {
    console.log(`✅ Found ${departersResult.data.length} departers`);

    if (departersResult.data.length > 0) {
      console.log('\n📋 Departers:');
      departersResult.data.forEach((dep, index) => {
        console.log(`   🏠 ${index + 1}. ${dep.name}`);
        console.log(`      Address: ${dep.address}`);
        console.log(`      Coordinates: ${dep.lat}, ${dep.lng}`);
      });
    }
  } else {
    console.log('❌ Failed to fetch departers:', departersResult.error);
  }

  // Test 3: Get destinations
  console.log('\n📍 Test 3: Fetching destinations...');
  const destinationsResult = await supabaseService.getDestinations();
  if (destinationsResult.success) {
    console.log(`✅ Found ${destinationsResult.data.length} destinations`);

    if (destinationsResult.data.length > 0) {
      console.log('\n📋 Sample Destinations (first 5):');
      destinationsResult.data.slice(0, 5).forEach((dest, index) => {
        console.log(`   📍 ${index + 1}. ${dest.carrier_name}`);
        console.log(`      Address: ${dest.address}`);
        console.log(`      Province: ${dest.province_name}`);
        console.log(`      Coordinates: ${dest.lat}, ${dest.lng}`);
      });

      if (destinationsResult.data.length > 5) {
        console.log(`   ... and ${destinationsResult.data.length - 5} more`);
      }
    }
  } else {
    console.log('❌ Failed to fetch destinations:', destinationsResult.error);
  }

  // Test 4: Get routes
  console.log('\n🛣️  Test 4: Fetching routes...');
  if (departersResult.success && departersResult.data.length > 0) {
    const mainDeparter = departersResult.data[0];
    const routesResult = await supabaseService.getRoutesByDeparter(mainDeparter.id);

    if (routesResult.success) {
      console.log(`✅ Found ${routesResult.data.length} routes`);

      if (routesResult.data.length > 0) {
        console.log('\n📋 Sample Routes (first 5):');
        routesResult.data.slice(0, 5).forEach((route, index) => {
          console.log(`   🛣️  ${index + 1}. ${route.destinations.carrier_name}`);
          console.log(`      Distance: ${route.distance_km} km`);
          console.log(`      Duration: ${route.duration_minutes} minutes`);
        });

        if (routesResult.data.length > 5) {
          console.log(`   ... and ${routesResult.data.length - 5} more`);
        }
      }
    } else {
      console.log('❌ Failed to fetch routes:', routesResult.error);
    }
  }

  // Test 5: Statistics
  console.log('\n📊 Test 5: Statistics...');
  if (departersResult.success && destinationsResult.success) {
    console.log(`   🏠 Total Departers: ${departersResult.data.length}`);
    console.log(`   📍 Total Destinations: ${destinationsResult.data.length}`);

    if (departersResult.success && departersResult.data.length > 0) {
      const mainDeparter = departersResult.data[0];
      const routesResult = await supabaseService.getRoutesByDeparter(mainDeparter.id);
      if (routesResult.success) {
        console.log(`   🛣️  Total Routes: ${routesResult.data.length}`);
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✅ All tests completed!');
  console.log('='.repeat(70));
}

// Run tests
testSupabase().catch(console.error);

