# Architecture Research: Association Oversight Layer

**Domain:** Multi-tenant sports platform - Association-level transaction oversight
**Researched:** 2026-01-18
**Confidence:** HIGH

## Executive Summary

This research focuses on integrating association-level oversight into an existing team-scoped Next.js application. The architecture must enable association administrators to view transactions across all teams in their association without modifying existing team-level functionality. The pattern is well-established: read-only cross-tenant views that leverage existing data infrastructure with minimal new components.

**Key finding:** The existing codebase already has 90% of the infrastructure needed. The `/api/transactions` route supports `teamIds` parameter for multi-team queries, and `getAccessibleTeams()` provides tenant isolation. The primary work is UI layer composition, not new data infrastructure.

## Existing Infrastructure (What We Have)

### Current Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌─────────────────┐         ┌──────────────────┐           │
│  │ Team Pages      │         │ Association Pages│           │
│  │ /transactions   │         │ /association/... │           │
│  │ (single team)   │         │ (compliance,etc) │           │
│  └────────┬────────┘         └────────┬─────────┘           │
├───────────┴──────────────────────────┴──────────────────────┤
│                      API Layer                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  GET /api/transactions                              │    │
│  │  - Accepts teamId OR teamIds[]                      │    │
│  │  - Enforces access via getAccessibleTeams()         │    │
│  │  - Returns paginated results (cursor-based)         │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                   Permission Layer                           │
│  ┌──────────────────────┐  ┌────────────────────────┐       │
│  │ getAccessibleTeams() │  │ isAssociationUser()    │       │
│  │ - Team users: [own]  │  │ - Check associationId  │       │
│  │ - Assoc users: [all] │  │ - Return boolean       │       │
│  └──────────────────────┘  └────────────────────────┘       │
├─────────────────────────────────────────────────────────────┤
│                     Data Layer                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ getTransactionsWithCursor()                         │    │
│  │ - Accepts teamId OR teamIds[]                       │    │
│  │ - Filters: type, status, category, search           │    │
│  │ - Pagination: cursor-based (transactionDate + id)   │    │
│  │ - Returns: {items, nextCursor, totalCount}          │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                   Database Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Transaction  │  │ Team         │  │ Association  │      │
│  │ - teamId     │  │ - id         │  │ - id         │      │
│  │ - amount     │  │ - name       │  │ - name       │      │
│  │ - vendor     │  │ - season     │  │ - season     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         ↓                  ↓                                 │
│  AssociationTeam (junction table)                            │
│  - associationId                                             │
│  - teamId                                                    │
└─────────────────────────────────────────────────────────────┘
```

### Multi-Tenant Isolation Pattern (Already Implemented)

**Source:** `lib/permissions/server-permissions.ts` (lines 154-197)

The application uses **row-level security with shared database** pattern:

1. **User Context Determination:**
   - Team users: `user.teamId` (single team)
   - Association users: `user.associationId` + `user.associationRole` (multiple teams)

2. **Access Control:**

   ```typescript
   // Team users → single team
   if (user.teamId) {
     teamId = user.teamId
   }

   // Association users → all teams in association
   if (user.associationId) {
     teamIds = await getAccessibleTeams() // Returns all teams in association
   }
   ```

3. **Query Filtering:**
   - Single team: `WHERE teamId = ?`
   - Multiple teams: `WHERE teamId IN (?)`

**Confidence:** HIGH - This pattern is already production-tested in the codebase.

## What Needs to Be Built

### New Components Required

| Component                                            | Purpose                                         | Complexity                                   |
| ---------------------------------------------------- | ----------------------------------------------- | -------------------------------------------- |
| `/association/[associationId]/transactions/page.tsx` | New page route for association transaction list | Low - compose existing components            |
| `AssociationTransactionsTable.tsx`                   | Table with team column, read-only               | Low - fork existing TransactionsPreviewTable |
| Team name resolution logic                           | Map teamId → team name in results               | Low - data already available                 |

### Modified Components

| Component                  | Change Required                              | Complexity          |
| -------------------------- | -------------------------------------------- | ------------------- |
| `/transactions/page.tsx`   | Already has TeamFilter for association users | None - already done |
| `TransactionDetailsDrawer` | Already accepts `isReadOnly` prop            | None - already done |
| `/api/transactions`        | Already supports `teamIds` parameter         | None - already done |

**Key insight:** The existing `/transactions/page.tsx` already demonstrates the pattern. It shows TeamFilter for association users (lines 444-448) and passes `isReadOnly={isAssociationUser}` to drawer (line 735). We need to replicate this pattern in association context.

## Recommended Architecture for Association Oversight

### Component Hierarchy

```
/association/[associationId]/transactions/page.tsx  (Server Component)
│
├─ Server-side data fetching
│  └─ Fetch accessible teams via getAccessibleTeams()
│
└─ AssociationTransactionsView  (Client Component)
   │
   ├─ TeamFilter  (existing component)
   │  └─ Multi-select team dropdown
   │
   ├─ TransactionFilters  (existing pattern)
   │  ├─ Status tabs (All, Imported, Validated, Exceptions, Resolved)
   │  ├─ Type filter (All, Income, Expense)
   │  └─ Search box (vendor/description)
   │
   └─ AssociationTransactionsTable  (new component)
      │
      ├─ Table columns
      │  ├─ Team Name (NEW)
      │  ├─ Date
      │  ├─ Type
      │  ├─ Vendor
      │  ├─ Category
      │  ├─ Amount
      │  ├─ Status
      │  ├─ Validation
      │  └─ Receipt
      │
      ├─ Row click → TransactionDetailsDrawer (existing)
      │  └─ isReadOnly={true}  (association users cannot edit)
      │
      └─ Load More button (cursor pagination)
