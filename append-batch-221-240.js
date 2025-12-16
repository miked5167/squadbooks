const fs = require('fs');

// Read the batch 221-240 results
const batch = JSON.parse(fs.readFileSync('batch-221-240-results.json', 'utf8'));

// Convert to CSV rows matching hockey-associations-contacts.csv format
// Format: Association Name,Location,Website URL,President Email,VP Email,Treasurer Email,Notes
const csvRows = batch.map(assoc => {
  const presidentEmail = assoc.president?.email || 'Not found';
  const vpEmail = assoc.vp?.email || 'Not listed';
  const treasurerEmail = assoc.treasurer?.email || 'Not found';

  // Build notes including names and any special notes
  const notes = [];
  if (assoc.president?.name && assoc.president.name !== 'Not available' && assoc.president.name !== 'Vacant') {
    notes.push(`President: ${assoc.president.name}`);
  }
  if (assoc.vp?.name) {
    notes.push(`VP: ${assoc.vp.name}`);
  }
  if (assoc.treasurer?.name) {
    notes.push(`Treasurer: ${assoc.treasurer.name}`);
  }
  if (assoc.note) {
    notes.push(assoc.note);
  }

  const notesStr = notes.join(' | ');

  return `"${assoc.name}","${assoc.location}",${assoc.website},"${presidentEmail}","${vpEmail}","${treasurerEmail}","${notesStr}"`;
});

// Read existing CSV to check for duplicates
const existingCsv = fs.readFileSync('hockey-associations-contacts.csv', 'utf8');
const existingLines = existingCsv.split('\n');

// Append new rows
const newRows = csvRows.filter(row => {
  // Extract association name from the row to check for duplicates
  const match = row.match(/^"([^"]+)"/);
  const assocName = match ? match[1] : '';
  return !existingCsv.includes(`"${assocName}"`);
});

if (newRows.length > 0) {
  // Append to file (without adding extra header)
  const toAppend = '\n' + newRows.join('\n');
  fs.appendFileSync('hockey-associations-contacts.csv', toAppend);
  console.log(`✓ Appended ${newRows.length} associations to hockey-associations-contacts.csv`);
  console.log(`  Total associations now: ${existingLines.length - 1 + newRows.length}`);
} else {
  console.log('No new associations to append (all already exist in CSV)');
}

// Also create a standalone CSV for batch 221-240
const standaloneCsv = 'Association Name,Location,Website URL,President Email,VP Email,Treasurer Email,Notes\n' + csvRows.join('\n');
fs.writeFileSync('batch-221-240-results.csv', standaloneCsv);
console.log(`✓ Created batch-221-240-results.csv with ${batch.length} associations`);
