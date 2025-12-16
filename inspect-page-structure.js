const { chromium } = require('playwright');

async function inspectPageStructure(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Get a sample of how staff info is structured
    const structure = await page.evaluate(() => {
      // Find elements that contain "President" or "Treasurer"
      const allText = document.body.innerText;
      const results = [];

      // Find all elements with position titles
      const keyPositions = ['president', 'vice president', 'treasurer', 'vp'];

      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent.toLowerCase();
        if (keyPositions.some(pos => text.includes(pos))) {
          const parent = node.parentElement;
          let container = parent;

          // Walk up to find a reasonable container (tr, div, etc)
          for (let i = 0; i < 5 && container; i++) {
            if (container.tagName === 'TR' || container.tagName === 'DIV' ||
                container.classList.contains('member') ||
                container.classList.contains('staff')) {
              break;
            }
            container = container.parentElement;
          }

          if (container) {
            const emailLink = container.querySelector('a[href^="mailto:"]');
            results.push({
              tagName: container.tagName,
              className: container.className,
              text: container.innerText.substring(0, 300),
              hasEmail: !!emailLink,
              email: emailLink ? emailLink.href.replace('mailto:', '').split('?')[0] : null,
              html: container.outerHTML.substring(0, 500)
            });
          }
        }
      }

      return results.slice(0, 5); // Just first 5 matches
    });

    return structure;

  } catch (error) {
    console.error('Error:', error.message);
    return [];
  } finally {
    await browser.close();
  }
}

(async () => {
  console.log('Inspecting Aylmer Flames structure...\n');
  const structure = await inspectPageStructure('https://aylmerflames.com/Staff/1003/');
  console.log(JSON.stringify(structure, null, 2));
})();
