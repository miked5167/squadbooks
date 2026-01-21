const fs = require('fs');

// Read the JSON file
const data = JSON.parse(fs.readFileSync('batch-201-220-results.json', 'utf8'));

// Convert to CSV format
const csvHeader = 'Association,Location,Website,Success,President Email,VP Email,Treasurer Email,Notes\n';
const csvRows = data.map(item => {
  const association = `"${item.name}"`;
  const location = `"${item.location}"`;
  const website = item.website || '';
  const success = item.success ? 'Yes' : 'No';
  const presidentEmail = item.presidentEmail || '';
  const vpEmail = item.vpEmail || '';
  const treasurerEmail = item.treasurerEmail || '';
  const notes = `"${item.notes}"`;

  return `${association},${location},${website},${success},${presidentEmail},${vpEmail},${treasurerEmail},${notes}`;
}).join('\n');

const csvContent = csvHeader + csvRows;

// Write to CSV file
fs.writeFileSync('batch-201-220-results.csv', csvContent, 'utf8');
console.log('CSV file created: batch-201-220-results.csv');

// Append successful results to main file
const successfulRows = data.filter(item => item.success).map(item => {
  const association = `"${item.name}"`;
  const location = `"${item.location}"`;
  const website = item.website || '';
  const success = 'Yes';
  const presidentEmail = item.presidentEmail || '';
  const vpEmail = item.vpEmail || '';
  const treasurerEmail = item.treasurerEmail || '';
  const notes = `"${item.notes}"`;

  return `${association},${location},${website},${success},${presidentEmail},${vpEmail},${treasurerEmail},${notes}`;
}).join('\n');

if (successfulRows) {
  fs.appendFileSync('hockey-associations-contacts.csv', '\n' + successfulRows, 'utf8');
  console.log(`Appended ${data.filter(item => item.success).length} successful results to hockey-associations-contacts.csv`);
}

console.log(`\nBatch 201-220 Summary:`);
console.log(`Total associations: ${data.length}`);
console.log(`Successful: ${data.filter(item => item.success).length}`);
console.log(`Failed: ${data.filter(item => !item.success).length}`);
