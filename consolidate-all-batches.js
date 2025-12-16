const fs = require('fs');
const path = require('path');

// List of batch result files to consolidate
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
  'batch-131-140-results.json',
  'new-batch-141-160-results.json',
  'batch-161-180-results.json',
  'batch-181-200-results.json',
  'batch-201-220-results.json',
  'batch-221-240-results.json'
];

const allAssociations = [];
let filesProcessed = 0;
let filesSkipped = 0;

console.log('='.repeat(80));
console.log('CONSOLIDATING ALL BATCH RESULTS');
console.log('='.repeat(80));

batchFiles.forEach(filename => {
  const filepath = path.join(__dirname, filename);

  if (fs.existsSync(filepath)) {
    try {
      const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

      // Handle both array and single object formats
      const associations = Array.isArray(data) ? data : [data];

      allAssociations.push(...associations);
      filesProcessed++;
      console.log(`✓ Loaded ${filename}: ${associations.length} associations`);
    } catch (err) {
      console.log(`✗ Error reading ${filename}: ${err.message}`);
      filesSkipped++;
    }
  } else {
    console.log(`⊘ File not found: ${filename}`);
    filesSkipped++;
  }
});

console.log('\n' + '='.repeat(80));
console.log(`Files processed: ${filesProcessed}`);
console.log(`Files skipped: ${filesSkipped}`);
console.log(`Total associations: ${allAssociations.length}`);
console.log('='.repeat(80));

// Sort by index
allAssociations.sort((a, b) => (a.index || 0) - (b.index || 0));

// Create CSV with all emails
// Format: Index,Association Name,Location,Website URL,President Name,President Email,VP Name,VP Email,Treasurer Name,Treasurer Email,Source,Notes
const csvHeader = 'Index,Association Name,Location,Website URL,President Name,President Email,VP Name,VP Email,Treasurer Name,Treasurer Email,Source,Notes';

const csvRows = allAssociations.map(assoc => {
  // Escape quotes in fields and handle null/undefined values
  const escape = (str) => {
    if (!str || str === 'null' || str === 'undefined') return '';
    return `"${String(str).replace(/"/g, '""')}"`;
  };

  const index = assoc.index || '';
  const name = escape(assoc.name);
  const location = escape(assoc.location);
  const website = escape(assoc.website);

  const presidentName = escape(assoc.president?.name);
  const presidentEmail = escape(assoc.president?.email);

  const vpName = escape(assoc.vp?.name);
  const vpEmail = escape(assoc.vp?.email);

  const treasurerName = escape(assoc.treasurer?.name);
  const treasurerEmail = escape(assoc.treasurer?.email);

  const source = escape(assoc.source);
  const note = escape(assoc.note);

  return `${index},${name},${location},${website},${presidentName},${presidentEmail},${vpName},${vpEmail},${treasurerName},${treasurerEmail},${source},${note}`;
});

const fullCsv = csvHeader + '\n' + csvRows.join('\n');

// Write to file
const outputFile = 'all-batches-consolidated.csv';
fs.writeFileSync(outputFile, fullCsv);

console.log(`\n✓ Created ${outputFile} with ${allAssociations.length} associations`);
console.log(`  Columns: Index, Association Name, Location, Website, President (Name/Email), VP (Name/Email), Treasurer (Name/Email), Source, Notes`);

// Also create a summary
const emailStats = {
  totalAssociations: allAssociations.length,
  withPresidentEmail: allAssociations.filter(a => a.president?.email && a.president.email !== 'protected' && a.president.email !== 'contact form only' && a.president.email !== 'Not available').length,
  withVPEmail: allAssociations.filter(a => a.vp?.email && a.vp.email !== 'protected' && a.vp.email !== 'contact form only').length,
  withTreasurerEmail: allAssociations.filter(a => a.treasurer?.email && a.treasurer.email !== 'protected' && a.treasurer.email !== 'contact form only').length,
  withAllThree: allAssociations.filter(a =>
    a.president?.email && a.president.email !== 'protected' && a.president.email !== 'contact form only' && a.president.email !== 'Not available' &&
    a.vp?.email && a.vp.email !== 'protected' && a.vp.email !== 'contact form only' &&
    a.treasurer?.email && a.treasurer.email !== 'protected' && a.treasurer.email !== 'contact form only'
  ).length,
  cloudflareProtected: allAssociations.filter(a =>
    (a.president?.email === 'protected') ||
    (a.vp?.email === 'protected') ||
    (a.treasurer?.email === 'protected')
  ).length,
  contactFormOnly: allAssociations.filter(a =>
    (a.president?.email === 'contact form only') ||
    (a.vp?.email === 'contact form only') ||
    (a.treasurer?.email === 'contact form only')
  ).length
};

console.log('\n' + '='.repeat(80));
console.log('EMAIL EXTRACTION SUMMARY');
console.log('='.repeat(80));
console.log(`Total associations processed: ${emailStats.totalAssociations}`);
console.log(`With President email: ${emailStats.withPresidentEmail} (${Math.round(emailStats.withPresidentEmail / emailStats.totalAssociations * 100)}%)`);
console.log(`With VP email: ${emailStats.withVPEmail} (${Math.round(emailStats.withVPEmail / emailStats.totalAssociations * 100)}%)`);
console.log(`With Treasurer email: ${emailStats.withTreasurerEmail} (${Math.round(emailStats.withTreasurerEmail / emailStats.totalAssociations * 100)}%)`);
console.log(`With all three emails: ${emailStats.withAllThree} (${Math.round(emailStats.withAllThree / emailStats.totalAssociations * 100)}%)`);
console.log(`Cloudflare protected: ${emailStats.cloudflareProtected}`);
console.log(`Contact form only: ${emailStats.contactFormOnly}`);
console.log('='.repeat(80));

// Save summary to JSON
fs.writeFileSync('extraction-summary.json', JSON.stringify({
  stats: emailStats,
  generatedAt: new Date().toISOString(),
  totalAssociations: allAssociations.length,
  batchesProcessed: filesProcessed
}, null, 2));

console.log('\n✓ Summary saved to extraction-summary.json');
