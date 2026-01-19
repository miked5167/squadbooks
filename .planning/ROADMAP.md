# Roadmap: Association Transaction Oversight

## Overview

This roadmap delivers association-level financial oversight capabilities to enable association presidents and treasurers to monitor team spending, verify receipt compliance, and ensure teams follow association policies. The project leverages 90% existing infrastructure (multi-tenant permissions, cursor pagination, transaction queries) and focuses on building association-scoped UI views with strict read-only enforcement. The four phases progress from security foundation through basic oversight to advanced filtering and production polish.

## Phases

**Phase Numbering:**

- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Security Foundation & Infrastructure** - Establish bulletproof permission enforcement and performance foundation
- [x] **Phase 2: Association Dashboard View** - Build minimal viable association transaction view with basic filtering
- [ ] **Phase 3: Enhanced Filtering & PDF Support** - Add advanced filtering and PDF receipt viewing
- [ ] **Phase 4: Polish & Production Readiness** - Handle edge cases, loading states, and production validation

## Phase Details

### Phase 1: Security Foundation & Infrastructure

**Goal**: Association users can only access their association's data with fast multi-team query performance
**Depends on**: Nothing (first phase)
**Requirements**: SEC-01, SEC-02, SEC-03, PERF-01, PERF-02, PERF-03
**Success Criteria** (what must be TRUE):

1. Association user attempting to access another association's team IDs receives 403 Forbidden error
2. Mutation endpoints (POST, PUT, DELETE) explicitly reject requests from association users with 403
3. Dashboard loads in under 2 seconds for 50 teams with 1000 transactions each
4. Multi-team transaction queries use single batch query (no N+1 query patterns)
5. Database queries use composite index on (teamId, transactionDate DESC, id DESC)
   **Plans**: 2 plans

Plans:

- [x] 01-01-PLAN.md — Security hardening with mutation rejection and integration tests
- [x] 01-02-PLAN.md — Database performance verification and validation

### Phase 2: Association Dashboard View

**Goal**: Association users can view all team transactions with basic filtering and receipt viewing
**Depends on**: Phase 1
**Requirements**: VIEW-01, VIEW-02, VIEW-03, VIEW-04, VIEW-05, NAV-01, NAV-02, NAV-03, NAV-04, RECEIPT-01, RECEIPT-06
**Success Criteria** (what must be TRUE):

1. Association user can view transactions from all teams in their association from dedicated transactions page
2. Association user can view team transactions from team details page (pre-filtered to selected team)
3. Transaction list displays date, vendor, amount, category, team name, and receipt status for each transaction
4. Association user can click transaction to view receipt in right-side drawer (or "No receipt" state)
5. Transaction list uses cursor-based pagination and loads 50 items per page
   **Plans**: 3 plans

Plans:

- [x] 02-01-PLAN.md — Association transactions page with team filtering and drawer integration
- [x] 02-02-PLAN.md — Team details transaction section with pre-filtering
- [x] 02-03-PLAN.md — Human verification of both transaction views and navigation

### Phase 3: Enhanced Filtering & PDF Support

**Goal**: Association users can filter transactions by team, date range, missing receipts, and view PDF receipts
**Depends on**: Phase 2
**Requirements**: FILTER-01, FILTER-02, FILTER-03, FILTER-04, FILTER-05, FILTER-06, FILTER-07, FILTER-08, RECEIPT-02, RECEIPT-03, RECEIPT-04, RECEIPT-05
**Success Criteria** (what must be TRUE):

1. Association user can filter transactions by multiple teams using multi-select dropdown
2. Association user can filter transactions by date range (from/to date pickers)
3. Association user can toggle "missing receipts only" filter to show transactions without receipts
4. Association user can search transactions by vendor name or description (text input)
5. Association user can sort transactions by date, amount, or category (column headers)
6. Applied filters display as removable chips above transaction list
7. Filter state persists in URL (shareable/bookmarkable filtered views)
8. Receipt drawer displays PDF receipts with page navigation and zoom controls
9. Receipt drawer shows metadata (who uploaded, when, amount, category) and download button
   **Plans**: TBD

Plans:

- [ ] 03-01: TBD
- [ ] 03-02: TBD
- [ ] 03-03: TBD

### Phase 4: Polish & Production Readiness

**Goal**: Application handles edge cases gracefully and performs well under production load
**Depends on**: Phase 3
**Requirements**: None (polish phase covers all requirements implicitly through UX refinement)
**Success Criteria** (what must be TRUE):

1. Empty states display helpful messages (no teams, no transactions, no matching filters)
2. Error states display clear messages (API timeout, permission denied, invalid team ID)
3. Loading states show skeletons while data fetches (transaction list, drawer content)
4. Timezone labels indicate association timezone ("All dates in Eastern Time")
5. Performance validated with realistic data (50 teams, 20K transactions, <2s dashboard load)
6. Security audit confirms no mutation paths exist for association role
   **Plans**: TBD

Plans:

- [ ] 04-01: TBD
- [ ] 04-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase                                   | Plans Complete | Status      | Completed  |
| --------------------------------------- | -------------- | ----------- | ---------- |
| 1. Security Foundation & Infrastructure | 2/2            | ✓ Complete  | 2026-01-18 |
| 2. Association Dashboard View           | 3/3            | ✓ Complete  | 2026-01-18 |
| 3. Enhanced Filtering & PDF Support     | 0/3            | Not started | -          |
| 4. Polish & Production Readiness        | 0/2            | Not started | -          |
