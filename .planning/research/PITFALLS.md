# Pitfalls Research: Association Oversight Dashboards

**Domain:** Multi-tenant financial oversight for sports associations
**Researched:** 2026-01-18
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Cross-Tenant Data Leakage via Connection Pool Contamination

**What goes wrong:**
Database connection pooling (PgBouncer, Prisma pooling) can cause session variables or RLS context to bleed between requests. Ontario association admin queries their teams, connection returns to pool, Alberta admin gets the same connection with stale Ontario context, sees Ontario teams' financial data.

**Why it happens:**
Modern SaaS uses connection pooling for performance. Developers assume each request gets a fresh context, but pooled connections maintain state between requests. Setting `SET LOCAL tenant_id = 'ontario-assoc'` persists if the connection isn't properly reset. This is especially dangerous with Prisma's connection pooling where the application layer manages tenant context.

**How to avoid:**

1. **Never rely solely on session variables for tenant isolation** - always include `associationId` in WHERE clauses at the query level
2. **Configure PgBouncer with Session Pooling mode** and mandatory `server_reset_query = 'DISCARD ALL'`
3. **Application-layer defense**: The codebase already implements this correctly in `getAccessibleTeams()` - it queries `associationTeam.associationId` directly rather than relying on session context
4. **Verify every association-scoped query includes explicit filters**:

   ```typescript
   // CORRECT (current implementation)
   where: {
     teamId: { in: teamIds },
     associationId: user.associationId  // explicit filter
   }

   // DANGEROUS - avoid
   where: { teamId: { in: teamIds } }  // relies on RLS/session
   ```

**Warning signs:**

- Intermittent "wrong data" reports that clear on refresh
- Query results vary by time of day (pooling pressure correlates with traffic)
- Association admin occasionally sees team names they don't recognize
- Logs show queries returning more rows than expected before application filtering

**Phase to address:**
Phase 1 (Infrastructure & Security Foundation) - Must be correct from day one. Add integration tests that simulate concurrent requests from different associations using the same connection pool.

---

### Pitfall 2: N+1 Query Explosion with Multi-Team Transaction Lists

**What goes wrong:**
Association dashboard loads transactions for 50 teams. For each team, code fetches transactions, then for each transaction, fetches category (N+1), then creator (N+2), then validation (N+3). 50 teams × 20 transactions × 3 relations = 3,000+ queries. Dashboard times out or takes 30+ seconds to load.

**Why it happens:**
Developers build team-level transaction view first (works fine for 1 team), then naively extend it to association-level by looping over teams. Each iteration triggers the same query pattern. Prisma's lazy loading and implicit relation fetching makes this invisible until production scale.

**How to avoid:**

1. **Use cursor pagination with includes** - the current `getTransactionsWithCursor` already does this correctly:
   ```typescript
   include: {
     category: { select: { id, name, color } },
     creator: { select: { id, name } },
     validation: true
   }
   ```
2. **Batch team queries with `teamIds IN (...)` clause** - already implemented in line 94-104 of transactions route
3. **Use `_count` for aggregates** rather than loading full relations (line 751-755)
4. **Never loop and fetch** - always fetch in batch with single query
5. **Set query timeout limits** at database and application level (300ms warning, 1s error)

**Warning signs:**

- Database query count spikes with team count (linear or worse)
- Slow query logs show identical queries with different parameters
- API response time correlates with number of teams in association
- Database connection pool exhaustion under load
- Prisma query logs show sequential queries rather than batched

**Phase to address:**
Phase 1 (Infrastructure) - Set up query monitoring. Phase 2 (Dashboard Implementation) - Verify all queries use batch patterns before launch. Add performance budget: association dashboard with 50 teams must load in <2s.

---

### Pitfall 3: Filter State Leak via URL Parameters and Client-Side State

**What goes wrong:**
Association admin filters to "teams with missing receipts", copies URL to share with colleague. URL contains `?teamIds=team-a,team-b,team-c` but no association filter. Colleague from different association opens link, sees other association's teams due to missing server-side validation of team ownership.

Worse: Client-side filter state (React state, localStorage) persists team IDs across association context switches. Admin views Association A, then switches to Association B, UI still shows Association A's team filter, sends those team IDs to server.

**Why it happens:**

