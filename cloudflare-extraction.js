const { chromium } = require('playwright');
const fs = require('fs');

/**
 * CLOUDFLARE EMAIL DECODER + EXTRACTION SCRIPT
 *
 * This script solves the Cloudflare email protection issue using XOR cipher decoding.
 * Based on 100% success pattern from extraction-results.json but enhanced to handle
 * modern Cloudflare /cdn-cgi/l/email-protection encoding.
 */

// Test batch - Start with known successful sites from extraction-results.json
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

// Priority associations with Cloudflare encoding
const PRIORITY_ASSOCIATIONS = [
  {
    name: 'Ajax Pickering Raiders',
    location: 'Ajax, ON',
    website: 'https://ajaxpickeringminorhockey.com',
    staffPage: 'https://ajaxpickeringminorhockey.com/Staff/1003/',
    group: 'OMHA Network - Cloudflare Encoded'
  },
  {
    name: 'Almaguin Ice Devils',
    location: 'Sundridge, ON',
    website: 'https://almaguinminorhockey.com',
    staffPage: 'https://almaguinminorhockey.com/Staff/1003/',
    group: 'OMHA Network - Cloudflare Encoded'
  },
  {
    name: 'Arnprior Packers',
    location: 'Arnprior, ON',
    website: 'https://arnpriorminorhockey.ca',
    staffPage: 'https://arnpriorminorhockey.ca/Staff/1003/',
    group: 'OMHA Network - Cloudflare Encoded'
  }
];

// URL patterns to try (in order of likelihood)
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
 * CLOUDFLARE XOR EMAIL DECODER
 * Cloudflare uses a simple XOR cipher to encode email addresses
 * The hash format is: first 2 hex chars = key, remaining pairs = encoded chars
 */
function decodeCloudflareEmail(encodedString) {
  try {
    let email = '';
    const key = parseInt(encodedString.substr(0, 2), 16);

    for (let i = 2; i < encodedString.length; i += 2) {
      const charCode = parseInt(encodedString.substr(i, 2), 16) ^ key;
      email += String.fromCharCode(charCode);
    }

    return email;
  } catch (error) {
    console.log(`    [Decoder Error] Could not decode: ${encodedString.substring(0, 20)}...`);
    return null;
  }
}

/**
 * Extract and decode emails from Cloudflare-protected page
 */
