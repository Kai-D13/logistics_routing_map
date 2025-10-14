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

async function verifyRoute(routeName, expectedStartRange) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`🔍 ROUTE: "${routeName}"`);
  console.log('═'.repeat(70));

  const { data, error } = await supabase
    .from('route_segments')
    .select('*')
    .eq('route_name', routeName)
    .order('segment_order', { ascending: true });

  if (error) {
    console.error('❌ Error:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('❌ No data found!');
    return;
  }

  console.log(`\n📊 Segments: ${data.length}\n`);

  data.forEach((seg) => {
    console.log(`Segment ${seg.segment_order}:`);
    console.log(`  ${seg.from_location_name} → ${seg.to_location_name}`);
    console.log(`  📏 ${seg.distance_km} km | ⏱️  ${seg.avg_duration_minutes} min | 🕐 ${seg.start_time || 'N/A'}`);
    console.log(`  📊 ${seg.sample_size} trips`);
    console.log('');
  });

  const startTime = data[0]?.start_time;
  const totalDistance = data.reduce((sum, seg) => sum + parseFloat(seg.distance_km), 0);
  const totalDuration = data.reduce((sum, seg) => sum + parseInt(seg.avg_duration_minutes), 0);

  console.log('─'.repeat(70));
  console.log('📊 SUMMARY:');
  console.log(`  🕐 Start time: ${startTime}`);
  console.log(`  📏 Total distance: ${totalDistance.toFixed(2)} km`);
  console.log(`  ⏱️  Total duration: ${totalDuration} min (${Math.floor(totalDuration / 60)}h ${totalDuration % 60}m)`);
  console.log('─'.repeat(70));

  // Verify start time
  if (startTime) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const [minHour, maxHour] = expectedStartRange;
    
    let isInRange = false;
    if (minHour > maxHour) {
      // Range crosses midnight (e.g., 23:00 - 01:00)
      isInRange = hours >= minHour || hours <= maxHour;
    } else {
      isInRange = hours >= minHour && hours <= maxHour;
    }

    if (isInRange) {
      console.log(`✅ Start time is in expected range (${minHour}:00 - ${maxHour}:00)`);
    } else {
      console.log(`❌ Start time is NOT in expected range! Expected: ${minHour}:00 - ${maxHour}:00`);
    }
  } else {
    console.log('❌ No start time found!');
  }

  console.log('');
}

async function main() {
  console.log('\n🚀 VERIFYING ROUTES WITH MEDIAN START TIME\n');

  // Route 1: Cần Thơ - Bạc Liêu - Sóc Trăng R1
  // Expected: 23:30 - 00:30 (23:00 - 01:00 range)
  await verifyRoute('Cần Thơ - Bạc Liêu - Sóc Trăng R1', [23, 1]);

  // Route 2: Cần Thơ - Sa Đéc - Cao Lãnh - Hồng Ngự R1
  // Expected: 23:30 - 00:00 (23:00 - 01:00 range)
  await verifyRoute('Cần Thơ - Sa Đéc - Cao Lãnh - Hồng Ngự R1', [23, 1]);

  console.log('═'.repeat(70));
  console.log('✅ VERIFICATION COMPLETE!');
  console.log('═'.repeat(70));
  console.log('');
}

main().catch(console.error);

