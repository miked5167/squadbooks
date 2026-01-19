# Phase 2: Association Dashboard View - Research

**Researched:** 2026-01-18
**Domain:** Next.js 14 Server Components, React Client Components, Cursor Pagination, Multi-tenant Transaction Queries
**Confidence:** HIGH

## Summary

This research identifies established patterns in the codebase for building association-scoped transaction views. The application already has robust infrastructure for cursor-based pagination, multi-team transaction queries, receipt viewing drawers, and association-level routing. Phase 2 requires minimal new architecture—primarily adapting existing `/app/transactions/page.tsx` patterns for association context and integrating with the team details page.

**Key findings:**

- Existing transactions page (`/app/transactions/page.tsx`) provides complete pattern for cursor pagination, filtering UI, and drawer integration
- API route `/api/transactions` already supports multi-team queries via `teamIds` parameter (Phase 1 work)
- Association layout pattern established in `/app/association/[associationId]/layout.tsx` with `AssociationSidebar`
- Transaction details drawer (`TransactionDetailsDrawer`) already accepts `isReadOnly` prop for association users
- Team filter component (`TeamFilter`) provides multi-select team filtering for association users

**Primary recommendation:** Clone and adapt existing `/app/transactions/page.tsx` for association context at `/app/association/[associationId]/transactions/page.tsx`, and enhance team details page to embed transaction viewing with team pre-filtering.

## Standard Stack

The established libraries/tools for this phase:

### Core

| Library    | Version | Purpose                                          | Why Standard                                     |
| ---------- | ------- | ------------------------------------------------ | ------------------------------------------------ |
| Next.js    | 14+     | App Router, Server Components, Client Components | Project standard, requires async params handling |
| React      | 18+     | Client-side interactivity                        | Required by Next.js 14                           |
| TypeScript | 5+      | Type safety                                      | Project standard                                 |
| Prisma     | Latest  | Database ORM                                     | Existing multi-tenant query patterns             |
| Clerk      | Latest  | Authentication (via server-auth)                 | Existing permission system                       |

### Supporting

| Library         | Version | Purpose                                                 | When to Use                                  |
| --------------- | ------- | ------------------------------------------------------- | -------------------------------------------- |
| shadcn/ui       | Latest  | UI components (Table, Card, Sheet, Tabs, Button, Badge) | All UI components, established design system |
| Tailwind CSS    | 3+      | Styling                                                 | All styling, project standard                |
| Lucide React    | Latest  | Icons                                                   | UI icons (Eye, FileText, RefreshCw, etc.)    |
| sonner          | Latest  | Toast notifications                                     | User feedback for actions                    |
| next/navigation | Next.js | `useSearchParams`, `useRouter`                          | Client-side navigation and URL state         |

### Alternatives Considered

| Instead of        | Could Use         | Tradeoff                                                          |
| ----------------- | ----------------- | ----------------------------------------------------------------- |
| Cursor pagination | Offset pagination | Cursor is faster for large datasets, already implemented          |
| Sheet drawer      | Modal dialog      | Drawer (Sheet) is established pattern for transaction details     |
| Client components | Server components | Need client interactivity for filtering, pagination, drawer state |

**Installation:**
No new dependencies required—all libraries already installed.

## Architecture Patterns

### Recommended Project Structure

```
app/
├── association/[associationId]/
│   ├── layout.tsx                    # Association layout with sidebar (exists)
│   ├── transactions/
│   │   └── page.tsx                  # NEW: Association transactions page
│   └── teams/[teamId]/
│       ├── page.tsx                  # ENHANCE: Add transaction section
│       └── TransactionsSection.tsx   # EXISTS: Team-specific transactions
├── transactions/
│   └── page.tsx                      # EXISTS: Team user transactions (reference pattern)
└── api/
    └── transactions/
        └── route.ts                  # EXISTS: Supports teamIds parameter
```

### Pattern 1: Async Params Handling (Next.js 14+)

**What:** Next.js 14+ requires `params` to be awaited before use
**When to use:** All page components with route parameters
**Example:**

