const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');
const { analyzeRouteSegments } = require('./analyze-route-segments');
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

// Rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get distance between two locations using Goong API
 */
async function getDistance(fromLat, fromLng, toLat, toLng) {
  try {
    const url = `https://rsapi.goong.io/DistanceMatrix?origins=${fromLat},${fromLng}&destinations=${toLat},${toLng}&vehicle=car&api_key=${GOONG_API_KEY}`;
    
    const response = await axios.get(url);
    
    if (response.data.rows && response.data.rows[0].elements[0].status === 'OK') {
      const distanceMeters = response.data.rows[0].elements[0].distance.value;
      return parseFloat((distanceMeters / 1000).toFixed(2)); // Convert to km
    }
    
    return null;
  } catch (error) {
    console.error('   ❌ Error fetching distance:', error.message);
    return null;
  }
}

/**
 * Main function
 */
async function calculateAndSaveSegments() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 ROUTE SEGMENTS CALCULATION & IMPORT');
  console.log('='.repeat(60) + '\n');
  
  // Step 1: Analyze Excel and calculate durations
  console.log('📊 PHASE 1: Analyzing Excel data...\n');
  const segments = await analyzeRouteSegments();
  
  if (!segments || segments.length === 0) {
    console.error('❌ No segments found!');
    return;
  }
  
  console.log(`✅ Found ${segments.length} segments to process\n`);
  
  // Step 2: Fetch location coordinates
  console.log('📊 PHASE 2: Fetching location coordinates...\n');
  
  const { data: departers } = await supabase
    .from('departers')
    .select('*');
  
  const { data: destinations } = await supabase
    .from('destinations')
    .select('*');
  
  // Create lookup maps
  const locationMap = {};
  
  departers?.forEach(d => {
    locationMap[d.id] = { lat: d.lat, lng: d.lng, name: d.name };
  });
  
  destinations?.forEach(d => {
    locationMap[d.id] = { lat: d.lat, lng: d.lng, name: d.carrier_name };
  });
  
  console.log(`✅ Loaded ${Object.keys(locationMap).length} locations\n`);
  
  // Step 3: Calculate distances using Goong API
  console.log('📊 PHASE 3: Calculating distances with Goong API...\n');
  console.log('⏳ This may take a few minutes (rate limiting: 300ms/request)\n');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    
    console.log(`[${i + 1}/${segments.length}] ${segment.route_name} - Segment ${segment.segment_order}`);
    console.log(`   From: ${segment.from_location_name}`);
    console.log(`   To: ${segment.to_location_name}`);
    
    // Get coordinates
    const fromLoc = locationMap[segment.from_location_id];
    const toLoc = locationMap[segment.to_location_id];
    
    if (!fromLoc || !toLoc) {
      console.log(`   ⚠️  Missing coordinates, skipping...`);
      errorCount++;
      continue;
    }
    
    // Calculate distance
    const distance = await getDistance(fromLoc.lat, fromLoc.lng, toLoc.lat, toLoc.lng);
    
    if (distance !== null) {
      segment.distance_km = distance;
      console.log(`   ✅ Distance: ${distance} km`);
      successCount++;
    } else {
      console.log(`   ❌ Failed to get distance`);
      errorCount++;
    }
    
    // Rate limiting
    await delay(300);
  }
  
  console.log(`\n📊 Distance calculation complete:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}\n`);
  
  // Step 4: Insert into database
  console.log('📊 PHASE 4: Inserting into database...\n');
  
  // Clear existing data
  console.log('🗑️  Clearing existing route_segments...');
  const { error: deleteError } = await supabase
    .from('route_segments')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
  
  if (deleteError) {
    console.log(`   ⚠️  Warning: ${deleteError.message}`);
  } else {
    console.log('   ✅ Cleared\n');
  }
  
  // Insert new data
  console.log('💾 Inserting new segments...');
  
  // Filter out segments with no distance
  const validSegments = segments.filter(s => s.distance_km > 0);
  
  console.log(`   Valid segments: ${validSegments.length}/${segments.length}`);
  
  // Insert in batches of 50
  const batchSize = 50;
  let insertedCount = 0;
  
  for (let i = 0; i < validSegments.length; i += batchSize) {
    const batch = validSegments.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('route_segments')
      .insert(batch)
      .select();
    
    if (error) {
      console.error(`   ❌ Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
    } else {
      insertedCount += data.length;
      console.log(`   ✅ Batch ${Math.floor(i / batchSize) + 1}: ${data.length} segments`);
    }
  }
  
  console.log(`\n✅ Inserted ${insertedCount} segments into database\n`);
  
  // Step 5: Summary
  console.log('='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total segments analyzed: ${segments.length}`);
  console.log(`Distances calculated: ${successCount}`);
  console.log(`Segments inserted: ${insertedCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log('='.repeat(60) + '\n');
  
  // Show sample data
  console.log('📋 Sample segments:\n');
  const { data: sampleData } = await supabase
    .from('route_segments')
    .select('*')
    .limit(5);
  
  sampleData?.forEach(seg => {
    console.log(`Route: ${seg.route_name}`);
    console.log(`  Segment ${seg.segment_order}: ${seg.from_location_name} → ${seg.to_location_name}`);
    console.log(`  Distance: ${seg.distance_km} km`);
    console.log(`  Duration: ${seg.avg_duration_minutes} min`);
    console.log(`  Start time: ${seg.start_time || 'N/A'}`);
    console.log(`  Sample size: ${seg.sample_size} trips\n`);
  });
  
  console.log('🎉 All done!\n');
}

// Run
calculateAndSaveSegments()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
  });

