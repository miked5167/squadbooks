const { chromium } = require('playwright');
const fs = require('fs');

/**
 * BEST PRACTICES EMAIL EXTRACTION SCRIPT
 * Based on lessons learned from previous successful extractions
 *
 * Key practices:
 * 1. Use Playwright with 3-second wait for Cloudflare
 * 2. Use card-based selectors (`.contact`, `.role`, `.name`)
 * 3. Look for mailto: links - they're already decoded!
 * 4. Try multiple URL patterns
 * 5. Handle different organizational structures
 * 6. Save progressively to avoid data loss
 */

// Load batch
const batch = JSON.parse(fs.readFileSync('next-batch-181-200.json', 'utf8'));

// URL patterns to try (in order of priority)
const URL_PATTERNS = [
  '/Staff/1003/',       // OMHA network sites (most common)
  '/staff/1003/',       // Lowercase variant
  '/ContactUs',         // TeamLinkt sites
  '/Contact/',          // Generic contact
  '/contact',           // Lowercase
  '/About/Contact',     // About section
  '/about/contact',     // Lowercase
  '/Board/',            // Board members
  '/board',             // Lowercase
  '/Executive/',        // Executive page
  '/executive'          // Lowercase
];

/**
 * Extract contacts using card-based structure
 */
async function extractContacts(page) {
  return await page.evaluate(() => {
    const results = [];

    // Look for contact cards (OMHA sites use this structure)
    const contactCards = document.querySelectorAll('.contact, .staff-member, .carousel-item, .board-member');

    contactCards.forEach(card => {
      // Find role within this card
      const roleEl = card.querySelector('.role, [class*="position"], [class*="title"]');
      const nameEl = card.querySelector('.name, [class*="name"]');
      const emailLink = card.querySelector('a[href^="mailto:"]');

      if (emailLink) {
        const role = roleEl?.innerText?.trim() || '';
        const name = nameEl?.innerText?.trim() || '';
        const email = emailLink.href.replace('mailto:', '').split('?')[0].trim();

        if (email && email.includes('@')) {
          results.push({
            position: role,
            name: name,
            email: email
          });
        }
      }
    });

    // If no cards found, try generic search for executive contacts
    if (results.length === 0) {
      const bodyText = document.body.innerText || '';

      // Look for president/vp/treasurer with emails
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
      const emails = bodyText.match(emailRegex) || [];

      // Try to find role context for each email
      emails.forEach(email => {
        // Find the element containing this email
        const emailLinks = document.querySelectorAll(`a[href="mailto:${email}"]`);
        emailLinks.forEach(link => {
          const container = link.closest('div, section, article, li, tr');
          if (container) {
            const text = container.innerText || '';
            results.push({
              position: 'Role found in context',
              name: '',
              email: email
            });
          }
        });
      });
    }

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
    const email = contact.email.toLowerCase();

    // President (but not vice president or past president)
    if ((roleText.includes('president') || roleText.includes('chair')) &&
        !roleText.includes('vice') &&
        !roleText.includes('past') &&
        !roleText.includes('assistant') &&
        !email.includes('vice') &&
        !email.includes('vp')) {
      if (!result.president) {
        result.president = {
          role: contact.position,
          name: contact.name,
          email: contact.email
        };
      }
    }

    // VP
    else if (roleText.includes('vice') || roleText.includes(' vp ') || email.includes('vice') || email.includes('vp')) {
      if (!result.vp) {
        result.vp = {
          role: contact.position,
          name: contact.name,
          email: contact.email
        };
      }
    }

    // Treasurer
    else if (roleText.includes('treasurer') || roleText.includes('finance') || email.includes('treasurer') || email.includes('finance')) {
      if (!result.treasurer) {
        result.treasurer = {
          role: contact.position,
          name: contact.name,
          email: contact.email
        };
      }
    }

    // Executive Director (treat as president if no president found)
    else if (roleText.includes('executive director') || roleText.includes('general manager')) {
      if (!result.president) {
        result.president = {
          role: contact.position + ' (Executive Director)',
          name: contact.name,
          email: contact.email
        };
      }
    }
  });

  return result;
}

/**
 * Try to extract from a specific URL
 */
async function tryExtractFromUrl(page, url, associationName) {
  try {
    console.log(`  Trying: ${url}`);
    const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    if (!response || !response.ok()) {
      console.log(`    ✗ Failed (HTTP ${response?.status()})`);
      return null;
    }

    // CRITICAL: Wait 3 seconds for Cloudflare email decoding
    await page.waitForTimeout(3000);

    // Extract contacts
    const contacts = await extractContacts(page);

    if (contacts.length > 0) {
      console.log(`    ✓ Found ${contacts.length} contact(s) with emails`);
      const categorized = categorizeContacts(contacts);

      // Check if we found at least president OR treasurer
      if (categorized.president || categorized.treasurer) {
        return {
          success: true,
          url: url,
          totalContacts: contacts.length,
          allContacts: contacts,
          ...categorized
        };
      } else {
        console.log(`    ~ Found contacts but no President/Treasurer`);
      }
    } else {
      console.log(`    ✗ No email contacts found`);
    }

    return null;
  } catch (error) {
    console.log(`    ✗ Error: ${error.message}`);
    return null;
  }
}

