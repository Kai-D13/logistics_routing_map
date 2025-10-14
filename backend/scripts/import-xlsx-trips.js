const XLSX = require('xlsx');
const path = require('path');
const supabaseService = require('../services/supabase.service');

/**
 * Script to import trips from XLSX file
 */

function parseDateTime(dateValue) {
  if (!dateValue) return null;
  
  try {
    // If it's already a Date object
    if (dateValue instanceof Date) {
      return dateValue.toISOString();
    }
    
    // If it's an Excel serial date number
    if (typeof dateValue === 'number') {
      // Excel date serial number (days since 1900-01-01)
      const excelEpoch = new Date(1900, 0, 1);
      const days = Math.floor(dateValue);
      const milliseconds = Math.round((dateValue - days) * 86400000);
      const date = new Date(excelEpoch.getTime() + (days - 2) * 86400000 + milliseconds);
      return date.toISOString();
    }
    
    // If it's a string, try to parse it
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error parsing date:', dateValue, error.message);
    return null;
  }
}

async function importFromXLSX() {
  console.log('📥 Starting XLSX import process...\n');

  try {
    // Step 1: Read XLSX file
    console.log('📂 Step 1: Reading XLSX file...');
    const xlsxPath = path.join(__dirname, '../../departer_destination.xlsx');
    const workbook = XLSX.readFile(xlsxPath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(`   Found ${data.length} records in XLSX\n`);

    // Display first record to verify structure
    if (data.length > 0) {
      console.log('📋 Sample record (first row):');
      console.log(JSON.stringify(data[0], null, 2));
      console.log('');
    }

    // Step 2: Clean old data
    console.log('🗑️  Step 2: Cleaning old trips data...');
    const { data: oldTrips } = await supabaseService.getTrips();
    if (oldTrips && oldTrips.length > 0) {
      console.log(`   Found ${oldTrips.length} old trips. Deleting...`);
      // Note: Deleting trips will cascade delete trip_destinations
      for (const trip of oldTrips) {
        await supabaseService.deleteTrip(trip.id);
      }
      console.log(`   ✅ Deleted ${oldTrips.length} old trips\n`);
    } else {
      console.log(`   No old trips to delete\n`);
    }

    // Step 3: Group by trip_code
    console.log('🔄 Step 3: Grouping by trip_code...');
    const tripGroups = {};
    
    data.forEach(row => {
      const tripCode = row.trip_code || row.TRIP_CODE || row['trip code'];
      if (!tripCode) {
        console.log('   ⚠️  Row without trip_code:', row);
        return;
      }
      
      if (!tripGroups[tripCode]) {
        tripGroups[tripCode] = [];
      }
      tripGroups[tripCode].push(row);
    });
    
    console.log(`   Found ${Object.keys(tripGroups).length} unique trips\n`);

    // Step 4: Get all destinations
    console.log('📍 Step 4: Fetching destinations from database...');
    const destinationsResult = await supabaseService.getDestinations(false);
    if (!destinationsResult.success) {
      throw new Error('Failed to fetch destinations');
    }
    
    const destinations = destinationsResult.data;
    console.log(`   Found ${destinations.length} destinations in database\n`);

    // Create carrier_name to ID map
    const carrierNameMap = {};
    destinations.forEach(dest => {
      carrierNameMap[dest.carrier_name.trim()] = dest.id;
    });

    // Step 5: Import trips
    console.log('💾 Step 5: Importing trips...\n');
    let successCount = 0;
    let errorCount = 0;
    let totalDestinations = 0;

    for (const [tripCode, records] of Object.entries(tripGroups)) {
      try {
        // Get first record for trip info
        const firstRecord = records[0];
        
        // Sort records by delivered_at to determine stop order
        const sortedRecords = records.sort((a, b) => {
          const timeA = parseDateTime(a.delivered_at || a.DELIVERED_AT || a['delivered at']);
          const timeB = parseDateTime(b.delivered_at || b.DELIVERED_AT || b['delivered at']);
          if (!timeA) return 1;
          if (!timeB) return -1;
          return new Date(timeA) - new Date(timeB);
        });

        // Create trip
        const tripData = {
          code: firstRecord.code || firstRecord.CODE || firstRecord.Code,
          trip_code: tripCode,
          route_name: firstRecord.route_name || firstRecord.ROUTE_NAME || firstRecord['route name'],
          status: firstRecord.status || firstRecord.STATUS || 'COMPLETED',
          created_at: parseDateTime(firstRecord.created_at || firstRecord.CREATED_AT || firstRecord['created at']),
          done_handover_at: parseDateTime(firstRecord.done_handover_at || firstRecord.DONE_HANDOVER_AT || firstRecord['done handover at']),
          completed_at: parseDateTime(firstRecord.completed_at || firstRecord.COMPLETED_AT || firstRecord['completed at']),
          driver_name: firstRecord.driver_name || firstRecord.DRIVER_NAME || firstRecord['driver name'],
          handover_employee: firstRecord.handover_employee || firstRecord.HANDOVER_EMPLOYEE || firstRecord['handover employee'],
          license_plate: firstRecord.license_plate || firstRecord.LICENSE_PLATE || firstRecord['license plate']
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
          const carrierName = (record.carrier_name || record.CARRIER_NAME || record['carrier name'] || '').trim();
          const destinationId = carrierNameMap[carrierName];
          
          if (!destinationId) {
            console.log(`   ⚠️  Destination not found: "${carrierName}"`);
            continue;
          }

          const tripDestData = {
            trip_id: tripId,
            destination_id: destinationId,
            stop_order: stopOrder++,
            delivered_at: parseDateTime(record.delivered_at || record.DELIVERED_AT || record['delivered at']),
            num_orders: parseInt(record.num_orders || record.NUM_ORDERS || record['num orders'] || 0),
            num_packages: parseInt(record.num_packages || record.NUM_PACKAGES || record['num packages'] || 0),
            num_bins: parseInt(record.num_bins || record.NUM_BINS || record['num bins'] || 0),
            delivery_image: record.delivery_image || record.DELIVERY_IMAGE || record['delivery image'],
            pick_up_image: record.pick_up_image || record.PICK_UP_IMAGE || record['pick up image']
          };

          const destResult = await supabaseService.addTripDestination(tripDestData);
          
          if (destResult.success) {
            addedDestinations++;
            totalDestinations++;
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
    console.log(`📍 Total destinations added: ${totalDestinations}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log('='.repeat(60));

    console.log('\n🎉 Import process completed!\n');

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the script
importFromXLSX()
  .then(() => {
    console.log('✅ Script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

