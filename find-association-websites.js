const { chromium } = require('playwright');
const XLSX = require('xlsx');
const fs = require('fs');

async function findWebsite(associationName, location, browser) {
  const page = await browser.newPage();

  try {
    // Search Google for the association
    const searchQuery = `${associationName} ${location} minor hockey`;
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

    console.log(`  Searching: ${associationName}...`);
    await page.goto(googleUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);

    // Extract the first organic search result
    const firstResult = await page.evaluate(() => {
      const searchResults = document.querySelectorAll('div.g a[href^="http"]');
      for (const link of searchResults) {
        const href = link.href;
        // Filter out Google's own links and common non-official sites
        if (!href.includes('google.com') &&
            !href.includes('facebook.com') &&
            !href.includes('twitter.com') &&
            !href.includes('instagram.com') &&
            !href.includes('youtube.com')) {
          return href;
        }
      }
      return null;
    });

    if (firstResult) {
      console.log(`    ✓ Found: ${firstResult}`);
      return {
        association: associationName,
        location: location,
        website: firstResult,
        found: true
      };
    } else {
      console.log(`    ✗ No website found`);
      return {
        association: associationName,
        location: location,
        website: null,
        found: false
      };
    }

  } catch (error) {
    console.error(`    ERROR: ${error.message}`);
    return {
      association: associationName,
      location: location,
      website: null,
      found: false,
      error: error.message
    };
  } finally {
    await page.close();
  }
}

async function main() {
  // Read the Excel file
  const workbook = XLSX.readFile('c:\\Users\\miked\\Team Budget App\\Ontario Associations List.xlsx');
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const allAssociations = XLSX.utils.sheet_to_json(worksheet);

  console.log(`Total associations in source: ${allAssociations.length}`);

  // Already processed associations
  const processed = [
    'Arthur Vipers', 'Aurora Tigers', 'Aylmer Flames', 'Barrie Colts',
    'Beeton Stingers', 'Belmont Rangers', 'Bradford Bulldogs', 'Caledon Hawks',
    'Colborne Fire Hawks', 'Collingwood Jr Blues', 'Deseronto Bulldogs',
    'East Gwillimbury Eagles', 'Embro Edge', 'Essex Ravens', 'Georgina Blaze',
    'Hanover Falcons', 'Ingersoll Express'
  ];

  // Get next batch to process (let's do 25 at a time)
  const BATCH_SIZE = 25;
  const toProcess = allAssociations
    .filter(a => !processed.includes(a['Association Name']))
    .slice(0, BATCH_SIZE);

  console.log(`Processing next ${toProcess.length} associations...\n`);
  console.log('='.repeat(70));

  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const assoc of toProcess) {
    const result = await findWebsite(
      assoc['Association Name'],
      assoc['Location'],
      browser
    );
    results.push(result);

    // Be nice to Google - add delay between searches
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('WEBSITE DISCOVERY SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total processed: ${results.length}`);
  console.log(`Found: ${results.filter(r => r.found).length}`);
  console.log(`Not found: ${results.filter(r => !r.found).length}`);

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `websites-batch-${timestamp}.json`;
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\n✓ Results saved to ${filename}`);

  // Output for easy copy-paste to extraction script
  console.log('\n' + '='.repeat(70));
  console.log('FORMAT FOR EXTRACTION SCRIPT:');
  console.log('='.repeat(70));
  results.filter(r => r.found).forEach(r => {
    console.log(`  { name: '${r.association}', url: '${r.website}/Staff/1003/' },`);
  });
}

main().catch(console.error);
