# Phase 4: Polish & Production Readiness - Research

**Researched:** 2026-01-19
**Domain:** Production polish, UX states, performance validation
**Confidence:** HIGH

## Summary

Phase 4 focuses on making the association transaction oversight feature production-ready through systematic handling of edge cases (empty states, error states, loading states), timezone clarity, performance validation with realistic data volumes, and security audit. The research reveals that modern Next.js 14+ applications benefit from specific patterns: skeleton loading over spinners for better perceived performance, inline error messages over toasts for critical failures, specialized empty states that guide users toward resolution, and comprehensive performance testing combining Playwright for Core Web Vitals with production-scale seed data.

The standard approach combines multiple proven techniques: shadcn/ui Skeleton components with animate-pulse for loading states, inline error replacement (not toasts) for data fetch failures, helpful empty states with clear next actions, date-fns v4 TZDate for timezone display, Playwright + web-vitals for performance validation, and Data Access Layer (DAL) pattern for security audit.

**Primary recommendation:** Use skeleton loading UI (not spinners) for transaction tables and drawers, inline error messages that replace content (not toast notifications), production-scale seed data (50 teams, 20K transactions) for performance validation, and systematic security audit of all mutation paths to verify association users have read-only access.

## Standard Stack

The established libraries/tools for production polish in Next.js 14+ with React 19:

### Core

| Library                | Version | Purpose                   | Why Standard                                                              |
| ---------------------- | ------- | ------------------------- | ------------------------------------------------------------------------- |
| shadcn/ui Skeleton     | Current | Loading state UI          | Built-in component, Tailwind-based, animate-pulse animation standard      |
| Lucide React (Loader2) | 0.468.0 | Spinner icon              | Project already uses lucide-react, LoaderIcon/Loader2 is standard spinner |
| date-fns               | 4.1.0   | Timezone formatting       | Project already uses v4.1.0 with first-class timezone support via TZDate  |
| Playwright             | 1.56.1  | E2E + Performance testing | Project already configured, supports Core Web Vitals measurement          |
| web-vitals             | 5.1.0   | Performance metrics       | Project already uses for tracking LCP, INP, CLS                           |
| Vitest                 | 4.0.14  | Unit/integration testing  | Project already configured, 2-5x faster than Jest                         |

### Supporting

| Library              | Version                | Purpose                | When to Use                                                                |
| -------------------- | ---------------------- | ---------------------- | -------------------------------------------------------------------------- |
| @date-fns/tz         | Latest (v4 compatible) | IANA timezone support  | If need timezone conversion beyond display (not required for this phase)   |
| react-error-boundary | Latest                 | Error boundary wrapper | If implementing error boundaries (optional - project uses inline patterns) |

### Alternatives Considered

| Instead of    | Could Use      | Tradeoff                                                                         |
| ------------- | -------------- | -------------------------------------------------------------------------------- |
| Skeleton      | Spinner        | Skeleton reduces perceived load time by 67%, shows content structure             |
| Inline errors | Sonner toast   | Toast good for background operations, inline better for primary content failures |
| date-fns      | Moment.js      | Moment.js deprecated, date-fns v4 has native timezone support                    |
| Playwright    | Lighthouse CLI | Playwright integrates E2E + performance, already configured in project           |

**Installation:**

```bash
# All dependencies already installed in package.json
# Optionally add @date-fns/tz if timezone conversion needed:
# npm install @date-fns/tz
```

## Architecture Patterns

### Recommended Loading State Structure

**Context-based decision tree:**

```
Loading State Decision:
├── Full page load → Use loading.js (Next.js convention)
├── Table/list data → Use Skeleton rows matching table structure
├── Drawer content → Use Skeleton layout matching drawer sections
├── Pagination "Load More" → Disable button + show spinner below existing content
└── Small inline actions → Use Loader2 spinner icon
```

### Pattern 1: Skeleton Loading for Tables

**What:** Replace table content with skeleton rows during initial load
**When to use:** Transaction list, team list, any tabular data
**Example:**