1. **URL parameters bypass server validation** - developers trust client-provided team IDs without verifying association ownership
2. **Client state isn't cleared on context switch** - React state survives navigation between associations
3. **Shareable URLs prioritized over security** - UX desire for "copy link to share filtered view" conflicts with authorization

**How to avoid:**

1. **Server-side validation of team ownership** - already implemented correctly in transactions route (lines 87-105):
   ```typescript
   if (teamIdsParam) {
     const requestedTeamIds = teamIdsParam.split(',')
     const accessibleTeamIds = accessibleTeams.map(t => t.id)
     // Only include teams user has access to
     teamIds = requestedTeamIds.filter(id => accessibleTeamIds.includes(id))
   }
   ```
2. **Never trust client-provided team/association IDs** - always verify against `getAccessibleTeams()`
3. **Clear filter state on association context change** - reset filters when URL param `associationId` changes
4. **Fail closed**: If no accessible teams match filter, return empty results (not error that reveals team existence)
5. **Audit logs for authorization failures** - log when user requests team IDs they can't access

**Warning signs:**

- Users report seeing "No data" when opening shared URLs (authorization filtered out invalid teams)
- Audit logs show frequent "team not accessible" authorization checks
- Edge case reports: "I saw another team's data for a second before it disappeared"
- URL parameters contain team IDs from multiple associations
- Filter counts don't match visible results (client shows 10, server filtered to 3)

**Phase to address:**
Phase 1 (Security Foundation) - Implement server-side validation. Phase 2 (Dashboard UX) - Add client-side state reset on association change. Phase 3 (Beta Testing) - Test cross-association URL sharing with audit logging.

---

### Pitfall 4: Accidental Mutations in "Read-Only" Dashboard

**What goes wrong:**
Association dashboard is "read-only oversight", but clicking transaction row opens detail modal with "Edit Transaction" button. Button is visible but onClick fails with 403. Worse: keyboard shortcut or dev tools enable editing, change saves, bypasses permission check due to missing server-side enforcement.

Another variant: Dashboard has "Mark as Reviewed" button for exceptions. Developer implements as transaction update (mutation) rather than separate audit log. Association admin "reviews" transaction, accidentally changes status from VALIDATED to RESOLVED, corrupts team's records.

**Why it happens:**

1. **UI permissions !== API permissions** - developers hide buttons with `{isTreasurer && <EditButton />}` but forget to enforce on server
2. **Shared components across contexts** - same TransactionDetailDrawer used for team view (editable) and association view (read-only), edit buttons leak through
3. **Audit actions implemented as data mutations** - "Mark Reviewed" modifies transaction rather than creating separate audit record
4. **Permission checks rely on role labels** rather than capability checks against resource ownership

**How to avoid:**

1. **Server-side permission enforcement on EVERY mutation** - already implemented in `requireTeamAccess()`:

   ```typescript
   export async function requireTeamAccess(teamId: string) {
     const user = await requireAuth()
     // Association users can access but NOT edit
     if (user.associationId && user.associationRole) {
       const team = await prisma.team.findUnique({
         where: { id: teamId },
         select: { associationTeam: { select: { associationId: true } } },
       })
       if (team?.associationTeam?.associationId !== user.associationId) {
         throw new PermissionError('You do not have access to this team', 403)
       }
       return user
     }
   }
   ```

   BUT this only checks READ access. Need separate `requireTeamEditAccess()` that rejects association users.

2. **Separate read-only components** - create `AssociationTransactionDetailDrawer` without edit capabilities rather than conditionally hiding buttons
3. **Audit actions as immutable logs** - create separate `AssociationReview` table rather than mutating transaction
4. **Permission preview mode** - show what WOULD happen on click, require second confirmation for cross-context actions
5. **API endpoints reject association mutations explicitly**:
   ```typescript
   if (isAssociationUser(user) && mutationType === 'UPDATE') {
     throw new PermissionError('Association users have read-only access', 403)
   }
   ```

**Warning signs:**

- Buttons are visible but disabled in association view (shows permission design flaw)
- 403 errors in browser console when association admin interacts with UI
- Audit logs show association admin attempting mutations
- Team treasurers report unexpected changes after association review
- Components have complex conditional rendering based on user role (`{role === 'TREASURER' && !isAssociationContext && ...}`)