```typescript
// Source: app/association/[associationId]/teams/page.tsx (lines 184-214)
interface PageProps {
  params: Promise<{
    associationId: string
  }>
}

export default function TransactionsPage({ params }: PageProps) {
  const [associationId, setAssociationId] = useState<string | null>(null)

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params
      setAssociationId(resolvedParams.associationId)
    }
    loadParams()
  }, [params])

  // Use associationId in subsequent effects
}
```

### Pattern 2: Cursor-Based Pagination with Multi-Team Queries

**What:** Fetch transactions across multiple teams with cursor pagination
**When to use:** Association transaction lists, team transaction lists
**Example:**

```typescript
// Source: app/transactions/page.tsx (lines 173-219)
async function fetchInitialTransactions() {
  const params = new URLSearchParams()
  params.append('limit', '50') // Phase 2 requirement: 50 items per page

  // Add team filter if specific teams selected (TeamFilter component sets this)
  const teamIdsParam = searchParams.get('teamIds')
  if (teamIdsParam) {
    params.append('teamIds', teamIdsParam)
  }

  // Add other filters
  if (statusFilter !== 'all') {
    params.append('status', mapUIFilterToBackendStatus(statusFilter))
  }

  const res = await fetch(`/api/transactions?${params.toString()}`)
  const data = await res.json()

  setItems(data.items || [])
  setNextCursor(data.nextCursor || null)
  setTotalCount(data.totalCount || 0)
}

// Load more using cursor
async function loadMoreTransactions() {
  if (!nextCursor) return

  const params = new URLSearchParams()
  params.append('limit', '50')
  params.append('cursor', nextCursor)
  // ... add same filters

  const res = await fetch(`/api/transactions?${params.toString()}`)
  const data = await res.json()

  setItems(prev => [...prev, ...(data.items || [])])
  setNextCursor(data.nextCursor || null)
}
```

### Pattern 3: Transaction Details Drawer with Read-Only Mode

**What:** Right-side Sheet drawer showing transaction details, receipt, and validation
**When to use:** Clicking any transaction row in association or team views
**Example:**

```typescript
// Source: components/transactions/transaction-details-drawer.tsx (lines 70, 735)
const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false)
const isAssociationUser = true // Detect from user role

async function openTransactionDetails(transaction: Transaction) {
  setDetailsDrawerOpen(true)

  // Fetch full transaction details
  const res = await fetch(`/api/transactions/${transaction.id}`)
  const data = await res.json()
  setSelectedTransaction(data.transaction)
}

// In JSX:
<TransactionDetailsDrawer
  transaction={selectedTransaction}
  open={detailsDrawerOpen}
  onOpenChange={setDetailsDrawerOpen}
  isReadOnly={isAssociationUser}  // Hides edit button, disables receipt upload
/>
```

**Key behavior:**

- `isReadOnly={true}` hides "Edit Transaction" button
- `isReadOnly={true}` shows "No receipt attached" message instead of upload button
- Drawer still shows receipt viewer if receipt exists

### Pattern 4: Team Filtering for Association Users

**What:** Multi-select dropdown to filter transactions by team(s)
**When to use:** Association users viewing transactions across multiple teams
**Example:**

```typescript
// Source: components/transactions/TeamFilter.tsx (lines 42-87)
import { TeamFilter } from '@/components/transactions/TeamFilter'

// In filter section:
{isAssociationUser && (
  <div className="md:col-span-3">
    <TeamFilter />
  </div>
)}
```

**Key behavior:**

- Fetches accessible teams from `/api/teams/accessible`
- Updates URL query param `?teamIds=id1,id2,id3`
- Defaults to "All Teams" selected
- Requires at least one team selected
- Shows team count badge and selected team names

### Pattern 5: Association Layout with Sidebar

**What:** Consistent layout wrapper for all association pages
**When to use:** All pages under `/app/association/[associationId]/`
**Example:**

```typescript
// Source: app/association/[associationId]/layout.tsx (lines 1-28)
// Layout automatically applied to all child pages
// No special setup needed in page component

// Just create page at: app/association/[associationId]/transactions/page.tsx
export default function AssociationTransactionsPage({ params }: PageProps) {
  // Layout wrapper with AssociationSidebar is automatically applied
  return <div>Transaction list content</div>
}
```

