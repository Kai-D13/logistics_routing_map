/**
 * Rebuild Destinations from new_marker.json
 * 
 * This script:
 * 1. Reads new_marker.json
 * 2. Clears existing destinations (keeps departers)
 * 3. Imports all destinations with updated coordinates
 * 4. Removes duplicates based on carrier_name
 * 
 * Usage: node backend/scripts/rebuild-from-new-markers.js
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

async function main() {
  console.log('='.repeat(60));
  console.log('🔄 REBUILD DESTINATIONS FROM NEW_MARKER.JSON');
  console.log('='.repeat(60));

  try {
    // Step 1: Read JSON file
    console.log('\n📖 Reading new_marker.json...');
    const jsonPath = path.join(__dirname, '../../database/new_marker.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`✅ Found ${jsonData.length} markers in file`);

    // Step 2: Get departers for mapping
    console.log('\n📊 Fetching departers from database...');
    const { data: departers, error: departersError } = await supabase
      .from('departers')
      .select('*');

    if (departersError) {
      throw new Error(`Error fetching departers: ${departersError.message}`);
    }
    console.log(`✅ Found ${departers.length} departers`);

    // Create departer mapping by address/name
    const departerMap = new Map();
    departers.forEach(d => {
      departerMap.set(d.name.toLowerCase(), d.id);
      departerMap.set(d.address.toLowerCase(), d.id);
    });

    // Step 3: Get existing destinations to check for duplicates
    console.log('\n🔍 Checking for existing destinations...');
    const { data: existing, error: existingError } = await supabase
      .from('destinations')
      .select('carrier_name, id');

    if (existingError) {
      throw new Error(`Error fetching existing destinations: ${existingError.message}`);
    }

    const existingNames = new Set(existing.map(d => d.carrier_name.toLowerCase().trim()));
    console.log(`✅ Found ${existing.length} existing destinations`);

    // Step 4: Process markers
    console.log('\n🔧 Processing markers...');
    
    const toInsert = [];
    const toUpdate = [];
    const skipped = [];
    const duplicates = new Map(); // Track duplicates in JSON

    for (const marker of jsonData) {
      const carrierName = marker.carrier_name?.trim();
      
      if (!carrierName) {
        skipped.push({ reason: 'No carrier_name', data: marker });
        continue;
      }

      // Check for duplicates in JSON file itself
      const lowerName = carrierName.toLowerCase();
      if (duplicates.has(lowerName)) {
        console.log(`⚠️  Duplicate in JSON: ${carrierName}`);
        continue;
      }
      duplicates.set(lowerName, true);

      // Parse coordinates
      const lat = marker._latitude || (marker['tọa độ'] ? parseFloat(marker['tọa độ'].split(',')[0]) : null);
      const lng = marker._longitude || (marker['tọa độ'] ? parseFloat(marker['tọa độ'].split(',')[1]) : null);

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
        skipped.push({ reason: 'Invalid coordinates', data: marker });
        continue;
      }

      // Find departer_id
      let departerId = null;
      if (marker.departer) {
        const departerKey = marker.departer.toLowerCase();
        departerId = departerMap.get(departerKey);
        
        if (!departerId) {
          // Try fuzzy match by checking if any departer name/address contains the key
          for (const [key, id] of departerMap.entries()) {
            if (key.includes(departerKey) || departerKey.includes(key)) {
              departerId = id;
              break;
            }
          }
        }
      }

      // Default to first departer if not found
      if (!departerId && departers.length > 0) {
        departerId = departers[0].id;
      }

      // Prepare destination object
      const destination = {
        carrier_name: carrierName,
        address: marker.address || '',
        province_name: marker.province_name || '',
        district_name: marker.district_name || '',
        ward_name: marker.ward_name || '',
        latitude: lat,
        longitude: lng,
        departer_id: departerId,
        is_active: true
      };

      // Check if exists
      if (existingNames.has(lowerName)) {
        // Update existing
        const existingDest = existing.find(d => d.carrier_name.toLowerCase().trim() === lowerName);
        toUpdate.push({ id: existingDest.id, ...destination });
      } else {
        // Insert new
        toInsert.push(destination);
      }
    }

    console.log(`\n📊 Processing Summary:`);
    console.log(`   To Insert: ${toInsert.length}`);
    console.log(`   To Update: ${toUpdate.length}`);
    console.log(`   Skipped: ${skipped.length}`);

    // Step 5: Delete old destinations not in new file
    console.log('\n🗑️  Removing destinations not in new file...');
    const newNames = new Set([...toInsert, ...toUpdate].map(d => d.carrier_name.toLowerCase()));
    const toDelete = existing.filter(d => !newNames.has(d.carrier_name.toLowerCase().trim()));
    
    if (toDelete.length > 0) {
      console.log(`   Found ${toDelete.length} destinations to remove`);
      const deleteIds = toDelete.map(d => d.id);
      
      const { error: deleteError } = await supabase
        .from('destinations')
        .delete()
        .in('id', deleteIds);

      if (deleteError) {
        console.warn(`⚠️  Error deleting: ${deleteError.message}`);
      } else {
        console.log(`✅ Deleted ${toDelete.length} old destinations`);
      }
    }

    // Step 6: Insert new destinations
    if (toInsert.length > 0) {
      console.log(`\n➕ Inserting ${toInsert.length} new destinations...`);
      
      // Insert in batches of 100
      const batchSize = 100;
      let inserted = 0;
      
      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('destinations')
          .insert(batch);

        if (insertError) {
          console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, insertError.message);
        } else {
          inserted += batch.length;
          console.log(`   ✅ Inserted batch ${i / batchSize + 1}: ${batch.length} destinations`);
        }
      }
      
      console.log(`✅ Total inserted: ${inserted}`);
    }

    // Step 7: Update existing destinations
    if (toUpdate.length > 0) {
      console.log(`\n🔄 Updating ${toUpdate.length} existing destinations...`);
      
      let updated = 0;
      for (const dest of toUpdate) {
        const { id, ...updates } = dest;
        const { error: updateError } = await supabase
          .from('destinations')
          .update(updates)
          .eq('id', id);

        if (updateError) {
          console.error(`❌ Error updating ${dest.carrier_name}:`, updateError.message);
        } else {
          updated++;
          if (updated % 50 === 0) {
            console.log(`   ✅ Updated ${updated}/${toUpdate.length}`);
          }
        }
      }
      
      console.log(`✅ Total updated: ${updated}`);
    }

    // Step 8: Final verification
    console.log('\n🔍 Verifying results...');
    const { data: finalDestinations, error: finalError } = await supabase
      .from('destinations')
      .select('carrier_name')
      .order('carrier_name');

    if (finalError) {
      throw new Error(`Error verifying: ${finalError.message}`);
    }

    // Check for duplicates in final result
    const finalNames = finalDestinations.map(d => d.carrier_name);
    const duplicateCheck = new Set();
    const finalDuplicates = [];
    
    for (const name of finalNames) {
      const lower = name.toLowerCase().trim();
      if (duplicateCheck.has(lower)) {
        finalDuplicates.push(name);
      } else {
        duplicateCheck.add(lower);
      }
    }

    console.log('='.repeat(60));
    console.log('✅ REBUILD COMPLETE');
    console.log('='.repeat(60));
    console.log(`📊 Total destinations in database: ${finalDestinations.length}`);
    console.log(`   Inserted: ${toInsert.length}`);
    console.log(`   Updated: ${toUpdate.length}`);
    console.log(`   Deleted: ${toDelete.length}`);
    console.log(`   Skipped: ${skipped.length}`);
    
    if (finalDuplicates.length > 0) {
      console.log(`\n⚠️  WARNING: Found ${finalDuplicates.length} duplicates in final result:`);
      finalDuplicates.forEach(name => console.log(`   - ${name}`));
    } else {
      console.log(`\n✅ No duplicates found!`);
    }

    if (skipped.length > 0) {
      console.log(`\n⚠️  Skipped ${skipped.length} markers:`);
      skipped.slice(0, 10).forEach(s => {
        console.log(`   - ${s.reason}: ${s.data.carrier_name || 'Unknown'}`);
      });
      if (skipped.length > 10) {
        console.log(`   ... and ${skipped.length - 10} more`);
      }
    }

    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

main();