**Phase to address:**
Phase 1 (Security) - Add explicit mutation rejection for association users in API. Phase 2 (Dashboard Implementation) - Create read-only components for association view. Phase 3 (Testing) - Security audit to verify no mutation paths exist for association role.

---

### Pitfall 5: Missing Composite Indexes on (associationId, teamId, transactionDate)

**What goes wrong:**
Association dashboard queries "all transactions for my 50 teams with missing receipts in last 30 days". PostgreSQL uses index on `teamId`, then filters 50 separate index scans, then filters by date on each, then filters by receiptUrl. Query scans 100,000+ rows to return 200. Takes 8+ seconds. Dashboard unusable.

**Why it happens:**

1. **Team-scoped indexes don't help association queries** - index on `(teamId, transactionDate)` requires 50 separate index scans for 50 teams
2. **Multi-tenant queries weren't considered during schema design** - indexes optimized for single-team view
3. **Filter combinations explode index requirements** - need different indexes for (teamId, date), (teamId, status), (teamId, categoryId), etc.
4. **Developers don't review query plans** for association-level queries until production

**How to avoid:**

1. **Create composite index for association queries**:

   ```sql
   -- Existing (team-scoped)
   CREATE INDEX idx_transactions_team_date ON transactions(team_id, transaction_date DESC);

   -- NEW (association-scoped via team)
   CREATE INDEX idx_transactions_assoc_team_date ON transactions(team_id, transaction_date DESC)
     INCLUDE (receipt_url, category_id, amount, status);

   -- Or if associationId is denormalized on transactions table:
   CREATE INDEX idx_transactions_association ON transactions(association_id, transaction_date DESC)
     INCLUDE (team_id, receipt_url, category_id, status);
   ```

