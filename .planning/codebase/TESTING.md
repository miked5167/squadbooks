# Testing Patterns

**Analysis Date:** 2026-01-18

## Test Framework

**Runner:**

- Vitest 4.0.14
- Config: `C:/Users/miked/Squadbooks/vitest.config.ts`

**Assertion Library:**

- Vitest (built-in)
- `@testing-library/jest-dom` for DOM assertions

**Run Commands:**

```bash
npm run test:unit              # Run all unit tests (watch mode)
npm run test:unit:run          # Run all unit tests (CI mode)
npm run test:coverage          # Run with coverage report
npm run test:e2e               # Run Playwright E2E tests
npm run test:e2e:ui            # Run Playwright with UI
npm run test:integration:supabase  # Run integration tests against Supabase
```

## Test File Organization

**Location:**

- Co-located: Test files live next to source files
- E2E tests: Separate `tests/` directory at project root
- Pattern: `lib/permissions/permissions.test.ts` next to `lib/permissions/permissions.ts`

**Naming:**

- Unit tests: `*.test.ts` or `*.test.tsx`
- E2E tests: `*.spec.ts` (in `tests/e2e/`, `tests/api/`, `tests/security/`)
- Integration tests: `*.test.ts` in `__tests__/` subdirectories

**Structure:**

```
lib/
├── permissions/
│   ├── permissions.ts
│   ├── permissions.test.ts
│   ├── server-permissions.ts
│   └── server-permissions.test.ts
├── services/
│   ├── validation-engine-v1.ts
│   └── __tests__/
│       └── validation-engine-v1.test.ts
tests/
├── e2e/
│   ├── treasurer-workflow.spec.ts
│   └── approval-workflow.spec.ts
├── api/
│   └── transactions.spec.ts
└── security/
    └── rbac.spec.ts
```

## Test Structure

**Suite Organization:**

```typescript
import { describe, it, expect } from 'vitest'
import { cn, formatCurrency } from './utils'

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge class names', () => {
      expect(cn('px-2 py-1', 'bg-blue-500')).toBe('px-2 py-1 bg-blue-500')
    })

    it('should handle conditional classes', () => {
      const isActive = true
      expect(cn('base-class', isActive && 'active-class')).toBe('base-class active-class')
    })
  })

  describe('formatCurrency', () => {
    it('should format whole numbers without decimals', () => {
      expect(formatCurrency(1000)).toBe('$1,000')
    })
  })
})
```

**Patterns:**

- Top-level `describe` for module/file
- Nested `describe` for each function/feature
- `it` for individual test cases
- Use `test` and `it` interchangeably (both supported)
- Descriptive test names: "should [expected behavior] when [condition]"

## Mocking

**Framework:** Vitest (built-in mocking with `vi`)

**Patterns:**

```typescript
import { vi, beforeEach, afterEach } from 'vitest'

// Mock Next.js modules (global setup in vitest.setup.ts)
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
}))

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))
```

**What to Mock:**

- External services (Clerk, Supabase in unit tests)
- Next.js router and navigation
- Environment variables (done in `vitest.setup.ts`)
- File system operations
- Time-dependent code

**What NOT to Mock:**

- Business logic being tested
- Utility functions
- Type definitions
- Prisma in integration tests (use test database)

## Fixtures and Factories

**Test Data:**

```typescript
// Helper factory pattern
function createContext(overrides: Partial<ValidationContext> = {}): ValidationContext {
  return {
    transaction: {
      amount: 100,
      type: 'EXPENSE',
      categoryId: 'cat-1',
      systemCategoryId: null,
      vendor: 'Test Vendor',
      transactionDate: new Date(),
      receiptUrl: null,
      description: null,
    },
    budget: {
      id: 'budget-1',
      status: 'LOCKED',
      allocations: [
        {
          categoryId: 'cat-1',
          allocated: 1000,
          spent: 0,
        },
      ],
    },
    teamSettings: {
      receiptThreshold: 100,
      largeTransactionThreshold: 200,
    },
    associationRules: DEFAULT_ASSOCIATION_RULES,
    ...overrides,
  }
}

// Usage in tests
const context = createContext({
  transaction: { amount: 500 },
})
```

**Location:**

- Inline factory functions in test files
- Shared fixtures in `lib/utils/__fixtures__/` for golden datasets
- E2E fixtures in `tests/fixtures/`

## Coverage

**Requirements:** 10% minimum (very low - not enforced strictly)

**Configuration:**

```typescript
// vitest.config.ts
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html'],
  include: ['lib/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
  exclude: [
    'node_modules/',
    '**/*.d.ts',
    '**/*.config.*',
    '**/mockData',
    'prisma/',
    '**/*.test.{ts,tsx}',
  ],
  lines: 10,
  functions: 10,
  branches: 10,
  statements: 10,
}
```

