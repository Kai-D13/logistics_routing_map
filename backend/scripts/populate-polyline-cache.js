/**
 * Populate Polyline Cache
 * 
 * This script:
 * 1. Reads all route segments from route_schedules table
 * 2. For each unique segment (hub_from → hub_to), calls Goong Directions API
 * 3. Saves polyline to route_polylines cache table
 * 
 * Usage:
 *   node backend/scripts/populate-polyline-cache.js
 * 
 * Options:
 *   --clear: Clear existing cache before populating
 *   --route="Route Name": Only populate for specific route
 */

const { createClient } = require('@supabase/supabase-js');
const goongService = require('../services/goong.service');
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

// Rate limiting (Goong API: max 300 requests/minute)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Parse command line arguments
const args = process.argv.slice(2);
const shouldClear = args.includes('--clear');
const routeFilter = args.find(arg => arg.startsWith('--route='))?.split('=')[1];

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 POPULATE POLYLINE CACHE');
  console.log('='.repeat(60));
  
  if (shouldClear) {
    console.log('\n🗑️  Clearing existing cache...');
    const { error } = await supabase
      .from('route_polylines')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
    if (error) {
      console.error('❌ Error clearing cache:', error.message);
    } else {
      console.log('✅ Cache cleared');
    }
  }

  // Step 1: Get all route segments
  console.log('\n📊 Fetching route segments from database...');
  
  let query = supabase
    .from('route_schedules')
    .select('route_name, hub_departer, hub_destination')
    .order('route_name')
    .order('departure_time')
    .order('arrival_time');
  
  if (routeFilter) {
    console.log(`   Filtering by route: ${routeFilter}`);
    query = query.eq('route_name', routeFilter);
  }
  
  const { data: segments, error: segmentsError } = await query;
  
  if (segmentsError) {
    console.error('❌ Error fetching segments:', segmentsError.message);
    process.exit(1);
  }
  
  console.log(`✅ Found ${segments.length} segments`);
  
  // Step 2: Build unique segment list
  console.log('\n🔍 Building unique segment list...');
  
  const uniqueSegments = new Map();
  
  for (const segment of segments) {
    const key = `${segment.hub_departer}→${segment.hub_destination}`;
    
    if (!uniqueSegments.has(key)) {
      uniqueSegments.set(key, {
        route_name: segment.route_name,
        hub_from: segment.hub_departer,
        hub_to: segment.hub_destination
      });
    }
  }
  
  console.log(`✅ Found ${uniqueSegments.size} unique segments`);
  
  // Step 3: Get coordinates for all hubs
  console.log('\n📍 Fetching hub coordinates...');
  
  const hubCoords = new Map();
  
  // Get from destinations table
  const { data: destinations } = await supabase
    .from('destinations')
    .select('carrier_name, lat, lng');
  
  if (destinations) {
    for (const dest of destinations) {
      hubCoords.set(dest.carrier_name, { lat: dest.lat, lng: dest.lng });
    }
  }
  
  // Get from departers table
  const { data: departers } = await supabase
    .from('departers')
    .select('name, lat, lng');
  
  if (departers) {
    for (const dep of departers) {
      hubCoords.set(dep.name, { lat: dep.lat, lng: dep.lng });
    }
  }
  
  console.log(`✅ Loaded coordinates for ${hubCoords.size} hubs`);
  
  // Step 4: Process each unique segment
  console.log('\n🚀 Processing segments...');
  console.log('='.repeat(60));
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  let apiCallCount = 0;
  
  let index = 0;
  for (const [key, segment] of uniqueSegments) {
    index++;
    console.log(`\n[${index}/${uniqueSegments.size}] ${segment.hub_from} → ${segment.hub_to}`);
    
    // Get coordinates
    const fromCoords = hubCoords.get(segment.hub_from);
    const toCoords = hubCoords.get(segment.hub_to);
    
    if (!fromCoords) {
      console.log(`   ⚠️  Skipped: No coordinates for ${segment.hub_from}`);
      skipCount++;
      continue;
    }
    
    if (!toCoords) {
      console.log(`   ⚠️  Skipped: No coordinates for ${segment.hub_to}`);
      skipCount++;
      continue;
    }
    
    // Check if already cached
    const { data: existing } = await supabase
      .from('route_polylines')
      .select('id')
      .eq('hub_from', segment.hub_from)
      .eq('hub_to', segment.hub_to)
      .eq('vehicle_type', 'truck')
      .single();
    
    if (existing && !shouldClear) {
      console.log(`   ✅ Already cached (skipping)`);
      skipCount++;
      continue;
    }
    
    // Call Goong Directions API
    console.log(`   📡 Calling Goong API...`);
    
    const waypoints = [
      { lat: fromCoords.lat, lng: fromCoords.lng, name: segment.hub_from },
      { lat: toCoords.lat, lng: toCoords.lng, name: segment.hub_to }
    ];
    
    const result = await goongService.getDirections(waypoints, 'truck');
    apiCallCount++;
    
    if (!result.success) {
      console.log(`   ❌ API Error: ${result.error}`);
      errorCount++;
      await delay(1000); // Wait longer on error
      continue;
    }
    
    // Save to cache
    const { error: cacheError } = await supabase
      .from('route_polylines')
      .upsert([{
        route_name: segment.route_name,
        hub_from: segment.hub_from,
        hub_to: segment.hub_to,
        polyline_encoded: result.data.overview_polyline,
        distance_meters: result.data.total_distance_meters,
        distance_km: parseFloat(result.data.total_distance_km),
        duration_seconds: result.data.total_duration_seconds,
        duration_minutes: Math.round(result.data.total_duration_seconds / 60),
        duration_text: result.data.total_duration_text,
        vehicle_type: 'truck',
        api_response: result.data,
        use_count: 0
      }], {
        onConflict: 'hub_from,hub_to,vehicle_type'
      });
    
    if (cacheError) {
      console.log(`   ❌ Cache Error: ${cacheError.message}`);
      errorCount++;
    } else {
      console.log(`   ✅ Cached: ${result.data.total_distance_km} km, ${result.data.total_duration_text}`);
      successCount++;
    }
    
    // Rate limiting: 300 requests/minute = 1 request per 200ms
    // Use 500ms to be safe
    await delay(500);
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total segments:     ${uniqueSegments.size}`);
  console.log(`✅ Successfully cached: ${successCount}`);
  console.log(`⚠️  Skipped:            ${skipCount}`);
  console.log(`❌ Errors:             ${errorCount}`);
  console.log(`📡 API calls made:     ${apiCallCount}`);
  console.log('='.repeat(60));
  
  // Estimated cost (assuming $0.005 per request)
  const estimatedCost = (apiCallCount * 0.005).toFixed(2);
  console.log(`💰 Estimated API cost: $${estimatedCost}`);
  console.log('='.repeat(60));
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