```

### Data Flow for Association Transaction List

```
[Association User visits /association/[associationId]/transactions]
    ↓
[Server Component: association/[associationId]/transactions/page.tsx]
    ↓
[Server-side: getAccessibleTeams()]
    ↓ Returns [{id, name, division, season}, ...]
    ↓
[Pass teams to Client Component as prop]
    ↓
[Client Component: AssociationTransactionsView]
    │
    ├─ State: selectedTeamIds (default: all teams)
    ├─ State: filters (status, type, search)
    ├─ State: items, cursor, loading
    │
    ├─ Effect: When filters change
    │   ↓
    │   [Fetch: GET /api/transactions?teamIds=X,Y,Z&status=...&type=...]
    │   ↓
    │   [API validates user access via getAccessibleTeams()]
    │   ↓
    │   [Database: WHERE teamId IN (X,Y,Z) AND status = ...]
    │   ↓
    │   [Returns: {items, nextCursor, totalCount}]
    │   ↓
    │   [Update state: setItems(data.items), setCursor(data.nextCursor)]
    │
    └─ Render: AssociationTransactionsTable
        │
        ├─ Map items to rows
        ├─ Include team name from teams prop (teamId lookup)
        └─ Click row → open TransactionDetailsDrawer (read-only)
```

### Integration Points

| Integration Point       | How It Works                                          | Notes                                 |
| ----------------------- | ----------------------------------------------------- | ------------------------------------- |
| **Permission check**    | `isAssociationUser()` on page load                    | Determines if TeamFilter should show  |
| **Team resolution**     | Pass teams array from server → client                 | Client maps teamId → name for display |
| **API endpoint**        | Reuse `/api/transactions` with teamIds                | Already implemented (lines 83-129)    |
| **Receipt viewing**     | Reuse ReceiptViewer component                         | No changes needed                     |
| **Transaction details** | Reuse TransactionDetailsDrawer with isReadOnly={true} | Already supports read-only mode       |
| **Validation badges**   | Reuse existing UI state mapping                       | Same validation rules apply           |

## Architectural Patterns to Follow

### Pattern 1: Server Component for Initial Data

**What:** Fetch accessible teams in Server Component, pass to Client Component

**When to use:** Always for association pages that need team context

**Why:** Reduces client-side waterfalls, enables streaming, SEO-friendly

**Example:**

```typescript
// app/association/[associationId]/transactions/page.tsx
import { getAccessibleTeams } from '@/lib/permissions/server-permissions'
import { AssociationTransactionsView } from './AssociationTransactionsView'

export default async function AssociationTransactionsPage() {
  const teams = await getAccessibleTeams()

  return <AssociationTransactionsView teams={teams} />
}
```

**Trade-offs:**

- Pro: Faster initial render, no loading spinner for teams
- Pro: Works with JS disabled
- Con: Teams list is snapshot at page load (not reactive)

**Source:** Next.js App Router best practices (WebSearch: 2025 patterns emphasize server-first rendering)

### Pattern 2: Cursor-Based Pagination for Large Datasets

**What:** Use `{transactionDate, id}` cursor for stable pagination across teams

**When to use:** Association views querying 100+ transactions across multiple teams

**Why:** Offset pagination breaks when new transactions are inserted. Cursor pagination is stable and performant.

**Example:**

```typescript
// Already implemented in lib/db/transactions.ts (lines 569-780)
const cursor = {
  transactionDate: lastItem.transactionDate,
  id: lastItem.id,
}

