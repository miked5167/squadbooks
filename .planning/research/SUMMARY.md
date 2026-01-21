# Project Research Summary

**Project:** Association Financial Oversight Dashboards
**Domain:** Multi-tenant sports platform - Association-level transaction monitoring & receipt compliance
**Researched:** 2026-01-18
**Confidence:** HIGH

## Executive Summary

This project adds association-level oversight capabilities to an existing team-scoped Next.js sports management platform. Association administrators (managing 10-50+ volunteer-run teams) need to monitor transactions across all teams to identify missing receipts, validate compliance with expense policies, and ensure financial accountability without the ability to edit team data.

The research reveals a highly favorable situation: **90% of required infrastructure already exists**. The codebase has multi-tenant permissions (`getAccessibleTeams()`), team-scoped transaction queries that already support multiple teams via `teamIds` parameter, cursor-based pagination, and read-only enforcement patterns. The primary work is UI layer composition - creating association-scoped views that leverage existing data infrastructure with minimal new components.

The critical risk is **cross-tenant data leakage** through improper permission enforcement. This is mitigated by existing server-side team ownership validation in the API layer, but requires vigilant testing of all association-scoped features. Secondary risks include N+1 query performance at scale (50+ teams) and timezone normalization for multi-timezone associations - both addressable with proper indexing and association-level timezone configuration.

## Key Findings

### Recommended Stack

The existing Next.js 15 stack already provides most needed functionality. Only three targeted additions are required for advanced table functionality and PDF receipt viewing.

**Core technologies to add:**

- **TanStack Table (^8.21.3)**: Headless table library for sorting, filtering, column management — integrates seamlessly with existing shadcn/ui components, handles 10K+ rows client-side
- **nuqs (^2.8.6)**: Type-safe URL state management for shareable filtered views — React.useState-like API that syncs to query params, essential for bookmarkable association dashboards
- **react-pdf (^10.x)**: PDF receipt viewing alongside existing image receipts — built on PDF.js foundation with zoom/pan support

**Already available (no installation):**

- date-fns (^4.1.0) for date filtering and formatting
- shadcn/ui Table components for styled primitives
- xlsx (^0.18.5) for Excel export
- Next.js Image for optimized receipt viewing

**Key insight:** The existing `/api/transactions` route already supports `teamIds` parameter for multi-team queries. The existing `TransactionDetailsDrawer` already has `isReadOnly` prop. This is primarily a UI composition exercise, not infrastructure work.

### Expected Features

**Must have for v1 (table stakes):**

- View all team transactions (association-scoped) — can't do oversight without data visibility
- Filter by team (multi-select) — multi-entity management requires team isolation
- Filter by date range — time-based analysis fundamental to financial review
- Filter by missing receipts — PRIMARY use case per PROJECT.md ("identify teams with missing receipts")
- Search transactions (vendor/description) — find specific items without scrolling
- Sort by date, amount, category — standard financial analysis
- View receipt images/PDFs in drawer — can't verify compliance without seeing receipts
- Association-scoped permissions — security requirement, prevent cross-association leakage
- Read-only enforcement — association users observe, team treasurers own
- Pagination (cursor-based) — performance requirement for 100-500+ transactions
- Validation status badges — see compliance state at a glance

**Should have for v1.x (add after validation):**

- Export to Excel/CSV — board reporting capabilities (add when 3+ users request)
- Team comparison metrics — identify most/least compliant teams
- Saved filter presets — "Missing receipts over $200" one-click access
- Missing receipt count badges on team cards — compliance summary on dashboard
- Bulk receipt download — zip receipts for board review

**Defer to v2+ (scope creep risks):**

- Association users editing transactions — breaks ownership model
- Commenting on transactions — requires messaging infrastructure
- Receipt approval workflows — changes semantic meaning of approvals
- Trend analysis/spending patterns — analytics secondary to compliance
- Receipt OCR validation — complex, explicitly out of scope per PRD

### Architecture Approach