/**
 * Process a single association
 */
async function processAssociation(association, index, total) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[${index + 1}/${total}] ${association.name}`);
  console.log(`Location: ${association.location}`);
  console.log('='.repeat(80));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // If we have a website from the source data, use it
    let websiteUrl = association.website;

    // If no website, try to find it via Google search
    if (!websiteUrl || websiteUrl === 'nan' || !websiteUrl.startsWith('http')) {
      console.log('No website URL provided, searching Google...');

      try {
        const searchQuery = `${association.name} ${association.location} minor hockey official website`;
        const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

        await page.goto(googleUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(2000);

        websiteUrl = await page.evaluate(() => {
          const searchResults = document.querySelectorAll('div.g a[href^="http"]');
          for (const link of searchResults) {
            const href = link.href;
            // Filter out non-official sites
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

        if (!websiteUrl) {
          console.log('  ✗ No website found via Google search');
          await browser.close();
          return {
            association: association.name,
            location: association.location,
            success: false,
            error: 'No website found'
          };
        }

        console.log(`  ✓ Found website: ${websiteUrl}`);
      } catch (error) {
        console.log(`  ✗ Google search failed: ${error.message}`);
        await browser.close();
        return {
          association: association.name,
          location: association.location,
          success: false,
          error: 'Google search failed'
        };
      }
    }

    // Try different URL patterns
    for (const pattern of URL_PATTERNS) {
      const baseUrl = websiteUrl.replace(/\/$/, '');
      const tryUrl = baseUrl + pattern;

      const result = await tryExtractFromUrl(page, tryUrl, association.name);

      if (result && result.success) {
        await browser.close();
        return {
          association: association.name,
          location: association.location,
          website: websiteUrl,
          ...result
        };
      }
    }

    // No success with any pattern
    console.log('  ✗ No contacts found with any URL pattern');
    await browser.close();
    return {
      association: association.name,
      location: association.location,
      website: websiteUrl,
      success: false,
      error: 'No contacts found with any URL pattern'
    };

  } catch (error) {
    console.log(`  ✗ Unexpected error: ${error.message}`);
    await browser.close();
    return {
      association: association.name,
      location: association.location,
      success: false,
      error: error.message
    };
  }
}

/**
 * Save results to CSV
 */
function saveToCSV(results, filename) {
  const csvLines = ['Association,Location,Website,Success,President Email,VP Email,Treasurer Email'];

  results.forEach(r => {
    const pres = r.president?.email || '';
    const vp = r.vp?.email || '';
    const treas = r.treasurer?.email || '';
    const success = r.success ? 'Yes' : 'No';

    csvLines.push(`"${r.association}","${r.location}","${r.website || ''}",${success},"${pres}","${vp}","${treas}"`);
  });

  fs.writeFileSync(filename, csvLines.join('\n'));
}

/**
 * Main execution
 */
(async () => {
  console.log('='.repeat(80));
  console.log('BATCH 181-200 EXTRACTION');
  console.log('Using best practices: Playwright + 3s wait + card selectors');
  console.log('='.repeat(80));
  console.log(`\nProcessing ${batch.length} associations...\n`);

  const results = [];
  let successCount = 0;

  for (let i = 0; i < batch.length; i++) {
    const association = batch[i];
    const result = await processAssociation(association, i, batch.length);
    results.push(result);

    if (result.success) {
      successCount++;
      console.log(`\n✓ SUCCESS!`);
      console.log(`  President: ${result.president?.email || 'Not found'} ${result.president?.name ? `(${result.president.name})` : ''}`);
      console.log(`  VP: ${result.vp?.email || 'Not found'} ${result.vp?.name ? `(${result.vp.name})` : ''}`);
      console.log(`  Treasurer: ${result.treasurer?.email || 'Not found'} ${result.treasurer?.name ? `(${result.treasurer.name})` : ''}`);
    } else {
      console.log(`\n✗ FAILED: ${result.error}`);
    }

    // Progressive save after each association
    saveToCSV(results, 'batch-181-200-results.csv');
    fs.writeFileSync('batch-181-200-results.json', JSON.stringify(results, null, 2));
  }

  // Final summary
  console.log('\n\n' + '='.repeat(80));
  console.log('BATCH 181-200 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Processed: ${results.length}`);
  console.log(`Successful: ${successCount} (${((successCount / results.length) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${results.length - successCount}`);

  console.log('\n✓ Results saved to:');
  console.log('  - batch-181-200-results.csv');
  console.log('  - batch-181-200-results.json');
})();
