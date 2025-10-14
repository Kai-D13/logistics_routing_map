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

async function checkRouteSegments() {
  console.log('\n🔍 Checking route_segments table...\n');

  try {
    // Count total segments
    const { data, error, count } = await supabase
      .from('route_segments')
      .select('*', { count: 'exact' });

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    console.log(`✅ Total segments in database: ${count || data.length}`);

    if (data && data.length > 0) {
      // Group by route
      const routeGroups = {};
      data.forEach(seg => {
        if (!routeGroups[seg.route_name]) {
          routeGroups[seg.route_name] = [];
        }
        routeGroups[seg.route_name].push(seg);
      });

      console.log(`\n📊 Routes found: ${Object.keys(routeGroups).length}\n`);

      // Show sample data
      Object.keys(routeGroups).slice(0, 3).forEach(routeName => {
        const segments = routeGroups[routeName];
        console.log(`\n📍 ${routeName}`);
        console.log(`   Segments: ${segments.length}`);
        
        segments.forEach(seg => {
          console.log(`   ${seg.segment_order}: ${seg.from_location_name} → ${seg.to_location_name}`);
          console.log(`      📏 ${seg.distance_km} km | ⏱️ ${seg.avg_duration_minutes} min | 📊 ${seg.sample_size} trips`);
          if (seg.start_time) {
            console.log(`      🕐 Start: ${seg.start_time}`);
          }
        });
      });

      console.log('\n✅ Data looks good!\n');
    } else {
      console.log('⚠️  No data found in route_segments table');
      console.log('   Please run: node backend/scripts/calculate-segment-distances.js\n');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkRouteSegments();