The architecture leverages existing multi-tenant isolation patterns with minimal new components. The application uses row-level security with shared database: team users access single team via `user.teamId`, association users access all teams in their association via `user.associationId` + `getAccessibleTeams()`.

**Major components to build:**

1. **AssociationTransactionsView** — Server Component page route that fetches teams and renders client components
2. **AssociationTransactionsTable** — Client Component table with team name column, uses TanStack Table with existing shadcn/ui primitives
3. **Team resolution logic** — Map teamId to team name (fetch teams once server-side, resolve client-side to avoid redundant joins)

**Modified components:**

- None required — `/api/transactions` already supports `teamIds`, `TransactionDetailsDrawer` already has `isReadOnly` prop, `TeamFilter` component already exists

**Data flow pattern:**
Server Component fetches accessible teams → passes to Client Component → Client fetches transactions via API with teamIds → API validates team ownership → returns paginated results → Client renders table with team name lookup → Click opens read-only drawer

**Performance considerations:**

- Client-side filtering works for <10K transactions (most associations have <5K/year)
- Cursor-based pagination already implemented (stable across concurrent inserts)
- Composite index needed: `(teamId, transactionDate DESC, id DESC)` for multi-team queries
- Consider denormalizing `associationId` to transactions table if queries slow (single index scan vs 50)

### Critical Pitfalls

1. **Cross-tenant data leakage via connection pool contamination** — Database connection pooling can cause session variables to bleed between requests (Ontario admin queries, Alberta admin gets same connection with stale context). **Avoid:** Never rely solely on session variables for tenant isolation. Always include `associationId` in WHERE clauses. The existing code already does this correctly in `getAccessibleTeams()` — maintain this pattern rigorously.

2. **N+1 query explosion with multi-team transaction lists** — Loading 50 teams × 20 transactions × 3 relations = 3,000+ queries causes 30s timeouts. **Avoid:** Use cursor pagination with `include` for relations (already implemented in `getTransactionsWithCursor`). Batch team queries with `teamIds IN (...)` clause (already supported). Never loop and fetch individually.

3. **Filter state leak via URL parameters** — User copies URL with `?teamIds=team-a,team-b`, colleague from different association opens it and sees cross-association data due to missing server-side validation. **Avoid:** Server-side validation of team ownership already implemented correctly (lines 87-105 in transactions route) — verify this pattern extends to all new endpoints. Clear client-side filter state on association context switch.

4. **Accidental mutations in "read-only" dashboard** — Association dashboard shows edit buttons that fail with 403, or worse, keyboard shortcuts enable editing and bypass permission checks. **Avoid:** Explicit server-side mutation rejection for association users (`if (isAssociationUser(user) && mutationType === 'UPDATE') throw PermissionError`). Remove edit UI entirely in association context rather than just disabling buttons.

5. **Missing composite indexes on (teamId, transactionDate)** — Association dashboard query scans 100K+ rows to return 200, takes 8+ seconds. **Avoid:** Add composite index `(teamId, transactionDate DESC, id DESC) INCLUDE (receiptUrl, status, categoryId)` BEFORE building dashboard. Use `EXPLAIN ANALYZE` during development to verify query plans.

6. **Date range queries without UTC normalization** — Ontario admin (EST) views "last 30 days", BC team (PST) transaction created yesterday 11 PM PST (2 AM EST tomorrow) doesn't appear. **Avoid:** Store timestamps in UTC (already done), normalize date range queries to association timezone before UTC conversion. Display timestamps in association timezone, not viewer's browser timezone.

## Implications for Roadmap

Based on combined research, the recommended approach is a focused 4-phase roadmap that leverages existing infrastructure and avoids common pitfalls through early security and performance validation.

### Phase 1: Security Foundation & Infrastructure (1-2 days)

**Rationale:** Cross-tenant data leakage is the highest risk. Must establish bulletproof permission enforcement and performance foundation before building user-facing features.

**Delivers:**