### Anti-Patterns to Avoid

- **Don't use offset pagination** for transaction lists—cursor pagination is established standard and required by Phase 2 success criteria
- **Don't create separate API endpoints** for association transactions—existing `/api/transactions` route supports `teamIds` parameter
- **Don't build custom filter components**—`TeamFilter`, `Tabs`, `Select` components already exist and match design system
- **Don't forget async params**—Next.js 14+ requires `await params` before accessing route parameters
- **Don't allow mutations**—association users must have read-only access (enforced by `isReadOnly` prop and API-level checks)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem                        | Don't Build              | Use Instead                                                            | Why                                                             |
| ------------------------------ | ------------------------ | ---------------------------------------------------------------------- | --------------------------------------------------------------- |
| Multi-team transaction queries | Custom database joins    | `getTransactionsWithCursor({ teamIds })` from `lib/db/transactions.ts` | Already handles composite indexes, cursor encoding, filters     |
| Team access control            | Custom permission checks | `getAccessibleTeams()` from `lib/permissions/server-permissions.ts`    | Returns correct teams for both team users and association users |
| Receipt viewing                | Custom modal/lightbox    | Existing `ReceiptViewer` component                                     | Handles images and PDFs with zoom, download                     |
| Transaction details            | Custom detail view       | `TransactionDetailsDrawer` with `isReadOnly` prop                      | Full transaction details, validation violations, review history |
| Team filtering                 | Custom multi-select      | `TeamFilter` component                                                 | Syncs with URL, handles "All Teams" logic, shows team badges    |
| Cursor pagination              | Manual cursor encoding   | `decodeCursor()` and `nextCursor` from API                             | Base64 encoding, error handling already implemented             |
| Association user detection     | Role checking logic      | `isAssociationUser(user)` from `server-permissions.ts`                 | Checks both `associationId` and `associationRole`               |
| Transaction status mapping     | Custom status logic      | `mapTransactionToUIState()` from `lib/utils/transaction-ui-mapping.ts` | Maps database statuses to UI labels, colors, icons              |

**Key insight:** 90% of Phase 2 functionality already exists in `/app/transactions/page.tsx`. The main task is adapting this pattern for association context (different layout, team filtering enabled by default, read-only enforcement) rather than building new infrastructure.

## Common Pitfalls

### Pitfall 1: Forgetting to Await Params

**What goes wrong:** Accessing `params.associationId` directly causes TypeScript error or runtime crash
**Why it happens:** Next.js 14+ changed params to be async to support React Server Components
**How to avoid:** Always use the async params pattern:

```typescript
const [associationId, setAssociationId] = useState<string | null>(null)

useEffect(() => {
  async function loadParams() {
    const resolvedParams = await params
    setAssociationId(resolvedParams.associationId)
  }
  loadParams()
}, [params])
```

**Warning signs:** TypeScript error "Property 'associationId' does not exist on type 'Promise<...>'"

### Pitfall 2: Not Pre-Filtering Team Details Page

**What goes wrong:** Team details page shows all association transactions instead of just the selected team
**Why it happens:** Forgetting to pass `teamId` to the transaction query or filter
**How to avoid:** When navigating from association teams page to team details, ensure transaction view is pre-filtered:

```typescript
// In team details page
const teamId = resolvedParams.teamId

// Pre-filter to selected team
const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([teamId])

// OR: Pass teamId directly to fetch
fetch(`/api/transactions?teamIds=${teamId}`)
```

**Warning signs:** Team details page shows transactions from other teams

### Pitfall 3: Association User Seeing "Create Transaction" Buttons

**What goes wrong:** Association users see "New Expense" or "New Income" buttons they can't use
**Why it happens:** Not checking `isAssociationUser` before rendering mutation actions
**How to avoid:** Always gate create/edit actions:

```typescript
const isAssociationUser = await isAssociationUser(user)

// In JSX:
{!isAssociationUser && canCreateTransaction && (
  <Button asChild>
    <Link href="/expenses/new">New Expense</Link>
  </Button>
)}
```

**Warning signs:** Association user clicks "New Expense" and gets 403 error

