/**
 * Rebuild Polyline Cache
 * 
 * Use this script when you re-import route.json or new_marker.json
 * 
 * This script:
 * 1. Clears ALL existing polyline cache
 * 2. Re-populates cache from current route_schedules data
 * 
 * Usage:
 *   node backend/scripts/rebuild-polyline-cache.js
 */

const { execSync } = require('child_process');

console.log('='.repeat(60));
console.log('🔄 REBUILD POLYLINE CACHE');
console.log('='.repeat(60));
console.log('\nThis will:');
console.log('1. Clear ALL existing polyline cache');
console.log('2. Re-populate cache from current database');
console.log('\n⚠️  WARNING: This will make API calls to Goong and may incur costs!');
console.log('='.repeat(60));

// Confirm
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

readline.question('\nContinue? (yes/no): ', (answer) => {
  readline.close();
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('\n❌ Cancelled');
    process.exit(0);
  }
  
  console.log('\n🚀 Starting rebuild...\n');
  
  try {
    // Run populate script with --clear flag
    execSync('node backend/scripts/populate-polyline-cache.js --clear', {
      stdio: 'inherit'
    });
    
    console.log('\n✅ Rebuild complete!');
  } catch (error) {
    console.error('\n❌ Rebuild failed:', error.message);
    process.exit(1);
  }
});

