// This is a test version that processes only 10 associations
// Copy of production-extractor.js with test settings

const { chromium } = require('playwright');
const XLSX = require('xlsx');
const fs = require('fs');
const pLimit = require('p-limit');

// TEST CONFIGURATION - Process only 10 associations
const CONFIG = {
  maxConcurrentBrowsers: 3, // Reduced for testing
  maxConcurrentSearches: 2,
  maxRetries: 2,
  retryDelay: 3000,
  navigationTimeout: 30000,
  searchTimeout: 15000,
  emailDecodeWait: 2000,
  delayBetweenRequests: 500,
  checkpointInterval: 5,

  inputFile: 'c:\\Users\\miked\\Team Budget App\\Ontario Associations List.xlsx',
  outputDir: './test-extraction',
  checkpointFile: './test-extraction/checkpoint.json',
  resultsFile: './test-extraction/results.json',
  csvFile: './test-extraction/test-contacts.csv',
  logFile: './test-extraction/test.log',
  errorsFile: './test-extraction/errors.json',

  testLimit: 10, // TEST MODE: Process only 10 associations
};

class Logger {
  constructor(logFile) {
    this.logFile = logFile;
    this.startTime = Date.now();
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  error(message) { this.log(message, 'ERROR'); }
  success(message) { this.log(message, 'SUCCESS'); }
  warn(message) { this.log(message, 'WARN'); }

  stats(stats) {
    const elapsed = ((Date.now() - this.startTime) / 1000 / 60).toFixed(2);
    this.log(`\n${'='.repeat(70)}`, 'STATS');
    this.log(`Statistics (${elapsed} minutes elapsed):`, 'STATS');
    Object.entries(stats).forEach(([key, value]) => {
      this.log(`  ${key}: ${value}`, 'STATS');
    });
    this.log('='.repeat(70), 'STATS');
  }
}

async function findWebsite(associationName, location, browser, logger) {
  const page = await browser.newPage();

  try {
    const searchQuery = `${associationName} ${location} minor hockey`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.searchTimeout });
    await page.waitForTimeout(1000);

    const url = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      for (const link of links) {
        const href = link.href;
        if (href.includes('http') &&
            !href.includes('google.com') &&
            !href.includes('youtube.com') &&
            !href.includes('facebook.com') &&
            !href.includes('instagram.com') &&
            (href.includes('hockey') || href.includes('mha') || href.includes('omha'))) {
          return href;
        }
      }
      return null;
    });

    if (url) {
      logger.log(`  Found website: ${url}`);
      return url;
    } else {
      logger.warn(`  No website found for ${associationName}`);
      return null;
    }
  } catch (error) {
    logger.error(`  Error finding website for ${associationName}: ${error.message}`);
    return null;
  } finally {
    await page.close();
  }
}

async function extractFromPage(url, associationName, browser, logger) {
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: CONFIG.navigationTimeout });
    await page.waitForTimeout(CONFIG.emailDecodeWait);

    const contacts = await page.evaluate(() => {
      const results = {};

      const roleDivs = document.querySelectorAll('.role, [class*="position"], [class*="title"]');

      roleDivs.forEach(roleDiv => {
        const roleText = roleDiv.innerText || roleDiv.textContent || '';
        const roleLower = roleText.toLowerCase();

        let container = roleDiv.parentElement;
        for (let i = 0; i < 3 && container; i++) {
          const emailLink = container.querySelector('a[href^="mailto:"]');
          const nameElement = container.querySelector('.name, [class*="name"]');

          if (emailLink) {
            const email = emailLink.href.replace('mailto:', '').split('?')[0];
            const name = nameElement ? nameElement.innerText.trim() : '';

            if (roleLower.includes('president') && !roleLower.includes('vice') && !roleLower.includes('past')) {
              results.president = { role: roleText.trim(), name: name, email: email };
            } else if (roleLower.includes('vice') || roleLower.includes(' vp ')) {
              results.vp = { role: roleText.trim(), name: name, email: email };
            } else if (roleLower.includes('treasurer')) {
              results.treasurer = { role: roleText.trim(), name: name, email: email };
            }

            break;
          }
          container = container.parentElement;
        }
      });

      if (Object.keys(results).length === 0) {
        const allRows = Array.from(document.querySelectorAll('tr, li, .member, .staff-member, article'));

        allRows.forEach(row => {
          const text = row.innerText || '';
          const textLower = text.toLowerCase();
          const emailLink = row.querySelector('a[href^="mailto:"]');

          if (emailLink) {
            const email = emailLink.href.replace('mailto:', '').split('?')[0];

            if (textLower.includes('president') && !textLower.includes('vice') && !textLower.includes('past')) {
              if (!results.president) results.president = { context: text.substring(0, 100), email: email };
            } else if (textLower.includes('vice') || textLower.includes(' vp ')) {
              if (!results.vp) results.vp = { context: text.substring(0, 100), email: email };
            } else if (textLower.includes('treasurer')) {
              if (!results.treasurer) results.treasurer = { context: text.substring(0, 100), email: email };
            }
          }
        });
      }

      return results;
    });

    return { url: url, ...contacts };
  } catch (error) {
    throw error;
  } finally {
    await page.close();
  }
}

async function extractEmails(url, associationName, browser, logger) {
  const staffPages = [
    '/Staff/1003/', '/staff/1003/', '/Staff/', '/staff/',
    '/contact/', '/Contact/', '/about/', '/About/',
    '/board/', '/Board/', '/executive/', '/Executive/'
  ];

  for (const staffPath of staffPages) {
    try {
      const fullUrl = new URL(staffPath, url).href;
      const result = await extractFromPage(fullUrl, associationName, browser, logger);

      if (result.president || result.vp || result.treasurer) {
        return result;
      }
    } catch (error) {
      continue;
    }
  }

  return await extractFromPage(url, associationName, browser, logger);
}