- Database composite index on `(teamId, transactionDate DESC, id DESC)` for fast multi-team queries
- Server-side mutation rejection for association users (explicit `if (isAssociationUser(user))` guards)
- Integration tests for cross-tenant isolation (Association A admin attempts to query Association B team IDs)
- Query performance monitoring (log slow queries >500ms, verify <2s for 50 teams)

**Addresses pitfalls:**

- Pitfall 1 (cross-tenant leakage) — verified with penetration testing
- Pitfall 2 (N+1 queries) — prevented with proper indexing before dashboard built
- Pitfall 4 (accidental mutations) — API layer rejects association mutations explicitly
- Pitfall 5 (missing indexes) — added proactively with EXPLAIN ANALYZE verification

**Research flag:** SKIP RESEARCH — standard multi-tenant security patterns, existing codebase provides clear examples

### Phase 2: Association Dashboard View (1 day)

**Rationale:** Build minimal viable association view that proves the core oversight value proposition — "see all team transactions with compliance status." Depends on Phase 1 security foundation.

**Delivers:**

- `/association/[associationId]/transactions/page.tsx` Server Component route
- `AssociationTransactionsView` Client Component with basic filtering
- `AssociationTransactionsTable` with team name column (TanStack Table + shadcn/ui)
- Transaction detail drawer in read-only mode (reuse existing component with `isReadOnly={true}`)
- Default to "all teams" view with missing receipt highlighting

**Implements:**

- Pattern 1: Server Component for initial data (fetch teams server-side)
- Pattern 3: Client-side filter coordination (URL query params via nuqs)
- Pattern 4: Read-only UI via props (existing TransactionDetailsDrawer pattern)

**Uses stack:**

- TanStack Table for advanced table functionality
- nuqs for URL state management (shareable filtered views)
- Existing API `/api/transactions?teamIds=X,Y,Z`

**Addresses features:**

- View all team transactions (association-scoped)
- Filter by team (multi-select via TeamFilter component)
- Filter by date range, status, search
- Sort by date/amount
- View receipt images in drawer
- Pagination (cursor-based, already implemented)

**Avoids pitfall 3:** Client-side filter state cleared on association context change, server validates all team IDs against `getAccessibleTeams()`

**Research flag:** SKIP RESEARCH — UI composition with existing patterns, official shadcn/ui data table guide available

### Phase 3: Enhanced Filtering & PDF Support (1 day)

**Rationale:** After core view is working, add advanced filtering for power users and PDF receipt support to handle all receipt types. Builds on Phase 2 foundation.

**Delivers:**

- TeamFilter component integration (multi-select team dropdown)
- Status filter tabs (All, Imported, Validated, Exceptions, Resolved)
- Missing receipts toggle filter
- PDF receipt viewing with react-pdf (alongside existing image viewer)
- URL state persistence (shareable filtered views via nuqs)

**Uses stack:**

- react-pdf for PDF viewing
- nuqs for type-safe URL parameter management
- date-fns for date range filtering (already available)

**Addresses features:**

- Filter by missing receipts (toggle + status filter combination)
- Filter by validation status (status tabs)
- Shareable filtered URLs (nuqs URL state)
- View PDF receipts (mixed receipt types: images + PDFs)

**Avoids pitfall 6:** Implement association timezone configuration, normalize date queries to association timezone before UTC conversion

**Research flag:** SKIP RESEARCH — react-pdf well-documented, existing TeamFilter component provides clear pattern

### Phase 4: Polish & Production Readiness (1 day)

**Rationale:** Handle edge cases, loading states, and error scenarios discovered during manual testing. Ensures production-quality UX.

**Delivers:**

- Empty states (no teams, no transactions, no matching filters)
- Error handling (API timeout, permission denied, invalid team ID)
- Loading skeletons and optimistic updates
- Timezone display labels ("All dates in Eastern Time")
- Performance validation with realistic data (50 teams, 20K transactions)
- Security audit (verify no mutation paths for association role)

**Addresses features:**

- Real-time data (Server Components fetch current on page load)
- Transaction status indicators (validation badges)
- Association-scoped visibility (final security audit)

