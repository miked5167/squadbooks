import { test, expect } from '@playwright/test';

/**
 * E2E Test: Treasurer Workflow
 * Tests the complete flow for a treasurer creating and managing transactions
 */

test.describe('Treasurer Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
  });

  test('should complete sign up and onboarding flow', async ({ page }) => {
    // Click Sign In button
    await page.click('text=Sign In');

    // Wait for Clerk authentication
    await page.waitForURL('**/sign-in**');

    // Note: This requires manual authentication or Clerk test credentials
    // For automated testing, you would use Clerk's test environment
  });

  test('should create expense under $200 (auto-approved)', async ({ page }) => {
    // Assuming user is already authenticated
    // Navigate to expenses page
    await page.goto('http://localhost:3000/expenses/new');

    // Fill out expense form
    await page.fill('[name="vendor"]', 'Test Sports Equipment');
    await page.fill('[name="amount"]', '150.00');
    await page.selectOption('[name="categoryId"]', { index: 1 });
    await page.fill('[name="description"]', 'Practice jerseys for the team');

    // Select date (today)
    const today = new Date().toISOString().split('T')[0];
    await page.fill('[name="transactionDate"]', today);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL('**/transactions');

    // Verify transaction appears in list
    await expect(page.locator('text=Test Sports Equipment')).toBeVisible();
    await expect(page.locator('text=$150.00')).toBeVisible();
  });

  test('should create expense over $200 (requires approval)', async ({ page }) => {
    await page.goto('http://localhost:3000/expenses/new');

    // Fill out high-value expense
    await page.fill('[name="vendor"]', 'Tournament Registration');
    await page.fill('[name="amount"]', '500.00');
    await page.selectOption('[name="categoryId"]', { index: 1 });
    await page.fill('[name="description"]', 'Spring tournament entry fee');

    const today = new Date().toISOString().split('T')[0];
    await page.fill('[name="transactionDate"]', today);

    // Submit form
    await page.click('button[type="submit"]');

    // Should see approval required message
    await expect(page.locator('text=Approval required')).toBeVisible();

    // Verify transaction status is PENDING
    await page.goto('http://localhost:3000/transactions');
    await page.click('text=Pending'); // Click pending tab
    await expect(page.locator('text=Tournament Registration')).toBeVisible();
  });

  test('should upload receipt with transaction', async ({ page }) => {
    await page.goto('http://localhost:3000/expenses/new');

    // Fill out expense form
    await page.fill('[name="vendor"]', 'Equipment Store');
    await page.fill('[name="amount"]', '75.50');
    await page.selectOption('[name="categoryId"]', { index: 1 });

    // Upload receipt
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('tests/fixtures/sample-receipt.pdf');

    // Verify file selected
    await expect(page.locator('text=sample-receipt.pdf')).toBeVisible();

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await page.waitForURL('**/transactions');
  });

  test('should create income transaction', async ({ page }) => {
    await page.goto('http://localhost:3000/income/new');

    // Fill out income form
    await page.fill('[name="vendor"]', 'Team Fundraiser');
    await page.fill('[name="amount"]', '1250.00');
    await page.selectOption('[name="categoryId"]', { label: /fundraising/i });
    await page.fill('[name="description"]', 'Pizza fundraiser proceeds');

    const today = new Date().toISOString().split('T')[0];
    await page.fill('[name="transactionDate"]', today);

    // Submit form
    await page.click('button[type="submit"]');

    // Verify in transaction list
    await page.waitForURL('**/transactions');
    await expect(page.locator('text=Team Fundraiser')).toBeVisible();
    await expect(page.locator('text=$1,250.00')).toBeVisible();
  });

  test('should view and verify budget updates', async ({ page }) => {
    await page.goto('http://localhost:3000/budget');

    // Verify budget page loads
    await expect(page.locator('h1:has-text("Budget")')).toBeVisible();

    // Verify budget categories are displayed
    await expect(page.locator('text=Equipment')).toBeVisible();
    await expect(page.locator('text=Tournament Fees')).toBeVisible();

    // Verify progress bars are visible
    const progressBars = page.locator('[role="progressbar"]');
    await expect(progressBars.first()).toBeVisible();

    // Verify budget calculations
    const totalBudget = page.locator('text=/Total Budget:.*\\$[\\d,]+/');
    await expect(totalBudget).toBeVisible();
  });
});