async function extractWithCloudflareDecoder(page) {
  return await page.evaluate(() => {
    // Function to decode Cloudflare email (injected into browser context)
    function decodeEmail(encodedString) {
      try {
        let email = '';
        const key = parseInt(encodedString.substr(0, 2), 16);

        for (let i = 2; i < encodedString.length; i += 2) {
          const charCode = parseInt(encodedString.substr(i, 2), 16) ^ key;
          email += String.fromCharCode(charCode);
        }

        return email;
      } catch (error) {
        return null;
      }
    }

    const results = [];

    // Strategy 1: Look for Cloudflare-protected email links
    const cloudflareLinks = document.querySelectorAll('a[href^="/cdn-cgi/l/email-protection"]');

    cloudflareLinks.forEach(link => {
      // Extract hash from href or data-cfemail attribute
      let hash = null;

      if (link.hasAttribute('data-cfemail')) {
        hash = link.getAttribute('data-cfemail');
      } else {
        const href = link.getAttribute('href');
        const match = href.match(/\/cdn-cgi\/l\/email-protection#([a-f0-9]+)/i);
        if (match) {
          hash = match[1];
        }
      }

      if (hash) {
        const email = decodeEmail(hash);

        if (email) {
          // Find the parent row or container to get position/name context
          let container = link.closest('tr, li, .member, .staff-member, article, .contact-card');

          if (container) {
            const text = container.innerText || '';

            // Try to find position and name in table structure
            const cells = container.querySelectorAll('td');
            let position = '';
            let name = '';

            if (cells.length >= 2) {
              position = cells[0]?.innerText.trim() || '';
              name = cells[1]?.innerText.trim() || '';
            } else {
              // Fallback: extract from text
              const lines = text.split('\\n').map(l => l.trim()).filter(l => l);
              position = lines[0] || '';
              name = lines[1] || '';
            }

            results.push({
              position: position,
              name: name,
              email: email,
              context: text.substring(0, 150)
            });
          }
        }
      }
    });

    // Strategy 2: Also check for regular mailto links (non-Cloudflare)
    const regularLinks = document.querySelectorAll('a[href^="mailto:"]');

    regularLinks.forEach(link => {
      const email = link.href.replace('mailto:', '').split('?')[0];

      if (email && !results.find(r => r.email === email)) {
        let container = link.closest('tr, li, .member, .staff-member, article, .contact-card');

        if (container) {
          const text = container.innerText || '';
          const cells = container.querySelectorAll('td');
          let position = '';
          let name = '';

          if (cells.length >= 2) {
            position = cells[0]?.innerText.trim() || '';
            name = cells[1]?.innerText.trim() || '';
          } else {
            const lines = text.split('\\n').map(l => l.trim()).filter(l => l);
            position = lines[0] || '';
            name = lines[1] || '';
          }

          results.push({
            position: position,
            name: name,
            email: email,
            context: text.substring(0, 150)
          });
        }
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
 * Extract from a specific URL with Cloudflare decoding
 */
async function extractFromUrl(browser, url, associationName) {
  const page = await browser.newPage();

  try {
    console.log(`  Trying: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // CRITICAL: Wait for Cloudflare and page to fully load
    await page.waitForTimeout(3000);

    // Extract contacts using Cloudflare decoder
    let contacts = await extractWithCloudflareDecoder(page);

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
 * Save results to CSV progressively
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
    const notes = r.success ? `Extracted via Cloudflare Decoder from ${r.url}` : `Failed: ${r.error}`;
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
  console.log('CLOUDFLARE EMAIL DECODER + EXTRACTION');
  console.log('='.repeat(80));
  console.log('\nUsing XOR cipher to decode Cloudflare-protected emails');
  console.log('Based on proven 100% success pattern + modern email decoding\n');

  // Determine which associations to process
  const args = process.argv.slice(2);
  const runMode = args[0] || 'test'; // 'test' or 'all'

  let associations = [];
  if (runMode === 'all') {
    associations = [...TEST_ASSOCIATIONS, ...PRIORITY_ASSOCIATIONS];
    console.log(`Processing ALL associations (${associations.length} total)...`);
  } else {
    associations = TEST_ASSOCIATIONS;
    console.log(`Processing TEST batch (${associations.length} associations)...`);
    console.log('These previously had 100% success - testing Cloudflare decoder\n');
  }

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

    // Save after each extraction (progressive save)
    saveToCSV(results, 'cloudflare-extraction-results.csv');
  }

  // Final summary
  console.log('\n\n' + '='.repeat(80));
  console.log('FINAL SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Associations Processed: ${results.length}`);
  console.log(`Successful Extractions: ${successCount}`);
  console.log(`Failed Extractions: ${results.length - successCount}`);
  console.log(`Success Rate: ${((successCount / results.length) * 100).toFixed(1)}%`);

  console.log('\n\nResults saved to: cloudflare-extraction-results.csv');
  console.log('Full JSON results saved to: cloudflare-extraction-results.json');

  // Save JSON results
  fs.writeFileSync('cloudflare-extraction-results.json', JSON.stringify(results, null, 2));

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

  // Comparison with original results if in test mode
  if (runMode === 'test') {
    console.log('\n\n' + '='.repeat(80));
    console.log('VALIDATION: Comparing with Original extraction-results.json');
    console.log('='.repeat(80));

    try {
      const originalResults = JSON.parse(fs.readFileSync('extraction-results.json', 'utf8'));

      results.forEach(current => {
        const original = originalResults.find(o => o.association === current.association);

        if (original && current.success) {
          console.log(`\n${current.association}:`);
          console.log(`  Original President: ${original.president?.email || 'Not found'}`);
          console.log(`  New President:      ${current.president?.email || 'Not found'}`);

          if (original.president?.email === current.president?.email) {
            console.log(`  ✓ MATCH!`);
          } else {
            console.log(`  ⚠ DIFFERENT (may indicate website update)`);
          }
        }
      });
    } catch (error) {
      console.log('Could not load extraction-results.json for comparison');
    }
  }
})();
