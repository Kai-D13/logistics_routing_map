const { createClient } = require('@supabase/supabase-js');
const config = require('../config/keys');

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY);

async function checkRoutesData() {
  console.log('==================================================');
  console.log('🔍 Checking Routes Data');
  console.log('==================================================\n');

  // 1. Check route_schedules table
  console.log('1️⃣ Checking route_schedules table...');
  const { data: schedules, error: schedulesError } = await supabase
    .from('route_schedules')
    .select('route_name, hub_departer, hub_destination')
    .limit(10);

  if (schedulesError) {
    console.error('❌ Error:', schedulesError.message);
  } else {
    console.log(`✅ Found ${schedules?.length || 0} route segments`);
    if (schedules && schedules.length > 0) {
      console.log('Sample routes:', schedules.slice(0, 3));
      // Get unique route names
      const uniqueRoutes = [...new Set(schedules.map(s => s.route_name))];
      console.log(`📊 Unique route names: ${uniqueRoutes.join(', ')}`);
    }
  }

  // 2. Check route_summary view/table
  console.log('\n2️⃣ Checking route_summary view...');
  const { data: summary, error: summaryError } = await supabase
    .from('route_summary')
    .select('*')
    .limit(10);

  if (summaryError) {
    console.error('❌ Error:', summaryError.message);
    console.log('⚠️  route_summary view might not exist!');
  } else {
    console.log(`✅ Found ${summary?.length || 0} route summaries`);
    if (summary && summary.length > 0) {
      console.log('Sample summaries:', summary.slice(0, 3));
    }
  }

  // 3. Get all distinct route names
  console.log('\n3️⃣ Getting all distinct route names...');
  const { data: allSchedules, error: allError } = await supabase
    .from('route_schedules')
    .select('route_name');

  if (allError) {
    console.error('❌ Error:', allError.message);
  } else {
    const uniqueRoutes = [...new Set(allSchedules.map(s => s.route_name))];
    console.log(`✅ Total unique routes: ${uniqueRoutes.length}`);
    console.log(`📋 All routes: ${uniqueRoutes.join(', ')}`);
  }

  // 4. Try to create route_summary if it doesn't exist
  if (summaryError && summaryError.code === '42P01') {
    console.log('\n4️⃣ route_summary doesn\'t exist, creating alternative query...');
    console.log('💡 Suggestion: Create route_summary view or modify API to use route_schedules directly');
    
    // Show what the API should return
    const { data: groupedRoutes, error: groupError } = await supabase
      .rpc('get_route_summary')
      .select('*');
    
    if (groupError) {
      console.log('⚠️  RPC function not available either');
      console.log('📝 Workaround: Modify /api/routes endpoint to query route_schedules and group by route_name');
    }
  }

  console.log('\n==================================================');
  console.log('✅ Route data check complete');
  console.log('==================================================');
}

checkRoutesData().catch(console.error);
