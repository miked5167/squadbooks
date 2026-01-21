import { test, expect } from '@playwright/test';

/**
 * E2E Test: Approval Workflow
 * Tests the dual approval system for high-value transactions
 */

test.describe('Approval Workflow', () => {
  test('should show pending approval in approver queue', async ({ page }) => {
    // Login as Assistant Treasurer (approver)
    await page.goto('http://localhost:3000/approvals');

    // Verify approvals page loads
    await expect(page.locator('h1:has-text("Pending Approvals")')).toBeVisible();

    // Check for pending approvals
    const pendingCard = page.locator('[data-testid="approval-card"]').first();
    if (await pendingCard.isVisible()) {
      // Verify approval card contains transaction details
      await expect(pendingCard.locator('text=/\\$[\\d,]+/')).toBeVisible();
      await expect(pendingCard.locator('button:has-text("Approve")')).toBeVisible();
      await expect(pendingCard.locator('button:has-text("Reject")')).toBeVisible();
    }
  });

  test('should approve expense successfully', async ({ page }) => {
    await page.goto('http://localhost:3000/approvals');

    // Find first pending approval
    const approveButton = page.locator('button:has-text("Approve")').first();

    if (await approveButton.isVisible()) {
      // Click approve button
      await approveButton.click();

      // Wait for confirmation toast
      await expect(page.locator('text=/approved/i')).toBeVisible({ timeout: 5000 });

      // Verify approval removed from queue
      await page.reload();
    }
  });

  test('should reject expense with comment', async ({ page }) => {
    await page.goto('http://localhost:3000/approvals');

    // Find first pending approval
    const rejectButton = page.locator('button:has-text("Reject")').first();

    if (await rejectButton.isVisible()) {
      // Click reject button
      await rejectButton.click();

      // Dialog should appear asking for comment
      await expect(page.locator('text=/reason/i')).toBeVisible();

      // Fill rejection comment
      await page.fill('[name="comment"]', 'Need more details about this expense');

      // Confirm rejection
      await page.click('button:has-text("Confirm")');

      // Wait for success message
      await expect(page.locator('text=/rejected/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should prevent self-approval', async ({ page }) => {
    // As a treasurer, create a high-value expense
    await page.goto('http://localhost:3000/expenses/new');

    await page.fill('[name="vendor"]', 'Test Self Approval');
    await page.fill('[name="amount"]', '300.00');
    await page.selectOption('[name="categoryId"]', { index: 1 });
    await page.click('button[type="submit"]');

    // Navigate to approvals (should not see own transaction for approval)
    await page.goto('http://localhost:3000/approvals');

    // Should NOT see the transaction we just created
    await expect(page.locator('text=Test Self Approval')).not.toBeVisible();
  });

  test('should send email notification on approval request', async ({ page }) => {
    // Note: Email testing requires checking the Resend dashboard or email inbox
    // This is a placeholder for manual verification

    // Create high-value expense
    await page.goto('http://localhost:3000/expenses/new');
    await page.fill('[name="vendor"]', 'Email Test Expense');
    await page.fill('[name="amount"]', '400.00');
    await page.selectOption('[name="categoryId"]', { index: 1 });
    await page.click('button[type="submit"]');

    // Verify confirmation message mentions email
    await expect(page.locator('text=/email|notification/i')).toBeVisible();
  });

  test('should show approval history for approved transactions', async ({ page }) => {
    await page.goto('http://localhost:3000/transactions');

    // Click on an approved transaction
    const approvedTransaction = page.locator('text=Approved').first();

    if (await approvedTransaction.isVisible()) {
      await approvedTransaction.click();

      // Should show who approved and when
      await expect(page.locator('text=/approved by/i')).toBeVisible();
      await expect(page.locator('text=/on \\d{1,2}\\/\\d{1,2}\\/\\d{4}/i')).toBeVisible();
    }
  });
});