```typescript
// Source: https://github.com/shadcn-ui/ui/discussions/2386 + https://ui.shadcn.com/docs/components/skeleton
import { Skeleton } from "@/components/ui/skeleton"
import { TableRow, TableCell } from "@/components/ui/table"

function TransactionTableSkeleton({ rows = 10 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell><Skeleton className="h-4 w-16" /></TableCell>
          <TableCell><Skeleton className="h-4 w-24" /></TableCell>
        </TableRow>
      ))}
    </>
  )
}

// Usage: Replace table body content while loading
{isLoading ? (
  <TransactionTableSkeleton rows={10} />
) : (
  transactions.map(tx => <TransactionRow key={tx.id} transaction={tx} />)
)}
```

### Pattern 2: Centered Spinner for Simple States

**What:** Simple centered spinner for content areas without complex structure
**When to use:** When skeleton would provide no structural benefit (per user decision: centered spinner for transaction list)
**Example:**

```typescript
// Source: https://ui.shadcn.com/docs/components/spinner
import { Loader2 } from "lucide-react"

function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="mt-4 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
```

### Pattern 3: Inline Error States

**What:** Replace content area with error message and retry button
**When to use:** Data fetch failures, API timeouts, permission errors (per user decision: inline replacement, not toast)
**Example:**

```typescript
// Source: https://codewithpawan.medium.com/mastering-error-handling-in-react-js-best-practices-and-practical-examples-bdd8062525a8
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <p className="mt-4 text-sm text-foreground">{message}</p>
      <Button onClick={onRetry} variant="outline" className="mt-4">
        Try Again
      </Button>
    </div>
  )
}

// User-friendly messages only (per user decision)
const ERROR_MESSAGES = {
  FETCH_FAILED: "Unable to load transactions. Please try again.",
  TIMEOUT: "Request timed out. Please try again.",
  PERMISSION_DENIED: "You don't have permission to view this data.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
}
```

### Pattern 4: Empty State with Guidance

**What:** Helpful message with suggested next action when no data exists
**When to use:** No teams, no transactions, no filter results
**Example:**

```typescript
// Source: https://www.toptal.com/designers/ux/empty-state-ux-design + https://mobbin.com/glossary/empty-state
import { FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

function EmptyState({
  icon: Icon = FileText,
  title,
  description,
  action
}: {
  icon?: React.ComponentType<any>;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="h-12 w-12 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>
      {action && (
        <Button onClick={action.onClick} variant="outline" className="mt-6">
          {action.label}
        </Button>
      )}
    </div>
  )
}

// Examples for this project:
// No teams: "No teams yet" / "This association doesn't have any teams."
// No transactions: "No transactions yet" / "Teams in this association haven't recorded any transactions yet."
// No filter results: "No transactions match your filters" / "Try adjusting your date range or team selection."
```

### Pattern 5: Timezone Display

**What:** Show dates in association timezone with clear label
**When to use:** Transaction dates, timestamp displays
**Example:**

```typescript
// Source: https://blog.date-fns.org/v40-with-time-zone-support/ + https://date-fns.org/
import { format } from "date-fns"
import { TZDate } from "@date-fns/tz"

// Display timezone label (user requirement: "All dates in Eastern Time")
function TransactionTimestampHeader({ timezone }: { timezone: string }) {
  // Convert IANA timezone to readable format
  const timezoneLabel = timezone.replace("America/", "").replace("_", " ")

  return (
    <div className="text-xs text-muted-foreground mb-2">
      All dates in {timezoneLabel} Time
    </div>
  )
}

// Format dates in association timezone
function formatInTimezone(date: Date, timezone: string): string {
  const tzDate = new TZDate(date, timezone)
  return format(tzDate, "MMM d, yyyy h:mm a")
}

// Alternative: If dates stored as UTC timestamps
function formatUTCInTimezone(utcDate: Date, timezone: string): string {
  // Parse UTC, display in association timezone
  return format(utcDate, "MMM d, yyyy h:mm a", {
    timeZone: timezone // date-fns v4 supports timeZone option
  })
}
```