async function withRetry(fn, retries = CONFIG.maxRetries, delay = CONFIG.retryDelay) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

async function processAssociation(association, browser, logger, stats) {
  const { 'Association Name': name, Location: location } = association;

  logger.log(`Processing: ${name}`);
  stats.processed++;

  try {
    let website = null;
    try {
      website = await withRetry(() => findWebsite(name, location, browser, logger));
    } catch (error) {
      logger.error(`  Failed to find website: ${error.message}`);
      stats.websiteNotFound++;
      return {
        association: name,
        location: location,
        website: null,
        status: 'website_not_found',
        error: error.message
      };
    }

    if (!website) {
      stats.websiteNotFound++;
      return {
        association: name,
        location: location,
        website: null,
        status: 'website_not_found'
      };
    }

    stats.websiteFound++;

    await new Promise(resolve => setTimeout(resolve, CONFIG.delayBetweenRequests));

    try {
      const contacts = await withRetry(() => extractEmails(website, name, browser, logger));

      const hasContacts = contacts.president || contacts.vp || contacts.treasurer;

      if (hasContacts) {
        logger.success(`  ✓ Extracted contacts for ${name}`);
        stats.emailsExtracted++;
      } else {
        logger.warn(`  No contacts found for ${name}`);
        stats.noEmailsFound++;
      }

      return {
        association: name,
        location: location,
        website: website,
        status: hasContacts ? 'success' : 'no_emails_found',
        president: contacts.president,
        vp: contacts.vp,
        treasurer: contacts.treasurer,
        extractedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error(`  Failed to extract emails: ${error.message}`);
      stats.extractionFailed++;
      return {
        association: name,
        location: location,
        website: website,
        status: 'extraction_failed',
        error: error.message
      };
    }
  } catch (error) {
    logger.error(`  Unexpected error: ${error.message}`);
    stats.errors++;
    return {
      association: name,
      location: location,
      status: 'error',
      error: error.message
    };
  }
}

function exportToCSV(results, logger) {
  const csvLines = ['Association Name,Location,Website URL,President Email,VP Email,Treasurer Email,Status,Notes'];

  results.forEach(result => {
    const presEmail = result.president?.email || 'Not found';
    const vpEmail = result.vp?.email || 'Not found';
    const treasEmail = result.treasurer?.email || 'Not found';
    const notes = result.error || result.status;

    csvLines.push(`"${result.association}","${result.location}","${result.website || 'Not found'}",${presEmail},${vpEmail},${treasEmail},${result.status},"${notes}"`);
  });

  fs.writeFileSync(CONFIG.csvFile, csvLines.join('\n'));
  logger.success(`CSV exported: ${CONFIG.csvFile}`);
}

async function main() {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const logger = new Logger(CONFIG.logFile);
  logger.log('='.repeat(70));
  logger.log('TEST RUN - 10 ASSOCIATIONS');
  logger.log('='.repeat(70));

  logger.log('Reading input file...');
  const workbook = XLSX.readFile(CONFIG.inputFile);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  let associations = XLSX.utils.sheet_to_json(worksheet);

  logger.log(`Total associations in file: ${associations.length}`);
  logger.warn(`TEST MODE: Processing only ${CONFIG.testLimit} associations`);
  associations = associations.slice(0, CONFIG.testLimit);

  let results = [];
  let stats = {
    total: associations.length,
    processed: 0,
    websiteFound: 0,
    websiteNotFound: 0,
    emailsExtracted: 0,
    noEmailsFound: 0,
    extractionFailed: 0,
    errors: 0
  };

  logger.log(`Launching ${CONFIG.maxConcurrentBrowsers} browsers...`);
  const browsers = [];
  for (let i = 0; i < CONFIG.maxConcurrentBrowsers; i++) {
    const browser = await chromium.launch({ headless: true });
    browsers.push(browser);
  }

  const limit = pLimit(CONFIG.maxConcurrentBrowsers);

  logger.log('Starting extraction...');
  logger.log('='.repeat(70));

  const tasks = associations.map((association, index) => {
    const browserIndex = index % CONFIG.maxConcurrentBrowsers;

    return limit(async () => {
      const result = await processAssociation(association, browsers[browserIndex], logger, stats);
      results.push(result);
      return result;
    });
  });

  await Promise.all(tasks);

  logger.log('Closing browsers...');
  for (const browser of browsers) {
    await browser.close();
  }

  logger.log('Saving results...');
  fs.writeFileSync(CONFIG.resultsFile, JSON.stringify(results, null, 2));
  exportToCSV(results, logger);

  const errors = results.filter(r => r.status === 'error' || r.status === 'extraction_failed');
  fs.writeFileSync(CONFIG.errorsFile, JSON.stringify(errors, null, 2));

  logger.log('\n' + '='.repeat(70));
  logger.log('TEST RUN COMPLETE');
  logger.log('='.repeat(70));
  logger.stats(stats);

  logger.log('\nSuccess Rate:');
  logger.log(`  Website Discovery: ${((stats.websiteFound / stats.total) * 100).toFixed(1)}%`);
  if (stats.websiteFound > 0) {
    logger.log(`  Email Extraction: ${((stats.emailsExtracted / stats.websiteFound) * 100).toFixed(1)}%`);
  }
  logger.log(`  Overall: ${((stats.emailsExtracted / stats.total) * 100).toFixed(1)}%`);

  logger.log('\nOutput files:');
  logger.log(`  Results: ${CONFIG.resultsFile}`);
  logger.log(`  CSV: ${CONFIG.csvFile}`);
  logger.log(`  Errors: ${CONFIG.errorsFile}`);
  logger.log(`  Log: ${CONFIG.logFile}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
