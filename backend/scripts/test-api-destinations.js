const supabaseService = require('../services/supabase.service');
require('dotenv').config();

console.log('\n🧪 TEST API: GET DESTINATIONS WITH ROUTES\n');
console.log('═'.repeat(70));

async function testAPI() {
  try {
    console.log('\n📊 Fetching destinations with route data...\n');
    
    const result = await supabaseService.getDestinations(true);
    
    if (!result.success) {
      throw new Error('Failed to fetch destinations: ' + result.error);
    }

    const destinations = result.data;
    console.log(`✅ Loaded ${destinations.length} destinations\n`);

    // Show first 5 destinations with route data
    console.log('📋 Sample destinations with route data:\n');
    
    destinations.slice(0, 5).forEach((dest, i) => {
      console.log(`${i + 1}. ${dest.carrier_name}`);
      console.log(`   📍 Address: ${dest.address}`);
      console.log(`   🏠 Departer: ${dest.departers?.name || 'N/A'}`);
      
      if (dest.distance_km && dest.duration_minutes) {
        console.log(`   ✅ Distance: ${dest.distance_km} km`);
        console.log(`   ✅ Duration: ${dest.duration_minutes} minutes`);
      } else {
        console.log(`   ❌ No route data`);
      }
      console.log('');
    });

    // Count destinations with route data
    const withRoutes = destinations.filter(d => d.distance_km && d.duration_minutes).length;
    const withoutRoutes = destinations.length - withRoutes;

    console.log('═'.repeat(70));
    console.log('📊 SUMMARY:');
    console.log('═'.repeat(70));
    console.log(`   Total destinations: ${destinations.length}`);
    console.log(`   ✅ With route data: ${withRoutes}`);
    console.log(`   ❌ Without route data: ${withoutRoutes}`);
    
    if (withRoutes === destinations.length) {
      console.log('\n🎉 ALL DESTINATIONS HAVE ROUTE DATA!\n');
      console.log('✅ Popup will show distance and duration for all markers!\n');
    } else {
      console.log('\n⚠️  Some destinations are missing route data.\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testAPI();