### Pattern 6: Pagination Loading State

**What:** Disable "Load More" button AND show spinner below existing content
**When to use:** Cursor-based pagination when loading next page (per user decision: maximum clarity)
**Example:**

```typescript
// Source: User decision + https://www.eleken.co/blog-posts/modal-ux
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

function LoadMoreButton({
  isLoading,
  onClick,
  disabled
}: {
  isLoading: boolean;
  onClick: () => void;
  disabled?: boolean
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <Button
        onClick={onClick}
        disabled={disabled || isLoading}
        variant="outline"
      >
        {isLoading ? "Loading..." : "Load More"}
      </Button>
      {isLoading && (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      )}
    </div>
  )
}
```

### Pattern 7: Performance Testing with Realistic Data

**What:** Seed database with production-scale data, measure Core Web Vitals
**When to use:** Before production launch, in CI pipeline for regression testing
**Example:**

```typescript
// Source: https://www.checklyhq.com/docs/learn/playwright/performance/ + https://playwright.dev/
// Seed script (expand existing prisma/seed-demo.ts)
// Target: 50 teams, 20K transactions (~400 transactions per team)

// Performance test (new file: tests/performance/dashboard-load.spec.ts)
import { test, expect } from '@playwright/test'

test('dashboard loads in <2s with 20K transactions', async ({ page }) => {
  // Navigate to association dashboard
  await page.goto('/association/test-association-id/transactions')

  // Measure Core Web Vitals
  const metrics = await page.evaluate(() => {
    return new Promise(resolve => {
      const webVitals = {
        LCP: 0,
        FCP: 0,
        CLS: 0,
      }

      // Largest Contentful Paint
      new PerformanceObserver(list => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as any
        webVitals.LCP = lastEntry.renderTime || lastEntry.loadTime
      }).observe({ entryTypes: ['largest-contentful-paint'] })

      // First Contentful Paint
      const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0] as any
      if (fcpEntry) webVitals.FCP = fcpEntry.startTime

      // Cumulative Layout Shift
      new PerformanceObserver(list => {
        let cls = 0
        for (const entry of list.getEntries() as any[]) {
          if (!entry.hadRecentInput) {
            cls += entry.value
          }
        }
        webVitals.CLS = cls
      }).observe({ entryTypes: ['layout-shift'] })

      // Wait for page to settle
      setTimeout(() => resolve(webVitals), 3000)
    })
  })

  // Assertions (from success criteria: <2s dashboard load)
  expect(metrics.LCP).toBeLessThan(2000) // 2 seconds
  expect(metrics.CLS).toBeLessThan(0.1) // Good CLS score

  console.log('Performance Metrics:', metrics)
})
```

### Pattern 8: Security Audit for Read-Only Access

**What:** Systematically verify no mutation paths exist for association users
**When to use:** Before production, after any permission-related changes
**Example:**

