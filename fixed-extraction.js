const { chromium } = require('playwright');
const fs = require('fs');

/**
 * FIXED EXTRACTION SCRIPT
 * Now using correct card-based div selectors instead of table selectors
 * The 3-second wait DOES work - emails are already decoded as mailto: links!
 */

// Test batch
const TEST_ASSOCIATIONS = [
  {
    name: 'Ingersoll Express',
    location: 'Ingersoll, ON',
    website: 'https://ingersollminorhockey.ca',
    staffPage: 'https://ingersollminorhockey.ca/Staff/1003/',
    group: 'Test - Previously Successful'
  },
  {
    name: 'Beeton Stingers',
    location: 'Beeton, ON',
    website: 'https://beetonstingers.com',
    staffPage: 'https://beetonstingers.com/Staff/1003/',
    group: 'Test - Previously Successful'
  },
  {
    name: 'Georgina Blaze',
    location: 'Keswick, ON',
    website: 'https://georginahockey.com',
    staffPage: 'https://georginahockey.com/Staff/1003/',
    group: 'Test - Previously Successful'
  }
];

// All priority associations from retry-extraction-plan.json
const ALL_ASSOCIATIONS = [
  ...TEST_ASSOCIATIONS,
  {
    name: 'Ajax Pickering Raiders',
    location: 'Ajax, ON',
    website: 'https://ajaxpickeringminorhockey.com',
    staffPage: 'https://ajaxpickeringminorhockey.com/Staff/1003/',
    group: 'OMHA Network'
  },
  {
    name: 'Almaguin Ice Devils',
    location: 'Sundridge, ON',
    website: 'https://almaguinminorhockey.com',
    staffPage: 'https://almaguinminorhockey.com/Staff/1003/',
    group: 'Cloudflare Encoded'
  },
  {
    name: 'Arnprior Packers',
    location: 'Arnprior, ON',
    website: 'https://arnpriorminorhockey.ca',
    staffPage: 'https://arnpriorminorhockey.ca/Staff/1003/',
    group: 'Cloudflare Encoded'
  },
  {
    name: 'Colborne Fire Hawks',
    location: 'Colborne, ON',
    website: 'https://ccmhafirehawks.com',
    staffPage: 'https://ccmhafirehawks.com/Staff/1003/',
    group: 'Playwright Retry'
  },
  {
    name: 'Barrie Colts',
    location: 'Barrie, ON',
    website: 'https://barrieminorhockey.net',
    staffPage: 'https://barrieminorhockey.net/Staff/1003/',
    group: 'Playwright Retry'
  },
  {
    name: 'Copper Cliff Reds',
    location: 'Copper Cliff, ON',
    website: 'http://coppercliffminorhockey.com',
    staffPage: 'http://coppercliffminorhockey.com/Staff/1003/',
    group: 'Playwright Retry'
  }
];

// URL patterns to try
const URL_PATTERNS = [
  '/Staff/1003/',
  '/staff/1003/',
  '/Contact/',
  '/contact/',
  '/About/',
  '/about/',
  '/Board/',
  '/board/',
  '/Executive/',
  '/executive/'
];

/**
 * Extract contacts using CORRECT card-based structure
 */
async function extractContacts(page) {
  return await page.evaluate(() => {
    const results = [];

    // Look for contact cards (the actual structure used by OMHA sites)
    const contactCards = document.querySelectorAll('.contact, .staff-member, .carousel-item');

    contactCards.forEach(card => {
      // Find role within this card
      const roleEl = card.querySelector('.role, [class*="position"]');
      const nameEl = card.querySelector('.name, [class*="name"]');
      const emailLink = card.querySelector('a[href^="mailto:"]');

      if (emailLink && roleEl) {
        const role = roleEl.innerText?.trim() || '';
        const name = nameEl?.innerText?.trim() || '';
        const email = emailLink.href.replace('mailto:', '').split('?')[0];

        if (role && email) {
          results.push({
            position: role,
            name: name,
            email: email
          });
        }
      }
    });

    return results;
  });
}

/**
 * Categorize contacts by role
 */
function categorizeContacts(contacts) {
  const result = {};

  contacts.forEach(contact => {
    const roleText = contact.position.toLowerCase();

    if (roleText.includes('president') && !roleText.includes('vice') && !roleText.includes('past')) {
      if (!result.president) {
        result.president = {
          role: contact.position,
          name: contact.name,
          email: contact.email
        };
      }
    } else if (roleText.includes('vice') || roleText.includes(' vp ')) {
      if (!result.vp) {
        result.vp = {
          role: contact.position,
          name: contact.name,
          email: contact.email
        };
      }
    } else if (roleText.includes('treasurer')) {
      if (!result.treasurer) {
        result.treasurer = {
          role: contact.position,
          name: contact.name,
          email: contact.email
        };
      }
    }
  });

  return result;
}

/**
 * Extract from a specific URL
 */
