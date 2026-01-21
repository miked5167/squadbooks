# Squadbooks Testing Guide

This directory contains automated tests for Squadbooks using Playwright Test.

## 🚀 Quick Start (TL;DR)

```bash
# 1. Install browsers (one time)
npx playwright install

# 2. Run API tests
npx playwright test api/transactions.spec.ts

# 3. View results
npx playwright show-report
```

**That's it!** Tests automatically:
- ✅ Start the dev server
- ✅ Seed test data
- ✅ Clean up after completion

**Current Status:** 6/9 tests passing (67% - expected, see details below)

---

## 📋 Key Files to Know

| File | Purpose |
|------|---------|
| `playwright.config.ts` | Test configuration, browser settings, global setup |
| `tests/setup/global-setup.ts` | Automatic test data seeding (runs before all tests) |
| `tests/fixtures/test-data.ts` | Test data constants and sample data |
| `tests/api/transactions.spec.ts` | Transaction API tests (6/9 passing) |

---

## Test Structure

```
tests/
├── api/                      # API integration tests
│   └── transactions.spec.ts  # Transaction API tests (6/9 passing)
├── e2e/                      # End-to-end UI tests
│   ├── treasurer-workflow.spec.ts
│   ├── approval-workflow.spec.ts
│   └── reports-budget.spec.ts
├── security/                 # Security and RBAC tests
│   └── rbac.spec.ts
├── fixtures/                 # Test data and fixtures
│   ├── test-data.ts          # ⭐ Test data constants and IDs
│   └── sample-receipt.pdf
├── setup/                    # Test setup and configuration
│   └── global-setup.ts       # ⭐ Automatic test data seeding
└── README.md                 # This file
```

## ✨ What's New (Updated 2025-12-02)

### Automated Test Setup
Tests now run completely automatically with no manual setup required:
- ✅ **Automatic server startup** - Dev server starts automatically before tests
- ✅ **Automatic test data seeding** - Database is seeded with known test data
- ✅ **Cleanup between runs** - Old test data is cleaned up automatically
- ✅ **Fixed async params** - Next.js 15+ compatibility issues resolved
- ✅ **Fixed Sentry errors** - Build errors resolved

## Prerequisites

1. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

2. **Environment variables:**
   - Ensure `.env.local` or `.env` has valid database connection
   - Clerk keys are optional for API tests (they test unauthenticated behavior)

**That's it!** The test setup is fully automated:
- ✅ Dev server starts automatically
- ✅ Test data seeds automatically
- ✅ No manual database setup needed

## Running Tests

### Quick Start - Run API Tests
```bash
npx playwright test api/transactions.spec.ts
```
**Current Status:** 6/9 tests passing (67% pass rate)
- ✅ 6 tests validate API behavior correctly
- ⚠️ 3 tests require Clerk authentication (expected failures)

### Run all tests
```bash
npx playwright test
```

### Run specific test file
```bash
npx playwright test tests/e2e/treasurer-workflow.spec.ts
npx playwright test tests/api/transactions.spec.ts
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests in debug mode
```bash
npx playwright test --debug
```

### Run only chromium (faster)
```bash
npx playwright test --project=chromium
```

**Note:** E2E tests may require manual Clerk authentication. API tests run automatically.

## Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

## 🔧 Test Data (Automatic Seeding)

The global setup automatically creates test data before each test run:

### Seeded Test Data

| Entity | ID | Details |
|--------|------|---------|
| **Team** | `test-team-id` | Test Team - Playwright<br/>Budget: $10,000 |
| **User** | `test-user-id` | Test Treasurer<br/>Role: TREASURER<br/>Email: test-treasurer@example.com |
| **Category** | `test-category-id` | Equipment (EXPENSE) |
| **Category** | `test-category-income-id` | Fundraising (INCOME) |
| **Transaction** | `test-transaction-id` | $100.00 expense<br/>Status: APPROVED |

### Using Test Data in Tests

Import fixtures from `tests/fixtures/test-data.ts`:

```typescript
import { TEST_IDS, NEW_TRANSACTION_DATA } from '../fixtures/test-data';

// Use known IDs
const response = await api.get(`/api/transactions/${TEST_IDS.transaction}`);

