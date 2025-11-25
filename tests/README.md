# HuddleBooks E2E Testing Guide

This directory contains end-to-end (E2E) tests for HuddleBooks using Playwright Test.

## Test Structure

```
tests/
├── e2e/                      # End-to-end UI tests
│   ├── treasurer-workflow.spec.ts
│   ├── approval-workflow.spec.ts
│   └── reports-budget.spec.ts
├── api/                      # API integration tests
│   └── transactions.spec.ts
├── security/                 # Security and RBAC tests
│   └── rbac.spec.ts
├── fixtures/                 # Test data and fixtures
│   └── sample-receipt.pdf
└── README.md                 # This file
```

## Prerequisites

1. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

2. **Ensure dev server is running:**
   ```bash
   npm run dev
   ```

3. **Database with test data:**
   - Run `npm run db:seed` to populate test categories
   - Create test users via Clerk dashboard

## Running Tests

### Run all tests
```bash
npx playwright test
```

### Run specific test file
```bash
npx playwright test tests/e2e/treasurer-workflow.spec.ts
```

### Run tests in headed mode (see browser)
```bash
npx playwright test --headed
```

### Run tests in debug mode
```bash
npx playwright test --debug
```

### Run tests for specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run tests on mobile viewport
```bash
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

## Test Reports

After running tests, view the HTML report:
```bash
npx playwright show-report
```

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

## Test Data Setup

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

### Tests fail with "Element not found"
- Make sure dev server is running
- Check if test data exists (users, team, categories)
- Increase timeout in `playwright.config.ts`

### Authentication errors
- Verify Clerk is configured correctly
- Check `.env.local` has correct Clerk keys
- Make sure test users exist in Clerk

### Database conflicts
- Run tests with `workers: 1` to avoid parallel execution
- Reset database between test runs if needed

### Browser not found
```bash
npx playwright install
```

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

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Writing Tests](https://playwright.dev/docs/writing-tests)
- [Debugging Tests](https://playwright.dev/docs/debug)
