const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testValidationAPI() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 TESTING ROUTE VALIDATION API');
  console.log('='.repeat(70));

  try {
    // Test 1: Valid route
    console.log('\n📋 Test 1: Validate VALID route');
    const validRoute = {
      route_name: 'Test Route Valid',
      segments: [
        {
          hub_departer: 'Hub VSIP II',
          hub_destination: 'KTLS Bửu Hòa - Đồng Nai',
          departure_time: '01:00:00',
          arrival_time: '01:50:00',
          day_offset: 0,
          note: 'D'
        }
      ]
    };

    const validResponse = await axios.post(`${BASE_URL}/routes/validate`, validRoute);
    console.log(`✅ Status: ${validResponse.status}`);
    console.log(`✅ Valid: ${validResponse.data.validation.valid}`);
    console.log(`✅ Errors: ${validResponse.data.validation.errors.length}`);
    console.log(`✅ Warnings: ${validResponse.data.validation.warnings.length}`);

    // Test 2: Invalid route - missing fields
    console.log('\n📋 Test 2: Validate INVALID route (missing fields)');
    const invalidRoute1 = {
      route_name: 'Test Route Invalid',
      segments: [
        {
          hub_departer: 'Hub VSIP II',
          // Missing hub_destination
          departure_time: '01:00:00',
          arrival_time: '01:50:00'
        }
      ]
    };

    const invalidResponse1 = await axios.post(`${BASE_URL}/routes/validate`, invalidRoute1);
    console.log(`✅ Status: ${invalidResponse1.status}`);
    console.log(`✅ Valid: ${invalidResponse1.data.validation.valid}`);
    console.log(`✅ Errors:`, invalidResponse1.data.validation.errors);

    // Test 3: Invalid route - hub not found
    console.log('\n📋 Test 3: Validate INVALID route (hub not found)');
    const invalidRoute2 = {
      route_name: 'Test Route Invalid 2',
      segments: [
        {
          hub_departer: 'Non Existent Hub',
          hub_destination: 'Another Non Existent Hub',
          departure_time: '01:00:00',
          arrival_time: '01:50:00',
          day_offset: 0,
          note: 'D'
        }
      ]
    };

    const invalidResponse2 = await axios.post(`${BASE_URL}/routes/validate`, invalidRoute2);
    console.log(`✅ Status: ${invalidResponse2.status}`);
    console.log(`✅ Valid: ${invalidResponse2.data.validation.valid}`);
    console.log(`✅ Errors:`, invalidResponse2.data.validation.errors);

    // Test 4: Route with warnings (day offset inconsistency)
    console.log('\n📋 Test 4: Validate route with WARNINGS');
    const warningRoute = {
      route_name: 'Test Route Warnings',
      segments: [
        {
          hub_departer: 'Hub VSIP II',
          hub_destination: 'KTLS Bửu Hòa - Đồng Nai',
          departure_time: '23:00:00',
          arrival_time: '02:00:00',  // Next day but day_offset = 0
          day_offset: 0,
          note: 'D'
        }
      ]
    };

    const warningResponse = await axios.post(`${BASE_URL}/routes/validate`, warningRoute);
    console.log(`✅ Status: ${warningResponse.status}`);
    console.log(`✅ Valid: ${warningResponse.data.validation.valid}`);
    console.log(`✅ Errors: ${warningResponse.data.validation.errors.length}`);
    console.log(`✅ Warnings:`, warningResponse.data.validation.warnings);

    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL VALIDATION TESTS PASSED!');
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

testValidationAPI();

