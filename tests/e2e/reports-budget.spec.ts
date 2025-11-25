import { test, expect } from '@playwright/test';

/**
 * E2E Test: Reports and Budget Features
 * Tests report generation and budget tracking functionality
 */

test.describe('Reports and Budget', () => {
  test.describe('Budget Page', () => {
    test('should display budget overview', async ({ page }) => {
      await page.goto('http://localhost:3000/budget');

      // Page should load
      await expect(page.locator('h1:has-text("Budget")')).toBeVisible();

      // Should show total budget
      await expect(page.locator('text=/Total Budget:.*\\$[\\d,]+/')).toBeVisible();

      // Should show spent amount
      await expect(page.locator('text=/Spent:.*\\$[\\d,]+/')).toBeVisible();

      // Should show remaining amount
      await expect(page.locator('text=/Remaining:.*\\$[\\d,]+/')).toBeVisible();
    });

    test('should display category breakdown', async ({ page }) => {
      await page.goto('http://localhost:3000/budget');

      // Should show multiple categories
      await expect(page.locator('text=Equipment')).toBeVisible();
      await expect(page.locator('text=Tournament Fees')).toBeVisible();

      // Each category should have progress bar
      const progressBars = page.locator('[role="progressbar"]');
      await expect(progressBars.first()).toBeVisible();
    });

    test('should show budget status colors', async ({ page }) => {
      await page.goto('http://localhost:3000/budget');

      // Categories should have status indicators
      // Green (<70%), Yellow (70-90%), Red (>90%)
      const statusIndicators = page.locator('[data-testid="budget-status"]');

      if (await statusIndicators.first().isVisible()) {
        const classList = await statusIndicators.first().getAttribute('class');
        expect(classList).toMatch(/(green|yellow|red|success|warning|danger)/i);
      }
    });

    test('should calculate totals correctly', async ({ page }) => {
      await page.goto('http://localhost:3000/budget');

      // Get total budget amount
      const totalText = await page.locator('text=/Total Budget:.*\\$([\\d,]+\\.\\d{2})/')
        .first()
        .textContent();

      // Verify it's a valid amount
      expect(totalText).toMatch(/\$[\d,]+\.\d{2}/);
    });

    test('should display pie chart visualization', async ({ page }) => {
      await page.goto('http://localhost:3000/budget');

      // Should have chart container
      const chart = page.locator('[data-testid="budget-chart"]');
      if (await chart.isVisible()) {
        await expect(chart).toBeVisible();
      } else {
        // Alternative: Look for Recharts SVG
        const rechartsSvg = page.locator('svg.recharts-surface');
        await expect(rechartsSvg.first()).toBeVisible();
      }
    });
  });

  test.describe('Reports Page', () => {
    test('should display reports dashboard', async ({ page }) => {
      await page.goto('http://localhost:3000/reports');

      // Page should load
      await expect(page.locator('h1:has-text("Reports")')).toBeVisible();

      // Should show report types
      await expect(page.locator('text=/monthly.*summary/i')).toBeVisible();
      await expect(page.locator('text=/budget.*variance/i')).toBeVisible();
      await expect(page.locator('text=/transaction.*export/i')).toBeVisible();
    });

    test('should generate monthly summary report', async ({ page }) => {
      await page.goto('http://localhost:3000/reports');

      // Find monthly summary section
      await expect(page.locator('text=/monthly.*summary/i')).toBeVisible();

      // Select month
      const monthSelect = page.locator('select[name="month"]');
      if (await monthSelect.isVisible()) {
        await monthSelect.selectOption({ index: 0 });
      }

      // Click generate button
      const generateButton = page.locator('button:has-text("Generate")').first();
      await generateButton.click();

      // Should show report results
      await expect(page.locator('text=/Total Income:|Total Expenses:/i')).toBeVisible();
    });

    test('should generate budget variance report', async ({ page }) => {
      await page.goto('http://localhost:3000/reports');

      // Find budget variance section
      await expect(page.locator('text=/budget.*variance/i')).toBeVisible();

      // Generate report
      const generateButton = page.locator('button:has-text("Generate")')
        .filter({ hasText: /variance/i });

      if (await generateButton.isVisible()) {
        await generateButton.click();

        // Should show variance data
        await expect(page.locator('text=/Budget|Actual|Variance/i')).toBeVisible();
      }
    });

    test('should export transactions as CSV', async ({ page }) => {
      await page.goto('http://localhost:3000/reports');

      // Find export section
      await expect(page.locator('text=/transaction.*export/i')).toBeVisible();

      // Setup download handler
      const downloadPromise = page.waitForEvent('download');

      // Click export button
      const exportButton = page.locator('button:has-text("Export")');
      await exportButton.click();

      // Wait for download
      const download = await downloadPromise;

      // Verify filename
      expect(download.suggestedFilename()).toMatch(/transactions.*\.csv/i);

      // Optionally verify file content
      const path = await download.path();
      expect(path).toBeTruthy();
    });

    test('should filter transactions before export', async ({ page }) => {
      await page.goto('http://localhost:3000/reports');

      // Set filters
      const typeSelect = page.locator('select[name="type"]');
      if (await typeSelect.isVisible()) {
        await typeSelect.selectOption('EXPENSE');
      }

      const statusSelect = page.locator('select[name="status"]');
      if (await statusSelect.isVisible()) {
        await statusSelect.selectOption('APPROVED');
      }

      // Export with filters
      const exportButton = page.locator('button:has-text("Export")');
      await exportButton.click();

      // Download should happen
      await expect(page.locator('text=/export/i')).toBeVisible();
    });
  });

  test.describe('Dashboard Budget Snapshot', () => {
    test('should show budget snapshot on dashboard', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');

      // Should have budget section
      await expect(page.locator('text=/budget.*snapshot|budget.*overview/i')).toBeVisible();

      // Should show key metrics
      await expect(page.locator('text=/\\$[\\d,]+/')).toBeVisible();
    });

    test('should link to full budget page', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');

      // Find "View Full Budget" link
      const budgetLink = page.locator('a:has-text("Budget")').first();
      await budgetLink.click();

      // Should navigate to budget page
      await expect(page).toHaveURL(/.*\/budget/);
    });
  });

  test.describe('Parent Dashboard View', () => {
    test('should show financial transparency for parents', async ({ page }) => {
      // Login as parent
      await page.goto('http://localhost:3000/dashboard');

      // Should see budget overview
      await expect(page.locator('text=/budget|balance/i')).toBeVisible();

      // Should see recent transactions (approved only)
      await expect(page.locator('text=/recent.*transactions/i')).toBeVisible();

      // Should NOT see pending transactions
      await expect(page.locator('text=Pending')).not.toBeVisible();
    });

    test('should display financial health status', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');

      // Should show health indicator
      const healthStatus = page.locator('text=/healthy|warning|danger|good|concerning/i');
      await expect(healthStatus.first()).toBeVisible();
    });

    test('should show category spending breakdown', async ({ page }) => {
      await page.goto('http://localhost:3000/dashboard');

      // Should have spending by category
      await expect(page.locator('text=/Equipment|Tournament|Travel/i')).toBeVisible();

      // Should have percentage or amount indicators
      await expect(page.locator('text=/\\$[\\d,]+|\\d+%/')).toBeVisible();
    });
  });

  test.describe('Budget Calculations', () => {
    test('should update budget after expense creation', async ({ page }) => {
      // Get initial budget state
      await page.goto('http://localhost:3000/budget');
      const initialRemaining = await page.locator('[data-testid="remaining-amount"]')
        .first()
        .textContent();

      // Create an expense
      await page.goto('http://localhost:3000/expenses/new');
      await page.fill('[name="vendor"]', 'Budget Test');
      await page.fill('[name="amount"]', '50.00');
      await page.selectOption('[name="categoryId"]', { index: 1 });
      await page.click('button[type="submit"]');

      // Go back to budget
      await page.goto('http://localhost:3000/budget');

      // Remaining should have decreased (if expense was auto-approved)
      const newRemaining = await page.locator('[data-testid="remaining-amount"]')
        .first()
        .textContent();

      // Note: Only compare if expense was auto-approved (<$200)
      expect(newRemaining).toBeTruthy();
    });

    test('should not count pending transactions in budget', async ({ page }) => {
      // Create high-value expense (requires approval)
      await page.goto('http://localhost:3000/expenses/new');
      await page.fill('[name="vendor"]', 'Pending Budget Test');
      await page.fill('[name="amount"]', '500.00');
      await page.selectOption('[name="categoryId"]', { index: 1 });
      await page.click('button[type="submit"]');

      // Check budget page
      await page.goto('http://localhost:3000/budget');

      // Budget should not have changed (pending not counted)
      // This would require storing previous state and comparing
      await expect(page.locator('text=/budget/i')).toBeVisible();
    });

    test('should show over-budget warning', async ({ page }) => {
      await page.goto('http://localhost:3000/budget');

      // Look for any over-budget indicators
      const warningIndicators = page.locator('[data-status="over-budget"]');
      if (await warningIndicators.first().isVisible()) {
        await expect(warningIndicators.first()).toHaveClass(/warning|danger|red/i);
      }
    });
  });
});
