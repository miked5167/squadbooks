const fs = require('fs');

/**
 * Process batch 181-200 using Apify RAG Web Browser
 * These associations don't have website URLs in source data,
 * so we'll use Apify to search and extract contacts
 */

// Load the batch
const batch = JSON.parse(fs.readFileSync('next-batch-181-200.json', 'utf8'));

console.log('='.repeat(80));
console.log('BATCH 181-200 APIFY EXTRACTION');
console.log('='.repeat(80));
console.log(`Total associations to process: ${batch.length}\n`);

// We already processed 2, so skip them
const processed = ['Niagara Falls Rapids', 'North Bay Trappers'];
const toProcess = batch.filter(a => !processed.includes(a.name));

console.log('Already processed manually:');
processed.forEach(name => console.log(`  ✓ ${name}`));

console.log(`\nRemaining to process: ${toProcess.length}\n`);

// Display the list
console.log('Associations to process with Apify:');
toProcess.forEach((assoc, i) => {
  console.log(`  ${i + 1}. ${assoc.name} (${assoc.location})`);
});

console.log('\n' + '='.repeat(80));
console.log('INSTRUCTIONS FOR APIFY PROCESSING');
console.log('='.repeat(80));
console.log('\nFor each association, use Apify RAG Web Browser with query:');
console.log('"{association name} {location} minor hockey Ontario executive board president vice president treasurer contact email"');
console.log('\nThen manually extract:');
console.log('  - President email');
console.log('  - VP email');
console.log('  - Treasurer email');
console.log('\nSave results to: batch-181-200-apify-results.json');
console.log('\nAfter all extractions, run: node parse-apify-results.js');
