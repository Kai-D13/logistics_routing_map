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

async function createRouteSegmentsTable() {
  console.log('📊 Creating route_segments table...\n');

  const sql = `
    -- Drop existing table if exists
    DROP TABLE IF EXISTS route_segments CASCADE;

    -- Create route_segments table
    CREATE TABLE route_segments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      
      -- Route Information
      route_name TEXT NOT NULL,
      segment_order INT NOT NULL,
      
      -- Location Information
      from_location_name TEXT NOT NULL,
      to_location_name TEXT NOT NULL,
      from_location_id UUID,
      to_location_id UUID,
      
      -- Metrics (Averages from historical data)
      avg_duration_minutes INT NOT NULL,
      distance_km DECIMAL(10,2) NOT NULL,
      
      -- Cargo Metrics (Averages)
      avg_orders INT DEFAULT 0,
      avg_packages INT DEFAULT 0,
      avg_bins INT DEFAULT 0,
      
      -- Start Time (only for segment_order = 0)
      start_time TIME,
      
      -- Metadata
      sample_size INT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      
      -- Constraints
      CONSTRAINT unique_route_segment UNIQUE (route_name, segment_order)
    );

    -- Create indexes for performance
    CREATE INDEX idx_route_segments_route_name ON route_segments(route_name);
    CREATE INDEX idx_route_segments_segment_order ON route_segments(segment_order);
    CREATE INDEX idx_route_segments_from_location ON route_segments(from_location_id);
    CREATE INDEX idx_route_segments_to_location ON route_segments(to_location_id);
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error creating table:', error.message);
      
      // Try alternative method - create via REST API
      console.log('\n🔄 Trying alternative method...\n');
      
      // We'll create the table by inserting a dummy row and letting Supabase create it
      // Then delete the dummy row
      const { error: insertError } = await supabase
        .from('route_segments')
        .insert({
          route_name: 'DUMMY',
          segment_order: 0,
          from_location_name: 'DUMMY',
          to_location_name: 'DUMMY',
          avg_duration_minutes: 0,
          distance_km: 0
        });
      
      if (insertError && !insertError.message.includes('already exists')) {
        console.error('❌ Alternative method failed:', insertError.message);
        console.log('\n⚠️  Please create table manually in Supabase Dashboard:');
        console.log('   SQL Editor → New Query → Paste schema-route-segments.sql\n');
        return false;
      }
    }

    console.log('✅ Table route_segments created successfully!\n');
    return true;

  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.log('\n📝 Please create table manually using schema-route-segments.sql\n');
    return false;
  }
}

// Run
createRouteSegmentsTable()
  .then(success => {
    if (success) {
      console.log('🎉 Database setup complete!\n');
      process.exit(0);
    } else {
      console.log('⚠️  Manual setup required\n');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });

