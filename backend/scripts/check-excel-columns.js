const XLSX = require('xlsx');
const path = require('path');

const EXCEL_FILE = path.join(__dirname, '../../departer_destination.xlsx');

async function checkExcelColumns() {
  console.log('\n🔍 CHECKING EXCEL COLUMNS\n');

  const workbook = XLSX.readFile(EXCEL_FILE);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  console.log('Column names:');
  console.log(Object.keys(data[0]));
  console.log('\n');

  // Show first row
  console.log('First row sample:');
  console.log(JSON.stringify(data[0], null, 2));
  console.log('\n');

  // Search for TRIP-590762 in all possible columns
  console.log('Searching for TRIP-590762 in all columns...\n');
  
  const found = data.filter(row => {
    return Object.values(row).some(val => 
      String(val).includes('TRIP-590762')
    );
  });

  console.log(`Found ${found.length} rows containing TRIP-590762:\n`);
  
  found.forEach((row, i) => {
    console.log(`Row ${i + 1}:`);
    console.log(JSON.stringify(row, null, 2));
    console.log('\n');
  });
}

checkExcelColumns().catch(console.error);

