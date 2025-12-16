const { chromium } = require('playwright');

async function extractByRole(url, associationName) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    const contacts = await page.evaluate(() => {
      const results = {};

      // Find all role divs or elements containing position titles
      const roleDivs = document.querySelectorAll('.role, [class*="position"], [class*="title"]');

      roleDivs.forEach(roleDiv => {
        const roleText = roleDiv.innerText || roleDiv.textContent || '';
        const roleLower = roleText.toLowerCase();

        // Find the parent container
        let container = roleDiv.parentElement;
        for (let i = 0; i < 3 && container; i++) {
          // Look for email in this container and its siblings
          const emailLink = container.querySelector('a[href^="mailto:"]');
          const nameElement = container.querySelector('.name, [class*="name"]');

          if (emailLink) {
            const email = emailLink.href.replace('mailto:', '').split('?')[0];
            const name = nameElement ? nameElement.innerText.trim() : '';

            // Categorize by role
            if (roleLower.includes('president') && !roleLower.includes('vice') && !roleLower.includes('past')) {
              results.president = {
                role: roleText.trim(),
                name: name,
                email: email
              };
            } else if (roleLower.includes('vice') || roleLower.includes(' vp ')) {
              results.vp = {
                role: roleText.trim(),
                name: name,
                email: email
              };
            } else if (roleLower.includes('treasurer')) {
              results.treasurer = {
                role: roleText.trim(),
                name: name,
                email: email
              };
            }

            break; // Found email, no need to go further up
          }

          container = container.parentElement;
        }
      });

      // If we didn't find with .role class, try alternative approach
      if (Object.keys(results).length === 0) {
        // Look for common patterns in table rows or list items
        const allRows = Array.from(document.querySelectorAll('tr, li, .member, .staff-member, article'));

        allRows.forEach(row => {
          const text = row.innerText || '';
          const textLower = text.toLowerCase();
          const emailLink = row.querySelector('a[href^="mailto:"]');

          if (emailLink) {
            const email = emailLink.href.replace('mailto:', '').split('?')[0];

            if (textLower.includes('president') && !textLower.includes('vice') && !textLower.includes('past')) {
              if (!results.president) {
                results.president = {
                  context: text.substring(0, 100),
                  email: email
                };
              }
            } else if (textLower.includes('vice') || textLower.includes(' vp ')) {
              if (!results.vp) {
                results.vp = {
                  context: text.substring(0, 100),
                  email: email
                };
              }
            } else if (textLower.includes('treasurer')) {
              if (!results.treasurer) {
                results.treasurer = {
                  context: text.substring(0, 100),
                  email: email
                };
              }
            }
          }
        });
      }

      return results;
    });

    return {
      association: associationName,
      ...contacts
    };

  } catch (error) {
    return {
      association: associationName,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

const testCases = [
  { name: 'Aylmer Flames', url: 'https://aylmerflames.com/Staff/1003/' },
  { name: 'Belmont Rangers', url: 'https://belmontminorhockey.ca/Staff/1003/' },
  { name: 'Caledon Hawks', url: 'https://caledonminorhockey.ca/Staff/1523/' }
];

(async () => {
  const allResults = [];

  for (const test of testCases) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Extracting: ${test.name}`);
    console.log('='.repeat(70));

    const result = await extractByRole(test.url, test.name);
    allResults.push(result);

    if (result.error) {
      console.log(`ERROR: ${result.error}`);
    } else {
      console.log(`President: ${result.president?.email || 'Not found'}`);
      if (result.president?.name) console.log(`  Name: ${result.president.name}`);
      if (result.president?.role) console.log(`  Role: ${result.president.role}`);

      console.log(`VP: ${result.vp?.email || 'Not found'}`);
      if (result.vp?.name) console.log(`  Name: ${result.vp.name}`);
      if (result.vp?.role) console.log(`  Role: ${result.vp.role}`);

      console.log(`Treasurer: ${result.treasurer?.email || 'Not found'}`);
      if (result.treasurer?.name) console.log(`  Name: ${result.treasurer.name}`);
      if (result.treasurer?.role) console.log(`  Role: ${result.treasurer.role}`);
    }
  }

  console.log('\n\n' + '='.repeat(70));
  console.log('CSV FORMAT OUTPUT');
  console.log('='.repeat(70));
  console.log('Association,President Email,VP Email,Treasurer Email');
  allResults.forEach(r => {
    const pres = r.president?.email || 'Not found';
    const vp = r.vp?.email || 'Not found';
    const treas = r.treasurer?.email || 'Not found';
    console.log(`${r.association},${pres},${vp},${treas}`);
  });
})();
