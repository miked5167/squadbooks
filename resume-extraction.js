const XLSX = require('xlsx');
const fs = require('fs');

// Read the master Excel file
const workbook = XLSX.readFile('c:\\Users\\miked\\Team Budget App\\Ontario Associations List.xlsx');
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const allAssociations = XLSX.utils.sheet_to_json(worksheet);

// Read the CSV to get already processed associations
const csvContent = fs.readFileSync('hockey-associations-contacts.csv', 'utf-8');
const csvLines = csvContent.trim().split('\n');
const processed = new Set();

// Parse CSV (skip header, get association names from column 0)
for (let i = 1; i < csvLines.length; i++) {
  const match = csvLines[i].match(/^([^,]+),/);
  if (match) {
    processed.add(match[1]);
  }
}

console.log(`Total associations: ${allAssociations.length}`);
console.log(`Already processed: ${processed.size}`);

// Get remaining associations
const remaining = allAssociations.filter(a => !processed.has(a['Association Name']));
console.log(`Remaining to process: ${remaining.length}\n`);

// Get next batch
const BATCH_SIZE = parseInt(process.argv[2]) || 10;
const nextBatch = remaining.slice(0, BATCH_SIZE);

console.log(`Next batch (${nextBatch.length} associations):\n`);
nextBatch.forEach((assoc, i) => {
  console.log(`${i + 1}. ${assoc['Association Name']} (${assoc['Location']})`);
});

// Output as JSON for easy processing
const outputFile = 'next-batch.json';
fs.writeFileSync(outputFile, JSON.stringify(nextBatch, null, 2));
console.log(`\n✓ Batch saved to ${outputFile}`);
