const fs = require('fs');

// Read new associations
const newAssociations = JSON.parse(fs.readFileSync('new-associations-to-process.json', 'utf8'));

// Take first 20
const batch = newAssociations.slice(0, 20);

// Common website patterns for Ontario hockey associations
function guessWebsite(name, location) {
  const cleanName = name
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9]/g, '');

  const cityName = location
    .split(',')[0]
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z]/g, '');

  // Common patterns
  const patterns = [
    `https://${cleanName}.com`,
    `https://${cleanName}.ca`,
    `https://${cleanName}hockey.com`,
    `https://${cleanName}minorhockey.com`,
    `https://${cityName}minorhockey.com`,
    `https://${cityName}hockey.com`
  ];

  return patterns;
}

// Create batch file with guessed websites
const batchWithWebsites = batch.map((assoc, index) => {
  const guessedUrls = guessWebsite(assoc.name, assoc.location);

  return {
    name: assoc.name,
    location: assoc.location,
    league: assoc.league,
    guessedWebsites: guessedUrls,
    staffPage: guessedUrls[0].replace(/\/$/, '') + '/Staff/1003/',
    notes: `New association from Excel - needs website verification`,
    action: 'FIND_AND_EXTRACT'
  };
});

fs.writeFileSync('new-batch-141-160.json', JSON.stringify(batchWithWebsites, null, 2));

console.log('Created batch file: new-batch-141-160.json');
console.log(`Associations in batch: ${batchWithWebsites.length}`);
console.log('\nFirst 5:');
batchWithWebsites.slice(0, 5).forEach((a, i) => {
  console.log(`${i+1}. ${a.name} - ${a.location}`);
  console.log(`   Primary guess: ${a.guessedWebsites[0]}`);
});
