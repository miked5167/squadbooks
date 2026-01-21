const { chromium } = require('playwright');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const pLimit = require('p-limit');

// ============================================================================
// CONFIGURATION
// ============================================================================
const CONFIG = {
  // Concurrency settings
  maxConcurrentBrowsers: 10,
  maxConcurrentSearches: 5,

  // Retry settings
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds

  // Timeouts
  navigationTimeout: 30000,
  searchTimeout: 15000,
  emailDecodeWait: 2000,

  // Rate limiting
  delayBetweenRequests: 1000, // 1 second

  // Checkpoint settings
  checkpointInterval: 50, // Save every 50 associations

  // Paths
  inputFile: 'c:\\Users\\miked\\Team Budget App\\Ontario Associations List.xlsx',
  outputDir: './extraction-output',
  checkpointFile: './extraction-output/checkpoint.json',
  resultsFile: './extraction-output/results.json',
  csvFile: './extraction-output/ontario-contacts.csv',
  logFile: './extraction-output/extraction.log',
  errorsFile: './extraction-output/errors.json',

  // Test mode (set to 0 for full run)
  testLimit: 0, // Process all associations
};

// ============================================================================
// LOGGING
// ============================================================================
class Logger {
  constructor(logFile) {
    this.logFile = logFile;
    this.startTime = Date.now();
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}`;
    console.log(logMessage);

    // Append to log file
    fs.appendFileSync(this.logFile, logMessage + '\n');
  }

  error(message) {
    this.log(message, 'ERROR');
  }

  success(message) {
    this.log(message, 'SUCCESS');
  }

  warn(message) {
    this.log(message, 'WARN');
  }

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

// ============================================================================
// WEBSITE DISCOVERY
// ============================================================================
async function findWebsite(associationName, location, browser, logger) {
  const page = await browser.newPage();

  try {
    const searchQuery = `${associationName} ${location} minor hockey`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.searchTimeout });
    await page.waitForTimeout(1000);

    // Extract first result URL
    const url = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      for (const link of links) {
        const href = link.href;
        // Look for relevant hockey association URLs
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

// ============================================================================
// EMAIL EXTRACTION
// ============================================================================
async function extractEmails(url, associationName, browser, logger) {
  // Try common staff page patterns
  const staffPages = [
    '/Staff/1003/',
    '/staff/1003/',
    '/Staff/',
    '/staff/',
    '/contact/',
    '/Contact/',
    '/about/',
    '/About/',
    '/board/',
    '/Board/',
    '/executive/',
    '/Executive/'
  ];

  for (const staffPath of staffPages) {
    try {
      const fullUrl = new URL(staffPath, url).href;
      const result = await extractFromPage(fullUrl, associationName, browser, logger);

      if (result.president || result.vp || result.treasurer) {
        return result;
      }
    } catch (error) {
      // Try next pattern
      continue;
    }
  }

  // If no staff page found, try the main page
  return await extractFromPage(url, associationName, browser, logger);
}

async function extractFromPage(url, associationName, browser, logger) {
  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: CONFIG.navigationTimeout });
    await page.waitForTimeout(CONFIG.emailDecodeWait);

    const contacts = await page.evaluate(() => {
      const results = {};

      // Strategy 1: Find role divs
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

      // Strategy 2: Fallback - search in table rows and list items
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

    return {
      url: url,
      ...contacts
    };
  } catch (error) {
    throw error;
  } finally {
    await page.close();
  }
}

// ============================================================================
// RETRY LOGIC
// ============================================================================
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

// ============================================================================
// MAIN PROCESSING
// ============================================================================
async function processAssociation(association, browser, logger, stats) {
  const { 'Association Name': name, Location: location } = association;

  logger.log(`Processing: ${name}`);
  stats.processed++;

  try {
    // Step 1: Find website
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

    // Step 2: Extract emails
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

// ============================================================================
// CHECKPOINT MANAGEMENT
// ============================================================================
function saveCheckpoint(results, stats, logger) {
  const checkpoint = {
    results: results,
    stats: stats,
    timestamp: new Date().toISOString(),
    processed: stats.processed
  };

  fs.writeFileSync(CONFIG.checkpointFile, JSON.stringify(checkpoint, null, 2));
  logger.log(`Checkpoint saved: ${stats.processed} associations processed`);
}

function loadCheckpoint(logger) {
  if (fs.existsSync(CONFIG.checkpointFile)) {
    logger.log('Loading checkpoint...');
    const checkpoint = JSON.parse(fs.readFileSync(CONFIG.checkpointFile, 'utf8'));
    logger.log(`Resuming from: ${checkpoint.processed} associations`);
    return checkpoint;
  }
  return null;
}

// ============================================================================
// CSV EXPORT
// ============================================================================
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

// ============================================================================
// MAIN FUNCTION
// ============================================================================
async function main() {
  // Create output directory
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }

  const logger = new Logger(CONFIG.logFile);
  logger.log('='.repeat(70));
  logger.log('ONTARIO HOCKEY ASSOCIATIONS - EMAIL EXTRACTION');
  logger.log('='.repeat(70));

  // Read input file
  logger.log('Reading input file...');
  const workbook = XLSX.readFile(CONFIG.inputFile);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  let associations = XLSX.utils.sheet_to_json(worksheet);

  logger.log(`Total associations: ${associations.length}`);

  // Apply test limit if set
  if (CONFIG.testLimit > 0) {
    logger.warn(`TEST MODE: Processing only ${CONFIG.testLimit} associations`);
    associations = associations.slice(0, CONFIG.testLimit);
  }

  // Check for checkpoint
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

  const checkpoint = loadCheckpoint(logger);
  if (checkpoint) {
    results = checkpoint.results;
    stats = checkpoint.stats;
    associations = associations.slice(stats.processed);
    logger.log(`Resuming with ${associations.length} remaining associations`);
  }

  // Launch browser pool
  logger.log(`Launching ${CONFIG.maxConcurrentBrowsers} browsers...`);
  const browsers = [];
  for (let i = 0; i < CONFIG.maxConcurrentBrowsers; i++) {
    const browser = await chromium.launch({ headless: true });
    browsers.push(browser);
  }

  // Create concurrency limiter
  const limit = pLimit(CONFIG.maxConcurrentBrowsers);

  // Process associations
  logger.log('Starting extraction...');
  logger.log('='.repeat(70));

  const tasks = associations.map((association, index) => {
    const browserIndex = index % CONFIG.maxConcurrentBrowsers;

    return limit(async () => {
      const result = await processAssociation(association, browsers[browserIndex], logger, stats);
      results.push(result);

      // Save checkpoint periodically
      if (stats.processed % CONFIG.checkpointInterval === 0) {
        saveCheckpoint(results, stats, logger);
        logger.stats(stats);
      }

      return result;
    });
  });

  // Wait for all tasks to complete
  await Promise.all(tasks);

  // Close browsers
  logger.log('Closing browsers...');
  for (const browser of browsers) {
    await browser.close();
  }

  // Final save
  logger.log('Saving final results...');
  fs.writeFileSync(CONFIG.resultsFile, JSON.stringify(results, null, 2));
  saveCheckpoint(results, stats, logger);
  exportToCSV(results, logger);

  // Save errors separately
  const errors = results.filter(r => r.status === 'error' || r.status === 'extraction_failed');
  fs.writeFileSync(CONFIG.errorsFile, JSON.stringify(errors, null, 2));

  // Final statistics
  logger.log('\n' + '='.repeat(70));
  logger.log('EXTRACTION COMPLETE');
  logger.log('='.repeat(70));
  logger.stats(stats);

  logger.log('\nSuccess Rate:');
  logger.log(`  Website Discovery: ${((stats.websiteFound / stats.total) * 100).toFixed(1)}%`);
  logger.log(`  Email Extraction: ${((stats.emailsExtracted / stats.websiteFound) * 100).toFixed(1)}%`);
  logger.log(`  Overall: ${((stats.emailsExtracted / stats.total) * 100).toFixed(1)}%`);

  logger.log('\nOutput files:');
  logger.log(`  Results: ${CONFIG.resultsFile}`);
  logger.log(`  CSV: ${CONFIG.csvFile}`);
  logger.log(`  Errors: ${CONFIG.errorsFile}`);
  logger.log(`  Log: ${CONFIG.logFile}`);
}

// ============================================================================
// RUN
// ============================================================================
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
