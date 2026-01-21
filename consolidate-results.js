const fs = require('fs');

const allResults = [];
const batchFiles = [
  'batch-10-results.json',
  'batch-11-20-results.json',
  'batch-21-30-results.json',
  'batch-31-40-results.json',
  'batch-41-50-results.json',
  'batch-51-60-results.json',
  'batch-61-70-results.json',
  'batch-71-80-results.json',
  'batch-81-90-results.json',
  'batch-91-100-results.json',
  'batch-101-110-results.json',
  'batch-111-120-results.json',
  'batch-121-130-results.json',
  'batch-131-140-results.json'
];

batchFiles.forEach(filename => {
  if (fs.existsSync(filename)) {
    const batch = JSON.parse(fs.readFileSync(filename, 'utf8'));
    allResults.push(...batch);
  }
});

const successful = allResults.filter(r => r.success);
const failed = allResults.filter(r => !r.success);

console.log(`Total associations processed: ${allResults.length}`);
console.log(`Successful: ${successful.length}`);
console.log(`Failed: ${failed.length}`);

// Save JSON
fs.writeFileSync('all-extraction-results.json', JSON.stringify(allResults, null, 2));
console.log('\nSaved JSON to: all-extraction-results.json');

// Create CSV for easy viewing
const csvLines = ['Association,Location,Website,Success,President Email,VP Email,Treasurer Email'];

allResults.forEach(result => {
  const presEmail = result.president?.email || '';
  const vpEmail = result.vp?.email || '';
  const treasEmail = result.treasurer?.email || '';
  const success = result.success ? 'Yes' : 'No';

  csvLines.push(`"${result.association}","${result.location}","${result.website}",${success},"${presEmail}","${vpEmail}","${treasEmail}"`);
});

fs.writeFileSync('all-extraction-results.csv', csvLines.join('\n'));
console.log('Saved CSV to: all-extraction-results.csv');

console.log('\n=== Summary by Contact Type ===');
console.log(`Presidents extracted: ${successful.filter(r => r.president).length}`);
console.log(`VPs extracted: ${successful.filter(r => r.vp).length}`);
console.log(`Treasurers extracted: ${successful.filter(r => r.treasurer).length}`);
