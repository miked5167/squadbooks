const { chromium } = require('playwright');
const fs = require('fs');

/**
 * RETRY EXTRACTION SCRIPT
 * Back to basics: Direct Playwright with proven patterns
 * Based on 100% success rate from extraction-results.json
 */

// Associations to retry (Priority Groups 1-3 from retry-extraction-plan.json)
const RETRY_ASSOCIATIONS = [
  // GROUP 1: OMHA network sites with encoded emails (HIGHEST PRIORITY)
  {
    name: 'Ajax Pickering Raiders',
    location: 'Ajax, ON',
    website: 'https://ajaxpickeringminorhockey.com',
    staffPage: 'https://ajaxpickeringminorhockey.com/Staff/1003/',
    group: 'OMHA Network'
  },

  // GROUP 2: Cloudflare-encoded emails
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

  // GROUP 3: Playwright retry
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
  }
];

// URL patterns to try (in order)
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
 * Extract contacts using OMHA table structure (proven method)
 */
async function extractOMHATable(page) {
  return await page.evaluate(() => {
    const staffRows = Array.from(document.querySelectorAll('tr'));
    const results = [];

    staffRows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 3) {
        const position = cells[0]?.innerText.trim() || '';
        const name = cells[1]?.innerText.trim() || '';
        const emailLink = cells[2]?.querySelector('a[href^="mailto:"]');
        const email = emailLink ? emailLink.href.replace('mailto:', '').split('?')[0] : '';

        if (position && email) {
          results.push({ position, name, email });
        }
      }
    });

    return results;
  });
}

/**
 * Extract contacts using role-based approach (fallback)
 */
async function extractByRole(page) {
  return await page.evaluate(() => {
    const results = [];

    // Try table rows, list items, and common staff containers
    const allRows = Array.from(document.querySelectorAll('tr, li, .member, .staff-member, article, .contact-card'));

    allRows.forEach(row => {
      const text = row.innerText || '';
      const textLower = text.toLowerCase();
      const emailLink = row.querySelector('a[href^="mailto:"]');

      if (emailLink && (
        textLower.includes('president') ||
        textLower.includes('vice') ||
        textLower.includes('vp') ||
        textLower.includes('treasurer')
      )) {
        const email = emailLink.href.replace('mailto:', '').split('?')[0];
        results.push({
          context: text.substring(0, 150),
          email: email
        });
      }
    });

    return results;
  });
}

/**
 * Categorize extracted contacts by role
 */
function categorizeContacts(contacts) {
  const result = {};

  contacts.forEach(contact => {
    const roleText = (contact.position || contact.context || '').toLowerCase();

    if (roleText.includes('president') && !roleText.includes('vice') && !roleText.includes('past')) {
      if (!result.president) {
        result.president = {
          role: contact.position || roleText.substring(0, 50),
          name: contact.name || '',
          email: contact.email
        };
      }
    } else if (roleText.includes('vice') || roleText.includes(' vp ')) {
      if (!result.vp) {
        result.vp = {
          role: contact.position || roleText.substring(0, 50),
          name: contact.name || '',
          email: contact.email
        };
      }
    } else if (roleText.includes('treasurer')) {
      if (!result.treasurer) {
        result.treasurer = {
          role: contact.position || roleText.substring(0, 50),
          name: contact.name || '',
          email: contact.email
        };
      }
    }
  });

  return result;
}

/**
 * Try multiple URL patterns for an association
 */
async function tryMultipleUrls(association) {
  const browser = await chromium.launch({ headless: true });

  try {
    // Try the known staff page first if provided
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

    // No success with any URL
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
 * Extract from a specific URL
 */
async function extractFromUrl(browser, url, associationName) {
  const page = await browser.newPage();

  try {
    console.log(`  Trying: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // CRITICAL: Wait 2 seconds for Cloudflare email decoding
    await page.waitForTimeout(2000);

    // Try OMHA table structure first (proven method)
    let contacts = await extractOMHATable(page);

    // If no results, try role-based approach
    if (contacts.length === 0) {
      contacts = await extractByRole(page);
    }

    await page.close();

    // Categorize contacts
    const categorized = categorizeContacts(contacts);

    // Check if we found at least one key contact
    if (categorized.president || categorized.treasurer) {
      return {
        association: associationName,
        url: url,
        success: true,
        ...categorized
      };
    }

    return {
      association: associationName,
      url: url,
      success: false,
      error: 'No key contacts found'
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
 * Save results to CSV progressively
 */
function saveToCSV(results, filename) {
  const csvLines = ['Association,Location,President Email,VP Email,Treasurer Email,Notes,Group'];

  results.forEach(r => {
    const pres = r.president?.email || 'Not found';
    const vp = r.vp?.email || 'Not found';
    const treas = r.treasurer?.email || 'Not found';
    const notes = r.success ? `Extracted via Playwright Retry from ${r.url}` : `Failed: ${r.error}`;
    const group = r.group || '';
    const location = r.location || '';

    csvLines.push(`"${r.association}","${location}","${pres}","${vp}","${treas}","${notes}","${group}"`);
  });

  fs.writeFileSync(filename, csvLines.join('\n'));
}

/**
 * Main execution
 */
(async () => {
  console.log('='.repeat(80));
  console.log('RETRY EXTRACTION - BACK TO BASICS WITH PROVEN PLAYWRIGHT METHOD');
  console.log('='.repeat(80));
  console.log(`\nProcessing ${RETRY_ASSOCIATIONS.length} associations sequentially...`);
  console.log('Using proven method: Direct Playwright + 2-second Cloudflare wait\n');

  const results = [];
  let successCount = 0;

  for (const association of RETRY_ASSOCIATIONS) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[${results.length + 1}/${RETRY_ASSOCIATIONS.length}] ${association.name} (${association.group})`);
    console.log('='.repeat(80));

    const result = await tryMultipleUrls(association);
    result.location = association.location;
    result.group = association.group;
    results.push(result);

    if (result.success) {
      successCount++;
      console.log(`✓ SUCCESS!`);
      console.log(`  President: ${result.president?.email || 'Not found'}`);
      if (result.president?.name) console.log(`    Name: ${result.president.name}`);
      console.log(`  VP: ${result.vp?.email || 'Not found'}`);
      if (result.vp?.name) console.log(`    Name: ${result.vp.name}`);
      console.log(`  Treasurer: ${result.treasurer?.email || 'Not found'}`);
      if (result.treasurer?.name) console.log(`    Name: ${result.treasurer.name}`);
    } else {
      console.log(`✗ FAILED: ${result.error}`);
    }

    // Save after each extraction (progressive save to avoid data loss)
    saveToCSV(results, 'retry-extraction-results.csv');
  }

  // Final summary
  console.log('\n\n' + '='.repeat(80));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Associations Processed: ${results.length}`);
  console.log(`Successful Extractions: ${successCount}`);
  console.log(`Failed Extractions: ${results.length - successCount}`);
  console.log(`Success Rate: ${((successCount / results.length) * 100).toFixed(1)}%`);

  console.log('\n\nResults saved to: retry-extraction-results.csv');
  console.log('Full JSON results saved to: retry-extraction-results.json');

  // Save JSON results
  fs.writeFileSync('retry-extraction-results.json', JSON.stringify(results, null, 2));

  // Display CSV format
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
})();
