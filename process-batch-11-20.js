const { chromium } = require('playwright');
const fs = require('fs');

/**
 * Process batch 11-20 associations
 * Uses proven fixed-extraction logic
 */

const batch = JSON.parse(fs.readFileSync('next-batch-11-20.json', 'utf8'));

/**
 * Extract contacts using card-based structure (PROVEN METHOD)
 */
async function extractContacts(page) {
  return await page.evaluate(() => {
    const results = [];

    // Card-based structure (works for OMHA network sites)
    const contactCards = document.querySelectorAll('.contact, .staff-member, .carousel-item');

    contactCards.forEach(card => {
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
 * Try multiple URL patterns
 */
async function tryExtraction(browser, association) {
  const urlPatterns = [
    association.staffPage || (association.website.replace(/\/$/, '') + '/Staff/1003/'),
    association.website.replace(/\/$/, '') + '/staff/1003/',
    association.website.replace(/\/$/, '') + '/Contact/',
    association.website.replace(/\/$/, '') + '/contact/',
    association.website.replace(/\/$/, '') + '/Board/',
    association.website.replace(/\/$/, '') + '/board/',
    association.website.replace(/\/$/, '') + '/Executive/',
    association.website.replace(/\/$/, '') + '/executive/'
  ];

  for (const url of urlPatterns) {
    try {
      const page = await browser.newPage();
      console.log(`    Trying: ${url}`);

      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // CRITICAL: Wait 3 seconds for client-side email decoding
      await page.waitForTimeout(3000);

      const contacts = await extractContacts(page);
      console.log(`    Found ${contacts.length} contact(s)`);

      await page.close();

      if (contacts.length > 0) {
        const categorized = categorizeContacts(contacts);

        if (categorized.president || categorized.treasurer) {
          return {
            success: true,
            url: url,
            totalContacts: contacts.length,
            ...categorized
          };
        }
      }
    } catch (error) {
      console.log(`    Error: ${error.message.substring(0, 50)}...`);
    }
  }

  return {
    success: false,
    error: 'No contacts found with any URL pattern'
  };
}

/**
 * Process one association
 */
async function processAssociation(browser, association, index, total) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[${index}/${total}] ${association.name} - ${association.location}`);
  console.log(`  Website: ${association.website}`);
  console.log(`  Action: ${association.action}`);
  console.log(`  Notes: ${association.notes}`);
  console.log('='.repeat(80));

  const result = await tryExtraction(browser, association);

  if (result.success) {
    console.log(`  ✓ SUCCESS! Found ${result.totalContacts} contacts`);
    console.log(`    President: ${result.president?.email || 'Not found'} ${result.president?.name ? `(${result.president.name})` : ''}`);
    console.log(`    VP: ${result.vp?.email || 'Not found'} ${result.vp?.name ? `(${result.vp.name})` : ''}`);
    console.log(`    Treasurer: ${result.treasurer?.email || 'Not found'} ${result.treasurer?.name ? `(${result.treasurer.name})` : ''}`);
  } else {
    console.log(`  ✗ FAILED: ${result.error}`);
  }

  return {
    association: association.name,
    location: association.location,
    website: association.website,
    action: association.action,
    originalNotes: association.notes,
    ...result
  };
}

/**
 * Main execution
 */
(async () => {
  console.log('='.repeat(80));
  console.log('BATCH PROCESSING - ASSOCIATIONS 11-20');
  console.log('='.repeat(80));
  console.log(`\nProcessing ${batch.length} associations\n`);

  const browser = await chromium.launch({ headless: true });
  const results = [];
  let successCount = 0;
  let newExtractions = 0;

  for (let i = 0; i < batch.length; i++) {
    const result = await processAssociation(browser, batch[i], i + 1, batch.length);
    results.push(result);

    if (result.success) {
      successCount++;
      if (result.action === 'TRY EXTRACTION') {
        newExtractions++;
      }
    }

    // Progressive save
    fs.writeFileSync('batch-11-20-results.json', JSON.stringify(results, null, 2));
  }

  await browser.close();

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('BATCH 11-20 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Associations Processed: ${results.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${results.length - successCount}`);
  console.log(`New Extractions: ${newExtractions}`);
  console.log(`Success Rate: ${((successCount / results.length) * 100).toFixed(1)}%`);

  console.log('\n\nResults saved to: batch-11-20-results.json');

  // Show new extractions
  console.log('\n' + '='.repeat(80));
  console.log('NEW EXTRACTIONS');
  console.log('='.repeat(80));

  const newOnes = results.filter(r => r.success && r.action === 'TRY EXTRACTION');
  if (newOnes.length > 0) {
    newOnes.forEach(r => {
      console.log(`\n✓ ${r.association}`);
      console.log(`  President: ${r.president?.email || 'Not found'}`);
      console.log(`  VP: ${r.vp?.email || 'Not found'}`);
      console.log(`  Treasurer: ${r.treasurer?.email || 'Not found'}`);
    });
  } else {
    console.log('\nNo new extractions (all were validations)');
  }

  // Show validation results
  console.log('\n' + '='.repeat(80));
  console.log('VALIDATIONS');
  console.log('='.repeat(80));

  const validations = results.filter(r => r.action === 'VALIDATE');
  const validationSuccess = validations.filter(r => r.success).length;
  console.log(`Validated ${validationSuccess} out of ${validations.length} associations`);

  if (validationSuccess > 0) {
    validations.filter(r => r.success).forEach(r => {
      console.log(`\n✓ ${r.association} - CONFIRMED`);
      console.log(`  President: ${r.president?.email || 'Not found'}`);
      console.log(`  VP: ${r.vp?.email || 'Not found'}`);
      console.log(`  Treasurer: ${r.treasurer?.email || 'Not found'}`);
    });
  }
})();