2. **Use `EXPLAIN ANALYZE` during development** - verify query plan before merging association features:

   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM transactions
   WHERE team_id = ANY(ARRAY['team1', 'team2', ...])
     AND transaction_date > NOW() - INTERVAL '30 days'
     AND receipt_url IS NULL;
   ```

3. **Consider denormalizing associationId to transactions table** - adds 8 bytes per row but enables single index scan instead of 50
4. **Implement query performance budgets** - CI fails if any association query exceeds 300ms on test dataset (10 teams, 1000 transactions each)
5. **Partial indexes for common filters**:
   ```sql
   -- Missing receipts (likely common filter)
   CREATE INDEX idx_transactions_no_receipt
     ON transactions(team_id, transaction_date DESC)
     WHERE receipt_url IS NULL;
   ```

**Warning signs:**

- Query execution time increases linearly with team count (50 teams = 10x slower than 5 teams)
- Database logs show "sequential scan" or "bitmap heap scan" for association queries
- `EXPLAIN` shows "Rows Removed by Filter" in thousands
- Database CPU spikes when association admin opens dashboard
- Indexes exist but aren't used (verify with `pg_stat_user_indexes`)

**Phase to address:**
Phase 1 (Infrastructure) - Add indexes BEFORE building dashboard. Phase 2 (Dashboard Implementation) - Verify query plans with realistic data (50 teams, 20k transactions). Phase 3 (Pre-Launch) - Load testing with production-scale datasets.

---

### Pitfall 6: Date Range Queries Without UTC Normalization Across Timezones

**What goes wrong:**
Association in Ontario (EST) views "transactions from last 30 days". Team in British Columbia (PST, -3 hours) created transaction today at 11 PM PST (2 AM EST tomorrow). Transaction doesn't appear in "today's" transactions for Ontario admin because it's "tomorrow" in EST. Confusion ensues. Worse: fiscal month boundaries differ by timezone, causing month-end reports to mismatch.

**Why it happens:**

1. **Client sends local date, server interprets as UTC** - browser sends `2026-01-18T00:00:00.000Z` (user's midnight) but server treats as UTC midnight
2. **Database stores timestamps in UTC but queries use local timezone** without normalization
3. **Multi-association platforms span timezones** - Ontario/Alberta/BC associations all use same platform
4. **Date pickers and filters don't specify timezone** - UX shows "Jan 18" but doesn't clarify which timezone

**How to avoid:**

1. **Store all timestamps in UTC, always** - already done in Prisma schema (`DateTime` is UTC)
2. **Normalize date range queries to association timezone**:

   ```typescript
   // Association setting: timezone = 'America/Toronto'
   const associationTz = await getAssociationTimezone(associationId)

   // Convert "last 30 days" to UTC boundaries in association timezone
   const endOfDayInAssocTz = DateTime.now()
     .setZone(associationTz)
     .endOf('day')
     .toUTC()
   const startOfRangeInAssocTz = endOfDayInAssocTz.minus({ days: 30 }).startOf('day')

   where: {
     transactionDate: {
       gte: startOfRangeInAssocTz.toJSDate(),
       lte: endOfDayInAssocTz.toJSDate()
     }
   }
   ```

3. **Display timestamps in association timezone in UI** - not user's browser timezone:

   ```typescript
   // WRONG - uses viewer's timezone
   {
     transaction.date.toLocaleDateString()
   }

   // CORRECT - uses association timezone
   {
     DateTime.fromJSDate(transaction.date).setZone(associationTz).toLocaleString()
   }
   ```

4. **Fiscal calendar stored per association** - month boundaries, year-end dates in association config
5. **Warn users about timezone in date pickers** - "All dates are in Eastern Time (association timezone)"

**Warning signs:**

- Reports don't match between association admin (Ontario) and team treasurer (BC)
- Transactions "disappear" or "appear" depending on viewer's timezone
- Month-end counts differ when viewed by different admins
- Fiscal year-end reports have off-by-one date errors
- Customer support tickets: "My transaction from yesterday isn't showing up"

**Phase to address:**
Phase 2 (Dashboard Implementation) - Add timezone to Association model, normalize all date queries. Phase 3 (Beta Testing) - Test with admins in different timezones. Document in UX: "All times shown in [association timezone]".

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut                                                                                             | Immediate Benefit                                                  | Long-term Cost                                                                                        | When Acceptable                                                 |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| "Just loop over teams and fetch transactions"                                                        | Fast to implement, works for 5 teams                               | N+1 queries cause 30s page loads with 50 teams, requires rewrite                                      | Never - batch fetch from start                                  |
| Skip server-side team ownership validation, rely on UI hiding                                        | Faster prototyping, fewer backend changes                          | Security vulnerability when URL is shared, possible data leak                                         | Never - security must be server-side                            |
| Use single TransactionDetailDrawer for both team and association views with conditional edit buttons | Reuse existing component, less code duplication                    | Brittle permission logic, easy to leak mutations, confusing UX                                        | Never - read-only needs separate component                      |
| Defer indexing "until we need it"                                                                    | Faster initial schema migrations, simpler                          | Requires production downtime to add indexes later, users experience slow dashboards in early adoption | Never - add indexes before association feature launches         |
| Client-side pagination for transaction lists                                                         | Simpler implementation, no cursor logic                            | Loads thousands of transactions on initial page load, timeout with large datasets                     | Only for single-team view with <1000 transactions               |
| Store transactionDate in local timezone                                                              | "More intuitive" for single-team, matches treasurer's expectations | Multi-timezone associations see different dates, fiscal reports break                                 | Never - always UTC with timezone display                        |
| Denormalize associationId onto transactions table                                                    | 5x faster association queries (single index scan vs 50)            | Schema migration complexity, data duplication, potential inconsistency                                | RECOMMENDED for performance, worth the tradeoff                 |
| Cache association transaction counts in Redis                                                        | Sub-100ms dashboard loads, great UX                                | Cache invalidation complexity, stale data risk, cost                                                  | After Phase 3 if <2s query time not achieved with indexes       |
| Use RLS policies for tenant isolation                                                                | Elegant, database-enforced isolation                               | Connection pool contamination risk, complex debugging, performance overhead                           | Acceptable as defense-in-depth BUT NOT sole isolation mechanism |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration                 | Common Mistake                                                                                       | Correct Approach                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Clerk (auth)                | Check role === 'ASSOCIATION_ADMIN' for read access but forget to check actual association membership | Always fetch association through `user.associationUser.associationId` relation, verify match |
| Prisma connection pooling   | Assume each query gets fresh context, rely on `SET LOCAL` for tenant isolation                       | Include `associationId` in WHERE clause explicitly, never rely on session variables          |
| Supabase Storage (receipts) | Association admin can access receipt URLs for any team because public bucket                         | Implement RLS on storage bucket OR verify team ownership before generating signed URL        |
| PDF report generation       | Generate all 50 teams' data in single request, timeout after 30s                                     | Background job with pagination, email when complete, or limit to 10 teams per report         |
| Email notifications         | Send "New Exception" email to association admin for every flagged transaction                        | Batch daily digest, filter to only critical exceptions, allow per-team opt-in                |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap                                                                     | Symptoms                                                                  | Prevention                                                               | When It Breaks                       |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------ |
| Loading all teams' transactions at once (no pagination)                  | Dashboard slow to load, increasing with team count                        | Cursor-based pagination, virtual scrolling, lazy load per team           | >10 teams OR >500 transactions total |
| N+1 queries for transaction relations (category, creator, validation)    | Query count = transactions × 3, database connection pool exhaustion       | Prisma `include` with selective fields, batch preload                    | >100 transactions in view            |
| Client-side filtering of 10k transactions                                | Initial load downloads 5MB JSON, browser freezes during filter            | Server-side filtering with indexes, return filtered results only         | >1000 transactions                   |
| Sequential team queries instead of `teamId IN (...)`                     | Linear slowdown with team count (50 teams = 50 queries)                   | Single query with `WHERE teamId IN (...)` or `WHERE associationId = ...` | >5 teams                             |
| Missing index on (associationId, transactionDate) for date range queries | Full table scan for "last 30 days", 10+ second queries                    | Composite index on association + date, partial index for common filters  | >10k transactions total              |
| Generating PDF reports synchronously in API request                      | Request timeout, Vercel function timeout (10s), user sees spinner forever | Background job queue (BullMQ, Inngest), email PDF when ready             | >20 teams OR >1000 transactions      |
| Using `COUNT(*)` for "transactions with missing receipts" badge          | Full table scan on every dashboard load                                   | Materialized view refreshed nightly, or cache in Redis with TTL          | >50k transactions                    |
| Loading full transaction objects for counts/aggregates                   | Transfers unnecessary data, slow JSON serialization                       | Use `_count` aggregates, `SELECT COUNT(*)` with minimal fields           | >1000 transactions                   |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake                                                                 | Risk                                                                                         | Prevention                                                                              |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Association admin can modify team transactions (missing mutation guard) | Data integrity violation, team treasurer loses trust, potential fraud accusation             | Explicit `if (isAssociationUser(user)) throw PermissionError` in UPDATE/DELETE handlers |
| Team IDs in URL parameters not validated against association membership | Cross-association data leak via URL sharing or parameter tampering                           | Server-side filter: `teamIds.filter(id => accessibleTeamIds.includes(id))`              |
| Receipt URLs accessible without team ownership check                    | Association admin views receipts from teams in other associations via direct URL             | Verify team ownership before returning signed URL OR use RLS on storage bucket          |
| Connection pool doesn't reset tenant context between requests           | Session variable contamination causes cross-tenant data leak                                 | Configure `server_reset_query = 'DISCARD ALL'`, never rely solely on session vars       |
| Audit logs don't record association admin views of team data            | No accountability trail for oversight access, can't detect snooping                          | Log every association admin team data access with timestamp, IP, user agent             |
| Filter state persists in localStorage across association switches       | User views Association A, switches to B, localStorage contains A's team IDs, sends to server | Clear filters on association context change, namespace by associationId                 |
| RLS policies don't account for association oversight role               | Association admin blocked by team-scoped RLS, can't perform oversight                        | RLS policy: `user.teamId = team.id OR user.associationId = team.associationId`          |
| API returns error messages that reveal team existence                   | "Team not found" vs "Access denied" leaks whether team exists in other association           | Always return "Access denied" for unauthorized access, never confirm existence          |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall                                                              | User Impact                                                                                     | Better Approach                                                                  |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Showing all 50 teams' transactions in single flat list               | Overwhelming, can't identify which team has issues                                              | Group by team with collapsible sections, default to "teams with exceptions only" |
| No visual distinction between team and association views             | User confused about permissions, attempts to edit in read-only view                             | Clear badge: "Association View (Read-Only)", different color scheme              |
| Exception counts without context (e.g., "5 exceptions")              | Can't prioritize: are these critical missing receipts or minor warnings?                        | Show severity breakdown: "2 critical, 3 warnings", sort by severity              |
| "Last updated 3 hours ago" for association dashboard                 | User doesn't know if data is stale or fresh, makes decisions on old data                        | Explicit refresh timestamp: "Data as of 2:15 PM ET - Refreshes nightly"          |
| Transaction detail modal identical to team view                      | Association admin clicks "Edit" before realizing it's disabled                                  | Remove action buttons entirely in association view, show "View Only" banner      |
| No filter persistence across page refreshes                          | User sets up complex filter (3 teams, missing receipts, last 30 days), refreshes, filters reset | Persist filters in URL params, validate team ownership on server                 |
| Date pickers show in user's local timezone                           | Ontario admin sees different dates than BC admin for same transaction                           | Display in association timezone with explicit label: "All dates in Eastern Time" |
| No bulk actions for common oversight tasks                           | Admin must click 50 teams individually to mark as reviewed                                      | "Mark all as reviewed", "Export all exceptions to CSV", bulk operations          |
| Exception reasons are technical (e.g., "VALIDATION_RULE_003_FAILED") | Association admin doesn't understand what's wrong or how to advise team                         | Plain language: "Missing receipt for $150 expense (required >$100)"              |
| No "what changed" diff when reviewing transactions                   | Admin sees current state but can't tell what team treasurer changed                             | Show edit history with old/new values: "Amount: $100 → $150"                     |

---

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Association dashboard loads transactions:** Often missing server-side team ownership validation — verify `teamIds.filter(id => accessibleTeamIds.includes(id))` before query
- [ ] **Read-only view implemented:** Often missing API-level mutation rejection — verify association users get 403 on UPDATE/DELETE even if UI allows it
- [ ] **Date range filtering works:** Often missing timezone normalization — verify dates are converted to association timezone before UTC query
- [ ] **Transaction detail drawer shows in association view:** Often missing edit button removal — verify no mutation paths exist in association context
- [ ] **Performance tested with 10 teams:** Often breaks at 50+ teams due to N+1 queries — verify `EXPLAIN ANALYZE` shows single query with `IN` clause
- [ ] **Pagination implemented:** Often client-side only — verify cursor-based server-side pagination with `nextCursor` returned
- [ ] **Indexes exist on teamId:** Often missing composite indexes for association queries — verify `(associationId, date)` or `(teamId, date) INCLUDE (receipt_url)` exists
- [ ] **Filters work in UI:** Often state leaks across association switches — verify filters reset when `associationId` URL param changes
- [ ] **Audit logging in place:** Often only logs mutations, not reads — verify association admin data access is logged for compliance
- [ ] **Error messages implemented:** Often reveal sensitive info — verify errors are generic: "Access denied" not "Team X belongs to Association Y"

---

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall                                  | Recovery Cost                             | Recovery Steps                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cross-tenant data leak discovered        | HIGH - legal/compliance, customer trust   | 1. Immediate: Disable association features, force logout all users. 2. Audit logs: Identify which admins saw which teams' data. 3. Notification: Disclose breach to affected associations per contract. 4. Fix: Add explicit association filters, deploy, audit code. 5. Validation: Penetration test before re-enable                           |
| N+1 queries cause 30s page loads         | MEDIUM - requires schema change, downtime | 1. Immediate: Add connection timeout (5s), return "Loading, please wait" with retry. 2. Add indexes: `CREATE INDEX CONCURRENTLY` on production (no downtime). 3. Refactor queries: Change loop to batch `IN` query. 4. Deploy: Verify with `EXPLAIN ANALYZE` before production. 5. Monitor: Alert if p95 latency >2s                             |
| Accidental mutation by association admin | MEDIUM - data integrity issue             | 1. Immediate: Rollback transaction using audit log old values. 2. Notification: Alert team treasurer of change and rollback. 3. Fix: Add `isAssociationUser()` guard to mutation endpoints. 4. Audit: Review all mutations in last 7 days for association users. 5. Prevention: Add integration test that attempts mutations as association user |
| Filter state leak shows wrong teams      | LOW - confusing UX, no data leak          | 1. Client fix: Clear localStorage filters on association change. 2. Server validation already prevents data leak (team ownership check). 3. UX: Add "You're viewing Association X" banner to prevent confusion. 4. Monitor: Log filter mismatches (requested teams vs accessible teams)                                                          |
| Missing timezone normalization           | LOW - reporting inaccuracies              | 1. Add timezone field to Association model (default to 'America/Toronto'). 2. Update date queries to normalize to association timezone before UTC conversion. 3. UI: Display "All dates in [timezone]" in date pickers. 4. Regenerate affected reports: Notify users, offer re-export                                                            |
| Performance degrades at 50+ teams        | MEDIUM - UX degradation, scaling blocker  | 1. Immediate: Add query timeout, return partial results with "Show more". 2. Indexes: Add composite index on (associationId, transactionDate). 3. Denormalize: Add associationId to transactions table if needed. 4. Pagination: Implement cursor-based pagination if not present. 5. Caching: Consider Redis for aggregate counts (last resort) |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall                       | Prevention Phase                  | Verification                                                                                            |
| ----------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Cross-tenant data leak        | Phase 1: Security Foundation      | Penetration test: Association A admin attempts to query Association B team IDs via API                  |
| N+1 query explosion           | Phase 1: Infrastructure           | Load test: Query 50 teams with 1000 transactions each, verify <2s response, single query in logs        |
| Filter state leak via URL     | Phase 2: Dashboard Implementation | Integration test: Send teamIds from Association A to Association B admin, verify empty results          |
| Accidental mutations          | Phase 1: Security + Phase 2: UI   | API test: Association user attempts UPDATE transaction, verify 403. UI test: Edit button not rendered   |
| Missing composite indexes     | Phase 1: Infrastructure           | EXPLAIN ANALYZE on association queries shows index scan, not sequential scan or bitmap heap scan        |
| Timezone normalization        | Phase 2: Dashboard Implementation | E2E test: Set association timezone to PST, verify "today" transactions match PST boundaries not UTC     |
| Connection pool contamination | Phase 1: Infrastructure           | Concurrent request test: Association A and B admins query simultaneously, verify no cross-contamination |
| Read-only enforcement         | Phase 2: Dashboard Implementation | Security audit: Review all API routes, verify association role rejected for mutations                   |
| Performance at scale          | Phase 3: Beta Testing             | Production load test: 50 teams, 20k transactions, dashboard loads <3s, all queries <300ms               |

---

## Sources

**Multi-Tenant Security (HIGH confidence):**

- CVE-2025-8713, CVE-2024-10976: PostgreSQL RLS vulnerabilities (official CVE database)
- "Multi-Tenant Leakage: When Row-Level Security Fails in SaaS" (InstaTunnel Blog, 2025)
- "Six Shades of Multi-Tenant Mayhem" (Medium, May 2025)
- "Postgres RLS Implementation Guide" (Permit.io, 2025)
- "84% of SaaS Startups Fail Multi-Tenant Security at Scale" (VergeCloud, 2025)

**Performance & N+1 Queries (HIGH confidence):**

- "Understanding N+1 Database Queries" (ScoutAPM)
- "A Practical Guide to Scalable Pagination" (Halodoc Engineering Blog, 2025)
- "Cursor Pagination: How It Works & Pros and Cons" (BytePlus, 2025)
- SQL Server Index Best Practices for Foreign Keys (multiple sources, 2025)

**Dashboard UX & Permissions (MEDIUM confidence):**

- "Dashboards API: Migrate from is_read_only" (Datadog docs, 2025)
- "Read-only, Scoped Access" (Secoda glossary)
- Grafana/OpenSearch permission management docs

**Codebase Analysis (HIGH confidence):**

- `lib/permissions/server-permissions.ts`: getAccessibleTeams(), requireTeamAccess() patterns
- `lib/db/transactions.ts`: getTransactionsWithCursor() with teamIds filtering
- `app/api/transactions/route.ts`: Server-side team ownership validation (lines 87-105)

---

_Pitfalls research for: Association oversight dashboards in multi-tenant financial platforms_
_Researched: 2026-01-18_
_Confidence: HIGH for security/performance, MEDIUM for UX patterns_