```typescript
// Source: https://nextjs.org/docs/app/guides/authentication + https://www.permit.io/blog/implementing-react-rbac-authorization
// Security audit checklist:

// 1. Server Actions audit
// Test: All Server Actions that modify data require correct permissions
describe('Association User Read-Only Access', () => {
  it('blocks transaction creation for association users', async () => {
    // Mock association user context
    await mockAssociationUser()

    // Attempt to create transaction
    const result = await createTransaction({
      teamId: 'test-team',
      amount: 100,
      description: 'Test',
    })

    expect(result.error).toBe('PERMISSION_DENIED')
  })

  it('blocks transaction updates for association users', async () => {
    await mockAssociationUser()
    const result = await updateTransaction('tx-id', { amount: 200 })
    expect(result.error).toBe('PERMISSION_DENIED')
  })

  it('blocks transaction deletion for association users', async () => {
    await mockAssociationUser()
    const result = await deleteTransaction('tx-id')
    expect(result.error).toBe('PERMISSION_DENIED')
  })

  it('blocks receipt uploads for association users', async () => {
    await mockAssociationUser()
    const result = await uploadReceipt('tx-id', fileData)
    expect(result.error).toBe('PERMISSION_DENIED')
  })
})

// 2. API Routes audit (grep for mutations)
// Command: grep -r "POST\|PUT\|DELETE\|PATCH" app/api/transactions
// Verify each endpoint has permission check:
// - requireAuth() called
// - requirePermission() or requireTeamAccess() validates role
// - Association users (ASSOCIATION_ADMIN) blocked from mutations

// 3. Data Access Layer (DAL) audit
// Pattern: Per Next.js official guidance, verify session in DAL
// Source: https://nextjs.org/docs/app/guides/authentication
// lib/db/transactions.ts should have read-only methods for association users

export async function getTransactionsForAssociation(userId: string, associationId: string) {
  // Verify session first (DAL pattern)
  const session = await verifySession()
  if (!session) throw new Error('Unauthorized')

  // Verify user is association member
  const isAssociationUser = await checkAssociationMembership(userId, associationId)
  if (!isAssociationUser) throw new Error('PERMISSION_DENIED')

  // Read-only query (no mutations)
  return await prisma.transaction.findMany({
    where: { team: { associationId } },
  })
}
```

### Anti-Patterns to Avoid

- **Flash of loading state:** Don't show spinner instantly on navigation - use 200ms delay threshold to avoid jarring flash for fast loads
- **Generic error messages:** Don't show "Error 500" or stack traces - use user-friendly messages only (per user decision)
- **Empty state with no guidance:** Don't just say "No data" - explain what's missing and suggest next action
- **Skeleton that doesn't match content:** Skeleton should mirror final layout structure for best perceived performance
- **Toast for critical errors:** Don't use toast/banner for primary content failures - inline replacement keeps context (per user decision)
- **Ignoring timezone in multi-association app:** Association in Ontario shouldn't see timestamps in Pacific Time
- **Testing performance with dev build:** Always use production build (`npm run build && npm start`) for accurate metrics
- **Shallow performance testing:** Don't just test with 5 teams - seed data must match production scale (50 teams, 20K transactions)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                           | Don't Build                     | Use Instead                                                        | Why                                                                              |
| --------------------------------- | ------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Skeleton loading animation        | Custom CSS pulse animation      | shadcn/ui Skeleton with animate-pulse                              | Tailwind's animate-pulse is optimized, accessible, matches design system         |
| Timezone conversion               | Manual UTC offset math          | date-fns v4 TZDate or format with timeZone option                  | Edge cases: DST transitions, leap seconds, historical timezone changes           |
| Core Web Vitals measurement       | Custom performance.timing logic | web-vitals library + Playwright integration                        | Google's official implementation, handles browser differences, maintained        |
| Virtual scrolling for large lists | Custom scroll event handlers    | react-window or react-virtuoso                                     | Memory management, scroll position tracking, dynamic heights are complex         |
| Error boundary wrapper            | Custom componentDidCatch        | react-error-boundary library                                       | Handles edge cases, provides hooks API, dev vs prod mode handling                |
| Permission audit script           | Manual code review              | Systematic test suite + DAL pattern                                | Human error in manual review, automated tests catch regressions                  |
| Loading delay threshold           | setTimeout with cleanup         | Use Suspense with startTransition or custom useDelayedLoading hook | React handles cleanup, avoids memory leaks, integrates with concurrent rendering |

**Key insight:** Timezone handling, performance measurement, and virtual scrolling have numerous edge cases that production-tested libraries handle. Building custom solutions leads to bugs in DST transitions, performance measurement inconsistencies across browsers, and memory leaks in scroll handlers.

## Common Pitfalls

### Pitfall 1: Loading State Flash (CLS Issue)

**What goes wrong:** Showing loading spinner instantly causes layout shift when content loads quickly (<200ms)
**Why it happens:** Network/cache makes some loads instant, spinner appears and disappears rapidly
**How to avoid:** Implement loading delay threshold - only show spinner if load takes >200ms
**Warning signs:** Layout shift metrics (CLS) increase, users report "flickering" UI