**View Coverage:**

```bash
npm run test:coverage
# Opens HTML report in coverage/ directory
```

## Test Types

**Unit Tests:**

- Scope: Individual functions, utilities, business logic
- Framework: Vitest
- Database: Local PostgreSQL (via Docker), NOT Supabase
- Setup: `vitest.setup.ts` validates localhost-only database
- Files: `*.test.ts` co-located with source
- Example: `lib/permissions/permissions.test.ts`, `lib/utils.test.ts`

**Integration Tests:**

- Scope: Database operations, external services
- Framework: Vitest with separate config
- Database: Supabase test environment
- Config: `vitest.config.integration.ts`
- Run: `npm run test:integration:supabase`
- Validation: Checks for Supabase connection before running

**E2E Tests:**

- Scope: Complete user workflows
- Framework: Playwright 1.56.1
- Config: `C:/Users/miked/Squadbooks/playwright.config.ts`
- Directory: `tests/e2e/`, `tests/api/`, `tests/security/`
- Browsers: Chromium only (others disabled initially)
- Workers: 1 (to avoid database conflicts)
- Setup: Global setup in `tests/setup/global-setup.ts`
- Example: `tests/e2e/treasurer-workflow.spec.ts`

## Common Patterns

**Async Testing:**

```typescript
import { describe, it, expect } from 'vitest'

describe('async operations', () => {
  it('should create transaction', async () => {
    const result = await createTransaction(data)
    expect(result).toBeDefined()
    expect(result.id).toBeTruthy()
  })
})
```

**Error Testing:**

```typescript
it('should fail when category not in budget', () => {
  const context = createContext({
    transaction: { categoryId: 'cat-999' },
  })
  const violation = validateApprovedCategory(context)
  expect(violation).not.toBeNull()
  expect(violation?.code).toBe('UNAPPROVED_CATEGORY')
  expect(violation?.severity).toBe(ViolationSeverity.ERROR)
})
```

**Permission Testing:**

```typescript
import { describe, test, expect } from '@jest/globals'
import { hasPermission, Permission } from './permissions'

describe('Permission System', () => {
  test('TREASURER can create transactions', () => {
    expect(hasPermission('TREASURER', Permission.CREATE_TRANSACTION)).toBe(true)
  })

  test('PARENT can only view', () => {
    expect(hasPermission('PARENT', Permission.VIEW_TRANSACTIONS)).toBe(true)
    expect(hasPermission('PARENT', Permission.CREATE_TRANSACTION)).toBe(false)
  })
})
```

**Playwright E2E Pattern:**

```typescript
import { test, expect } from '@playwright/test'

test.describe('Treasurer Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
  })

  test('should create expense under $200 (auto-approved)', async ({ page }) => {
    await page.goto('http://localhost:3000/expenses/new')

    await page.fill('[name="vendor"]', 'Test Sports Equipment')
    await page.fill('[name="amount"]', '150.00')
    await page.selectOption('[name="categoryId"]', { index: 1 })

    await page.click('button[type="submit"]')
    await page.waitForURL('**/transactions')

    await expect(page.locator('text=Test Sports Equipment')).toBeVisible()
  })
})
```

## Test Database Safety

**Unit Test Safeguards:**

```typescript
// vitest.setup.ts enforces localhost database
beforeAll(async () => {
  const dbUrl = process.env.DATABASE_URL || ''
  const host = dbUrl ? new URL(dbUrl).hostname : 'unknown'

  // CRITICAL: Unit tests must NEVER use Supabase
  if (host && host.includes('.supabase.co')) {
    throw new Error('Unit tests must not use Supabase. Use localhost test DB.')
  }

  if (host !== 'localhost' && host !== '127.0.0.1') {
    throw new Error('Unit tests must use localhost database')
  }
})
```

**Best Practices:**

- Unit tests: Always use local PostgreSQL (Docker)
- Integration tests: Use dedicated Supabase test project
- Never run tests against production database
- Use `.env.test.local` for test environment variables
- Bootstrap test database: `npm run test:unit:bootstrap`

## Setup and Teardown

**Global Setup (Vitest):**

- File: `C:/Users/miked/Squadbooks/vitest.setup.ts`
- Database validation (localhost check)
- Mock Next.js modules (router, cache)
- Mock environment variables
- Testing library setup

**Cleanup:**

```typescript
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup() // Clean up React components after each test
})
```

**Playwright Setup:**

- Global setup: `tests/setup/global-setup.ts`
- Web server: Starts Next.js dev server automatically
- Artifacts: Screenshots/videos on failure
- Trace: On first retry only

---

_Testing analysis: 2026-01-18_
