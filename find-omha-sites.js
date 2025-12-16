const fs = require('fs');

/**
 * Find OMHA network sites that we can extract from
 * Look for sites that match the OMHA network pattern
 */

// Parse CSV
function parseCSV(filename) {
  const content = fs.readFileSync(filename, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());

  const associations = [];
  for (let i = 1; i < lines.length; i++) {
    const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    if (!matches || matches.length < 3) continue;

    const row = matches.map(val => val.replace(/^"|"$/g, '').trim());

    associations.push({
      lineNumber: i + 1,
      name: row[0],
      location: row[1],
      website: row[2],
      presidentEmail: row[3],
      vpEmail: row[4],
      treasurerEmail: row[5],
      notes: row[6] || ''
    });
  }

  return associations;
}

// Check if it's an OMHA network site
function isOMHANetwork(url) {
  if (!url || url === 'Not found') return false;

  // OMHA network sites typically have these patterns
  const omhaPatterns = [
    'minorhockey.com',
    'minorhockey.ca',
    'minorhockey.net',
    'hockey.com/',
    'hockey.ca/',
    'hockey.net/'
  ];

  return omhaPatterns.some(pattern => url.toLowerCase().includes(pattern));
}

// Should we try extracting this association?
function shouldTryExtraction(assoc) {
  // Must have valid website
  if (!assoc.website || assoc.website === 'Not found') return false;

  // Must be OMHA network
  if (!isOMHANetwork(assoc.website)) return false;

  const notes = assoc.notes.toLowerCase();

  // Priority 1: Needs decoding
  if (notes.includes('email found - needs decoding') || notes.includes('emails encoded')) {
    return { priority: 1, reason: 'Encoded emails (high priority)' };
  }

  // Priority 2: No emails found
  if (assoc.presidentEmail === 'Not found' || !assoc.presidentEmail) {
    return { priority: 2, reason: 'No emails found' };
  }

  // Priority 3: Only role-based emails (could get personal emails)
  if (assoc.presidentEmail && assoc.presidentEmail.includes('@') &&
      (assoc.presidentEmail.startsWith('president@') ||
       assoc.presidentEmail.startsWith('info@'))) {
    return { priority: 3, reason: 'Only role-based emails' };
  }

  // Priority 4: Playwright notes (might work better now)
  if (notes.includes('playwright') && notes.includes('no email')) {
    return { priority: 4, reason: 'Previous Playwright attempt failed' };
  }

  return false;
}

// Main execution
const associations = parseCSV('hockey-associations-contacts.csv');
console.log(`Loaded ${associations.length} associations\n`);

// Categorize
const candidates = [];

associations.forEach(assoc => {
  const shouldTry = shouldTryExtraction(assoc);
  if (shouldTry) {
    candidates.push({
      ...assoc,
      ...shouldTry
    });
  }
});

// Sort by priority
candidates.sort((a, b) => a.priority - b.priority);

console.log(`Found ${candidates.length} OMHA network sites to extract from\n`);

// Group by priority
console.log('='.repeat(80));
console.log('EXTRACTION CANDIDATES BY PRIORITY');
console.log('='.repeat(80));

[1, 2, 3, 4].forEach(pri => {
  const priCandidates = candidates.filter(c => c.priority === pri);
  if (priCandidates.length > 0) {
    console.log(`\nPriority ${pri}: ${priCandidates[0].reason} (${priCandidates.length} associations)`);
    console.log('-'.repeat(80));
    priCandidates.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.name} (${c.location})`);
      console.log(`     Website: ${c.website}`);
      console.log(`     Current: ${c.notes.substring(0, 60)}...`);
    });
  }
});

// Create batches of 10
console.log('\n\n' + '='.repeat(80));
console.log('EXTRACTION BATCHES (10 per batch)');
console.log('='.repeat(80));

const batchSize = 10;
const numBatches = Math.ceil(candidates.length / batchSize);

for (let i = 0; i < numBatches; i++) {
  const start = i * batchSize;
  const end = Math.min(start + batchSize, candidates.length);
  const batch = candidates.slice(start, end);

  console.log(`\nBatch ${i + 1}: ${batch.length} associations`);
  batch.forEach((c, idx) => {
    console.log(`  ${idx + 1}. ${c.name} - ${c.reason}`);
  });
}

// Save to JSON for batch script
fs.writeFileSync('omha-extraction-candidates.json', JSON.stringify(candidates, null, 2));
console.log(`\n\nSaved ${candidates.length} candidates to omha-extraction-candidates.json`);
console.log(`\nTo process batch 1, run: node batch-extract-omha.js 1`);
