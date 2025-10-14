const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
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

const GOONG_API_KEY = process.env.GOONG_API_KEY;
const EXCEL_FILE = 'C:\\Users\\user\\logistics-routing-system\\departer_destination.xlsx';

// Rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Parse Excel datetime to JavaScript Date
 * FIXED: Use correct Excel epoch (1899-12-30) instead of Unix epoch conversion
 */
function parseExcelDate(excelDate) {
  if (!excelDate) return null;

  // If already a Date object
  if (excelDate instanceof Date) return excelDate;

  // If Excel serial number
  if (typeof excelDate === 'number') {
    // Excel epoch: December 30, 1899
    const excelEpoch = new Date(1899, 11, 30);
    const msPerDay = 86400000;
    const date = new Date(excelEpoch.getTime() + excelDate * msPerDay);
    return date;
  }

  // If string format "M/D/YYYY H:MM"
  if (typeof excelDate === 'string') {
    const parsed = new Date(excelDate);
    if (!isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

/**
 * Calculate duration in minutes between two dates
 */
function calculateDuration(date1, date2) {
  if (!date1 || !date2) return null;
  const diff = date2.getTime() - date1.getTime();
  return Math.round(diff / 60000); // Convert to minutes
}

/**
 * Get median (middle value) from array of time strings
 * More robust than mode/average for handling outliers
 */
function getMedian(arr) {
  if (!arr || arr.length === 0) return null;

  // Filter out null/undefined values
  const validTimes = arr.filter(v => v);
  if (validTimes.length === 0) return null;

  // Convert time strings to minutes since midnight for sorting
  const timeInMinutes = validTimes.map(timeStr => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;

    // Handle times after midnight (00:00 - 02:00) as next day
    // Treat 00:00-02:00 as 24:00-26:00 for proper sorting with 23:00-23:59
    if (hours >= 0 && hours < 3) {
      totalMinutes += 24 * 60;
    }

    return { original: timeStr, minutes: totalMinutes };
  });

  // Sort by minutes
  timeInMinutes.sort((a, b) => a.minutes - b.minutes);

  // Get median
  const mid = Math.floor(timeInMinutes.length / 2);

  if (timeInMinutes.length % 2 === 0) {
    // Even number: average of two middle values
    const avg = Math.round((timeInMinutes[mid - 1].minutes + timeInMinutes[mid].minutes) / 2);
    // Convert back to time string
    let hours = Math.floor(avg / 60) % 24;
    const minutes = avg % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
  } else {
    // Odd number: middle value
    return timeInMinutes[mid].original + ':00';
  }
}

/**
 * Calculate average, ignoring null values
 */
function calculateAverage(arr) {
  const validValues = arr.filter(v => v !== null && v !== undefined && !isNaN(v));
  if (validValues.length === 0) return 0;
  return Math.round(validValues.reduce((a, b) => a + b, 0) / validValues.length);
}

/**
 * Get distance between two locations using Goong API
 */
async function getDistance(fromLat, fromLng, toLat, toLng) {
  try {
    const url = `https://rsapi.goong.io/DistanceMatrix?origins=${fromLat},${fromLng}&destinations=${toLat},${toLng}&vehicle=car&api_key=${GOONG_API_KEY}`;
    
    const response = await axios.get(url);
    
    if (response.data.rows && response.data.rows[0].elements[0].status === 'OK') {
      const distanceMeters = response.data.rows[0].elements[0].distance.value;
      return (distanceMeters / 1000).toFixed(2); // Convert to km
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching distance:', error.message);
    return null;
  }
}

/**
 * Main analysis function
 */
async function analyzeRouteSegments() {
  console.log('📊 ANALYZING ROUTE SEGMENTS FROM EXCEL\n');
  console.log('=' .repeat(60));
  
  // Step 1: Read Excel file
  console.log('\n📖 Step 1: Reading Excel file...');
  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);
  
  console.log(`   ✅ Loaded ${data.length} rows\n`);
  
  // Step 2: Fetch departer and destinations from database
  console.log('📖 Step 2: Fetching locations from database...');
  
  const { data: departers } = await supabase
    .from('departers')
    .select('*');
  
  const { data: destinations } = await supabase
    .from('destinations')
    .select('*');
  
  console.log(`   ✅ Departers: ${departers?.length || 0}`);
  console.log(`   ✅ Destinations: ${destinations?.length || 0}\n`);
  
  // Create lookup maps
  const departerMap = {};
  departers?.forEach(d => {
    departerMap[d.name] = d;
  });
  
  const destinationMap = {};
  destinations?.forEach(d => {
    destinationMap[d.carrier_name] = d;
  });
  
  // Step 3: Group data by route_name and trip_code
  console.log('📖 Step 3: Grouping trips by route...');
  
  const tripsByRoute = {};
  
  data.forEach(row => {
    const routeName = row.route_name;
    const tripCode = row.trip_code;
    
    if (!routeName || !tripCode) return;
    
    if (!tripsByRoute[routeName]) {
      tripsByRoute[routeName] = {};
    }
    
    if (!tripsByRoute[routeName][tripCode]) {
      tripsByRoute[routeName][tripCode] = [];
    }
    
    tripsByRoute[routeName][tripCode].push({
      carrier_name: row.carrier_name,
      done_handover_at: parseExcelDate(row.done_handover_at),
      delivered_at: parseExcelDate(row.delivered_at),
      completed_at: parseExcelDate(row.completed_at),
      orders: row.orders || 0,
      packages: row.packages || 0,
      bins: row.bins || 0
    });
  });
  
  const routeCount = Object.keys(tripsByRoute).length;
  console.log(`   ✅ Found ${routeCount} unique routes\n`);
  
  // Step 4: Calculate segment metrics for each route
  console.log('📖 Step 4: Calculating segment metrics...\n');
  
  const routeSegments = [];
  
  for (const [routeName, trips] of Object.entries(tripsByRoute)) {
    console.log(`\n🔍 Processing: ${routeName}`);
    
    const tripCodes = Object.keys(trips);
    console.log(`   Trips: ${tripCodes.length}`);
    
    // Collect all segment durations across all trips
    const segmentDurations = {}; // { segmentOrder: [duration1, duration2, ...] }
    const segmentCargo = {}; // { segmentOrder: { orders: [], packages: [], bins: [] } }
    const startTimes = []; // For mode calculation
    
    // Process each trip
    tripCodes.forEach(tripCode => {
      const destinations = trips[tripCode];
      
      // Sort by delivered_at (or completed_at if delivered_at is null)
      destinations.sort((a, b) => {
        const timeA = a.delivered_at || a.completed_at;
        const timeB = b.delivered_at || b.completed_at;
        return timeA - timeB;
      });
      
      // Collect start time (done_handover_at of first destination)
      if (destinations[0]?.done_handover_at) {
        const time = destinations[0].done_handover_at;
        const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
        startTimes.push(timeStr);
      }
      
      // Calculate durations between segments
      for (let i = 0; i < destinations.length; i++) {
        const dest = destinations[i];
        
        let duration = null;
        
        if (i === 0) {
          // Segment 0: Hub Departer → Destination 1
          // Duration = delivered_at[0] - done_handover_at
          const deliveredAt = dest.delivered_at || dest.completed_at;
          duration = calculateDuration(dest.done_handover_at, deliveredAt);
        } else {
          // Segment N: Destination N-1 → Destination N
          // Duration = delivered_at[N] - delivered_at[N-1]
          const prevDest = destinations[i - 1];
          const prevDeliveredAt = prevDest.delivered_at || prevDest.completed_at;
          const currDeliveredAt = dest.delivered_at || dest.completed_at;
          duration = calculateDuration(prevDeliveredAt, currDeliveredAt);
        }
        
        if (duration !== null && duration > 0) {
          if (!segmentDurations[i]) segmentDurations[i] = [];
          segmentDurations[i].push(duration);
        }
        
        // Collect cargo data
        if (!segmentCargo[i]) {
          segmentCargo[i] = { orders: [], packages: [], bins: [] };
        }
        segmentCargo[i].orders.push(dest.orders || 0);
        segmentCargo[i].packages.push(dest.packages || 0);
        segmentCargo[i].bins.push(dest.bins || 0);
      }
    });
    
    // Calculate averages and create segments
    const segmentCount = Object.keys(segmentDurations).length;
    console.log(`   Segments: ${segmentCount}`);
    
    // Get departer (assume first departer)
    const departer = departers[0];
    
    for (let segmentOrder = 0; segmentOrder < segmentCount; segmentOrder++) {
      const durations = segmentDurations[segmentOrder] || [];
      const cargo = segmentCargo[segmentOrder];
      
      const avgDuration = calculateAverage(durations);
      const avgOrders = calculateAverage(cargo?.orders || []);
      const avgPackages = calculateAverage(cargo?.packages || []);
      const avgBins = calculateAverage(cargo?.bins || []);
      
      // Get location names
      let fromLocationName, toLocationName, fromLocationId, toLocationId;
      
      // Get a sample trip to extract destination names
      const sampleTrip = trips[tripCodes[0]];
      sampleTrip.sort((a, b) => {
        const timeA = a.delivered_at || a.completed_at;
        const timeB = b.delivered_at || b.completed_at;
        return timeA - timeB;
      });
      
      if (segmentOrder === 0) {
        // Segment 0: Departer → First Destination
        fromLocationName = departer?.name || 'Hub Chính Cần Thơ';
        fromLocationId = departer?.id;
        toLocationName = sampleTrip[0]?.carrier_name;
        toLocationId = destinationMap[toLocationName]?.id;
      } else {
        // Segment N: Destination N-1 → Destination N
        fromLocationName = sampleTrip[segmentOrder - 1]?.carrier_name;
        fromLocationId = destinationMap[fromLocationName]?.id;
        toLocationName = sampleTrip[segmentOrder]?.carrier_name;
        toLocationId = destinationMap[toLocationName]?.id;
      }
      
      routeSegments.push({
        route_name: routeName,
        segment_order: segmentOrder,
        from_location_name: fromLocationName,
        to_location_name: toLocationName,
        from_location_id: fromLocationId,
        to_location_id: toLocationId,
        avg_duration_minutes: avgDuration,
        avg_orders: avgOrders,
        avg_packages: avgPackages,
        avg_bins: avgBins,
        start_time: segmentOrder === 0 ? getMedian(startTimes) : null,
        sample_size: durations.length,
        distance_km: 0 // Will calculate next
      });
    }
  }
  
  console.log(`\n✅ Calculated ${routeSegments.length} route segments\n`);
  
  return routeSegments;
}

// Export for use in other scripts
module.exports = { analyzeRouteSegments };

// Run if called directly
if (require.main === module) {
  analyzeRouteSegments()
    .then(segments => {
      console.log('\n🎉 Analysis complete!');
      console.log(`📊 Total segments: ${segments.length}\n`);
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Error:', err);
      process.exit(1);
    });
}

