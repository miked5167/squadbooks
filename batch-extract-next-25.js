const { chromium } = require('playwright');
const fs = require('fs');

async function findWebsiteAndExtract(associationName, location, browser) {
  const page = await browser.newPage();

  try {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Processing: ${associationName} (${location})`);

    // Step 1: Search Google to find the official website
    const searchQuery = `${associationName} ${location} minor hockey official website`;
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

    await page.goto(googleUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500);

    // Extract the first organic search result
    const websiteUrl = await page.evaluate(() => {
      const searchResults = document.querySelectorAll('div.g a[href^="http"]');
      for (const link of searchResults) {
        const href = link.href;
        // Filter out non-official sites
        if (!href.includes('google.com') &&
            !href.includes('facebook.com') &&
            !href.includes('twitter.com') &&
            !href.includes('instagram.com') &&
            !href.includes('youtube.com') &&
            !href.includes('linkedin.com')) {
          return href;
        }
      }
      return null;
    });

    if (!websiteUrl) {
      console.log(`  ✗ No website found`);
      return {
        association: associationName,
        location: location,
        website: null,
        contacts: null,
        status: 'no_website_found'
      };
    }

    console.log(`  ✓ Found website: ${websiteUrl}`);
    await page.waitForTimeout(2000);

    // Step 2: Try to extract contacts from different possible URLs
    let contacts = null;
    let contactPageUrl = null;

    // Try different contact page patterns
    const patterns = [
      '/Staff/1003/',           // OMHA network sites
      '/ContactUs',             // TeamLinkt sites
      '/Contact/',              // Generic contact page
      '/contact',               // Lowercase variant
      '/about/contact',         // About/Contact
      '/board',                 // Board/Executive page
      '/executive'              // Executive page
    ];

    for (const pattern of patterns) {
      try {
        const baseUrl = websiteUrl.replace(/\/$/, ''); // Remove trailing slash
        const tryUrl = baseUrl + pattern;

        console.log(`  Trying: ${tryUrl}`);
        const response = await page.goto(tryUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 15000
        });

        if (response && response.ok()) {
          await page.waitForTimeout(2000);

          // Extract contacts from the page
          contacts = await page.evaluate(() => {
            const results = {};

            // Look for executive/board members with roles and emails
            const findContactByRole = (roleKeywords) => {
              // Search in structured elements first (divs, articles, sections)
              const containers = document.querySelectorAll('div, article, section, li, tr');

              for (const container of containers) {
                const text = container.innerText || container.textContent || '';
                const textLower = text.toLowerCase();

                // Check if this container mentions the role
                const hasRole = roleKeywords.some(keyword => textLower.includes(keyword));
                if (!hasRole) continue;

                // Look for email in this container or nearby
                const emailLink = container.querySelector('a[href^="mailto:"]');
                if (emailLink) {
                  const email = emailLink.href.replace('mailto:', '').split('?')[0].trim();
                  if (email && email.includes('@')) {
                    // Try to find the name
                    const nameElements = container.querySelectorAll('.name, [class*="name"], strong, b, h1, h2, h3, h4');
                    let name = '';
                    for (const el of nameElements) {
                      const elText = el.innerText || el.textContent;
                      if (elText && !elText.toLowerCase().includes('president') &&
                          !elText.toLowerCase().includes('treasurer') &&
                          !elText.toLowerCase().includes('vice')) {
                        name = elText.trim();
                        break;
                      }
                    }

                    return {
                      role: text.substring(0, 100).trim(),
                      name: name || 'Name not listed',
                      email: email
                    };
                  }
                }
              }
              return null;
            };

            // Search for specific roles
            results.president = findContactByRole(['president']) ||
                               findContactByRole(['chair', 'chairperson']);
            results.vp = findContactByRole(['vice president', 'vice-president', 'vp', 'v.p.']);
            results.treasurer = findContactByRole(['treasurer', 'finance']);

            return results;
          });

          // Check if we found any contacts
          if (contacts.president || contacts.vp || contacts.treasurer) {
            contactPageUrl = tryUrl;
            console.log(`  ✓ Found contacts on: ${pattern}`);
            break;
          }
        }
      } catch (error) {
        // This pattern didn't work, try the next one
        continue;
      }
    }

    if (!contacts || (!contacts.president && !contacts.vp && !contacts.treasurer)) {
      console.log(`  ⚠ Website found but no contacts extracted`);
      return {
        association: associationName,
        location: location,
        website: websiteUrl,
        contactPage: null,
        contacts: null,
        status: 'no_contacts_found'
      };
    }

    console.log(`  ✓ President: ${contacts.president?.email || 'Not found'}`);
    console.log(`  ✓ VP: ${contacts.vp?.email || 'Not found'}`);
    console.log(`  ✓ Treasurer: ${contacts.treasurer?.email || 'Not found'}`);

    return {
      association: associationName,
      location: location,
      website: websiteUrl,
      contactPage: contactPageUrl,
      contacts: contacts,
      status: 'success'
    };

  } catch (error) {
    console.error(`  ERROR: ${error.message}`);
    return {
      association: associationName,
      location: location,
      website: null,
      contacts: null,
      status: 'error',
      error: error.message
    };
  } finally {
    await page.close();
  }
}

async function main() {
  const batch = [
    { name: 'Akwesasne Wolves', location: 'Akwesasne, ON' },
    { name: 'Alexandria Glens', location: 'Alexandria, ON' },
    { name: 'Almaguin Gazelles', location: 'Sundridge, ON' },
    { name: 'Almaguin Ice Devils', location: 'Sundridge, ON' },
    { name: 'Almonte Pakenham Thunder', location: 'Almonte, ON' },
    { name: 'Ancaster Avalanche', location: 'Ancaster, ON' },
    { name: 'Applewood Coyotes', location: 'Mississauga, ON' },
    { name: 'Arnprior Packers', location: 'Arnprior, ON' },
    { name: 'Arran-Elderslie Ice Dogs', location: 'Paisley, ON' },
    { name: 'Atikokan Voyageurs', location: 'Atikokan, ON' },
    { name: 'Ausable Valley Coyotes', location: 'Parkhill, ON' },
    { name: 'Avenue Road Ducks', location: 'North York, ON' },
    { name: 'Ayr Flames', location: 'Ayr, ON' },
    { name: 'Ayr Rockets', location: 'Ayr, ON' },
    { name: 'Baltimore Ice Dogs', location: 'Baltimore, ON' },
    { name: 'Bancroft Jets', location: 'Bancroft, ON' },
    { name: 'Belle River Jr Canadiens', location: 'Belle River, ON' },
    { name: 'Belleville Bearcats', location: 'Belleville, ON' },
    { name: 'Belleville Jr Bulls', location: 'Belleville, ON' },
    { name: 'BioSteel Sports Academy', location: 'Windsor, ON' }
  ];

  console.log(`\n${'='.repeat(70)}`);
  console.log(`BATCH EXTRACTION - ${batch.length} ASSOCIATIONS`);
  console.log(`${'='.repeat(70)}\n`);

  const browser = await chromium.launch({ headless: false }); // Set to false to see what's happening
  const results = [];

  for (const assoc of batch) {
    const result = await findWebsiteAndExtract(assoc.name, assoc.location, browser);
    results.push(result);

    // Be polite - delay between searches
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  await browser.close();

  // Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('EXTRACTION SUMMARY');
  console.log(`${'='.repeat(70)}`);
  console.log(`Total processed: ${results.length}`);
  console.log(`Success: ${results.filter(r => r.status === 'success').length}`);
  console.log(`Website found but no contacts: ${results.filter(r => r.status === 'no_contacts_found').length}`);
  console.log(`No website found: ${results.filter(r => r.status === 'no_website_found').length}`);
  console.log(`Errors: ${results.filter(r => r.status === 'error').length}`);

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `extraction-results-${timestamp}.json`;
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\n✓ Results saved to ${filename}`);

  // Output CSV format
  console.log(`\n${'='.repeat(70)}`);
  console.log('CSV FORMAT FOR ADDING TO MAIN FILE:');
  console.log(`${'='.repeat(70)}\n`);

  results.forEach(r => {
    if (r.status === 'success') {
      const pres = r.contacts.president?.email || 'Not found';
      const vp = r.contacts.vp?.email || 'Not found';
      const treas = r.contacts.treasurer?.email || 'Not found';
      const note = [
        r.contacts.president ? 'President found' : '',
        r.contacts.vp ? 'VP found' : '',
        r.contacts.treasurer ? 'Treasurer found' : ''
      ].filter(Boolean).join(', ');

      console.log(`${r.association},"${r.location}",${r.website},${pres},${vp},${treas},"${note}"`);
    } else {
      console.log(`${r.association},"${r.location}",${r.website || 'Not found'},Not found,Not found,Not found,"${r.status}"`);
    }
  });
}

main().catch(console.error);