// WHERE clause
OR: [
  { transactionDate: { lt: cursor.transactionDate } },
  { AND: [{ transactionDate: cursor.transactionDate }, { id: { lt: cursor.id } }] },
]
```

**Trade-offs:**

- Pro: Stable results even with concurrent inserts
- Pro: Efficient database queries (index on transactionDate + id)
- Con: Cannot jump to arbitrary pages
- Con: Cannot show total pages (only "Load More")

**Source:** Production code in `lib/db/transactions.ts` - already handles teamIds array

### Pattern 3: Client-Side Filter Coordination

**What:** Single source of truth for filters in URL query params

**When to use:** Multi-filter interfaces with shareable URLs

**Why:** Enables bookmarking, sharing filtered views, browser back/forward

**Example:**

```typescript
// Similar to app/transactions/page.tsx (lines 155-170)
const searchParams = useSearchParams()

// Read filters from URL on mount
useEffect(() => {
  setStatusFilter(searchParams.get('status') || 'all')
  setTypeFilter(searchParams.get('type') || 'all')
  setTeamIds(searchParams.get('teamIds')?.split(',') || allTeamIds)
}, [searchParams])

// Update URL when filters change
useEffect(() => {
  const params = new URLSearchParams()
  if (statusFilter !== 'all') params.set('status', statusFilter)
  if (typeFilter !== 'all') params.set('type', typeFilter)
  if (teamIds.length < allTeamIds.length) params.set('teamIds', teamIds.join(','))

  router.push(`?${params.toString()}`, { scroll: false })
}, [statusFilter, typeFilter, teamIds])
```

**Trade-offs:**

- Pro: Shareable filtered views
- Pro: Browser back/forward works
- Con: More complex state synchronization
- Con: Must debounce search input to avoid URL spam

**Source:** Existing implementation in `app/transactions/page.tsx` and `components/transactions/TeamFilter.tsx`

### Pattern 4: Read-Only UI via Props

**What:** Components accept `isReadOnly` boolean to disable mutations

**When to use:** Sharing components between editable (team) and read-only (association) contexts

**Why:** Single component definition, conditional rendering based on permission context

**Example:**

```typescript
// TransactionDetailsDrawer already implements this (line 735 in transactions/page.tsx)
<TransactionDetailsDrawer
  transaction={selectedTransaction}
  open={detailsDrawerOpen}
  onOpenChange={setDetailsDrawerOpen}
  isReadOnly={isAssociationUser}  // <-- Key prop
/>

// Inside TransactionDetailsDrawer
function TransactionDetailsDrawer({ transaction, isReadOnly }) {
  return (
    <>
      {/* View-only fields always shown */}
      <TransactionDetails transaction={transaction} />

      {/* Edit buttons only if not read-only */}
      {!isReadOnly && (
        <div className="flex gap-2">
          <Button onClick={handleEdit}>Edit</Button>
          <Button onClick={handleDelete}>Delete</Button>
        </div>
      )}
    </>
  )
}
```

**Trade-offs:**

- Pro: No code duplication between team/association views
- Pro: Consistent UI/UX
- Con: Component complexity increases with branching logic
- Con: Must test both modes

**Source:** Already implemented in `TransactionDetailsDrawer` component

## Anti-Patterns to Avoid

### Anti-Pattern 1: Creating Separate Association-Specific Database Queries

**What people do:** Write new `getAssociationTransactions()` function that duplicates `getTransactionsWithCursor()` logic

**Why it's wrong:**

- Code duplication
- Maintenance burden (two query functions to update)
- The existing function already supports `teamIds` parameter

**Do this instead:**
Reuse `getTransactionsWithCursor()` with `teamIds` parameter:

```typescript
// BAD: New function
export async function getAssociationTransactions(associationId: string) {
  const teams = await getTeamsByAssociation(associationId)
  const teamIds = teams.map(t => t.id)
  // ... duplicate pagination logic ...
}

