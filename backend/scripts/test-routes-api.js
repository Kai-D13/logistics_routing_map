const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testRoutesAPI() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TESTING ROUTES API');
  console.log('='.repeat(70));

  try {
    // Test 1: Get all routes
    console.log('\n📋 Test 1: GET /api/routes (List all routes)');
    const routesResponse = await axios.get(`${BASE_URL}/routes`);
    console.log(`✅ Status: ${routesResponse.status}`);
    console.log(`✅ Total routes: ${routesResponse.data.total}`);
    console.log(`✅ Sample routes:`, routesResponse.data.data.slice(0, 3).map(r => r.route_name));

    // Test 2: Get departers
    console.log('\n📋 Test 2: GET /api/routes/departers (Get all departers)');
    const departersResponse = await axios.get(`${BASE_URL}/routes/departers`);
    console.log(`✅ Status: ${departersResponse.status}`);
    console.log(`✅ Total departers: ${departersResponse.data.total}`);
    console.log(`✅ Departers:`, departersResponse.data.data);

    // Test 3: Search routes
    console.log('\n📋 Test 3: GET /api/routes/search (Search routes)');
    const searchResponse = await axios.get(`${BASE_URL}/routes/search`, {
      params: {
        hub_departer: 'Hub VSIP II',
        note: 'D'
      }
    });
    console.log(`✅ Status: ${searchResponse.status}`);
    console.log(`✅ Total results: ${searchResponse.data.total}`);
    console.log(`✅ Sample results:`, searchResponse.data.data.slice(0, 3).map(r => ({
      route: r.route_name,
      destination: r.hub_destination,
      time: r.departure_time
    })));

    // Test 4: Get route details
    if (routesResponse.data.data.length > 0) {
      const firstRoute = routesResponse.data.data[0].route_name;
      console.log(`\n📋 Test 4: GET /api/routes/${firstRoute} (Get route details)`);
      const detailsResponse = await axios.get(`${BASE_URL}/routes/${encodeURIComponent(firstRoute)}`);
      console.log(`✅ Status: ${detailsResponse.status}`);
      console.log(`✅ Route name: ${detailsResponse.data.data.route_name}`);
      console.log(`✅ Total segments: ${detailsResponse.data.data.total_segments}`);
      console.log(`✅ Summary:`, detailsResponse.data.data.summary);
    }

    // Test 5: Get route segments
    if (routesResponse.data.data.length > 0) {
      const firstRoute = routesResponse.data.data[0].route_name;
      console.log(`\n📋 Test 5: GET /api/routes/${firstRoute}/segments (Get route segments)`);
      const segmentsResponse = await axios.get(`${BASE_URL}/routes/${encodeURIComponent(firstRoute)}/segments`);
      console.log(`✅ Status: ${segmentsResponse.status}`);
      console.log(`✅ Total segments: ${segmentsResponse.data.total}`);
      console.log(`✅ Sample segment:`, segmentsResponse.data.data[0]);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL TESTS PASSED!');
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

testRoutesAPI();

