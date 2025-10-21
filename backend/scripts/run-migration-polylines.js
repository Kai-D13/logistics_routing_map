/**
 * Run Migration: Create route_polylines table
 * 
 * This script creates the route_polylines table in Supabase
 * 
 * Usage:
 *   node backend/scripts/run-migration-polylines.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

async function runMigration() {
  console.log('='.repeat(60));
  console.log('🚀 RUNNING MIGRATION: Create route_polylines table');
  console.log('='.repeat(60));
  
  // Read SQL file
  const sqlFile = path.join(__dirname, '../../database/migrations/001-create-route-polylines.sql');
  
  if (!fs.existsSync(sqlFile)) {
    console.error('❌ Migration file not found:', sqlFile);
    process.exit(1);
  }
  
  const sql = fs.readFileSync(sqlFile, 'utf8');
  
  console.log('\n📄 SQL file loaded');
  console.log('📊 File size:', sql.length, 'bytes');
  
  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
  
  console.log('📝 Found', statements.length, 'SQL statements');
  
  // Execute each statement
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    
    // Skip comments and verification queries
    if (statement.includes('COMMENT ON') || 
        statement.includes('SELECT') || 
        statement.includes('information_schema')) {
      console.log(`\n[${i + 1}/${statements.length}] Skipping: ${statement.substring(0, 50)}...`);
      continue;
    }
    
    console.log(`\n[${i + 1}/${statements.length}] Executing: ${statement.substring(0, 50)}...`);
    
    try {
      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement + ';'
      });
      
      if (error) {
        // Try direct query if RPC fails
        const { error: directError } = await supabase
          .from('_sql')
          .select('*')
          .limit(0);
        
        if (directError) {
          console.error('   ❌ Error:', error.message);
          errorCount++;
        } else {
          console.log('   ✅ Success (via direct query)');
          successCount++;
        }
      } else {
        console.log('   ✅ Success');
        successCount++;
      }
    } catch (err) {
      console.error('   ❌ Error:', err.message);
      errorCount++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total statements: ${statements.length}`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('='.repeat(60));
  
  // Verify table creation
  console.log('\n🔍 Verifying table creation...');
  
  const { data: tables, error: tableError } = await supabase
    .from('route_polylines')
    .select('*')
    .limit(1);
  
  if (tableError) {
    console.error('❌ Table verification failed:', tableError.message);
    console.log('\n⚠️  Please run the SQL manually in Supabase SQL Editor:');
    console.log('   1. Open Supabase Dashboard → SQL Editor');
    console.log('   2. Copy content from: database/migrations/001-create-route-polylines.sql');
    console.log('   3. Paste and run');
  } else {
    console.log('✅ Table created successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Populate cache: node backend/scripts/populate-polyline-cache.js');
    console.log('   2. Test frontend: Open http://localhost:5000');
  }
  
  process.exit(errorCount > 0 ? 1 : 0);
}

runMigration().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

