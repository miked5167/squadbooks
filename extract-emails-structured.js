const { chromium } = require('playwright');

async function extractStaffContacts(url, associationName) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`\nNavigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for Cloudflare email protection to decode
    await page.waitForTimeout(2000);

    // Extract structured contact information from the staff table
    const contacts = await page.evaluate(() => {
      const staffRows = Array.from(document.querySelectorAll('tr'));
      const results = [];

      staffRows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 3) {
          const position = cells[0]?.innerText.trim() || '';
          const name = cells[1]?.innerText.trim() || '';
          const emailLink = cells[2]?.querySelector('a[href^="mailto:"]');
          const email = emailLink ? emailLink.href.replace('mailto:', '').split('?')[0] : '';

          if (position && name && email) {
            results.push({
              position: position,
              name: name,
              email: email
            });
          }
        }
      });

      return results;
    });

    // Filter for President, VP, and Treasurer
    const president = contacts.find(c =>
      c.position.toLowerCase().includes('president') && !c.position.toLowerCase().includes('vice')
    );
    const vp = contacts.find(c =>
      c.position.toLowerCase().includes('vice') || c.position.toLowerCase().includes('vp')
    );
    const treasurer = contacts.find(c =>
      c.position.toLowerCase().includes('treasurer')
    );

    return {
      association: associationName,
      president: president || null,
      vp: vp || null,
      treasurer: treasurer || null,
      allContacts: contacts
    };

  } catch (error) {
    console.error('Error:', error.message);
    return {
      association: associationName,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

// Test the 3 associations
const testCases = [
  {
    name: 'Aylmer Flames',
    url: 'https://aylmerflames.com/Staff/1003/',
    expectedPresident: 'Shawn Pede',
    expectedVP: 'Leon Thoonen',
    expectedTreasurer: 'Missy Walcarius'
  },
  {
    name: 'Belmont Rangers',
    url: 'https://belmontminorhockey.ca/Staff/1003/',
    expectedPresident: 'Mark Landon',
    expectedVP: 'Mallory Hesselmans',
    expectedTreasurer: 'Rob Carlisi'
  },
  {
    name: 'Caledon Hawks',
    url: 'https://caledonminorhockey.ca/Staff/1523/',
    expectedPresident: 'Anthony Costa',
    expectedVP: 'Abby Beech',
    expectedTreasurer: 'Jason Newsom'
  }
];

(async () => {
  const results = [];

  for (const test of testCases) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Testing: ${test.name}`);
    console.log(`Expected - President: ${test.expectedPresident}, VP: ${test.expectedVP}, Treasurer: ${test.expectedTreasurer}`);
    console.log('='.repeat(70));

    const data = await extractStaffContacts(test.url, test.name);
    results.push(data);

    // Display results
    if (data.error) {
      console.log(`ERROR: ${data.error}`);
    } else {
      console.log('\nExtracted Key Contacts:');
      console.log(`  President: ${data.president?.name || 'Not found'} - ${data.president?.email || 'N/A'}`);
      console.log(`  VP: ${data.vp?.name || 'Not found'} - ${data.vp?.email || 'N/A'}`);
      console.log(`  Treasurer: ${data.treasurer?.name || 'Not found'} - ${data.treasurer?.email || 'N/A'}`);
      console.log(`\nTotal contacts found: ${data.allContacts?.length || 0}`);
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(70));
  console.log('FINAL SUMMARY - CSV FORMAT');
  console.log('='.repeat(70));
  console.log('Association,President Email,VP Email,Treasurer Email');
  results.forEach(r => {
    if (!r.error) {
      console.log(`${r.association},${r.president?.email || 'Not found'},${r.vp?.email || 'Not found'},${r.treasurer?.email || 'Not found'}`);
    }
  });

  console.log('\n\nFull JSON Results:');
  console.log(JSON.stringify(results, null, 2));
})();
