const XLSX = require('xlsx');

// Read the Excel file
const workbook = XLSX.readFile('c:\\Users\\miked\\Team Budget App\\Ontario Associations List.xlsx');
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const allAssociations = XLSX.utils.sheet_to_json(worksheet);

console.log(`Total associations in source: ${allAssociations.length}`);

// Already processed associations (from CSV)
const processed = [
  'Arthur Vipers', 'Aurora Tigers', 'Aylmer Flames', 'Barrie Colts',
  'Beeton Stingers', 'Belmont Rangers', 'Bradford Bulldogs', 'Caledon Hawks',
  'Colborne Fire Hawks', 'Collingwood Jr Blues', 'Deseronto Bulldogs',
  'East Gwillimbury Eagles', 'Embro Edge', 'Essex Ravens', 'Georgina Blaze',
  'Hanover Falcons', 'Ingersoll Express', 'Almaguin Ice Devils',
  'Almonte Pakenham Thunder', 'Arnprior Packers', 'Atikokan Voyageurs',
  'Baltimore Ice Dogs', 'Almaguin Gazelles', 'Ancaster Avalanche',
  'Applewood Coyotes', 'Arran-Elderslie Ice Dogs', 'Ausable Valley Coyotes',
  'Ajax Pickering Raiders', 'Akwesasne Wolves', 'Alexandria Glens',
  'Avenue Road Ducks', 'Ayr Flames', 'Bancroft Jets',
  'Belle River Jr Canadiens', 'Belleville Jr Bulls', 'BioSteel Sports Academy',
  'Barrie Sharks', 'Ayr Rockets', 'Barrie Colts AAA',
  'Belleville Bearcats', 'Belmont Blazers', 'Bluewater Hawks',
  'Borden', 'Bracebridge', 'Brampton', 'Brant County'
];

// Get next batch to process
const BATCH_SIZE = 10;
const toProcess = allAssociations
  .filter(a => !processed.includes(a['Association Name']))
  .slice(0, BATCH_SIZE);

console.log(`\nNext ${toProcess.length} associations to process:\n`);
toProcess.forEach((assoc, index) => {
  console.log(`${index + 1}. ${assoc['Association Name']} (${assoc['Location']})`);
});