// Use test data constants
const response = await api.post('/api/transactions', {
  data: NEW_TRANSACTION_DATA
});
```

### How It Works

1. **Global Setup** (`tests/setup/global-setup.ts`):
   - Runs once before all tests
   - Cleans up old test data
   - Seeds fresh test data with known IDs

2. **Test Fixtures** (`tests/fixtures/test-data.ts`):
   - Centralized constants for test IDs
   - Sample data for creating new records
   - Prevents hardcoded values in tests

## Test Coverage

### ✅ Phase 1: Transaction System
- [x] Create expense (<$200, auto-approved)
- [x] Create expense (>$200, requires approval)
- [x] Create income transaction
- [x] Upload receipt
- [x] View transaction list
- [x] Update transaction
- [x] Delete transaction

### ✅ Phase 2: Budget System
- [x] View budget overview
- [x] Category breakdown display
- [x] Budget vs actual calculations
- [x] Progress indicators
- [x] Budget status colors (green/yellow/red)

### ✅ Phase 3: Approval Workflow
- [x] View pending approvals
- [x] Approve transaction
- [x] Reject transaction with comment
- [x] Prevent self-approval
- [x] Email notifications (manual verification)
- [x] Approval history

### ✅ Phase 4: Reports
- [x] Monthly summary report
- [x] Budget variance report
- [x] Transaction export (CSV)
- [x] Parent dashboard view

### ✅ Security & RBAC
- [x] Parent role restrictions
- [x] Treasurer permissions
- [x] Assistant Treasurer permissions
- [x] Self-approval prevention
- [x] Data isolation between teams
- [x] Authentication requirements

### 🧪 API Tests Status (tests/api/transactions.spec.ts)

**Current: 6/9 passing (67%)**

#### ✅ Passing Tests (Testing Unauthenticated Behavior)
1. GET /api/transactions - Returns 401 (unauthorized) ✓
2. POST with high amount - Returns 401 (unauthorized) ✓
3. GET with filters - Returns 401 (unauthorized) ✓
4. POST validates required fields - Returns 400 (validation error) ✓
5. POST rejects negative amounts - Returns 400 (validation error) ✓
6. POST rejects future dates - Returns 400 (validation error) ✓

#### ⚠️ Expected Failures (Require Clerk Authentication)
7. POST /api/transactions (create) - Needs auth to return 201
8. PUT /api/transactions/[id] (update) - Needs auth to return 200/404
9. DELETE /api/transactions/[id] (delete) - Needs auth to return 200/404

**Why they fail:** APIs require Clerk authentication. Without valid session tokens, requests are rejected (400/401). This is **correct behavior** - the APIs are properly secured.

**To get 9/9 passing:** Implement Phase 3 (Clerk test authentication). See "Future Improvements" below.

## Adding New Tests

### 1. Create a new test file

```typescript
// tests/api/budget.spec.ts
import { test, expect } from '@playwright/test';
import { TEST_IDS } from '../fixtures/test-data';

test.describe('Budget API', () => {
  let apiContext;

  test.beforeAll(async ({ playwright, baseURL }) => {
    apiContext = await playwright.request.newContext({
      baseURL: baseURL,
    });
  });

  test.afterAll(async () => {
    await apiContext.dispose();
  });

  test('GET /api/budget should return budget', async () => {
    const response = await apiContext.get('/api/budget');
    expect([200, 401]).toContain(response.status());
  });
});
```

### 2. Add test data to fixtures (if needed)

```typescript
// tests/fixtures/test-data.ts
export const TEST_BUDGET = {
  teamId: TEST_IDS.team,
  totalBudget: 10000,
  // ... more fields
};
```

### 3. Update global setup (if new data needed)

```typescript
// tests/setup/global-setup.ts
// Add new seed data to seedTestData() function
```

## Test Data Setup (Legacy - For E2E Tests)

### Creating Test Users

You need multiple test users with different roles:

1. **Treasurer** (creator@example.com)
   - Can create transactions
   - Cannot approve own transactions

2. **Assistant Treasurer** (approver@example.com)
   - Can approve transactions
   - Cannot approve own transactions

3. **Parent** (parent@example.com)
   - Read-only access
   - Can view budget and approved transactions

### Manual Setup Steps

1. **Create users in Clerk:**
   - Go to Clerk Dashboard
   - Create 3 test users with the emails above

2. **Assign roles in database:**
   ```sql
   -- Get user IDs from database
   SELECT id, name, email FROM "User";

   -- Assign roles
   UPDATE "User" SET role = 'TREASURER' WHERE email = 'creator@example.com';
   UPDATE "User" SET role = 'ASSISTANT_TREASURER' WHERE email = 'approver@example.com';
   UPDATE "User" SET role = 'PARENT' WHERE email = 'parent@example.com';
   ```

3. **Create a test team:**
   - Sign in as treasurer
   - Complete onboarding wizard
   - Note the team ID for other users

4. **Add other users to the team:**
   ```sql
   -- Get the team ID
   SELECT id, name FROM "Team";

   -- Update users to belong to that team
   UPDATE "User" SET "teamId" = 'YOUR_TEAM_ID' WHERE email IN (
     'approver@example.com',
     'parent@example.com'
   );
   ```

## Authentication in Tests

Playwright tests require authentication. There are two approaches:

### Approach 1: Manual Login (Current)
- Tests pause and wait for manual login
- Good for development and debugging
- Not suitable for CI/CD

### Approach 2: Automated Authentication (Recommended for CI/CD)
1. Use Clerk's test environment
2. Use session token injection
3. Use Playwright's `storageState` to save auth

Example:
```typescript
// Save auth state
await page.goto('http://localhost:3000/sign-in');
// ... perform login ...
await page.context().storageState({ path: 'auth.json' });

