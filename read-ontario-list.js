const XLSX = require('xlsx');

// Read the Excel file
const workbook = XLSX.readFile('c:\\Users\\miked\\Team Budget App\\Ontario Associations List.xlsx');

console.log('Worksheets:', workbook.SheetNames);
console.log('\n');

// Read the first sheet
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Convert to JSON
const data = XLSX.utils.sheet_to_json(worksheet);

console.log(`Total rows: ${data.length}`);
console.log('\nFirst 5 rows:');
console.log(JSON.stringify(data.slice(0, 5), null, 2));

console.log('\nColumn names:');
console.log(Object.keys(data[0]));

console.log('\nSample data structure:');
console.log(JSON.stringify(data[0], null, 2));
