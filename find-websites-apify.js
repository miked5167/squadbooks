const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel file
const workbook = XLSX.readFile('c:\\Users\\miked\\Team Budget App\\Ontario Associations List.xlsx');
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const allAssociations = XLSX.utils.sheet_to_json(worksheet);

// Already processed associations
const processed = [
  'Arthur Vipers', 'Aurora Tigers', 'Aylmer Flames', 'Barrie Colts',
  'Beeton Stingers', 'Belmont Rangers', 'Bradford Bulldogs', 'Caledon Hawks',
  'Colborne Fire Hawks', 'Collingwood Jr Blues', 'Deseronto Bulldogs',
  'East Gwillimbury Eagles', 'Embro Edge', 'Essex Ravens', 'Georgina Blaze',
  'Hanover Falcons', 'Ingersoll Express'
];

// Get next batch to process
const BATCH_SIZE = 25;
const toProcess = allAssociations
  .filter(a => !processed.includes(a['Association Name']))
  .slice(0, BATCH_SIZE);

console.log('Next batch of associations to find websites for:\n');
console.log('Use the Apify RAG Web Browser with these search queries:');
console.log('='.repeat(70));

toProcess.forEach((assoc, index) => {
  const searchQuery = `${assoc['Association Name']} ${assoc['Location']} minor hockey official website`;
  console.log(`${index + 1}. ${assoc['Association Name']}`);
  console.log(`   Search: "${searchQuery}"`);
  console.log(`   Location: ${assoc['Location']}`);
  console.log('');
});

// Save to a file for batch processing
const searchQueries = toProcess.map(a => ({
  association: a['Association Name'],
  location: a['Location'],
  searchQuery: `${a['Association Name']} ${a['Location']} minor hockey official website`
}));

fs.writeFileSync('next-batch-queries.json', JSON.stringify(searchQueries, null, 2));
console.log(`\n✓ Saved ${searchQueries.length} search queries to next-batch-queries.json`);