// GOOD: Reuse existing
const teams = await getAccessibleTeams()
const teamIds = teams.map(t => t.id)
const result = await getTransactionsWithCursor({ teamIds, filters })
```

**Source:** Existing implementation already supports both patterns (lines 569-780 in `lib/db/transactions.ts`)

### Anti-Pattern 2: Server Actions for Read-Only Data Fetching

**What people do:** Use Server Actions to fetch transaction list

**Why it's wrong:**

- Server Actions use POST (not cacheable)
- Loses semantic meaning of GET for reads
- Cannot be called by external clients
- Worse performance for read operations

**Do this instead:**
Use API Routes (Route Handlers) for data fetching from client components:

```typescript
// BAD: Server Action for reads
'use server'
async function getTransactions(teamIds: string[]) {
  return await getTransactionsWithCursor({ teamIds })
}

// GOOD: API Route
// GET /api/transactions?teamIds=X,Y,Z
export async function GET(request: NextRequest) {
  const teamIds = searchParams.get('teamIds')?.split(',')
  return NextResponse.json(await getTransactionsWithCursor({ teamIds }))
}
```

**Source:** Next.js 2025 best practices (WebSearch: Server Actions for mutations, Route Handlers for reads)

### Anti-Pattern 3: Client-Side Team Filtering

**What people do:** Fetch all transactions, filter by team in browser

**Why it's wrong:**

- Massive data transfer (could be thousands of transactions)
- Slow browser rendering
- Breaks pagination
- Memory issues on mobile

**Do this instead:**
Server-side filtering via teamIds parameter:

```typescript
// BAD: Client-side filter
const allTransactions = await fetch('/api/transactions') // All teams
const filtered = allTransactions.filter(t => selectedTeamIds.includes(t.teamId))

// GOOD: Server-side filter
const filtered = await fetch(`/api/transactions?teamIds=${selectedTeamIds.join(',')}`)
```

**Source:** Multi-tenant performance patterns (WebSearch: Microsoft Azure multi-tenant guidance)

### Anti-Pattern 4: Embedding Team Data in Every Transaction Result

**What people do:** Join team data to every transaction in database query

**Why it's wrong:**

- Redundant data (same team name repeated for every transaction)
- Larger payload size
- More database work

**Do this instead:**
Fetch teams once, resolve client-side:

```typescript
// BAD: Database join on every transaction
const transactions = await prisma.transaction.findMany({
  include: {
    team: { select: { name: true } }, // Repeated for every row
  },
})

// GOOD: Fetch teams once, map client-side
const teams = await getAccessibleTeams() // [{id, name}, ...]
const transactions = await getTransactionsWithCursor({ teamIds })

