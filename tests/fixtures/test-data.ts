/**
 * Test Data Fixtures
 * Known IDs and data for Playwright tests
 * These match the IDs seeded in global-setup.ts
 */

export const TEST_IDS = {
  team: 'test-team-id',
  user: 'test-user-id',
  clerkUser: 'test-clerk-id',
  category: 'test-category-id',
  categoryIncome: 'test-category-income-id',
  transaction: 'test-transaction-id',
}

export const TEST_USER = {
  id: TEST_IDS.user,
  clerkId: TEST_IDS.clerkUser,
  email: 'test-treasurer@example.com',
  name: 'Test Treasurer',
  role: 'TREASURER',
  teamId: TEST_IDS.team,
}

export const TEST_TEAM = {
  id: TEST_IDS.team,
  name: 'Test Team - Playwright',
  organizationName: 'Test Organization',
  season: '2024-2025',
  currency: 'CAD',
  totalBudget: 10000,
  approvalThreshold: 200,
}

export const TEST_CATEGORY = {
  id: TEST_IDS.category,
  name: 'Equipment',
  type: 'EXPENSE',
  budgetAmount: 5000,
  teamId: TEST_IDS.team,
}

export const TEST_TRANSACTION = {
  id: TEST_IDS.transaction,
  type: 'EXPENSE',
  amount: 100.0,
  vendor: 'Test Vendor',
  description: 'Test transaction for updates/deletes',
  status: 'APPROVED',
  transactionDate: '2024-01-15T00:00:00.000Z',
  categoryId: TEST_IDS.category,
  teamId: TEST_IDS.team,
  userId: TEST_IDS.user,
}

/**
 * Sample transaction data for creating new transactions
 */
export const NEW_TRANSACTION_DATA = {
  type: 'EXPENSE' as const,
  amount: 125.5,
  vendor: 'API Test Vendor',
  categoryId: TEST_IDS.category,
  description: 'Test transaction via API',
  transactionDate: new Date().toISOString(),
}

export const HIGH_AMOUNT_TRANSACTION_DATA = {
  type: 'EXPENSE' as const,
  amount: 500.0,
  vendor: 'High Value Test',
  categoryId: TEST_IDS.category,
  transactionDate: new Date().toISOString(),
}
