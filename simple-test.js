const { chromium } = require('playwright');
const XLSX = require('xlsx');
const fs = require('fs');

async function findWebsite(associationName, location, page) {
  try {
    const searchQuery = `${associationName} ${location} minor hockey`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1000);

    const url = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      for (const link of links) {
        const href = link.href;
        if (href.includes('http') &&
            !href.includes('google.com') &&
            !href.includes('youtube.com') &&
            !href.includes('facebook.com') &&
            !href.includes('instagram.com') &&
            (href.includes('hockey') || href.includes('mha') || href.includes('omha'))) {
          return href;
        }
      }
      return null;
    });

    return url;
  } catch (error) {
    console.log(`  Error finding website: ${error.message}`);
    return null;
  }
}

async function extractEmails(url, page) {
  const staffPages = [
    '/Staff/1003/', '/staff/1003/', '/Staff/', '/staff/',
    '/contact/', '/Contact/', '/about/', '/About/'
  ];

  for (const staffPath of staffPages) {
    try {
      const fullUrl = new URL(staffPath, url).href;
      await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);

      const contacts = await page.evaluate(() => {
        const results = {};
        const roleDivs = document.querySelectorAll('.role, [class*="position"], [class*="title"]');

        roleDivs.forEach(roleDiv => {
          const roleText = roleDiv.innerText || roleDiv.textContent || '';
          const roleLower = roleText.toLowerCase();

          let container = roleDiv.parentElement;
          for (let i = 0; i < 3 && container; i++) {
            const emailLink = container.querySelector('a[href^="mailto:"]');
            const nameElement = container.querySelector('.name, [class*="name"]');

            if (emailLink) {
              const email = emailLink.href.replace('mailto:', '').split('?')[0];
              const name = nameElement ? nameElement.innerText.trim() : '';

              if (roleLower.includes('president') && !roleLower.includes('vice') && !roleLower.includes('past')) {
                results.president = { name, email };
              } else if (roleLower.includes('vice') || roleLower.includes(' vp ')) {
                results.vp = { name, email };
              } else if (roleLower.includes('treasurer')) {
                results.treasurer = { name, email };
              }

              break;
            }
            container = container.parentElement;
          }
        });

        if (Object.keys(results).length === 0) {
          const allRows = Array.from(document.querySelectorAll('tr, li, .member, .staff-member, article'));

          allRows.forEach(row => {
            const text = row.innerText || '';
            const textLower = text.toLowerCase();
            const emailLink = row.querySelector('a[href^="mailto:"]');

            if (emailLink) {
              const email = emailLink.href.replace('mailto:', '').split('?')[0];

              if (textLower.includes('president') && !textLower.includes('vice') && !textLower.includes('past')) {
                if (!results.president) results.president = { email };
              } else if (textLower.includes('vice') || textLower.includes(' vp ')) {
                if (!results.vp) results.vp = { email };
              } else if (textLower.includes('treasurer')) {
                if (!results.treasurer) results.treasurer = { email };
              }
            }
          });
        }

        return results;
      });

      if (contacts.president || contacts.vp || contacts.treasurer) {
        return contacts;
      }
    } catch (error) {
      continue;
    }
  }

  return {};
}

async function main() {
  console.log('='.repeat(70));
  console.log('SIMPLE TEST - 5 ASSOCIATIONS');
  console.log('='.repeat(70));

  // Read Excel file
  const workbook = XLSX.readFile('c:\\Users\\miked\\Team Budget App\\Ontario Associations List.xlsx');
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const associations = XLSX.utils.sheet_to_json(worksheet).slice(0, 5);

  console.log(`Processing ${associations.length} associations...\n`);

  // Launch single browser
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const results = [];

  for (const assoc of associations) {
    const name = assoc['Association Name'];
    const location = assoc['Location'];

    console.log(`\nProcessing: ${name}`);

    // Find website
    const website = await findWebsite(name, location, page);

    if (!website) {
      console.log('  ✗ Website not found');
      results.push({
        association: name,
        location,
        website: null,
        status: 'website_not_found'
      });
      continue;
    }

    console.log(`  ✓ Found: ${website}`);

    // Extract emails
    await new Promise(resolve => setTimeout(resolve, 1000));
    const contacts = await extractEmails(website, page);

    if (contacts.president || contacts.vp || contacts.treasurer) {
      console.log(`  ✓ President: ${contacts.president?.email || 'Not found'}`);
      console.log(`  ✓ VP: ${contacts.vp?.email || 'Not found'}`);
      console.log(`  ✓ Treasurer: ${contacts.treasurer?.email || 'Not found'}`);

      results.push({
        association: name,
        location,
        website,
        status: 'success',
        ...contacts
      });
    } else {
      console.log('  ✗ No contacts found');
      results.push({
        association: name,
        location,
        website,
        status: 'no_contacts_found'
      });
    }
  }

  await browser.close();

  // Save results
  if (!fs.existsSync('./test-extraction')) {
    fs.mkdirSync('./test-extraction');
  }

  fs.writeFileSync('./test-extraction/simple-test-results.json', JSON.stringify(results, null, 2));

  console.log('\n' + '='.repeat(70));
  console.log('TEST COMPLETE');
  console.log('='.repeat(70));

  const successful = results.filter(r => r.status === 'success').length;
  console.log(`\nSuccess rate: ${successful}/${results.length} (${((successful / results.length) * 100).toFixed(1)}%)`);
  console.log(`Results saved to: ./test-extraction/simple-test-results.json`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
