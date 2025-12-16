const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const excelPath = 'C:\\Users\\miked\\Team Budget App\\Ontario Associations List.xlsx';
const workbook = XLSX.readFile(excelPath);
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(sheet);

// Extract batch 221-240 (indices 220-239 in 0-based array)
const batch = data.slice(220, 240).map((row, idx) => ({
  index: 221 + idx,
  name: row['Association Name'] || '',
  location: row['Location'] || '',
  website: ''
}));

fs.writeFileSync('next-batch-221-240.json', JSON.stringify(batch, null, 2));
console.log('Created next-batch-221-240.json with ' + batch.length + ' associations');
console.log('First association: ' + batch[0].name);
console.log('Last association: ' + batch[batch.length-1].name);
