const XLSX = require('xlsx');
const path = require('path');

const EXCEL_FILE = path.join(__dirname, '../../departer_destination.xlsx');

async function checkExcelRaw() {
  console.log('\n🔍 CHECKING RAW EXCEL DATA\n');

  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  // Find TRIP-590762
  const trip590762 = data.filter(row => row.trip_codes === 'TRIP-590762');

  console.log(`Found ${trip590762.length} rows for TRIP-590762:\n`);

  trip590762.forEach((row, i) => {
    console.log(`Row ${i + 1}:`);
    console.log(`  carrier_name:      ${row.carrier_name}`);
    console.log(`  created_at:        ${row.created_at} (type: ${typeof row.created_at})`);
    console.log(`  done_handover_at:  ${row.done_handover_at} (type: ${typeof row.done_handover_at})`);
    console.log(`  delivered_at:      ${row.delivered_at} (type: ${typeof row.delivered_at})`);
    console.log(`  completed_at:      ${row.completed_at} (type: ${typeof row.completed_at})`);
    
    // If it's a number (Excel serial date), convert it
    if (typeof row.created_at === 'number') {
      const date = new Date((row.created_at - 25569) * 86400 * 1000);
      console.log(`  created_at (converted): ${date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
    }
    
    if (typeof row.done_handover_at === 'number') {
      const date = new Date((row.done_handover_at - 25569) * 86400 * 1000);
      console.log(`  done_handover_at (converted): ${date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
    }
    
    if (typeof row.delivered_at === 'number') {
      const date = new Date((row.delivered_at - 25569) * 86400 * 1000);
      console.log(`  delivered_at (converted): ${date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
    }
    
    if (typeof row.completed_at === 'number') {
      const date = new Date((row.completed_at - 25569) * 86400 * 1000);
      console.log(`  completed_at (converted): ${date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
    }
    
    console.log('');
  });

  // Check if the data matches user's expectation
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('📋 USER PROVIDED DATA:');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('created_at:       3/9/2025 23:30');
  console.log('done_handover_at: 3/9/2025 23:32');
  console.log('delivered_at:     4/9/2025 1:04');
  console.log('completed_at:     4/9/2025 2:31');
  console.log('');
}

checkExcelRaw().catch(console.error);