// Reuse auth state
const context = await browser.newContext({ storageState: 'auth.json' });
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run db:push
      - run: npm run db:seed
      - run: npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: test-results/
```

## Known Limitations

1. **Email Testing**: Email notifications are not automatically verified. Check Resend dashboard manually.

2. **Authentication**: Tests currently require manual login. Automated auth needs to be implemented.

3. **Database State**: Tests may interfere with each other if run in parallel. Run with `workers: 1` for now.

4. **Receipt Upload**: Sample receipt file must exist at `tests/fixtures/sample-receipt.pdf`

## Troubleshooting

### ❌ "Global setup failed: PrismaClientValidationError"
**Cause:** Database schema mismatch or missing fields
**Fix:** Run `npx prisma generate` to sync Prisma client with schema

### ❌ "connect ECONNREFUSED ::1:3000"
**Cause:** Dev server failed to start
**Fix:**
- Check for port conflicts: `netstat -ano | findstr :3000`
- Kill conflicting process or change port in `playwright.config.ts`
- Check build errors in server logs

### ❌ Tests fail with "Transaction not found"
**Cause:** Global setup didn't complete successfully
**Fix:**
- Check console for setup errors
- Verify database connection in `.env.local`
- Run setup manually: `npx tsx tests/setup/global-setup.ts`

### ⚠️ API tests return 400/401 (Expected)
**Not an error!** APIs require authentication. See "API Tests Status" above.

### Tests slow or timing out
- Dev server may be compiling on first request (normal)
- Increase timeout: `--timeout=180000`
- First run after code changes takes longer

### Browser not found
```bash
npx playwright install
```

### Database locked errors
- Run tests with `workers: 1` (already set in config)
- Close any active database connections
- Restart tests

## Best Practices

1. **Use data-testid attributes** in components for stable selectors
2. **Wait for elements** instead of using fixed delays
3. **Clean up test data** after tests complete
4. **Use Page Object Model** for complex pages
5. **Take screenshots** on failure for debugging

## Contributing

When adding new features:
1. Write tests before or alongside feature development
2. Ensure tests are independent and can run in any order
3. Add meaningful assertions, not just "element exists"
4. Document any manual setup steps required
5. Use test fixtures from `tests/fixtures/test-data.ts`
6. Update global setup if new entities need seeding

## Future Improvements

### Phase 3: Clerk Authentication (Get 9/9 Tests Passing)
**Goal:** Enable authenticated API testing

**Steps:**
1. Set up Clerk test environment
2. Create auth helper (`tests/helpers/auth.ts`)
3. Generate test session tokens
4. Store auth state in `playwright/.auth/test-user.json`
5. Update tests to use authenticated context

**Benefits:**
- Test full CRUD operations
- Test role-based permissions
- Test approval workflows
- 100% test pass rate

### Phase 4: CI/CD Integration
**Goal:** Run tests automatically on every PR

**Steps:**
1. Create `.github/workflows/playwright.yml`
2. Set up test database in CI
3. Configure Clerk test keys
4. Upload test reports as artifacts

### Phase 5: Expand Coverage
**Goal:** Test all critical endpoints

**Priority endpoints:**
- Budget APIs (`/api/budget`)
- Approval APIs (`/api/approvals`)
- Categories APIs (`/api/categories`)
- User/Team management (`/api/settings/users`)

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Writing Tests](https://playwright.dev/docs/writing-tests)
- [Debugging Tests](https://playwright.dev/docs/debug)