### Pitfall 4: Missing Team Name Column

**What goes wrong:** Association transaction list doesn't show which team each transaction belongs to
**Why it happens:** Team users don't need team column (all transactions are from their team), but association users do
**How to avoid:** Add team name column to transaction table for association users:

```typescript
// Fetch team name from API response
const transaction = {
  id: string,
  vendor: string,
  amount: number,
  team: { id: string, name: string }  // Include team relation
}

// Show team column in table
<TableHead>Team</TableHead>
<TableCell>{transaction.team.name}</TableCell>
```

**Warning signs:** Association user can't tell which team a transaction belongs to

### Pitfall 5: Not Handling Empty Team Lists

**What goes wrong:** Association with no connected teams shows blank page or crashes
**Why it happens:** Not checking if `teams.length === 0` before rendering
**How to avoid:** Show empty state when no teams:

```typescript
if (teams.length === 0) {
  return (
    <Card>
      <CardContent className="text-center py-12">
        <p>No teams connected to this association.</p>
      </CardContent>
    </Card>
  )
}
```

**Warning signs:** Blank page or "cannot read property 'map' of undefined"

### Pitfall 6: Cursor Pagination State Not Resetting on Filter Change

**What goes wrong:** Changing filters doesn't reset pagination, causing confusing results
**Why it happens:** Forgetting to reset cursor when filters change
**How to avoid:** Reset pagination state in filter change handlers:

```typescript
function setStatusFilter(newStatus: string) {
  setStatusFilterState(newStatus)
  setItems([]) // Clear current items
  setNextCursor(null) // Reset cursor
}

// Or in useEffect:
useEffect(() => {
  fetchInitialTransactions() // Automatically resets cursor
}, [statusFilter, typeFilter, teamFilter])
```

**Warning signs:** Changing filters shows stale data or wrong page

## Code Examples

Verified patterns from official sources:

### Example 1: Complete Transaction List Page Structure

```typescript
// Source: app/transactions/page.tsx (adapted for association context)
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TransactionDetailsDrawer } from '@/components/transactions/transaction-details-drawer'
import { TeamFilter } from '@/components/transactions/TeamFilter'

interface PageProps {
  params: Promise<{ associationId: string }>
}

export default function AssociationTransactionsPage({ params }: PageProps) {
  const searchParams = useSearchParams()
  const [associationId, setAssociationId] = useState<string | null>(null)

  // Data state
  const [items, setItems] = useState<Transaction[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Drawer state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false)

  // Resolve params
  useEffect(() => {
    async function loadParams() {
      const resolved = await params
      setAssociationId(resolved.associationId)
    }
    loadParams()
  }, [params])

  // Fetch transactions when associationId is available
  useEffect(() => {
    if (associationId) {
      fetchInitialTransactions()
    }
  }, [associationId])

  async function fetchInitialTransactions() {
    setLoading(true)
    const params = new URLSearchParams()
    params.append('limit', '50')

    // TeamFilter component handles teamIds parameter via URL
    const teamIds = searchParams.get('teamIds')
    if (teamIds) {
      params.append('teamIds', teamIds)
    }

    const res = await fetch(`/api/transactions?${params.toString()}`)
    const data = await res.json()

    setItems(data.items || [])
    setNextCursor(data.nextCursor || null)
    setTotalCount(data.totalCount || 0)
    setLoading(false)
  }

  async function openTransactionDetails(transaction: Transaction) {
    setDetailsDrawerOpen(true)
    const res = await fetch(`/api/transactions/${transaction.id}`)
    const data = await res.json()
    setSelectedTransaction(data.transaction)
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="bg-navy text-white p-6 md:p-8 rounded-lg">
        <h1 className="text-2xl md:text-3xl font-bold">Transactions</h1>
        <p className="text-navy-light mt-1">
          View all team transactions ({totalCount} total)
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <TeamFilter />
        </CardContent>
      </Card>

      {/* Transaction List */}
      {!loading && items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(tx => (
                  <TableRow
                    key={tx.id}
                    onClick={() => openTransactionDetails(tx)}
                    className="cursor-pointer hover:bg-navy/5"
                  >
                    <TableCell>{formatDate(tx.transactionDate)}</TableCell>
                    <TableCell>{tx.team.name}</TableCell>
                    <TableCell>{tx.vendor}</TableCell>
                    <TableCell>{tx.category.name}</TableCell>
                    <TableCell>${tx.amount}</TableCell>
                    <TableCell>
                      {tx.receiptUrl ? (
                        <Badge variant="outline" className="bg-green-50">Has Receipt</Badge>
                      ) : (
                        <Badge variant="outline" className="bg-amber-50">No Receipt</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Load More */}
            {nextCursor && (
              <Button onClick={loadMoreTransactions} className="mt-4">
                Load More
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Transaction Details Drawer */}
      <TransactionDetailsDrawer
        transaction={selectedTransaction}
        open={detailsDrawerOpen}
        onOpenChange={setDetailsDrawerOpen}
        isReadOnly={true}  // Association users are read-only
      />
    </div>
  )
}
```

