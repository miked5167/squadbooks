const fs = require('fs');

// Read the full list
const allAssociations = JSON.parse(fs.readFileSync('new-associations-to-process.json', 'utf8'));

// Get batch 181-200 (using 0-based indexing, so 180-199)
const startIndex = 180;
const endIndex = 200;
const batch = allAssociations.slice(startIndex, endIndex);

console.log(`Extracting associations ${startIndex + 1} to ${Math.min(endIndex, allAssociations.length)}`);
console.log(`Found ${batch.length} associations in this batch`);

// Save the batch
fs.writeFileSync('next-batch-181-200.json', JSON.stringify(batch, null, 2));
console.log('\nSaved to: next-batch-181-200.json');

// Display the associations
console.log('\nAssociations in this batch:');
batch.forEach((assoc, i) => {
  console.log(`  ${startIndex + i + 1}. ${assoc.name} (${assoc.location})`);
});
