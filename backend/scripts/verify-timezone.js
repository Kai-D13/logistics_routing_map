const XLSX = require('xlsx');
const path = require('path');

const EXCEL_FILE = path.join(__dirname, '../../departer_destination.xlsx');

function excelSerialToDate(serial) {
  // Excel serial date: days since 1900-01-01 (with 1900 leap year bug)
  // JavaScript: milliseconds since 1970-01-01
  const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
  const msPerDay = 86400000;
  return new Date(excelEpoch.getTime() + serial * msPerDay);
}

function formatDateTime(date) {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

async function verifyTimezone() {
  console.log('\n🔍 VERIFYING TIMEZONE CONVERSION\n');

  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const trip590762 = data.filter(row => row.trip_code === 'TRIP-590762');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📋 TRIP-590762 DATA:');
  console.log('═══════════════════════════════════════════════════════════════\n');

  trip590762.forEach((row, i) => {
    console.log(`Destination ${i + 1}: ${row.carrier_name}`);
    console.log('─────────────────────────────────────────────────────────────');
    
    console.log(`\nRaw Excel serial numbers:`);
    console.log(`  created_at:       ${row.created_at}`);
    console.log(`  done_handover_at: ${row.done_handover_at}`);
    console.log(`  delivered_at:     ${row.delivered_at}`);
    console.log(`  completed_at:     ${row.completed_at}`);
    
    const createdAt = excelSerialToDate(row.created_at);
    const doneHandoverAt = excelSerialToDate(row.done_handover_at);
    const deliveredAt = excelSerialToDate(row.delivered_at);
    const completedAt = excelSerialToDate(row.completed_at);
    
    console.log(`\nConverted to UTC:`);
    console.log(`  created_at:       ${formatDateTime(createdAt)}`);
    console.log(`  done_handover_at: ${formatDateTime(doneHandoverAt)}`);
    console.log(`  delivered_at:     ${formatDateTime(deliveredAt)}`);
    console.log(`  completed_at:     ${formatDateTime(completedAt)}`);
    
    console.log(`\nISO String:`);
    console.log(`  created_at:       ${createdAt.toISOString()}`);
    console.log(`  done_handover_at: ${doneHandoverAt.toISOString()}`);
    console.log(`  delivered_at:     ${deliveredAt.toISOString()}`);
    console.log(`  completed_at:     ${completedAt.toISOString()}`);
    
    console.log('\n');
  });

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📋 USER PROVIDED DATA (Expected):');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('Destination 1: NVCT Hub Sóc Trăng-CT');
  console.log('  created_at:       3/9/2025 23:30');
  console.log('  done_handover_at: 3/9/2025 23:32');
  console.log('  delivered_at:     4/9/2025 1:04');
  console.log('  completed_at:     4/9/2025 2:31');
  console.log('\n');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🔍 ANALYSIS:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const createdAt = excelSerialToDate(trip590762[0].created_at);
  const expectedCreatedAt = new Date('2025-09-03T23:30:00');
  
  console.log(`Converted created_at: ${formatDateTime(createdAt)}`);
  console.log(`Expected created_at:  03/09/2025 23:30:00`);
  console.log(`\nDifference: ${(createdAt.getTime() - expectedCreatedAt.getTime()) / 3600000} hours`);
  
  // Check if it's a timezone issue (Vietnam is UTC+7)
  const vietnamTime = new Date(createdAt.getTime() + 7 * 3600000);
  console.log(`\nIf we add +7 hours (Vietnam timezone):`);
  console.log(`  ${formatDateTime(vietnamTime)}`);
  
  const vietnamTime2 = new Date(createdAt.getTime() - 7 * 3600000);
  console.log(`\nIf we subtract -7 hours:`);
  console.log(`  ${formatDateTime(vietnamTime2)}`);
  
  console.log('\n');
}

verifyTimezone().catch(console.error);