**Avoids pitfalls:**

- All pitfalls — comprehensive testing with production-scale data and cross-association scenarios
- UX pitfalls from research: clear "Association View (Read-Only)" indicators, severity breakdown for exceptions

**Research flag:** SKIP RESEARCH — edge cases and polish based on existing patterns

### Phase Ordering Rationale

**Why security/infrastructure first:**

- Cross-tenant data leakage is catastrophic risk (legal/compliance, customer trust)
- N+1 query performance issues are easier to prevent than fix (adding indexes to production requires downtime)
- Existing codebase provides clear security patterns — extend, don't reinvent

**Why minimal dashboard second:**

- Validates core value proposition early ("can I see which teams have missing receipts?")
- Provides foundation for feedback on filtering priorities
- 90% of infrastructure already exists — low execution risk

**Why enhanced filtering third:**

- Depends on user feedback from basic dashboard usage
- PDF support is nice-to-have, not blocker (most receipts are images)
- URL state adds UX polish without changing core functionality

**Why polish last:**

- Edge cases only discovered through real usage
- Loading states can be added incrementally
- Production testing requires all features working

**Grouping rationale:**

- Phase 1 bundles all performance/security infrastructure (single database migration, consistent testing approach)
- Phase 2 bundles all basic UI composition (Server Component → Client Component → API → Database pattern applied consistently)
- Phase 3 bundles all advanced filters (URL state management, complex filter combinations)
- Phase 4 bundles all edge cases (comprehensive testing sweep)

### Research Flags

**Phases needing deeper research during planning:**

- None — all phases use well-documented patterns with existing codebase examples

**Phases with standard patterns (skip research-phase):**

- **Phase 1:** Multi-tenant security is well-understood, existing code provides clear patterns
- **Phase 2:** shadcn/ui data table guide + existing `/transactions/page.tsx` provides complete pattern
- **Phase 3:** react-pdf official docs, nuqs official guide, existing TeamFilter component
- **Phase 4:** Standard testing and error handling patterns

**When to invoke `/gsd:research-phase`:**

- NOT NEEDED for this project — existing infrastructure and official documentation cover all requirements
- Consider for future phases if adding: real-time notifications (email infrastructure research), advanced analytics (time-series database patterns), receipt OCR (ML provider comparison)

## Confidence Assessment

| Area         | Confidence | Notes                                                                                                                                                                                                                  |
| ------------ | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stack        | HIGH       | Core recommendations (TanStack Table, nuqs, react-pdf) verified via Context7 and official docs. Versions confirmed compatible with Next.js 15 + React 19.                                                              |
| Features     | HIGH       | MVP features validated against PROJECT.md requirements and multi-tenant financial oversight best practices. Feature prioritization based on proven table stakes vs differentiators.                                    |
| Architecture | HIGH       | Existing codebase analysis shows 90% of infrastructure already implemented. Patterns verified in production code (getAccessibleTeams, cursor pagination, read-only enforcement).                                       |
| Pitfalls     | HIGH       | Critical pitfalls (cross-tenant leakage, N+1 queries) validated via CVE database, multi-tenant security research, and codebase security audit. Performance patterns confirmed with PostgreSQL indexing best practices. |

**Overall confidence:** HIGH

### Gaps to Address

**Timezone handling specifics:**

- Research confirmed timezone normalization is critical for multi-timezone associations (Ontario/BC span 3 hours)
- Implementation detail needed: Add `timezone` field to Association model (default 'America/Toronto')
- Validation strategy: E2E test with association in PST, verify "today" transactions match PST boundaries not UTC

**How to handle:** Add timezone field in Phase 1 database migration, implement normalization in Phase 3 date filtering

**Excel export implementation:**

- Research confirmed `xlsx` library already installed and commonly used for financial exports
- Deferred to v1.x (post-launch based on user requests)
- Implementation pattern clear (example code in STACK.md lines 264-282)

**How to handle:** Track user requests during beta testing, implement as quick win if 3+ users request

