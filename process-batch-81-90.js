const { chromium } = require('playwright');
const fs = require('fs');

const batch = JSON.parse(fs.readFileSync('next-batch-81-90.json', 'utf8'));

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
  const urlPatterns = [
    association.staffPage || (association.website.replace(/\/$/, '') + '/Staff/1003/'),
    association.website.replace(/\/$/, '') + '/staff/1003/',
    association.website.replace(/\/$/, '') + '/Contact/',
    association.website.replace(/\/$/, '') + '/contact/',
    association.website.replace(/\/$/, '') + '/Board/',
    association.website.replace(/\/$/, '') + '/board/'
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
  console.log(`[${index}/${total}] ${association.name} - ${association.location}`);
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
    ...result
  };
}

(async () => {
  console.log('='.repeat(80));
  console.log('BATCH 81-90');
  console.log('='.repeat(80));

  const browser = await chromium.launch({ headless: true });
  const results = [];
  let successCount = 0;

  for (let i = 0; i < batch.length; i++) {
    const result = await processAssociation(browser, batch[i], i + 1, batch.length);
    results.push(result);
    if (result.success) successCount++;
    fs.writeFileSync('batch-81-90-results.json', JSON.stringify(results, null, 2));
  }

  await browser.close();

  console.log('\n' + '='.repeat(80));
  console.log('BATCH 81-90 SUMMARY');
  console.log('='.repeat(80));
  console.log(`Processed: ${results.length} | Success: ${successCount} | Rate: ${((successCount / results.length) * 100).toFixed(1)}%`);
  console.log('Results saved to: batch-81-90-results.json');
})();