async function extractFromUrl(browser, url, associationName) {
  const page = await browser.newPage();

  try {
    console.log(`  Trying: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // CRITICAL: Wait 3 seconds for clientside email decoding
    await page.waitForTimeout(3000);

    // Extract contacts
    let contacts = await extractContacts(page);

    console.log(`  Found ${contacts.length} contact(s) with email addresses`);

    await page.close();

    // Categorize contacts
    const categorized = categorizeContacts(contacts);

    // Check if we found at least one key contact
    if (categorized.president || categorized.treasurer) {
      return {
        association: associationName,
        url: url,
        success: true,
        totalContacts: contacts.length,
        ...categorized
      };
    }

    return {
      association: associationName,
      url: url,
      success: false,
      totalContacts: contacts.length,
      error: 'No key contacts found (President or Treasurer required)'
    };

  } catch (error) {
    await page.close();
    return {
      association: associationName,
      url: url,
      success: false,
      error: error.message
    };
  }
}

/**
 * Try multiple URL patterns
 */
async function tryMultipleUrls(association) {
  const browser = await chromium.launch({ headless: true });

  try {
    // Try the known staff page first
    if (association.staffPage) {
      const result = await extractFromUrl(browser, association.staffPage, association.name);
      if (result.success) {
        await browser.close();
        return result;
      }
    }

    // Try different URL patterns
    for (const pattern of URL_PATTERNS) {
      const url = association.website.replace(/\/$/, '') + pattern;
      const result = await extractFromUrl(browser, url, association.name);

      if (result.success) {
        await browser.close();
        return result;
      }
    }

    // No success
    await browser.close();
    return {
      association: association.name,
      success: false,
      error: 'No contacts found with any URL pattern'
    };

  } catch (error) {
    await browser.close();
    return {
      association: association.name,
      success: false,
      error: error.message
    };
  }
}

/**
 * Save results to CSV
 */
function saveToCSV(results, filename) {
  const csvLines = ['Association,Location,President Email,VP Email,Treasurer Email,President Name,VP Name,Treasurer Name,Total Contacts,Notes,Group'];

  results.forEach(r => {
    const pres = r.president?.email || 'Not found';
    const vp = r.vp?.email || 'Not found';
    const treas = r.treasurer?.email || 'Not found';
    const presName = r.president?.name || '';
    const vpName = r.vp?.name || '';
    const treasName = r.treasurer?.name || '';
    const totalContacts = r.totalContacts || 0;
    const notes = r.success ? `SUCCESS - Extracted from ${r.url}` : `Failed: ${r.error}`;
    const group = r.group || '';
    const location = r.location || '';

    csvLines.push(`"${r.association}","${location}","${pres}","${vp}","${treas}","${presName}","${vpName}","${treasName}",${totalContacts},"${notes}","${group}"`);
  });

  fs.writeFileSync(filename, csvLines.join('\n'));
}

/**
 * Main execution
 */
(async () => {
  console.log('='.repeat(80));
  console.log('FIXED EXTRACTION - USING CORRECT CARD-BASED SELECTORS');
  console.log('='.repeat(80));
  console.log('\nKey insight: Emails ARE decoded - they\'re plain mailto: links!');
  console.log('Issue was wrong selectors (looking for tables instead of cards)\n');

  const args = process.argv.slice(2);
  const runMode = args[0] || 'test'; // 'test' or 'all'

  let associations = runMode === 'all' ? ALL_ASSOCIATIONS : TEST_ASSOCIATIONS;

  console.log(`Processing ${associations.length} association(s)...\n`);

  const results = [];
  let successCount = 0;

  for (const association of associations) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[${results.length + 1}/${associations.length}] ${association.name} (${association.group})`);
    console.log('='.repeat(80));

    const result = await tryMultipleUrls(association);
    result.location = association.location;
    result.group = association.group;
    results.push(result);

    if (result.success) {
      successCount++;
      console.log(`✓ SUCCESS! Found ${result.totalContacts} contacts`);
      console.log(`  President: ${result.president?.email || 'Not found'}`);
      if (result.president?.name) console.log(`    Name: ${result.president.name}`);
      console.log(`  VP: ${result.vp?.email || 'Not found'}`);
      if (result.vp?.name) console.log(`    Name: ${result.vp.name}`);
      console.log(`  Treasurer: ${result.treasurer?.email || 'Not found'}`);
      if (result.treasurer?.name) console.log(`    Name: ${result.treasurer.name}`);
    } else {
      console.log(`✗ FAILED: ${result.error}`);
    }

    // Progressive save
    saveToCSV(results, 'fixed-extraction-results.csv');
  }

  // Final summary
  console.log('\n\n' + '='.repeat(80));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Associations Processed: ${results.length}`);
  console.log(`Successful Extractions: ${successCount}`);
  console.log(`Failed Extractions: ${results.length - successCount}`);
  console.log(`Success Rate: ${((successCount / results.length) * 100).toFixed(1)}%`);

  console.log('\n\nResults saved to: fixed-extraction-results.csv');
  console.log('Full JSON results saved to: fixed-extraction-results.json');

  fs.writeFileSync('fixed-extraction-results.json', JSON.stringify(results, null, 2));

  // Display CSV
  console.log('\n' + '='.repeat(80));
  console.log('CSV FORMAT');
  console.log('='.repeat(80));
  console.log('Association,President Email,VP Email,Treasurer Email');
  results.forEach(r => {
    const pres = r.president?.email || 'Not found';
    const vp = r.vp?.email || 'Not found';
    const treas = r.treasurer?.email || 'Not found';
    console.log(`${r.association},${pres},${vp},${treas}`);
  });

  // Validation against original results
  if (runMode === 'test') {
    console.log('\n\n' + '='.repeat(80));
    console.log('VALIDATION: Comparing with Original extraction-results.json');
    console.log('='.repeat(80));

    try {
      const originalResults = JSON.parse(fs.readFileSync('extraction-results.json', 'utf8'));

      results.forEach(current => {
        const original = originalResults.find(o => o.association === current.name);

        if (original && current.success) {
          console.log(`\n${current.association}:`);
          console.log(`  Original President: ${original.president?.email || 'N/A'}`);
          console.log(`  New President:      ${current.president?.email || 'N/A'}`);

          if (original.president?.email === current.president?.email) {
            console.log(`  ✓ PERFECT MATCH!`);
          } else {
            console.log(`  ⚠ DIFFERENT (website may have been updated)`);
          }
        }
      });
    } catch (error) {
      console.log('Could not load extraction-results.json for comparison');
    }
  }
})();
