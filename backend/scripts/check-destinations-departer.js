const supabaseService = require('../services/supabase.service');
require('dotenv').config();

console.log('\n🔍 CHECK DESTINATIONS DEPARTER_ID\n');
console.log('═'.repeat(70));

async function checkDestinations() {
  try {
    // Get all departers
    console.log('\n📊 Loading departers...');
    const departersResult = await supabaseService.getDeparters(false);
    
    if (!departersResult.success) {
      throw new Error('Failed to load departers: ' + departersResult.error);
    }

    const departers = departersResult.data;
    console.log(`   ✅ Loaded ${departers.length} departers\n`);

    departers.forEach((d, i) => {
      console.log(`   ${i + 1}. ${d.name} (ID: ${d.id})`);
    });

    // Get all destinations (without activeOnly filter)
    console.log('\n📊 Loading destinations...');
    const destinationsResult = await supabaseService.getDestinations(false);
    
    if (!destinationsResult.success) {
      throw new Error('Failed to load destinations: ' + destinationsResult.error);
    }

    const destinations = destinationsResult.data;
    console.log(`   ✅ Loaded ${destinations.length} destinations\n`);

    // Check departer_id
    console.log('📊 Checking departer_id...\n');
    
    let withDeparter = 0;
    let withoutDeparter = 0;

    destinations.forEach((dest, i) => {
      if (dest.departer_id) {
        withDeparter++;
        console.log(`   ✅ ${i + 1}. ${dest.carrier_name} → Departer: ${dest.departer_id}`);
      } else {
        withoutDeparter++;
        console.log(`   ❌ ${i + 1}. ${dest.carrier_name} → NO DEPARTER`);
      }
    });

    console.log('\n' + '═'.repeat(70));
    console.log('📊 SUMMARY:');
    console.log('═'.repeat(70));
    console.log(`   Total destinations: ${destinations.length}`);
    console.log(`   ✅ With departer_id: ${withDeparter}`);
    console.log(`   ❌ Without departer_id: ${withoutDeparter}`);
    
    if (withoutDeparter > 0) {
      console.log('\n⚠️  WARNING: Some destinations are not assigned to any departer!');
      console.log('   You need to assign them to a departer first.\n');
    } else {
      console.log('\n✅ All destinations are assigned to departers!\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

checkDestinations();

