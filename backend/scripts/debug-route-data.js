const XLSX = require('xlsx');
const path = require('path');

const EXCEL_FILE = path.join(__dirname, '../../departer_destination.xlsx');

// Parse Excel datetime
function parseExcelDate(excelDate) {
  if (excelDate instanceof Date) return excelDate;
  if (typeof excelDate === 'number') {
    return new Date((excelDate - 25569) * 86400 * 1000);
  }
  if (typeof excelDate === 'string') {
    const parsed = new Date(excelDate);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function formatTime(date) {
  if (!date) return 'NULL';
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

function formatDateTime(date) {
  if (!date) return 'NULL';
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

async function debugRouteData() {
  console.log('\n🔍 DEBUGGING ROUTE DATA: "Cần Thơ - Bạc Liêu - Sóc Trăng R1"\n');

  const targetTripCodes = [
    'TRIP-590762', 'TRIP-591357', 'TRIP-592025', 'TRIP-592647', 'TRIP-593226',
    'TRIP-593845', 'TRIP-594434', 'TRIP-595070', 'TRIP-595703', 'TRIP-596345',
    'TRIP-596998', 'TRIP-597543', 'TRIP-598108', 'TRIP-598729', 'TRIP-599370',
    'TRIP-600016', 'TRIP-600657', 'TRIP-601278', 'TRIP-601831', 'TRIP-602435',
    'TRIP-603051', 'TRIP-603681', 'TRIP-604321', 'TRIP-604952', 'TRIP-605559',
    'TRIP-606073', 'TRIP-606648'
  ];

  // Read Excel
  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log(`📊 Total rows in Excel: ${data.length}\n`);

  // Filter for this route
  const routeData = data.filter(row => 
    row.route_name === 'Cần Thơ - Bạc Liêu - Sóc Trăng R1'
  );

  console.log(`📍 Rows for this route: ${routeData.length}\n`);

  // Group by trip_code
  const tripsByCode = {};
  routeData.forEach(row => {
    const tripCode = row.trip_code;
    if (!tripsByCode[tripCode]) {
      tripsByCode[tripCode] = [];
    }
    tripsByCode[tripCode].push(row);
  });

  console.log(`🚚 Unique trips: ${Object.keys(tripsByCode).length}\n`);

  // Analyze target trips
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📋 ANALYZING TARGET TRIPS:\n');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const createdAtTimes = [];
  const doneHandoverAtTimes = [];

  targetTripCodes.forEach((tripCode, index) => {
    const tripRows = tripsByCode[tripCode];
    
    if (!tripRows) {
      console.log(`❌ ${tripCode} - NOT FOUND IN EXCEL\n`);
      return;
    }

    console.log(`\n${index + 1}. ${tripCode} (${tripRows.length} destinations)`);
    console.log('─────────────────────────────────────────────────────────────');

    // Sort by delivered_at or completed_at
    const sortedRows = tripRows.sort((a, b) => {
      const timeA = parseExcelDate(a.delivered_at) || parseExcelDate(a.completed_at);
      const timeB = parseExcelDate(b.delivered_at) || parseExcelDate(b.completed_at);
      return timeA - timeB;
    });

    sortedRows.forEach((row, i) => {
      const createdAt = parseExcelDate(row.created_at);
      const doneHandoverAt = parseExcelDate(row.done_handover_at);
      const deliveredAt = parseExcelDate(row.delivered_at);
      const completedAt = parseExcelDate(row.completed_at);

      console.log(`\n   Destination ${i + 1}: ${row.carrier_name}`);
      console.log(`   ├─ created_at:       ${formatDateTime(createdAt)}`);
      console.log(`   ├─ done_handover_at: ${formatDateTime(doneHandoverAt)}`);
      console.log(`   ├─ delivered_at:     ${formatDateTime(deliveredAt)}`);
      console.log(`   └─ completed_at:     ${formatDateTime(completedAt)}`);

      // Collect times for first destination
      if (i === 0) {
        if (createdAt) createdAtTimes.push(formatTime(createdAt));
        if (doneHandoverAt) doneHandoverAtTimes.push(formatTime(doneHandoverAt));
      }
    });

    console.log('');
  });

  // Analyze start times
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('📊 START TIME ANALYSIS:');
  console.log('═══════════════════════════════════════════════════════════════\n');

  console.log('🕐 created_at times (first destination):');
  const createdAtFreq = {};
  createdAtTimes.forEach(time => {
    createdAtFreq[time] = (createdAtFreq[time] || 0) + 1;
  });
  Object.entries(createdAtFreq)
    .sort((a, b) => b[1] - a[1])
    .forEach(([time, count]) => {
      console.log(`   ${time} - ${count} times ${count === Math.max(...Object.values(createdAtFreq)) ? '⭐ MODE' : ''}`);
    });

  console.log('\n🕐 done_handover_at times (first destination):');
  const doneHandoverFreq = {};
  doneHandoverAtTimes.forEach(time => {
    doneHandoverFreq[time] = (doneHandoverFreq[time] || 0) + 1;
  });
  Object.entries(doneHandoverFreq)
    .sort((a, b) => b[1] - a[1])
    .forEach(([time, count]) => {
      console.log(`   ${time} - ${count} times ${count === Math.max(...Object.values(doneHandoverFreq)) ? '⭐ MODE' : ''}`);
    });

  // Calculate durations for one sample trip
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('⏱️  DURATION CALCULATION (Sample: TRIP-590762):');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const sampleTrip = tripsByCode['TRIP-590762'];
  if (sampleTrip) {
    const sortedSample = sampleTrip.sort((a, b) => {
      const timeA = parseExcelDate(a.delivered_at) || parseExcelDate(a.completed_at);
      const timeB = parseExcelDate(b.delivered_at) || parseExcelDate(b.completed_at);
      return timeA - timeB;
    });

    sortedSample.forEach((row, i) => {
      const doneHandoverAt = parseExcelDate(row.done_handover_at);
      const deliveredAt = parseExcelDate(row.delivered_at) || parseExcelDate(row.completed_at);

      if (i === 0) {
        // Segment 0: Hub → Dest 1
        const duration = Math.round((deliveredAt - doneHandoverAt) / 60000);
        console.log(`Segment 0: Hub → ${row.carrier_name}`);
        console.log(`   done_handover_at: ${formatDateTime(doneHandoverAt)}`);
        console.log(`   delivered_at:     ${formatDateTime(deliveredAt)}`);
        console.log(`   Duration:         ${duration} minutes\n`);
      } else {
        // Segment N: Dest N-1 → Dest N
        const prevRow = sortedSample[i - 1];
        const prevDeliveredAt = parseExcelDate(prevRow.delivered_at) || parseExcelDate(prevRow.completed_at);
        const duration = Math.round((deliveredAt - prevDeliveredAt) / 60000);
        
        console.log(`Segment ${i}: ${prevRow.carrier_name} → ${row.carrier_name}`);
        console.log(`   prev delivered_at: ${formatDateTime(prevDeliveredAt)}`);
        console.log(`   curr delivered_at: ${formatDateTime(deliveredAt)}`);
        console.log(`   Duration:          ${duration} minutes\n`);
      }
    });
  }

  console.log('═══════════════════════════════════════════════════════════════\n');
}

debugRouteData().catch(console.error);

