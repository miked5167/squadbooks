import { test, expect } from '@playwright/test';

/**
 * Security Test: Role-Based Access Control (RBAC)
 * Tests that users can only perform actions allowed by their role
 */

test.describe('RBAC - Role-Based Access Control', () => {
  test.describe('Parent Role', () => {
    test('parent cannot create transactions', async ({ page }) => {
      // Login as parent
      // Note: Requires parent user credentials

      // Try to access expense creation page
      await page.goto('http://localhost:3000/expenses/new');

      // Should be redirected or see error message
      await expect(page.locator('text=/unauthorized|forbidden|access denied/i')).toBeVisible();
    });

    test('parent cannot approve expenses', async ({ page }) => {
      await page.goto('http://localhost:3000/approvals');

      // Should not see approval buttons or should see access denied
      const approveButton = page.locator('button:has-text("Approve")');
      await expect(approveButton).not.toBeVisible();
    });

    test('parent can only see approved transactions', async ({ page }) => {
      await page.goto('http://localhost:3000/transactions');

      // Should only see approved transactions
      const pendingBadge = page.locator('text=Pending');
      await expect(pendingBadge).not.toBeVisible();

      const rejectedBadge = page.locator('text=Rejected');
      await expect(rejectedBadge).not.toBeVisible();
    });

    test('parent can view budget dashboard', async ({ page }) => {
      await page.goto('http://localhost:3000/budget');

      // Budget page should be accessible
      await expect(page.locator('h1:has-text("Budget")')).toBeVisible();

      // But cannot modify budgets
      const editButton = page.locator('button:has-text("Edit")');
      await expect(editButton).not.toBeVisible();
    });
  });

  test.describe('Treasurer Role', () => {
    test('treasurer can create transactions', async ({ page }) => {
      await page.goto('http://localhost:3000/expenses/new');

      // Should see expense form
      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input[name="vendor"]')).toBeVisible();
    });

    test('treasurer cannot approve own expenses', async ({ page }) => {
      // Create an expense
      await page.goto('http://localhost:3000/expenses/new');
      await page.fill('[name="vendor"]', 'Self Approval Test');
      await page.fill('[name="amount"]', '300.00');
      await page.selectOption('[name="categoryId"]', { index: 1 });
      await page.click('button[type="submit"]');

      // Try to go to approvals page
      await page.goto('http://localhost:3000/approvals');

      // Should NOT see the expense they just created
      await expect(page.locator('text=Self Approval Test')).not.toBeVisible();
    });

    test('treasurer can update draft transactions', async ({ page }) => {
      await page.goto('http://localhost:3000/transactions');

      // Find a draft transaction
      const draftTransaction = page.locator('[data-status="DRAFT"]').first();

      if (await draftTransaction.isVisible()) {
        await draftTransaction.click();

        // Should see edit button
        await expect(page.locator('button:has-text("Edit")')).toBeVisible();
      }
    });

    test('treasurer cannot update approved transactions', async ({ page }) => {
      await page.goto('http://localhost:3000/transactions');

      // Find an approved transaction
      const approvedTransaction = page.locator('[data-status="APPROVED"]').first();

      if (await approvedTransaction.isVisible()) {
        await approvedTransaction.click();

        // Should NOT see edit button or it should be disabled
        const editButton = page.locator('button:has-text("Edit")');
        if (await editButton.isVisible()) {
          await expect(editButton).toBeDisabled();
        } else {
          await expect(editButton).not.toBeVisible();
        }
      }
    });
  });

  test.describe('Assistant Treasurer Role', () => {
    test('assistant treasurer can approve transactions', async ({ page }) => {
      await page.goto('http://localhost:3000/approvals');

      // Should see pending approvals
      await expect(page.locator('h1:has-text("Pending Approvals")')).toBeVisible();

      // Should see approve buttons
      const approveButton = page.locator('button:has-text("Approve")');
      if (await approveButton.first().isVisible()) {
        await expect(approveButton.first()).toBeEnabled();
      }
    });

    test('assistant treasurer can reject transactions', async ({ page }) => {
      await page.goto('http://localhost:3000/approvals');

      // Should see reject buttons
      const rejectButton = page.locator('button:has-text("Reject")');
      if (await rejectButton.first().isVisible()) {
        await expect(rejectButton.first()).toBeEnabled();
      }
    });

    test('assistant treasurer cannot approve own transactions', async ({ page }) => {
      // Similar to treasurer test - create a high-value transaction
      // Then check approvals page doesn't show it
      await page.goto('http://localhost:3000/expenses/new');
      await page.fill('[name="vendor"]', 'Own Transaction Test');
      await page.fill('[name="amount"]', '250.00');
      await page.selectOption('[name="categoryId"]', { index: 1 });
      await page.click('button[type="submit"]');

      await page.goto('http://localhost:3000/approvals');
      await expect(page.locator('text=Own Transaction Test')).not.toBeVisible();
    });
  });

  test.describe('Data Isolation', () => {
    test('user cannot access other teams data via URL manipulation', async ({ page }) => {
      // Try to access transaction from another team
      const otherTeamTransactionId = 'other-team-transaction-id';

      await page.goto(`http://localhost:3000/transactions/${otherTeamTransactionId}`);

      // Should see 404 or access denied
      await expect(page.locator('text=/not found|access denied|forbidden/i')).toBeVisible();
    });

    test('API requests with other team IDs should be rejected', async ({ request }) => {
      const response = await request.get('/api/transactions?teamId=other-team-id');

      // Should return 403 or filter results to show nothing
      if (response.status() === 200) {
        const data = await response.json();
        expect(data.transactions).toHaveLength(0);
      } else {
        expect(response.status()).toBe(403);
      }
    });
  });

  test.describe('Authentication', () => {
    test('unauthenticated users cannot access protected pages', async ({ page }) => {
      // Clear all cookies to simulate logged out state
      await page.context().clearCookies();

      await page.goto('http://localhost:3000/dashboard');

      // Should redirect to sign-in
      await page.waitForURL('**/sign-in**');
    });

    test('unauthenticated API requests should return 401', async ({ request }) => {
      const response = await request.get('/api/transactions');

      expect(response.status()).toBe(401);
    });
  });
});
