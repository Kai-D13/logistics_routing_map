const fs = require('fs');
const path = require('path');
const supabaseService = require('../services/supabase.service');

/**
 * Script to import trips from CSV file
 */

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const headers = lines[0].split(',');
  
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    
    const values = lines[i].split(',');
    const row = {};
    
    headers.forEach((header, index) => {
      row[header.trim()] = values[index] ? values[index].trim() : null;
    });
    
    data.push(row);
  }
  
  return data;
}

function parseDateTime(dateStr) {
  if (!dateStr || dateStr === 'null') return null;
  
  try {
    // Format: "10/10/2025 7:37:32 AM"
    const [datePart, timePart, period] = dateStr.split(' ');
    const [month, day, year] = datePart.split('/');
    let [hours, minutes, seconds] = timePart.split(':');
    
    hours = parseInt(hours);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return new Date(year, month - 1, day, hours, minutes, seconds).toISOString();
  } catch (error) {
    return null;
  }
}

async function importTrips() {
  console.log('📥 Starting CSV import process...\n');

  try {
    // Step 1: Parse CSV
    console.log('📂 Step 1: Parsing CSV file...');
    const csvPath = path.join(__dirname, '../../departer_destination.csv');
    const csvData = parseCSV(csvPath);
    console.log(`   Found ${csvData.length} records in CSV\n`);

    // Step 2: Group by trip_code
    console.log('🔄 Step 2: Grouping by trip_code...');
    const tripGroups = {};
    
    csvData.forEach(row => {
      const tripCode = row.trip_code;
      if (!tripGroups[tripCode]) {
        tripGroups[tripCode] = [];
      }
      tripGroups[tripCode].push(row);
    });
    
    console.log(`   Found ${Object.keys(tripGroups).length} unique trips\n`);

    // Step 3: Get all destinations
    console.log('📍 Step 3: Fetching destinations from database...');
    const destinationsResult = await supabaseService.getDestinations(false);
    if (!destinationsResult.success) {
      throw new Error('Failed to fetch destinations');
    }
    
    const destinations = destinationsResult.data;
    console.log(`   Found ${destinations.length} destinations in database\n`);

    // Create carrier_name to ID map
    const carrierNameMap = {};
    destinations.forEach(dest => {
      carrierNameMap[dest.carrier_name] = dest.id;
    });

    // Step 4: Import trips
    console.log('💾 Step 4: Importing trips...\n');
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const [tripCode, records] of Object.entries(tripGroups)) {
      try {
        // Get first record for trip info
        const firstRecord = records[0];
        
        // Sort records by delivered_at to determine stop order
        const sortedRecords = records.sort((a, b) => {
          const timeA = parseDateTime(a.delivered_at);
          const timeB = parseDateTime(b.delivered_at);
          if (!timeA) return 1;
          if (!timeB) return -1;
          return new Date(timeA) - new Date(timeB);
        });

        // Create trip
        const tripData = {
          code: firstRecord.code,
          trip_code: tripCode,
          route_name: firstRecord.route_name,
          status: firstRecord.status || 'COMPLETED',
          created_at: parseDateTime(firstRecord.created_at),
          done_handover_at: parseDateTime(firstRecord.done_handover_at),
          completed_at: parseDateTime(firstRecord.completed_at),
          driver_name: firstRecord.driver_name,
          handover_employee: firstRecord.handover_employee,
          license_plate: firstRecord.license_plate
        };

        const tripResult = await supabaseService.createTrip(tripData);
        
        if (!tripResult.success) {
          console.log(`   ❌ Failed to create trip ${tripCode}: ${tripResult.error}`);
          errorCount++;
          continue;
        }

        const tripId = tripResult.data.id;

        // Add destinations to trip
        let stopOrder = 1;
        let addedDestinations = 0;

        for (const record of sortedRecords) {
          const destinationId = carrierNameMap[record.carrier_name];
          
          if (!destinationId) {
            console.log(`   ⚠️  Destination not found: ${record.carrier_name}`);
            continue;
          }

          const tripDestData = {
            trip_id: tripId,
            destination_id: destinationId,
            stop_order: stopOrder++,
            delivered_at: parseDateTime(record.delivered_at),
            num_orders: parseInt(record.num_orders) || 0,
            num_packages: parseInt(record.num_packages) || 0,
            num_bins: parseInt(record.num_bins) || 0,
            delivery_image: record.delivery_image,
            pick_up_image: record.pick_up_image
          };

          const destResult = await supabaseService.addTripDestination(tripDestData);
          
          if (destResult.success) {
            addedDestinations++;
          }
        }

        console.log(`   ✅ Trip ${tripCode}: ${addedDestinations} destinations`);
        successCount++;

      } catch (error) {
        console.log(`   ❌ Error processing trip ${tripCode}: ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 IMPORT SUMMARY:');
    console.log('='.repeat(60));
    console.log(`✅ Successfully imported: ${successCount} trips`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log('='.repeat(60));

    console.log('\n🎉 Import process completed!\n');

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
importTrips()
  .then(() => {
    console.log('✅ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

