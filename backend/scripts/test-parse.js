// Test coordinate parsing
const testValues = [
  '10.915.133.107.042.400',
  11.912289548560548,
  '109.15133107042400'
];

function parseCoordinate(value, type) {
  console.log(`\nParsing: ${value} (type: ${typeof value})`);
  
  if (typeof value === 'number') {
    console.log(`  → Already number: ${value}`);
    return value;
  }
  
  if (typeof value === 'string') {
    // Try to parse as-is first
    let parsed = parseFloat(value);
    console.log(`  → Parse as-is: ${parsed}`);
    
    // If failed or out of range, try removing all dots and re-inserting decimal
    if (isNaN(parsed) || (type === 'lat' && (parsed < -90 || parsed > 90)) || (type === 'lng' && (parsed < -180 || parsed > 180))) {
      console.log(`  → Out of range or NaN, trying to fix...`);
      // Remove all dots
      const cleaned = value.replace(/\./g, '');
      console.log(`  → Cleaned: ${cleaned}`);
      // Insert decimal point after first 2-3 digits (for coordinates)
      if (cleaned.length > 2) {
        const withDecimal = cleaned.substring(0, 3) + '.' + cleaned.substring(3);
        console.log(`  → With decimal: ${withDecimal}`);
        parsed = parseFloat(withDecimal);
        console.log(`  → Parsed: ${parsed}`);
      }
    }
    
    if (!isNaN(parsed)) {
      // Validate range
      if (type === 'lat' && parsed >= -90 && parsed <= 90) {
        console.log(`  ✅ Valid lat: ${parsed}`);
        return parsed;
      }
      if (type === 'lng' && parsed >= -180 && parsed <= 180) {
        console.log(`  ✅ Valid lng: ${parsed}`);
        return parsed;
      }
      console.log(`  ❌ Out of range for ${type}`);
    }
  }
  console.log(`  ❌ Invalid`);
  return null;
}

console.log('Testing longitude parsing:');
testValues.forEach(val => {
  const result = parseCoordinate(val, 'lng');
  console.log(`Result: ${result}\n`);
});