### Example 2: API Query with Multi-Team Support

```typescript
// Source: app/api/transactions/route.ts (lines 115-163)
// Association user query - returns transactions from multiple teams

// Server-side detection:
const user = await getCurrentUser()
const isAssocUser = isAssociationUser(user)

if (isAssocUser) {
  // Get all teams accessible to this association user
  const accessibleTeams = await getAccessibleTeams()

  // If specific teams requested via ?teamIds=id1,id2
  const teamIdsParam = searchParams.get('teamIds')
  let teamIds: string[]

  if (teamIdsParam) {
    const requestedTeamIds = teamIdsParam.split(',')
    const accessibleTeamIds = accessibleTeams.map(t => t.id)
    // Only include teams user has access to (security check)
    teamIds = requestedTeamIds.filter(id => accessibleTeamIds.includes(id))
  } else {
    // Default: all accessible teams
    teamIds = accessibleTeams.map(t => t.id)
  }

  // Query with multiple team IDs
  const result = await getTransactionsWithCursor({
    teamIds, // Array of team IDs
    limit: 50,
    cursor,
    filters,
  })
}
```

### Example 3: Team Details Page with Pre-Filtered Transactions

```typescript
// Source: app/association/[associationId]/teams/[teamId]/page.tsx
// Pattern for showing transactions on team details page

interface PageProps {
  params: Promise<{
    associationId: string
    teamId: string
  }>
}

export default function TeamDetailsPage({ params }: PageProps) {
  const [teamId, setTeamId] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])

  useEffect(() => {
    async function loadParams() {
      const resolved = await params
      setTeamId(resolved.teamId)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    async function fetchTeamTransactions() {
      if (!teamId) return

      // Pre-filter to this team only
      const res = await fetch(`/api/transactions?teamIds=${teamId}&limit=50`)
      const data = await res.json()
      setTransactions(data.items || [])
    }

    fetchTeamTransactions()
  }, [teamId])

  return (
    <div>
      <h1>Team Details</h1>

      {/* Team info section */}

      {/* Transactions section - pre-filtered to this team */}
      <TransactionsSection transactions={transactions} />
    </div>
  )
}
```

### Example 4: Read-Only Enforcement in Drawer

```typescript
// Source: components/transactions/transaction-details-drawer.tsx (lines 610-620)
// How the drawer handles read-only mode

interface TransactionDetailsDrawerProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isReadOnly?: boolean  // Set to true for association users
}

export function TransactionDetailsDrawer({
  transaction,
  open,
  onOpenChange,
  isReadOnly = false
}: TransactionDetailsDrawerProps) {
  // ... drawer content ...

  {/* Receipt section */}
  {transaction.receiptUrl ? (
    <Button onClick={() => setShowReceiptViewer(true)}>
      View Receipt
    </Button>
  ) : !isReadOnly ? (
    // Only show upload button for team users
    <Button onClick={() => fileInputRef.current?.click()}>
      Upload Receipt
    </Button>
  ) : (
    // Association users see this
    <div className="text-center text-sm text-gray-500">
      No receipt attached
    </div>
  )}

  {/* Edit button - hidden for association users */}
  {!isReadOnly && (
    <Button asChild>
      <Link href={`/expenses/${transaction.id}/edit`}>
        Edit Transaction
      </Link>
    </Button>
  )}
}
```