**Implementation:**

```typescript
// Source: https://www.eleken.co/blog-posts/modal-ux + React concurrent rendering patterns
import { useState, useEffect } from 'react'

function useDelayedLoading(isLoading: boolean, delayMs = 200) {
  const [showLoading, setShowLoading] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setShowLoading(false)
      return
    }

    const timeout = setTimeout(() => setShowLoading(true), delayMs)
    return () => clearTimeout(timeout)
  }, [isLoading, delayMs])

  return showLoading
}

// Usage
function TransactionList() {
  const { data, isLoading } = useTransactions()
  const showLoadingState = useDelayedLoading(isLoading)

  if (showLoadingState) return <LoadingSpinner />
  if (!data) return null
  return <Table data={data} />
}
```

### Pitfall 2: Testing Performance with Dev Build

**What goes wrong:** Performance tests pass in dev but fail in production, or vice versa
**Why it happens:** Next.js dev mode has different optimizations than production build
**How to avoid:** Always run performance tests against production build: `npm run build && npm start`
**Warning signs:** Dev build 3-5x slower than production, metrics don't match production monitoring

**Verification:**

```bash
# Wrong: Running tests against dev server
npm run dev &
npm run test:e2e

# Right: Running tests against production build
npm run build
npm run start &
npm run test:e2e
```

### Pitfall 3: Inadequate Seed Data Volume

**What goes wrong:** Performance tests pass with 345 transactions but fail with 20K transactions in production
**Why it happens:** Small datasets don't expose N+1 queries, pagination issues, or memory problems
**How to avoid:** Seed realistic production volumes: 50 teams, ~400 transactions per team (20K total)
**Warning signs:** Existing seed has 5 teams with 345 total transactions (per PROJECT.md blocker)

**From STATE.md blocker:**

> Performance baseline tested with 5 teams (345 transactions) vs. target 50 teams (50k txns)
> Recommend re-validation with production-scale seed data before launch

### Pitfall 4: Middleware-Only Security (CVE-2025-29927)

**What goes wrong:** Permission checks in middleware can be bypassed with `x-middleware-subrequest` header
**Why it happens:** Next.js middleware vulnerability (CVE-2025-29927) affects versions 11.1.4-15.2.2
**How to avoid:** Implement Data Access Layer (DAL) pattern - verify permissions in Server Actions/Route Handlers, not middleware
**Warning signs:** Security audit finds permission checks only in middleware.ts, no checks in API routes

**Official Next.js guidance (2025):**

> Middleware should not be your only line of defense. While Proxy can perform "optimistic checks", the majority of security validation should happen as close to your data source as possible.

Source: https://nextjs.org/docs/app/guides/authentication

### Pitfall 5: Null/Undefined in Financial Calculations

**What goes wrong:** `total = amount1 + amount2` returns `null` if either value is `null`, causing display errors
**Why it happens:** SQL `NULL` propagates through arithmetic operations
**How to avoid:** Use `COALESCE(column, 0)` in queries or `?? 0` in TypeScript for optional numeric values
**Warning signs:** Dashboard totals show "null" or blank, transaction amounts disappear

**Implementation:**

```typescript
// Source: https://thelinuxcode.com/mysql-coalesce-function-reliable-fallbacks-for-real-world-data/
// Database query (Prisma)
const totals = await prisma.$queryRaw`
  SELECT
    team_id,
    COALESCE(SUM(amount), 0) as total_spent,
    COUNT(*) as transaction_count
  FROM transactions
  GROUP BY team_id
`

// TypeScript calculation
function calculateTotal(transactions: Transaction[]): number {
  return transactions.reduce((sum, tx) => sum + (tx.amount ?? 0), 0)
}
```

### Pitfall 6: Drawer Loading UX Confusion

