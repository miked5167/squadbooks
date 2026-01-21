const { chromium } = require('playwright');

async function extractStaffContactsPrecise(url, associationName, expectedNames) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`\nNavigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for Cloudflare email protection to decode
    await page.waitForTimeout(2000);

    // Extract staff contacts with tight context matching
    const contacts = await page.evaluate((expectedNames) => {
      const results = {};

      // Find all table rows that might contain staff info
      const rows = Array.from(document.querySelectorAll('tr, .staff-member, .member, div[class*="staff"]'));

      rows.forEach(row => {
        const text = row.innerText || row.textContent || '';
        const emailLink = row.querySelector('a[href^="mailto:"]');

        if (emailLink && text.length < 500) {
          const email = emailLink.href.replace('mailto:', '').split('?')[0];

          // Check which expected name this row contains
          Object.keys(expectedNames).forEach(role => {
            const expectedName = expectedNames[role];
            const nameParts = expectedName.toLowerCase().split(' ');

            // Check if this row contains both first and last name
            const containsFullName = nameParts.every(part =>
              text.toLowerCase().includes(part)
            );

            if (containsFullName) {
              // If we haven't found this role yet, or this match has tighter context
              if (!results[role] || text.length < results[role].contextLength) {
                results[role] = {
                  name: expectedName,
                  email: email,
                  contextLength: text.length,
                  context: text.substring(0, 200)
                };
              }
            }
          });
        }
      });

      return results;
    }, expectedNames);

    return {
      association: associationName,
      contacts: contacts,
      success: Object.keys(contacts).length > 0
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
    expectedNames: {
      president: 'Shawn Pede',
      vp: 'Leon Thoonen',
      treasurer: 'Missy Walcarius'
    }
  },
  {
    name: 'Belmont Rangers',
    url: 'https://belmontminorhockey.ca/Staff/1003/',
    expectedNames: {
      president: 'Mark Landon',
      vp: 'Mallory Hesselmans',
      treasurer: 'Rob Carlisi'
    }
  },
  {
    name: 'Caledon Hawks',
    url: 'https://caledonminorhockey.ca/Staff/1523/',
    expectedNames: {
      president: 'Anthony Costa',
      vp: 'Abby Beech',
      treasurer: 'Jason Newsom'
    }
  }
];

(async () => {
  const results = [];

  for (const test of testCases) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Testing: ${test.name}`);
    console.log('='.repeat(70));

    const data = await extractStaffContactsPrecise(test.url, test.name, test.expectedNames);
    results.push(data);

    // Display results
    if (data.error) {
      console.log(`ERROR: ${data.error}`);
    } else if (data.success) {
      console.log('\nSuccessfully Extracted:');
      Object.keys(data.contacts).forEach(role => {
        const contact = data.contacts[role];
        console.log(`  ${role.toUpperCase()}: ${contact.name} - ${contact.email}`);
      });
    } else {
      console.log('No contacts found');
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(70));
  console.log('CSV UPDATE DATA');
  console.log('='.repeat(70));

  results.forEach(r => {
    if (!r.error && r.success) {
      const pres = r.contacts.president?.email || 'Not found';
      const vp = r.contacts.vp?.email || 'Not found';
      const treas = r.contacts.treasurer?.email || 'Not found';

      console.log(`\n${r.association}:`);
      console.log(`  President: ${pres}`);
      console.log(`  VP: ${vp}`);
      console.log(`  Treasurer: ${treas}`);
      console.log(`  CSV format: ${pres},${vp},${treas}`);
    }
  });
})();
