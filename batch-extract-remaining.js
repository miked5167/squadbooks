const { chromium } = require('playwright');
const fs = require('fs');

async function extractByRole(url, associationName) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`\nProcessing: ${associationName}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const contacts = await page.evaluate(() => {
      const results = {};

      // Find all role divs
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
              results.president = { role: roleText.trim(), name: name, email: email };
            } else if (roleLower.includes('vice') || roleLower.includes(' vp ')) {
              results.vp = { role: roleText.trim(), name: name, email: email };
            } else if (roleLower.includes('treasurer')) {
              results.treasurer = { role: roleText.trim(), name: name, email: email };
            }

            break;
          }
          container = container.parentElement;
        }
      });

      // Fallback: look in table rows or list items
      if (Object.keys(results).length === 0) {
        const allRows = Array.from(document.querySelectorAll('tr, li, .member, .staff-member, article'));

        allRows.forEach(row => {
          const text = row.innerText || '';
          const textLower = text.toLowerCase();
          const emailLink = row.querySelector('a[href^="mailto:"]');

          if (emailLink) {
            const email = emailLink.href.replace('mailto:', '').split('?')[0];

            if (textLower.includes('president') && !textLower.includes('vice') && !textLower.includes('past')) {
              if (!results.president) results.president = { context: text.substring(0, 100), email: email };
            } else if (textLower.includes('vice') || textLower.includes(' vp ')) {
              if (!results.vp) results.vp = { context: text.substring(0, 100), email: email };
            } else if (textLower.includes('treasurer')) {
              if (!results.treasurer) results.treasurer = { context: text.substring(0, 100), email: email };
            }
          }
        });
      }

      return results;
    });

    return {
      association: associationName,
      url: url,
      success: true,
      ...contacts
    };

  } catch (error) {
    console.error(`  ERROR: ${error.message}`);
    return {
      association: associationName,
      url: url,
      success: false,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

const remainingAssociations = [
  { name: 'Beeton Stingers', url: 'https://beetonstingers.com/Staff/1003/' },
  { name: 'Colborne Fire Hawks', url: 'https://ccmhafirehawks.com/Staff/1003/' },
  { name: 'Collingwood Jr Blues', url: 'https://collingwoodhockey.com/Staff/1003/' },
  { name: 'Deseronto Bulldogs', url: 'https://ddmha.ca/Staff/1003/' },
  { name: 'East Gwillimbury Eagles', url: 'https://egmha.com/Staff/1003/' },
  { name: 'Embro Edge', url: 'https://embrohockey.com/Staff/1003/' },
  { name: 'Essex Ravens', url: 'https://essex-southpoint.com/Staff/1003/' },
  { name: 'Georgina Blaze', url: 'https://georginahockey.com/Staff/1003/' },
  { name: 'Hanover Falcons', url: 'https://saugeenvalleyminorhockey.com/Staff/1003/' },
  { name: 'Ingersoll Express', url: 'https://ingersollminorhockey.ca/Staff/1003/' }
];

(async () => {
  const allResults = [];

  console.log('=' .repeat(70));
  console.log('BATCH PROCESSING REMAINING PROTECTED ASSOCIATIONS');
  console.log('='.repeat(70));

  for (const assoc of remainingAssociations) {
    const result = await extractByRole(assoc.url, assoc.name);
    allResults.push(result);

    if (result.success) {
      console.log(`  ✓ President: ${result.president?.email || 'Not found'}`);
      console.log(`  ✓ VP: ${result.vp?.email || 'Not found'}`);
      console.log(`  ✓ Treasurer: ${result.treasurer?.email || 'Not found'}`);
    } else {
      console.log(`  ✗ Failed to extract`);
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(70));
  console.log('EXTRACTION SUMMARY');
  console.log('='.repeat(70));

  const successful = allResults.filter(r => r.success);
  const failed = allResults.filter(r => !r.success);

  console.log(`Total processed: ${allResults.length}`);
  console.log(`Successful: ${successful.length}`);
  console.log(`Failed: ${failed.length}`);

  console.log('\n' + '='.repeat(70));
  console.log('CSV FORMAT OUTPUT');
  console.log('='.repeat(70));

  allResults.forEach(r => {
    if (r.success) {
      const pres = r.president?.email || 'Not found';
      const vp = r.vp?.email || 'Not found';
      const treas = r.treasurer?.email || 'Not found';
      console.log(`${r.association}|${pres}|${vp}|${treas}`);
    }
  });

  // Save to JSON for easier processing
  fs.writeFileSync('extraction-results.json', JSON.stringify(allResults, null, 2));
  console.log('\n✓ Results saved to extraction-results.json');
})();