**What goes wrong:** User clicks transaction, nothing happens for 2 seconds, then drawer appears - feels broken
**Why it happens:** Drawer waits for data before opening, no loading feedback
**How to avoid:** Two options: (1) Open drawer immediately with skeleton content, or (2) Show inline loading indicator while drawer loads
**Warning signs:** Users report "clicking doesn't work" or double-click transactions

**Options:**

```typescript
// Option 1: Open drawer immediately with skeleton (better UX for fast loads)
function openDrawer(transactionId: string) {
  setDrawerOpen(true)
  setDrawerContent(<DrawerSkeleton />)

  fetchTransactionDetails(transactionId).then(data => {
    setDrawerContent(<TransactionDetails data={data} />)
  })
}

// Option 2: Inline loading indicator (better for slow loads)
function TransactionRow({ transaction }) {
  const [isLoadingDrawer, setIsLoadingDrawer] = useState(false)

  async function handleClick() {
    setIsLoadingDrawer(true)
    const details = await fetchTransactionDetails(transaction.id)
    setIsLoadingDrawer(false)
    openDrawer(details)
  }

  return (
    <TableRow onClick={handleClick}>
      <TableCell>{transaction.date}</TableCell>
      <TableCell>{transaction.amount}</TableCell>
      <TableCell>
        {isLoadingDrawer && <Loader2 className="h-4 w-4 animate-spin" />}
      </TableCell>
    </TableRow>
  )
}
```

### Pitfall 7: Inconsistent Error Messages

**What goes wrong:** Same error shows different messages in different places, confusing users
**Why it happens:** Error messages hardcoded in components instead of centralized constants
**How to avoid:** Create error message constants, map error codes to messages consistently
**Warning signs:** User reports "sometimes says timeout, sometimes says failed" for same error

**Implementation:**

```typescript
// Source: https://codewithpawan.medium.com/mastering-error-handling-in-react-js-best-practices-and-practical-examples-bdd8062525a8
// lib/constants/error-messages.ts
export const ERROR_MESSAGES = {
  FETCH_FAILED: "Unable to load transactions. Please try again.",
  TIMEOUT: "Request timed out. Please try again.",
  PERMISSION_DENIED: "You don't have permission to view this data.",
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  NOT_FOUND: "The requested data could not be found.",
} as const

// Usage in components
import { ERROR_MESSAGES } from "@/lib/constants/error-messages"

function TransactionList() {
  const { error } = useTransactions()

  if (error) {
    const message = error.code in ERROR_MESSAGES
      ? ERROR_MESSAGES[error.code as keyof typeof ERROR_MESSAGES]
      : ERROR_MESSAGES.FETCH_FAILED

    return <ErrorState message={message} onRetry={refetch} />
  }
}
```

## Code Examples

Verified patterns from official sources and user decisions:

### Empty State Variations (User Decisions)

```typescript
// Source: User CONTEXT.md decisions + https://www.toptal.com/designers/ux/empty-state-ux-design

// No teams state
<EmptyState
  icon={Users}
  title="No teams yet"
  description="This association doesn't have any teams. Teams will appear here once they're created."
/>

// No transactions state
<EmptyState
  icon={Receipt}
  title="No transactions yet"
  description="Teams in this association haven't recorded any transactions yet. Transactions will appear here once team treasurers start adding them."
/>

// No filter results (helpful tone per user decision)
<EmptyState
  icon={Search}
  title="No transactions match your filters"
  description="Try adjusting your date range or team selection to see more results."
  action={{
    label: "Clear Filters",
    onClick: clearFilters
  }}
/>
```

### Error Message Variations (User Decisions)

```typescript
// Source: User CONTEXT.md decisions

// Standard error (user-friendly, no technical details)
<ErrorState
  message="Unable to load transactions. Please try again."
  onRetry={refetch}
/>

// Permission error (403) - user decision allows Claude's discretion
<ErrorState
  message="You don't have permission to view this data."
  onRetry={refetch}
/>

// Alternative permission message (clearer for read-only context)
<ErrorState
  message="Association users have read-only access to team data."
  onRetry={refetch}
/>
```

### Loading State Variations (User Decisions)

