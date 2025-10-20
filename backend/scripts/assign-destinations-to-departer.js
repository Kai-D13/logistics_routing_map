const supabaseService = require('../services/supabase.service');
require('dotenv').config();

console.log('\n🔗 ASSIGN ALL DESTINATIONS TO MAIN DEPARTER\n');
console.log('═'.repeat(70));

async function assignDestinations() {
  try {
    // Step 1: Get main departer
    console.log('\n📊 STEP 1: Loading main departer...');
    const departersResult = await supabaseService.getDeparters(true);
    
    if (!departersResult.success || departersResult.data.length === 0) {
      throw new Error('No departer found!');
    }

    const mainDeparter = departersResult.data[0];
    console.log(`   ✅ Main departer: ${mainDeparter.name}`);
    console.log(`   📍 ID: ${mainDeparter.id}\n`);

    // Step 2: Get all destinations without departer_id
    console.log('📊 STEP 2: Loading destinations...');
    const destinationsResult = await supabaseService.getDestinations(false);
    
    if (!destinationsResult.success) {
      throw new Error('Failed to load destinations: ' + destinationsResult.error);
    }

    const allDestinations = destinationsResult.data;
    const destinationsWithoutDeparter = allDestinations.filter(d => !d.departer_id);
    
    console.log(`   ✅ Total destinations: ${allDestinations.length}`);
    console.log(`   ⚠️  Without departer_id: ${destinationsWithoutDeparter.length}\n`);

    if (destinationsWithoutDeparter.length === 0) {
      console.log('✅ All destinations already have departer_id!\n');
      return;
    }

    // Step 3: Assign departer_id to all destinations
    console.log('📊 STEP 3: Assigning departer_id...\n');

    let successCount = 0;
    let errorCount = 0;

    for (const destination of destinationsWithoutDeparter) {
      console.log(`   ${successCount + errorCount + 1}. ${destination.carrier_name}`);

      const updateResult = await supabaseService.updateDestination(destination.id, {
        departer_id: mainDeparter.id
      });

      if (updateResult.success) {
        console.log(`      ✅ Assigned to ${mainDeparter.name}`);
        successCount++;
      } else {
        console.log(`      ❌ Failed: ${updateResult.error}`);
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(70));
    console.log('✅ ASSIGNMENT COMPLETE!');
    console.log('═'.repeat(70));
    console.log(`\n📊 Summary:`);
    console.log(`   Total processed: ${destinationsWithoutDeparter.length}`);
    console.log(`   ✅ Successfully assigned: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log(`\n🎉 All destinations are now assigned to "${mainDeparter.name}"!\n`);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error(error);
    process.exit(1);
  }
}

assignDestinations();

