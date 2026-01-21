const { chromium } = require('playwright');
const fs = require('fs');

const batch = JSON.parse(fs.readFileSync('next-batch-161-180.json', 'utf8'));

async function extractContacts(page) {
  return await page.evaluate(() => {
    const results = [];
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
          results.push({ position: role, name: name, email: email });
        }
      }
    });

    return results;
  });
}

function categorizeContacts(contacts) {
  const result = {};

  contacts.forEach(contact => {
    const roleText = contact.position.toLowerCase();

    if (roleText.includes('president') && !roleText.includes('vice') && !roleText.includes('past')) {
      if (!result.president) {
        result.president = { role: contact.position, name: contact.name, email: contact.email };
      }
    } else if (roleText.includes('vice') || roleText.includes(' vp ')) {
      if (!result.vp) {
        result.vp = { role: contact.position, name: contact.name, email: contact.email };
      }
    } else if (roleText.includes('treasurer')) {
      if (!result.treasurer) {
        result.treasurer = { role: contact.position, name: contact.name, email: contact.email };
      }
    }
  });

  return result;
}

async function tryExtraction(browser, association) {
  const baseWebsite = association.website.replace(/\/$/, '');

  const urlPatterns = [
    baseWebsite + '/Staff/1003/',
    baseWebsite + '/staff/1003/',
    baseWebsite + '/Contact/',
    baseWebsite + '/contact/',
    baseWebsite + '/Board/',
    baseWebsite + '/board/',
    baseWebsite + '/Executive/',
    baseWebsite + '/executive/'
  ];

  for (const url of urlPatterns) {
    try {
      const page = await browser.newPage();
      console.log(`    Trying: ${url}`);

      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
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

  return { success: false, error: 'No contacts found with any URL pattern' };
}

async function processAssociation(browser, association, index, total) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`[${index}/${total}] ${association.association} - ${association.location}`);
  console.log(`Website: ${association.website}`);

  const result = await tryExtraction(browser, association);

  return {
    association: association.association,
    location: association.location,
    website: association.website,
    league: association.league,
    ...result
  };
}

async function processBatch() {
  console.log('Starting batch 161-180 extraction...');
  console.log(`Total associations: ${batch.length}\n`);

  const browser = await chromium.launch({ headless: false });
  const results = [];

  for (let i = 0; i < batch.length; i++) {
    const result = await processAssociation(browser, batch[i], i + 1, batch.length);
    results.push(result);

    // Save progress after each association
    fs.writeFileSync('batch-161-180-results.json', JSON.stringify(results, null, 2));
  }

  await browser.close();

  console.log('\n' + '='.repeat(80));
  console.log('BATCH COMPLETE!');
  console.log('='.repeat(80));

  const successful = results.filter(r => r.success).length;
  console.log(`Total: ${results.length}`);
  console.log(`Successful: ${successful} (${Math.round(successful/results.length*100)}%)`);
  console.log(`Failed: ${results.length - successful}`);
  console.log(`\nResults saved to: batch-161-180-results.json`);
}

processBatch().catch(console.error);
