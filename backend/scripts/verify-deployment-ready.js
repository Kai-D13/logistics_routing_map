const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('\n🔍 VERIFYING DEPLOYMENT READINESS\n');
console.log('═'.repeat(70));

let allChecks = true;

// Check 1: Environment Variables
console.log('\n📋 CHECK 1: Environment Variables');
console.log('─'.repeat(70));

const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'GOONG_API_KEY',
  'GOONG_MAPTILES_KEY'
];

requiredEnvVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`✅ ${varName}: Configured`);
  } else {
    console.log(`❌ ${varName}: MISSING!`);
    allChecks = false;
  }
});

// Check 2: Required Files
console.log('\n📋 CHECK 2: Required Files');
console.log('─'.repeat(70));

const requiredFiles = [
  'package.json',
  'vercel.json',
  '.vercelignore',
  'backend/server.js',
  'frontend/index.html',
  'DEPLOYMENT-GUIDE.md',
  'QUICK-DEPLOY.md'
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '../..', file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}: Exists`);
  } else {
    console.log(`❌ ${file}: MISSING!`);
    allChecks = false;
  }
});

// Check 3: Supabase Connection
console.log('\n📋 CHECK 3: Supabase Connection');
console.log('─'.repeat(70));

async function checkSupabase() {
  try {
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

    // Check each table
    const tables = ['departers', 'destinations', 'trips', 'trip_destinations', 'routes', 'route_segments'];
    
    for (const table of tables) {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ERROR - ${error.message}`);
        allChecks = false;
      } else {
        console.log(`✅ ${table}: ${count || 0} rows`);
      }
    }

  } catch (err) {
    console.log(`❌ Supabase connection failed: ${err.message}`);
    allChecks = false;
  }
}

// Check 4: Package.json
console.log('\n📋 CHECK 4: Package.json');
console.log('─'.repeat(70));

try {
  const packageJson = require('../../package.json');
  
  const requiredDeps = [
    '@supabase/supabase-js',
    'axios',
    'cors',
    'dotenv',
    'express'
  ];

  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`✅ ${dep}: ${packageJson.dependencies[dep]}`);
    } else {
      console.log(`❌ ${dep}: MISSING!`);
      allChecks = false;
    }
  });

  // Check scripts
  if (packageJson.scripts.start) {
    console.log(`✅ start script: ${packageJson.scripts.start}`);
  } else {
    console.log(`❌ start script: MISSING!`);
    allChecks = false;
  }

} catch (err) {
  console.log(`❌ package.json error: ${err.message}`);
  allChecks = false;
}

// Check 5: Vercel Config
console.log('\n📋 CHECK 5: Vercel Configuration');
console.log('─'.repeat(70));

try {
  const vercelConfig = require('../../vercel.json');
  
  if (vercelConfig.builds && vercelConfig.builds.length > 0) {
    console.log(`✅ Builds configured: ${vercelConfig.builds.length} build(s)`);
  } else {
    console.log(`❌ Builds: NOT configured!`);
    allChecks = false;
  }

  if (vercelConfig.routes && vercelConfig.routes.length > 0) {
    console.log(`✅ Routes configured: ${vercelConfig.routes.length} route(s)`);
  } else {
    console.log(`❌ Routes: NOT configured!`);
    allChecks = false;
  }

} catch (err) {
  console.log(`❌ vercel.json error: ${err.message}`);
  allChecks = false;
}

// Run async checks
(async () => {
  await checkSupabase();

  // Final Summary
  console.log('\n' + '═'.repeat(70));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(70));

  if (allChecks) {
    console.log('\n✅ ALL CHECKS PASSED!');
    console.log('\n🚀 Your project is READY TO DEPLOY!');
    console.log('\nNext steps:');
    console.log('1. Push to GitHub: git push');
    console.log('2. Deploy to Vercel: Follow QUICK-DEPLOY.md');
    console.log('3. Add environment variables in Vercel dashboard');
    console.log('4. Deploy!');
  } else {
    console.log('\n❌ SOME CHECKS FAILED!');
    console.log('\n⚠️  Please fix the issues above before deploying.');
    console.log('\nSee DEPLOYMENT-GUIDE.md for help.');
  }

  console.log('\n' + '═'.repeat(70));
  console.log('');

})().catch(err => {
  console.error('\n❌ Verification failed:', err.message);
  process.exit(1);
});

