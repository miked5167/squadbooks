const { chromium } = require('playwright');

async function extractStaffContacts(url, associationName, expectedNames) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`\nNavigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for Cloudflare email protection to decode
    await page.waitForTimeout(2000);

    // Extract all staff information by finding patterns in the page
    const contacts = await page.evaluate(() => {
      const results = [];

      // Find all elements that might contain staff information
      // Look for divs or sections that contain names and emails
      const allElements = document.body.querySelectorAll('*');

      allElements.forEach(el => {
        const text = el.innerText || el.textContent || '';
        const emailLink = el.querySelector('a[href^="mailto:"]');

        if (emailLink && text.length < 300) {
          const email = emailLink.href.replace('mailto:', '').split('?')[0];
          results.push({
            text: text.trim(),
            email: email,
            html: el.outerHTML.substring(0, 500)
          });
        }
      });

      // Remove duplicates based on email
      const unique = [];
      const seen = new Set();

      results.forEach(item => {
        if (!seen.has(item.email)) {
          seen.add(item.email);
          unique.push(item);
        }
      });

      return unique;
    });

    // Now match the contacts with expected names
    const result = {
      association: associationName,
      contacts: {}
    };

    Object.keys(expectedNames).forEach(role => {
      const expectedName = expectedNames[role];
      // Try to find a contact that includes the expected name
      const match = contacts.find(c =>
        c.text.toLowerCase().includes(expectedName.toLowerCase())
      );

      if (match) {
        result.contacts[role] = {
          name: expectedName,
          email: match.email
        };
      } else {
        result.contacts[role] = {
          name: expectedName,
          email: 'Not found'
        };
      }
    });

    result.allContactsFound = contacts.length;

    return result;

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

    const data = await extractStaffContacts(test.url, test.name, test.expectedNames);
    results.push(data);

    // Display results
    if (data.error) {
      console.log(`ERROR: ${data.error}`);
    } else {
      console.log('\nExtracted Contacts:');
      Object.keys(data.contacts).forEach(role => {
        const contact = data.contacts[role];
        console.log(`  ${role.toUpperCase()}: ${contact.name} - ${contact.email}`);
      });
      console.log(`\nTotal email links found on page: ${data.allContactsFound}`);
    }
  }

  // Summary
  console.log('\n\n' + '='.repeat(70));
  console.log('FINAL SUMMARY - CSV UPDATE FORMAT');
  console.log('='.repeat(70));
  results.forEach(r => {
    if (!r.error) {
      console.log(`\n${r.association}:`);
      console.log(`  President Email: ${r.contacts.president?.email}`);
      console.log(`  VP Email: ${r.contacts.vp?.email}`);
      console.log(`  Treasurer Email: ${r.contacts.treasurer?.email}`);
    }
  });

  // Output JSON for programmatic use
  console.log('\n\nJSON Output:');
  console.log(JSON.stringify(results, null, 2));
})();