## State of the Art

| Old Approach                                | Current Approach                                       | When Changed       | Impact                                                                |
| ------------------------------------------- | ------------------------------------------------------ | ------------------ | --------------------------------------------------------------------- |
| Offset pagination (`?page=1&limit=50`)      | Cursor pagination (`?cursor=base64&limit=50`)          | Phase 1            | More efficient for large datasets, prevents skipped/duplicate records |
| Single team queries                         | Multi-team batch queries with `teamIds` array          | Phase 1            | Association users can query all teams in one request                  |
| Role-based permission checks only           | Defense-in-depth with explicit association user checks | Phase 1            | Association users blocked at API level before role checks             |
| Sync params access (`params.associationId`) | Async params (`await params`)                          | Next.js 14 upgrade | Required for React Server Components                                  |
| Modal dialogs for details                   | Sheet drawer for transaction details                   | Recent             | Consistent with app design system                                     |

**Deprecated/outdated:**

- Manual teamId loops: Use `teamIds` array in single query instead
- Direct Prisma queries in components: Use `lib/db/transactions.ts` functions
- Custom permission logic: Use `server-permissions.ts` utilities

## Open Questions

Things that couldn't be fully resolved:

1. **Team Name Display in Transaction List**
   - What we know: API response includes minimal team data via joins
   - What's unclear: Whether team name is included in `getTransactionsWithCursor` select clause
   - Recommendation: Verify `getTransactionsWithCursor` includes `team { select: { id, name } }` join; add if missing

2. **Receipt Status Badge vs. Receipt Column**
   - What we know: Existing `/app/transactions/page.tsx` has "Receipt" column with Eye icon button
   - What's unclear: Should association view show receipt status badge or keep Eye button pattern
   - Recommendation: Keep Eye button pattern for consistency, but ensure badge shows "No receipt" when `receiptUrl` is null

3. **Default Team Filter State**
   - What we know: `TeamFilter` component defaults to "All Teams" selected
   - What's unclear: Whether this is correct for association transactions page (could be overwhelming)
   - Recommendation: Keep "All Teams" default per existing pattern; association users can filter down

4. **Mobile Responsiveness for Team Column**
   - What we know: Transaction table has many columns
   - What's unclear: Whether team name column breaks mobile layout
   - Recommendation: Test on mobile; consider hiding team column on small screens or using responsive table pattern

## Sources

### Primary (HIGH confidence)

- Codebase Analysis: `app/transactions/page.tsx` - Complete transaction list pattern with pagination, filtering, drawer
- Codebase Analysis: `lib/db/transactions.ts` - `getTransactionsWithCursor()` function supporting multi-team queries
- Codebase Analysis: `components/transactions/transaction-details-drawer.tsx` - Drawer component with `isReadOnly` prop
- Codebase Analysis: `app/api/transactions/route.ts` - API route supporting `teamIds` parameter for association users
- Codebase Analysis: `lib/permissions/server-permissions.ts` - `getAccessibleTeams()` and `isAssociationUser()` utilities
- Codebase Analysis: `components/transactions/TeamFilter.tsx` - Multi-select team filter component
- Codebase Analysis: `app/association/[associationId]/layout.tsx` - Association layout pattern
- Codebase Analysis: `app/association/[associationId]/teams/page.tsx` - Async params handling pattern

### Secondary (MEDIUM confidence)

- Next.js 14 Documentation: Async params in App Router (verified via codebase usage pattern)
- shadcn/ui Components: Sheet, Table, Card, Badge (verified via existing component usage)

### Tertiary (LOW confidence)

- None - All findings based on direct codebase analysis

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - All libraries actively used in codebase
- Architecture: HIGH - Patterns verified in multiple existing pages
- Pitfalls: MEDIUM - Inferred from code patterns and Next.js 14 requirements
- Team name in API response: LOW - Needs verification in API response structure

**Research date:** 2026-01-18
**Valid until:** 2026-02-18 (30 days - stack is stable)
**Codebase version:** Current master branch as of 2026-01-18