// Client-side lookup
const teamMap = Object.fromEntries(teams.map(t => [t.id, t]))
transactions.items.forEach(txn => {
  txn.teamName = teamMap[txn.teamId]?.name
})
```

**Source:** Performance best practice for repeated reference data

## Scaling Considerations

| Scale        | Architecture Adjustments                                                                                                                             |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1-10 teams   | Current architecture works perfectly. Single database query with `WHERE teamId IN (...)`                                                             |
| 10-50 teams  | Add database index on `(teamId, transactionDate, id)` for efficient multi-team queries. Monitor query performance.                                   |
| 50-100 teams | Consider pagination limits (currently 50 max per page). May need to add "Load More" UX instead of showing all teams at once.                         |
| 100+ teams   | Consider association-level data aggregation tables for dashboard summaries. Individual transaction queries still work but need careful index tuning. |

### Scaling Priorities

1. **First bottleneck: Database query performance with many teams**
   - **Symptom:** Slow page load when association has 20+ teams
   - **Fix:** Add composite index `(teamId, transactionDate DESC, id DESC)` on Transaction table
   - **Monitoring:** Log query execution time, alert if > 500ms

2. **Second bottleneck: Client-side rendering of large result sets**
   - **Symptom:** Browser lag when displaying 100+ transactions
   - **Fix:** Virtual scrolling (react-window) instead of rendering all rows
   - **Monitoring:** Measure render time, implement pagination limits

3. **Third bottleneck: Too many concurrent team queries**
   - **Symptom:** Multiple association users querying all teams simultaneously
   - **Fix:** Implement query result caching (Redis) with 30-second TTL
   - **Monitoring:** Database connection pool utilization

**Confidence:** MEDIUM - Based on multi-tenant performance patterns from Microsoft Azure guidance and existing codebase performance characteristics

## Build Order and Dependencies

### Phase 1: Minimal Viable Association View (1-2 days)

**Goal:** Association users can view all transactions across their teams

**Components:**

1. Create `/association/[associationId]/transactions/page.tsx` (Server Component)
   - Fetch teams via `getAccessibleTeams()`
   - Pass teams to Client Component

2. Create `AssociationTransactionsView.tsx` (Client Component)
   - Copy structure from `/transactions/page.tsx`
   - Add team name column to table
   - Default to all teams selected

3. Test with existing API and components
   - No API changes needed (already supports teamIds)
   - No permission changes needed (already have isAssociationUser)

**Success criteria:**

- Association user can see transactions from all teams
- Team name appears in table
- Clicking transaction opens read-only drawer

### Phase 2: Enhanced Filtering (1 day)

**Goal:** Association users can filter by specific teams

**Components:**

1. Add TeamFilter component (already exists)
   - Import from `components/transactions/TeamFilter.tsx`
   - Wire up to API teamIds parameter

2. Add URL state management
   - Team selection in query params
   - Shareable filtered views

**Dependencies:**

- Phase 1 must be complete (base view working)

**Success criteria:**

- Association user can select subset of teams
- URL reflects team selection
- Filters persist on page refresh

### Phase 3: Performance Optimization (1 day)

**Goal:** Fast queries even with many teams/transactions

**Components:**

1. Add database index

   ```sql
   CREATE INDEX idx_transactions_team_date
   ON Transaction(teamId, transactionDate DESC, id DESC)
   ```

2. Add query performance monitoring
   - Log slow queries (> 500ms)
   - Alert if p95 latency exceeds threshold

3. Test with realistic data volume
   - 10 teams, 1000 transactions each
   - Measure page load time

**Dependencies:**

- Phase 1 and 2 complete (need real usage to measure)

**Success criteria:**

- Page loads in < 1 second
- "Load More" button works smoothly
- No browser lag with 100+ transactions displayed

### Phase 4: Polish and Edge Cases (1 day)

**Goal:** Handle edge cases and improve UX

**Components:**

1. Empty states
   - No teams in association
   - No transactions match filters

2. Error handling
   - API timeout
   - Permission denied
   - Invalid team ID

3. Loading states
   - Skeleton screens
   - Optimistic updates

**Dependencies:**

- All previous phases complete

**Success criteria:**

- All edge cases handled gracefully
- No console errors
- Smooth loading transitions

## Summary: What to Build

**New Files (4 files):**

1. `app/association/[associationId]/transactions/page.tsx` - Server Component route
2. `app/association/[associationId]/transactions/AssociationTransactionsView.tsx` - Client Component
3. `components/association/AssociationTransactionsTable.tsx` - Table with team column
4. `components/association/AssociationTransactionsTable.test.tsx` - Component tests

**Modified Files (0 files):**

- None required - all infrastructure already exists

**Database Changes:**

- Add index on `Transaction(teamId, transactionDate DESC, id DESC)` for performance

**Estimated Timeline:**

- Phase 1: 1-2 days (core functionality)
- Phase 2: 1 day (enhanced filtering)
- Phase 3: 1 day (performance)
- Phase 4: 1 day (polish)
- **Total: 4-5 days**

## Sources

### Code References (HIGH confidence)

- `lib/db/transactions.ts` - getTransactionsWithCursor() supports teamIds (lines 569-780)
- `lib/permissions/server-permissions.ts` - getAccessibleTeams() and isAssociationUser() (lines 154-204)
- `app/api/transactions/route.ts` - Multi-team query support (lines 83-129)
- `app/transactions/page.tsx` - TeamFilter usage pattern (lines 444-448)
- `components/transactions/TeamFilter.tsx` - Team selection component (full file)
- `app/association/[associationId]/teams/[teamId]/TransactionsSection.tsx` - Association view pattern example

### Architecture Patterns (MEDIUM-HIGH confidence)

- Next.js App Router Server Components (WebSearch: 2025 best practices - server-first rendering)
- Multi-tenant row-level security (WebSearch: Microsoft Azure multi-tenant guidance)
- Cursor-based pagination (WebSearch: Industry standard for infinite scroll)
- Server Actions vs Route Handlers (WebSearch: GitHub discussions on Next.js patterns)

### Performance Guidance (MEDIUM confidence)

- Multi-tenant query performance (WebSearch: Row-based filtering with proper indexes)
- Noisy neighbor problem mitigation (WebSearch: Per-tenant rate limits and monitoring)
- Cross-tenant analytics patterns (WebSearch: Dual-write for aggregation tables)

---

_Architecture research for: Association transaction oversight_
_Researched: 2026-01-18_
_Confidence: HIGH (existing patterns), MEDIUM (scaling projections)_
