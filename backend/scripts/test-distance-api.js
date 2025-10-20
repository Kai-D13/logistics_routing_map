const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testDistanceAPI() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TESTING DISTANCE CALCULATION API');
  console.log('='.repeat(70));

  try {
    // Test 1: Calculate distance for single segment
    console.log('\n📋 Test 1: POST /api/routes/calculate-distance');
    const distanceResponse = await axios.post(`${BASE_URL}/routes/calculate-distance`, {
      hub_departer: 'Hub VSIP II',
      hub_destination: 'KTLS Bửu Hòa - Đồng Nai'
    });
    console.log(`✅ Status: ${distanceResponse.status}`);
    console.log(`✅ Distance: ${distanceResponse.data.data.distance_km} km`);
    console.log(`✅ Duration: ${distanceResponse.data.data.duration_hours} hours`);
    console.log(`✅ Distance text: ${distanceResponse.data.data.distance_text}`);
    console.log(`✅ Duration text: ${distanceResponse.data.data.duration_text}`);

    // Test 2: Calculate distances for entire route (small route)
    console.log('\n📋 Test 2: POST /api/routes/:routeName/calculate-distances');
    console.log('Finding a small route to test...');
    
    const routesResponse = await axios.get(`${BASE_URL}/routes`);
    const smallRoute = routesResponse.data.data.find(r => r.total_destinations <= 5);
    
    if (smallRoute) {
      console.log(`Testing with route: ${smallRoute.route_name} (${smallRoute.total_destinations} destinations)`);
      
      const calculateResponse = await axios.post(
        `${BASE_URL}/routes/${encodeURIComponent(smallRoute.route_name)}/calculate-distances`
      );
      
      console.log(`✅ Status: ${calculateResponse.status}`);
      console.log(`✅ Message: ${calculateResponse.data.message}`);
      console.log(`✅ Success count: ${calculateResponse.data.data.success_count}`);
      console.log(`✅ Fail count: ${calculateResponse.data.data.fail_count}`);
      console.log(`✅ Sample results:`, calculateResponse.data.data.results.slice(0, 2));
    } else {
      console.log('⚠️  No small route found, skipping batch calculation test');
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL DISTANCE TESTS PASSED!');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Error:`, error.response.data);
    } else {
      console.error(error.message);
    }
    console.log('\n' + '='.repeat(70) + '\n');
    process.exit(1);
  }
}

testDistanceAPI();

