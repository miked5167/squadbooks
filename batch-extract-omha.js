const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * BATCH EXTRACTION FOR OMHA NETWORK SITES
 * Processes associations in batches of 10
 * Focuses on OMHA network sites where our card-based extraction works
 */

// Parse CSV file
function parseCSV(filename) {
  const content = fs.readFileSync(filename, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

  const associations = [];
  for (let i = 1; i < lines.length; i++) {
    // Simple CSV parsing (handles quoted values)
    const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    if (!matches || matches.length < 3) continue;

    const row = matches.map(val => val.replace(/^"|"$/g, '').trim());

    const assoc = {
      name: row[0],
      location: row[1],
      website: row[2],
      presidentEmail: row[3],
      vpEmail: row[4],
      treasurerEmail: row[5],
      notes: row[6] || ''
    };

    associations.push(assoc);
  }

  return associations;
}

// Check if association needs extraction
function needsExtraction(assoc) {
  const notes = assoc.notes.toLowerCase();

  // Skip if already complete with emails
  if (notes.includes('complete') &&
      assoc.presidentEmail &&
      assoc.presidentEmail !== 'Not found' &&
      assoc.presidentEmail !== 'Not listed' &&
      !notes.includes('email found - needs decoding') &&
      !notes.includes('emails encoded')) {
    return false;
  }

  // Priority: "Email found - needs decoding" or "emails encoded"
  if (notes.includes('email found - needs decoding') ||
      notes.includes('emails encoded')) {
    return true;
  }

  // Priority: "Not found" with OMHA-style URL
  if ((assoc.presidentEmail === 'Not found' || !assoc.presidentEmail) &&
      assoc.website &&
      (assoc.website.includes('.com') || assoc.website.includes('.ca') || assoc.website.includes('.net'))) {
    return true;
  }

  return false;
}

// Check if URL is OMHA network (our extraction works best on these)
function isOMHANetwork(url) {
  if (!url) return false;

  // OMHA network sites typically end in .com, .ca, or .net
  // and have the /Staff/1003/ pattern
  const omhaIndicators = [
    'minorhockey.com',
    'minorhockey.ca',
    'hockey.com',
    'hockey.ca'
  ];

  return omhaIndicators.some(indicator => url.includes(indicator));
}

/**
 * Extract contacts using card-based structure
 */
async function extractContacts(page) {
  return await page.evaluate(() => {
    const results = [];

    // Look for contact cards (OMHA network structure)
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
    '/Staff/1003/',
    '/staff/1003/',
    '/Contact/',
    '/contact/',
    '/Board/',
    '/board/',
    '/Executive/',
    '/executive/'
  ];

  for (const pattern of urlPatterns) {
    const url = association.website.replace(/\/$/, '') + pattern;

    try {
      const page = await browser.newPage();
      console.log(`    Trying: ${url}`);

      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000); // Wait for Cloudflare email decoding

      const contacts = await extractContacts(page);
      console.log(`    Found ${contacts.length} contact(s)`);

      await page.close();

      if (contacts.length > 0) {
        const categorized = categorizeContacts(contacts);

        // Check if we found key contacts
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
  console.log(`  Current status: ${association.notes.substring(0, 60)}...`);
  console.log('='.repeat(80));

  const result = await tryExtraction(browser, association);

  if (result.success) {
    console.log(`  ✓ SUCCESS! Found ${result.totalContacts} contacts`);
    console.log(`    President: ${result.president?.email || 'Not found'}`);
    console.log(`    VP: ${result.vp?.email || 'Not found'}`);
    console.log(`    Treasurer: ${result.treasurer?.email || 'Not found'}`);
  } else {
    console.log(`  ✗ FAILED: ${result.error}`);
  }

  return {
    association: association.name,
    location: association.location,
    website: association.website,
    oldPresidentEmail: association.presidentEmail,
    oldVPEmail: association.vpEmail,
    oldTreasurerEmail: association.treasurerEmail,
    oldNotes: association.notes,
    ...result
  };
}

/**
 * Main execution
 */
(async () => {
  console.log('='.repeat(80));
  console.log('BATCH EXTRACTION - OMHA NETWORK SITES');
  console.log('='.repeat(80));

  const args = process.argv.slice(2);
  const batchNumber = parseInt(args[0]) || 1;
  const batchSize = 10;

  console.log(`\nProcessing Batch #${batchNumber} (${batchSize} associations max)\n`);

  // Load CSV
  const associations = parseCSV('hockey-associations-contacts.csv');
  console.log(`Loaded ${associations.length} associations from CSV\n`);

  // Filter associations that need extraction
  const needsWork = associations.filter(a => {
    return needsExtraction(a) && a.website && a.website !== 'Not found';
  });

  console.log(`Found ${needsWork.length} associations that need extraction\n`);

  // Select batch
  const startIdx = (batchNumber - 1) * batchSize;
  const endIdx = Math.min(startIdx + batchSize, needsWork.length);
  const batch = needsWork.slice(startIdx, endIdx);

  if (batch.length === 0) {
    console.log('No associations to process in this batch!');
    return;
  }

  console.log(`Batch #${batchNumber}: Processing ${batch.length} associations (${startIdx + 1} to ${endIdx})`);
  console.log('\nAssociations in this batch:');
  batch.forEach((a, i) => {
    console.log(`  ${i + 1}. ${a.name} (${a.location}) - ${a.website}`);
  });
  console.log('');

  // Process batch
  const browser = await chromium.launch({ headless: true });
  const results = [];
  let successCount = 0;

  for (let i = 0; i < batch.length; i++) {
    const result = await processAssociation(browser, batch[i], i + 1, batch.length);
    results.push(result);

    if (result.success) {
      successCount++;
    }

    // Progressive save
    const filename = `batch-${batchNumber}-results.json`;
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  }

  await browser.close();

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log(`BATCH #${batchNumber} SUMMARY`);
  console.log('='.repeat(80));
  console.log(`Associations Processed: ${results.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Failed: ${results.length - successCount}`);
  console.log(`Success Rate: ${((successCount / results.length) * 100).toFixed(1)}%`);

  console.log(`\nResults saved to: batch-${batchNumber}-results.json`);

  // Show what's new/different
  console.log('\n' + '='.repeat(80));
  console.log('NEW EXTRACTIONS');
  console.log('='.repeat(80));

  results.forEach(r => {
    if (r.success) {
      const hadEmail = r.oldPresidentEmail &&
                      r.oldPresidentEmail !== 'Not found' &&
                      r.oldPresidentEmail !== 'Not listed' &&
                      !r.oldNotes.includes('needs decoding') &&
                      !r.oldNotes.includes('encoded');

      if (!hadEmail) {
        console.log(`\n✓ ${r.association}`);
        console.log(`  President: ${r.president?.email || 'Not found'}`);
        console.log(`  VP: ${r.vp?.email || 'Not found'}`);
        console.log(`  Treasurer: ${r.treasurer?.email || 'Not found'}`);
      }
    }
  });

  // Next batch info
  const remaining = needsWork.length - endIdx;
  if (remaining > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('NEXT BATCH');
    console.log('='.repeat(80));
    console.log(`${remaining} associations remaining`);
    console.log(`\nTo process next batch, run:`);
    console.log(`  node batch-extract-omha.js ${batchNumber + 1}`);
  } else {
    console.log('\n' + '='.repeat(80));
    console.log('ALL BATCHES COMPLETE!');
    console.log('='.repeat(80));
  }
})();
