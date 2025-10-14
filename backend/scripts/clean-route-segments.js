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

async function cleanRouteSegments() {
  console.log('\n🧹 CLEANING route_segments TABLE...\n');

  try {
    // Delete all rows
    const { error } = await supabase
      .from('route_segments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using a condition that's always true)

    if (error) {
      console.error('❌ Error deleting data:', error.message);
      return;
    }

    console.log('✅ All data deleted from route_segments table\n');

    // Verify
    const { data, count } = await supabase
      .from('route_segments')
      .select('*', { count: 'exact' });

    console.log(`📊 Remaining rows: ${count || 0}\n`);

    if (count === 0) {
      console.log('✅ Table is clean and ready for fresh data!\n');
    } else {
      console.log('⚠️  Warning: Some rows still remain\n');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

cleanRouteSegments();

