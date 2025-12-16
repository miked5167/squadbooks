const { chromium } = require('playwright');

async function extractEmails(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait a bit for Cloudflare email protection to decode
    await page.waitForTimeout(2000);

    // Extract all email links
    const emails = await page.evaluate(() => {
      const emailLinks = Array.from(document.querySelectorAll('a[href^="mailto:"]'));
      return emailLinks.map(link => {
        const email = link.href.replace('mailto:', '');
        const parentText = link.closest('tr')?.innerText || link.closest('div')?.innerText || '';
        return {
          email: email,
          context: parentText.substring(0, 200)
        };
      });
    });

    console.log('\nFound emails:', JSON.stringify(emails, null, 2));
    return emails;

  } catch (error) {
    console.error('Error:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}

// Test URLs
const testUrls = [
  { name: 'Aylmer Flames', url: 'https://aylmerflames.com/Staff/1003/' },
  { name: 'Belmont Rangers', url: 'https://belmontminorhockey.ca/Staff/1003/' },
  { name: 'Caledon Hawks', url: 'https://caledonminorhockey.ca/Staff/1523/' }
];

(async () => {
  const results = {};

  for (const test of testUrls) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Testing: ${test.name}`);
    console.log(`${'='.repeat(60)}`);
    const emails = await extractEmails(test.url);
    results[test.name] = emails;
  }

  console.log('\n\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(JSON.stringify(results, null, 2));
})();
