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

async function listRoutes() {
  const { data } = await supabase
    .from('route_segments')
    .select('route_name')
    .order('route_name');

  const routes = [...new Set(data.map(d => d.route_name))];
  
  console.log('\n📋 All routes in database:\n');
  routes.forEach((r, i) => {
    console.log(`${i + 1}. ${r}`);
  });
  console.log('');
}

listRoutes();