```typescript
// Source: User CONTEXT.md decisions

// Centered spinner for transaction list (per user decision)
{isLoading ? (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
) : (
  <TransactionTable data={transactions} />
)}

// Pagination loading with maximum clarity (per user decision)
<div className="flex flex-col items-center gap-4 py-6">
  <Button
    onClick={loadMore}
    disabled={isLoadingMore}
    variant="outline"
  >
    {isLoadingMore ? "Loading..." : "Load More"}
  </Button>
  {isLoadingMore && (
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  )}
</div>
```

### Production-Scale Seed Data

```typescript
// Source: Project blocker + https://medium.com/@patel.d/next-js-14-introduced-the-feature-to-seed-data-07beae46b056
// File: prisma/seed-production-scale.ts

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function seedProductionScale() {
  const TEAM_COUNT = 50
  const TRANSACTIONS_PER_TEAM = 400 // Total: 20,000 transactions

  console.log(`Seeding ${TEAM_COUNT} teams with ${TRANSACTIONS_PER_TEAM} transactions each...`)

  for (let i = 1; i <= TEAM_COUNT; i++) {
    const team = await prisma.team.create({
      data: {
        name: `Team ${i}`,
        associationId: 'test-association-id',
        // ... other fields
      },
    })

    // Batch insert transactions for performance
    const transactions = Array.from({ length: TRANSACTIONS_PER_TEAM }, (_, j) => ({
      teamId: team.id,
      amount: Math.random() * 1000,
      description: `Transaction ${j + 1}`,
      date: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      // 70% have receipts, 30% missing (realistic distribution)
      receiptUrl: Math.random() > 0.3 ? `https://example.com/receipt-${j}.pdf` : null,
    }))

    await prisma.transaction.createMany({
      data: transactions,
    })

    if (i % 10 === 0) console.log(`  Seeded ${i} teams...`)
  }

  console.log('Production-scale seed complete!')
}

seedProductionScale()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

## State of the Art

| Old Approach                       | Current Approach                        | When Changed               | Impact                                                            |
| ---------------------------------- | --------------------------------------- | -------------------------- | ----------------------------------------------------------------- |
| Moment.js for timezones            | date-fns v4 TZDate                      | 2024 (date-fns v4 release) | Smaller bundle, native timezone support, Moment.js deprecated     |
| Spinners for all loading states    | Skeleton UI for structured content      | 2023-2024                  | 67% reduction in perceived load time, better CLS scores           |
| Middleware for auth checks         | Data Access Layer (DAL) pattern         | 2025 (CVE-2025-29927)      | Next.js middleware no longer safe, DAL is official recommendation |
| Jest for testing                   | Vitest                                  | 2023-2024                  | 2-5x faster test execution, native ESM support                    |
| Manual Core Web Vitals tracking    | web-vitals library                      | 2021-present               | Google's official implementation, consistent browser support      |
| Toast notifications for all errors | Inline error states for primary content | 2024-2025                  | Better context preservation, clear error ownership                |
| Generic "Loading..." text          | Context-appropriate loading messages    | 2024-2025                  | Reduced user anxiety, clearer feedback                            |

**Deprecated/outdated:**

- **Moment.js:** Deprecated since 2020, use date-fns or Day.js instead
- **Middleware-only auth:** CVE-2025-29927 vulnerability, use DAL pattern instead
- **loading.js without Suspense:** Next.js 14+ uses Suspense boundaries automatically
- **Jest with Next.js:** Vitest provides better Next.js integration and performance
- **Generic empty states:** 2025 UX research shows guided empty states increase engagement

## Open Questions

Things that couldn't be fully resolved:

1. **Loading delay threshold value**
   - What we know: User CONTEXT.md says "Claude's discretion" on delay threshold, 200ms is common pattern
   - What's unclear: Optimal value depends on P95 latency of production API
   - Recommendation: Start with 200ms, measure in production, adjust based on real user data

