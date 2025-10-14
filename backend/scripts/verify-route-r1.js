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

async function verifyRouteR1() {
  console.log('\n🔍 VERIFYING: "Cần Thơ - Bạc Liêu - Sóc Trăng R1"\n');

  const { data, error } = await supabase
    .from('route_segments')
    .select('*')
    .eq('route_name', 'Cần Thơ - Bạc Liêu - Sóc Trăng R1')
    .order('segment_order', { ascending: true });

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 ROUTE SEGMENTS DATA:');
  console.log('═══════════════════════════════════════════════════════════════\n');

  data.forEach((seg, i) => {
    console.log(`Segment ${seg.segment_order}:`);
    console.log(`  From: ${seg.from_location_name}`);
    console.log(`  To:   ${seg.to_location_name}`);
    console.log(`  📏 Distance: ${seg.distance_km} km`);
    console.log(`  ⏱️  Duration: ${seg.avg_duration_minutes} minutes`);
    console.log(`  🕐 Start time: ${seg.start_time || 'N/A'}`);
    console.log(`  📦 Cargo: ${seg.avg_orders} orders, ${seg.avg_packages} packages, ${seg.avg_bins} bins`);
    console.log(`  📊 Sample size: ${seg.sample_size} trips`);
    console.log('');
  });

  // Calculate totals
  const totalDistance = data.reduce((sum, seg) => sum + parseFloat(seg.distance_km), 0);
  const totalDuration = data.reduce((sum, seg) => sum + parseInt(seg.avg_duration_minutes), 0);
  const startTime = data[0]?.start_time || 'N/A';

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log(`🕐 Start time: ${startTime}`);
  console.log(`📏 Total distance: ${totalDistance.toFixed(2)} km`);
  console.log(`⏱️  Total duration: ${totalDuration} minutes (${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m)`);
  console.log(`📊 Sample size: ${data[0]?.sample_size || 0} trips`);
  console.log('');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ EXPECTED VALUES (from user):');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('🕐 Start time: Should be around 23:30 - 23:50');
  console.log('📏 Distance: Segment 0 should be ~74 km, Segment 1 should be ~40 km');
  console.log('📊 Sample size: 37 trips (from 27 trip codes provided)');
  console.log('');

  // Verify
  const startHour = startTime ? parseInt(startTime.split(':')[0]) : 0;
  if (startHour >= 22 || startHour <= 1) {
    console.log('✅ Start time is in correct range (22:00 - 01:00)');
  } else {
    console.log('❌ Start time is NOT in expected range!');
  }

  if (data[0] && parseFloat(data[0].distance_km) >= 70 && parseFloat(data[0].distance_km) <= 80) {
    console.log('✅ Segment 0 distance is correct (~74 km)');
  } else {
    console.log('❌ Segment 0 distance is NOT correct!');
  }

  if (data[1] && parseFloat(data[1].distance_km) >= 35 && parseFloat(data[1].distance_km) <= 45) {
    console.log('✅ Segment 1 distance is correct (~40 km)');
  } else {
    console.log('❌ Segment 1 distance is NOT correct!');
  }

  console.log('');
}

verifyRouteR1().catch(console.error);

