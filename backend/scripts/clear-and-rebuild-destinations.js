/**
 * Clear ALL Destinations and Rebuild from new_marker.json
 * 
 * This script:
 * 1. DELETES ALL existing destinations
 * 2. Reads new_marker.json
 * 3. Imports all destinations with fresh data
 * 4. Removes duplicates based on carrier_name
 * 
 * ⚠️ WARNING: This will DELETE ALL destinations!
 * 
 * Usage: node backend/scripts/clear-and-rebuild-destinations.js
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
  console.log('='.repeat(70));
  console.log('🗑️  CLEAR ALL DESTINATIONS & REBUILD FROM new_marker.json');
  console.log('='.repeat(70));

  try {
    // Step 1: Count existing destinations
    console.log('\n📊 Checking existing destinations...');
    const { data: existing, error: countError } = await supabase
      .from('destinations')
      .select('id, carrier_name');

    if (countError) {
      throw new Error(`Error counting destinations: ${countError.message}`);
    }

    console.log(`⚠️  Found ${existing.length} existing destinations`);
    
    // Step 2: Confirm deletion
    if (existing.length > 0) {
      console.log('\n⚠️  WARNING: This will DELETE ALL destinations!');
      console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...');
      
      // Wait 5 seconds
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      console.log('\n🗑️  Deleting ALL destinations...');
      const { error: deleteError } = await supabase
        .from('destinations')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (dummy condition)

      if (deleteError) {
        throw new Error(`Error deleting destinations: ${deleteError.message}`);
      }

      console.log(`✅ Deleted ${existing.length} destinations`);
    }

    // Step 3: Read JSON file
    console.log('\n📖 Reading new_marker.json...');
    const jsonPath = path.join(__dirname, '../../database/new_marker.json');
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`✅ Found ${jsonData.length} markers in file`);

    // Step 4: Get departers for mapping
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
      if (d.address) {
        departerMap.set(d.address.toLowerCase(), d.id);
      }
    });

    // Step 5: Process markers
    console.log('\n🔧 Processing markers...');
    
    const toInsert = [];
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
        console.log(`⚠️  Duplicate in JSON (skipping): ${carrierName}`);
        skipped.push({ reason: 'Duplicate', data: marker });
        continue;
      }
      duplicates.set(lowerName, true);

      // Parse coordinates
      let lat = null;
      let lng = null;

      // Try _latitude/_longitude first
      if (marker._latitude && marker._longitude) {
        lat = parseFloat(marker._latitude);
        lng = parseFloat(marker._longitude);
      }
      // Try latitude/longitude
      else if (marker.latitude && marker.longitude) {
        lat = parseFloat(marker.latitude);
        lng = parseFloat(marker.longitude);
      }
      // Try tọa độ field
      else if (marker['tọa độ']) {
        const coords = marker['tọa độ'].split(',');
        if (coords.length === 2) {
          lat = parseFloat(coords[0].trim());
          lng = parseFloat(coords[1].trim());
        }
      }

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
          // Try fuzzy match
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
        address: marker.address || marker['địa chỉ'] || '',
        province_name: marker.province_name || marker['tỉnh/thành phố'] || '',
        district_name: marker.district_name || marker['quận/huyện'] || '',
        ward_name: marker.ward_name || marker['phường/xã'] || '',
        lat: lat,  // Database uses 'lat', not 'latitude'
        lng: lng,  // Database uses 'lng', not 'longitude'
        departer_id: departerId,
        is_active: true
      };

      toInsert.push(destination);
    }

    console.log(`\n📊 Processing Summary:`);
    console.log(`   To Insert: ${toInsert.length}`);
    console.log(`   Skipped: ${skipped.length}`);

    // Step 6: Insert new destinations
    if (toInsert.length > 0) {
      console.log(`\n➕ Inserting ${toInsert.length} destinations...`);
      
      // Insert in batches of 100
      const batchSize = 100;
      let inserted = 0;
      let errors = 0;
      
      for (let i = 0; i < toInsert.length; i += batchSize) {
        const batch = toInsert.slice(i, i + batchSize);
        const { error: insertError } = await supabase
          .from('destinations')
          .insert(batch);

        if (insertError) {
          console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, insertError.message);
          errors++;
        } else {
          inserted += batch.length;
          console.log(`   ✅ Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(toInsert.length / batchSize)}: ${batch.length} destinations`);
        }
      }
      
      console.log(`\n✅ Total inserted: ${inserted}`);
      if (errors > 0) {
        console.log(`⚠️  Errors: ${errors} batches failed`);
      }
    }

    // Step 7: Final verification
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

    console.log('='.repeat(70));
    console.log('✅ REBUILD COMPLETE');
    console.log('='.repeat(70));
    console.log(`📊 Total destinations in database: ${finalDestinations.length}`);
    console.log(`   Inserted: ${toInsert.length}`);
    console.log(`   Skipped: ${skipped.length}`);
    
    if (finalDuplicates.length > 0) {
      console.log(`\n⚠️  WARNING: Found ${finalDuplicates.length} duplicates in final result:`);
      finalDuplicates.forEach(name => console.log(`   - ${name}`));
    } else {
      console.log(`\n✅ No duplicates found!`);
    }

    if (skipped.length > 0) {
      console.log(`\n⚠️  Skipped ${skipped.length} markers:`);
      const skipReasons = {};
      skipped.forEach(s => {
        skipReasons[s.reason] = (skipReasons[s.reason] || 0) + 1;
      });
      Object.entries(skipReasons).forEach(([reason, count]) => {
        console.log(`   - ${reason}: ${count}`);
      });
      
      console.log(`\n   First 5 skipped:`);
      skipped.slice(0, 5).forEach(s => {
        console.log(`   - ${s.reason}: ${s.data.carrier_name || 'Unknown'}`);
      });
    }

    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

main();

