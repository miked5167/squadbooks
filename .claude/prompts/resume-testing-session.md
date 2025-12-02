# Resume Testing Session

**Quick prompt to paste when starting your next Claude Code session:**

```
I'm working on Squadbooks - continuing from testing setup session (2025-12-02).

Current status:
- ✅ Playwright tests working with automatic server startup
- ✅ Automatic test data seeding implemented
- ✅ 6/9 API tests passing (3 need Clerk auth - expected)
- ✅ Fixed Next.js 15+ async params in /api/transactions/[id]
- ✅ Fixed Sentry v8 compatibility

Key files:
- tests/setup/global-setup.ts (automatic seeding)
- tests/fixtures/test-data.ts (test constants)
- tests/api/transactions.spec.ts (6/9 passing)
- CLAUDE_SESSION_RESUME.md (full context)

Run tests: npx playwright test api/transactions.spec.ts

[Choose one next step:]
A) Implement Clerk authentication for 9/9 passing tests
B) Expand test coverage to budget/approvals/categories APIs
C) Set up GitHub Actions CI/CD
D) Fix async params in remaining API routes

See CLAUDE_SESSION_RESUME.md for detailed context.
```

---

**Copy-paste options for specific tasks:**

### Option A: Clerk Authentication
```
Let's implement Clerk authentication for the 3 failing API tests.
Goal: Get all 9/9 tests passing.
Create tests/helpers/auth.ts for session token generation.
```

### Option B: Expand Coverage
```
Let's add tests for the /api/budget endpoint.
Follow the pattern in tests/api/transactions.spec.ts.
Use TEST_IDS from tests/fixtures/test-data.ts.
```

### Option C: CI/CD Setup
```
Let's create a GitHub Actions workflow for Playwright tests.
Should run on every PR with automatic test data seeding.
Upload test reports as artifacts.
```

### Option D: Fix Async Params
```
Let's update remaining API routes to Next.js 15+ async params.
Already fixed: app/api/transactions/[id]/route.ts
Find and fix all other dynamic route handlers.
```