2. **Drawer loading UX preference**
   - What we know: User CONTEXT.md says "Claude's discretion" on drawer loading pattern, two valid options exist
   - What's unclear: Which approach (open immediately with skeleton vs. delay until loaded) better suits this use case
   - Recommendation: Test both in implementation, user testing will reveal preference (skeleton likely better for consistent structure)

3. **Exact timezone label placement**
   - What we know: Success criteria requires "All dates in Eastern Time" indication, user says placement is Claude's discretion
   - What's unclear: Header above table vs. footer below table vs. inline with each timestamp
   - Recommendation: Header placement (top of transaction table) most visible, established pattern in financial apps

4. **Performance target for 50 teams**
   - What we know: Success criteria says "<2s dashboard load" with 50 teams and 20K transactions
   - What's unclear: Whether 2s includes all data or just initial page (50-item pagination limit)
   - Recommendation: 2s should be for initial 50 items loaded, subsequent pagination can be slower (established pattern)

5. **403 permission error messaging**
   - What we know: User CONTEXT.md says "Claude's discretion on exact messaging" for 403 errors
   - What's unclear: Whether to explain read-only limitation or just say permission denied
   - Recommendation: Use "You don't have permission to view this data" for consistency with existing 403 pattern from STATE.md, optionally add hint about read-only access

## Sources

### Primary (HIGH confidence)

- Next.js Official Docs: Authentication Guide - https://nextjs.org/docs/app/guides/authentication (DAL pattern, middleware security)
- Next.js Official Docs: loading.js - https://nextjs.org/docs/app/api-reference/file-conventions/loading (Suspense, instant loading states)
- shadcn/ui Official Docs: Spinner - https://ui.shadcn.com/docs/components/spinner (Loader2 icon, accessibility)
- date-fns v4.0 Release Blog - https://blog.date-fns.org/v40-with-time-zone-support/ (TZDate, IANA timezone support)
- Playwright Official Docs - https://playwright.dev/ (Performance testing, page.evaluate())
- web-vitals library (package.json v5.1.0) - Google's official Core Web Vitals implementation
- User CONTEXT.md - Phase 4 decisions (inline errors, centered spinner, helpful empty states, Claude's discretion areas)
- Project STATE.md - Performance blocker (5 teams / 345 transactions vs. 50 teams / 20K target)

### Secondary (MEDIUM confidence)

- CVE-2025-29927 Next.js Middleware Vulnerability - https://www.permit.io/blog/implementing-authentication-and-authorization-in-nextjs (x-middleware-subrequest bypass, versions affected)
- TanStack Table Skeleton Loading Discussion - https://github.com/TanStack/table/discussions/2386 (Verified pattern from maintainers)
- Checkly Playwright Performance Guide - https://www.checklyhq.com/docs/learn/playwright/performance/ (Core Web Vitals measurement with Playwright)
- shadcn/ui Skeleton Discussions - https://github.com/shadcn-ui/ui/discussions/1694 (Community patterns, 67% perceived performance improvement)
- UX Pattern Analysis: Empty States - https://www.toptal.com/designers/ux/empty-state-ux-design (Verified by multiple design system sources)

### Tertiary (LOW confidence - WebSearch only, flagged for validation)

- "Skeleton UI reduces perceived load time by 67%" - Multiple blog sources cite this, but original research not verified
- "Vitest 2-5x faster than Jest" - Community benchmarks, may vary by project configuration
- "200ms delay threshold for loading states" - Common pattern in articles, no authoritative source
- Financial data null handling patterns - Best practices from multiple sources, not official standards

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All libraries already in package.json, official documentation verified
- Architecture: HIGH - Next.js official guidance for auth/loading, user decisions for error/empty/loading states, established patterns verified
- Pitfalls: MEDIUM - CVE-2025-29927 verified, other pitfalls from community experience and blog sources
- Performance testing: MEDIUM - Playwright + web-vitals approach verified, production-scale seed data pattern is project-specific recommendation

**Research date:** 2026-01-19
**Valid until:** 2026-02-28 (45 days for stable patterns, Next.js auth guidance may evolve, CVE patches ongoing)
