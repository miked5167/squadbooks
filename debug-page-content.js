const { chromium } = require('playwright');
const fs = require('fs');

/**
 * DEBUG SCRIPT: Inspect actual page content to understand Cloudflare structure
 */

async function inspectPage(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log(`\nNavigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Get the HTML content
    const html = await page.content();

    // Extract information about email links
    const linkInfo = await page.evaluate(() => {
      const info = {
        cloudflareLinks: [],
        mailtoLinks: [],
        allLinks: [],
        sampleHTML: ''
      };

      // Find all links
      const allLinks = document.querySelectorAll('a');
      info.allLinks = Array.from(allLinks).map(link => ({
        href: link.getAttribute('href'),
        text: link.innerText?.substring(0, 50),
        hasDataCfemail: link.hasAttribute('data-cfemail'),
        dataCfemailValue: link.getAttribute('data-cfemail')
      }));

      // Find Cloudflare-protected links
      const cfLinks = document.querySelectorAll('a[href*="cdn-cgi"]');
      info.cloudflareLinks = Array.from(cfLinks).map(link => ({
        href: link.getAttribute('href'),
        text: link.innerText?.substring(0, 50),
        outerHTML: link.outerHTML
      }));

      // Find mailto links
      const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
      info.mailtoLinks = Array.from(mailtoLinks).map(link => ({
        href: link.getAttribute('href'),
        text: link.innerText?.substring(0, 50)
      }));

      // Get sample HTML around "Send Email" text
      const bodyText = document.body.innerHTML;
      const sendEmailIndex = bodyText.indexOf('Send Email');
      if (sendEmailIndex !== -1) {
        info.sampleHTML = bodyText.substring(Math.max(0, sendEmailIndex - 200), sendEmailIndex + 200);
      }

      return info;
    });

    console.log('\n' + '='.repeat(80));
    console.log('LINK ANALYSIS');
    console.log('='.repeat(80));
    console.log(`Total links found: ${linkInfo.allLinks.length}`);
    console.log(`Cloudflare-protected links: ${linkInfo.cloudflareLinks.length}`);
    console.log(`Mailto links: ${linkInfo.mailtoLinks.length}`);

    if (linkInfo.cloudflareLinks.length > 0) {
      console.log('\nCloudflare Links (first 3):');
      linkInfo.cloudflareLinks.slice(0, 3).forEach((link, i) => {
        console.log(`  ${i + 1}. href="${link.href}"`);
        console.log(`     text="${link.text}"`);
        console.log(`     HTML: ${link.outerHTML.substring(0, 150)}`);
      });
    }

    if (linkInfo.mailtoLinks.length > 0) {
      console.log('\nMailto Links (first 3):');
      linkInfo.mailtoLinks.slice(0, 3).forEach((link, i) => {
        console.log(`  ${i + 1}. ${link.href}`);
      });
    }

    console.log('\nSample HTML around "Send Email":');
    console.log(linkInfo.sampleHTML);

    // Check for data-cfemail attributes
    const cfemailLinks = linkInfo.allLinks.filter(l => l.hasDataCfemail);
    if (cfemailLinks.length > 0) {
      console.log('\n\nLinks with data-cfemail attribute:');
      cfemailLinks.forEach((link, i) => {
        console.log(`  ${i + 1}. data-cfemail="${link.dataCfemailValue}"`);
        console.log(`     href="${link.href}"`);
      });
    }

    // Save full HTML for manual inspection
    fs.writeFileSync('debug-page.html', html);
    console.log('\n\nFull page HTML saved to: debug-page.html');

    await browser.close();

  } catch (error) {
    console.error('Error:', error.message);
    await browser.close();
  }
}

// Test with Ingersoll (confirmed to have Cloudflare-protected emails)
inspectPage('https://ingersollminorhockey.ca/Staff/1003/');