**Performance at 50+ teams:**

- Research indicates client-side filtering works for <10K transactions
- Most associations have <5K transactions/year (validated assumption, not verified data)
- Scaling threshold: If association exceeds 10K transactions, need server-side filtering

**How to handle:** Monitor query performance in Phase 4, add query timeout alert (>2s), implement server-side filtering pattern (TanStack Table manual mode + TanStack Query) if needed post-launch

**Association user mutation scenarios:**

- Research identified risk of "helpful" mutations (association admin sees error, wants to fix)
- Product decision needed: Should association admins ever be able to flag/comment on transactions (deferred to v2)?
- Permission model assumes strict read-only, but audit trail for "reviewed by association" might be valuable

**How to handle:** Implement strict read-only in v1 as designed, collect user feedback during beta about desired audit/review workflows, design proper audit table (not transaction mutation) for v2 if validated

## Sources

### Primary (HIGH confidence)

- **Codebase Analysis:**
  - `lib/permissions/server-permissions.ts` — getAccessibleTeams(), isAssociationUser(), requireTeamAccess()
  - `lib/db/transactions.ts` — getTransactionsWithCursor() with teamIds support (lines 569-780)
  - `app/api/transactions/route.ts` — Multi-team query with ownership validation (lines 83-129)
  - `app/transactions/page.tsx` — TeamFilter usage pattern (lines 444-448)
  - `components/transactions/transaction-details-drawer.tsx` — Read-only enforcement pattern

- **Official Documentation:**
  - TanStack Table v8 — https://tanstack.com/table/latest/docs/introduction (verified 2026-01-18)
  - nuqs — https://nuqs.dev/ (verified 2026-01-18, Next.js 15 App Router support confirmed)
  - react-pdf — https://github.com/wojtekmaj/react-pdf (verified 2026-01-18, React 19 compatible)
  - shadcn/ui Data Table Guide — https://ui.shadcn.com/docs/components/data-table (TanStack Table integration pattern)
  - Next.js 15 App Router — Server Components, Route Handlers best practices

### Secondary (MEDIUM-HIGH confidence)

- **Multi-Tenant Security:**
  - CVE-2025-8713, CVE-2024-10976 — PostgreSQL RLS vulnerabilities (official CVE database)
  - Microsoft Azure Multi-Tenant Guidance — Row-level security patterns, noisy neighbor mitigation
  - InstaTunnel Blog (2025) — "Multi-Tenant Leakage: When Row-Level Security Fails in SaaS"
  - VergeCloud (2025) — "84% of SaaS Startups Fail Multi-Tenant Security at Scale"

- **Performance Patterns:**
  - ScoutAPM — "Understanding N+1 Database Queries"
  - Halodoc Engineering Blog (2025) — "A Practical Guide to Scalable Pagination"
  - BytePlus (2025) — "Cursor Pagination: How It Works & Pros and Cons"
  - SQL Server Index Best Practices — Composite indexes for foreign key queries

- **Financial Oversight UX:**
  - National Council of Nonprofits — Dashboards for Nonprofits
  - MetricStream (2025) — Compliance Dashboard Guide
  - Baymard Institute (2025) — Product List and Filtering UX Best Practices
  - Eleken — 19+ Filter UI Examples for SaaS

### Tertiary (MEDIUM confidence)

- **Feature Validation:**
  - Sports management software comparisons (SportLoMo, TeamSnap) — confirmed limited financial oversight
  - Nonprofit accounting software (QuickBooks Nonprofit, Araize) — confirmed strong finance but no sports context
  - Receipt compliance requirements — industry standard $100 threshold for receipt retention

- **Technology Comparisons:**
  - TanStack Table vs AG Grid — performance and bundle size comparisons (2025)
  - nuqs vs next-usequerystate — TypeScript support and maintenance activity (2025)
  - date-fns v4 vs dayjs — tree-shaking and timezone support improvements

---

_Research completed: 2026-01-18_
_Research files: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md_
_Ready for roadmap: YES_
