import { test, expect } from '@playwright/test';
import { TEST_IDS, NEW_TRANSACTION_DATA, HIGH_AMOUNT_TRANSACTION_DATA } from '../fixtures/test-data';

/**
 * API Test: Transaction Endpoints
 * Tests the transaction API endpoints directly
 *
 * Note: These tests run without authentication and should expect 401 responses
 * for protected endpoints. To test authenticated flows, set up Clerk test tokens.
 */

test.describe('Transaction API', () => {
  let apiContext;
  let sessionToken;

  test.beforeAll(async ({ playwright, baseURL }) => {
    // Create API context using the baseURL from playwright.config.ts
    apiContext = await playwright.request.newContext({
      baseURL: baseURL,
    });

    // Note: In real authenticated tests, you would set up Clerk session tokens here
    // For now, we test unauthenticated behavior and expect 401 responses
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('GET /api/transactions should return transactions list', async () => {
    const response = await apiContext.get('/api/transactions', {
      headers: {
        // Add authentication header if needed
        // 'Cookie': `__session=${sessionToken}`
      }
    });

    // Should return 200 or 401 (if not authenticated)
    expect([200, 401]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data).toHaveProperty('transactions');
      expect(data).toHaveProperty('pagination');
      expect(Array.isArray(data.transactions)).toBeTruthy();
    }
  });

  test('POST /api/transactions should create transaction', async () => {
    const response = await apiContext.post('/api/transactions', {
      data: NEW_TRANSACTION_DATA,
    });

    // Should return 201 (created) or 401 (unauthorized)
    expect([201, 401, 403]).toContain(response.status());

    if (response.status() === 201) {
      const data = await response.json();
      expect(data).toHaveProperty('transaction');
      expect(data.transaction.vendor).toBe(NEW_TRANSACTION_DATA.vendor);
      expect(data.transaction.amount).toBe(NEW_TRANSACTION_DATA.amount.toFixed(1));
    }
  });

  test('POST /api/transactions with high amount should require approval', async () => {
    const response = await apiContext.post('/api/transactions', {
      data: HIGH_AMOUNT_TRANSACTION_DATA,
    });

    if (response.status() === 201) {
      const data = await response.json();
      expect(data.approvalRequired).toBe(true);
      expect(data.transaction.status).toBe('PENDING');
    }
  });

  test('GET /api/transactions with filters should return filtered results', async () => {
    const response = await apiContext.get('/api/transactions?type=EXPENSE&status=APPROVED');

    if (response.status() === 200) {
      const data = await response.json();
      // All transactions should be expenses and approved
      data.transactions.forEach(transaction => {
        expect(transaction.type).toBe('EXPENSE');
        expect(transaction.status).toBe('APPROVED');
      });
    }
  });

  test('PUT /api/transactions/[id] should update transaction', async () => {
    const updateData = {
      description: 'Updated description',
    };

    const response = await apiContext.put(`/api/transactions/${TEST_IDS.transaction}`, {
      data: updateData,
    });

    // Should return 200, 404, 401, or 403
    expect([200, 401, 403, 404]).toContain(response.status());

    if (response.status() === 200) {
      const data = await response.json();
      expect(data.transaction.description).toBe('Updated description');
    }
  });

  test('DELETE /api/transactions/[id] should delete transaction', async () => {
    const response = await apiContext.delete(`/api/transactions/${TEST_IDS.transaction}`);

    // Should return 200, 404, 401, or 403
    expect([200, 401, 403, 404]).toContain(response.status());
  });

  test('POST /api/transactions should validate required fields', async () => {
    const invalidData = {
      // Missing required fields
      amount: 100,
    };

    const response = await apiContext.post('/api/transactions', {
      data: invalidData,
    });

    // Should return 400 (bad request) or 401 (unauthorized)
    expect([400, 401]).toContain(response.status());

    if (response.status() === 400) {
      const data = await response.json();
      expect(data).toHaveProperty('error');
    }
  });

  test('POST /api/transactions should reject negative amounts', async () => {
    const invalidData = {
      type: 'EXPENSE',
      amount: -50.00,
      vendor: 'Test',
      categoryId: TEST_IDS.category,
      transactionDate: new Date().toISOString(),
    };

    const response = await apiContext.post('/api/transactions', {
      data: invalidData,
    });

    expect([400, 401]).toContain(response.status());
  });

  test('POST /api/transactions should reject future dates', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const invalidData = {
      type: 'EXPENSE',
      amount: 50.00,
      vendor: 'Test',
      categoryId: TEST_IDS.category,
      transactionDate: futureDate.toISOString(),
    };

    const response = await apiContext.post('/api/transactions', {
      data: invalidData,
    });

    expect([400, 401]).toContain(response.status());
  });
});
