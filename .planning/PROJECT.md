# Squadbooks - Association Transaction Oversight

## What This Is

A hockey association management platform that enables association presidents and treasurers to monitor team spending, verify receipt compliance, and ensure teams follow association policies. Delivered in v1.0: association-scoped transaction viewing with advanced filtering, PDF receipt viewing, and read-only enforcement across all mutation endpoints.

## Core Value

Association leaders can quickly identify teams with missing receipts and verify compliance with spending policies across all teams in their association.

## Requirements

### Validated

**Pre-existing infrastructure:**

- ✓ Multi-tenant hockey association management platform — existing
- ✓ Role-based access control (ADMIN, ASSOCIATION_ADMIN, TREASURER, ASSISTANT_TREASURER, COACH, PARENT) — existing
- ✓ Team transaction management with receipt uploads by team treasurers — existing
- ✓ Budget creation and approval workflow — existing
- ✓ Transaction validation engine with 5 core rules — existing
- ✓ Rule enforcement for association policies (coach compensation, receipt requirements) — existing
- ✓ Exception handling for policy violations — existing
- ✓ Dashboard views for different user roles — existing
- ✓ Association dashboard showing team overview — existing
- ✓ Audit trail for all financial actions — existing
- ✓ Supabase storage for receipt files — existing
- ✓ Plaid banking integration — existing
- ✓ Drawer UI pattern for detail views — existing

**v1.0 Association Transaction Oversight:**

- ✓ Association users can view all transactions from all teams in their association — v1.0
- ✓ Association users cannot view transactions from other associations (scoped visibility) — v1.0
- ✓ Association users have read-only access (cannot create, edit, or delete transactions) — v1.0
- ✓ Transactions viewable from team details page (contextual investigation) — v1.0
- ✓ Dedicated transactions page for cross-team analysis — v1.0
- ✓ Filter transactions by team (multi-select), date range, missing receipts — v1.0
- ✓ Search transactions by vendor name or description (300ms debounce) — v1.0
- ✓ Sort transactions by date, amount, or category (column headers) — v1.0
- ✓ Click transaction to view full details and receipt in right-side drawer — v1.0
- ✓ View PDF receipts with page navigation and zoom controls — v1.0
- ✓ View image receipts with zoom/pan — v1.0
- ✓ Receipt metadata display (who uploaded, when, amount, category) — v1.0
- ✓ Download receipt from drawer — v1.0
- ✓ Filter state persists in URL (shareable/bookmarkable filtered views) — v1.0
- ✓ Applied filters display as removable chips above transaction list — v1.0
- ✓ Defense-in-depth security blocking all mutations for association users — v1.0
- ✓ Production-scale performance validated (50 teams, 20K transactions, <2s load) — v1.0 (achieved 595ms)

## Current Milestone: v1.1 Dashboard UX Polish

**Goal:** Apply QuickBooks and FreshBooks design patterns to improve association dashboard visual hierarchy, scannability, and professional polish

**Target improvements:**

- Apply QuickBooks 4px spacing grid for consistent visual rhythm
- Implement FreshBooks visual priority breakdown for Teams Needing Attention
- Enhance status badges with icons and industry-standard colors (WCAG 2.1 AA compliant)
- Apply FreshBooks progress bar styling to budget indicators
- Implement QuickBooks typography hierarchy for clear information architecture

### Active

- [ ] QuickBooks 4px spacing grid applied consistently across dashboard
- [ ] FreshBooks "Outstanding Invoices" pattern adapted for Teams Needing Attention section
- [ ] Status badges enhanced with icons (CheckCircle, AlertTriangle, AlertOctagon) and accessible colors
- [ ] FreshBooks-style progress bars for budget tracking (8px height, dynamic color thresholds)
- [ ] QuickBooks typography hierarchy implemented (12px badges, 14px labels, 18px headings, 30px metrics)

### Out of Scope

- Association users editing transactions — Team treasurers own transaction data
- Association users uploading receipts — Team treasurers upload receipts for their transactions
- Flagging or commenting on transactions — Defer to future (current focus is visibility only)
- Email notifications for missing receipts — Defer to future
- Bulk receipt download — Defer to future
- Receipt validation/OCR — Out of scope

## Context

**Existing Architecture:**

- Next.js 15 App Router with Server Components and API Routes
- TypeScript, Prisma ORM, Supabase PostgreSQL
- Clerk authentication with role-based permissions
- Service layer pattern for business logic (`lib/services/`)
- Database layer with typed queries (`lib/db/`)
- Permission guards: `requireAuth()`, `requirePermission()`, `requireTeamAccess()`

**Existing UI Patterns:**

- Right-side drawer for detail views (already used for parent transaction viewing)
- Filter/search controls on list pages
- Server Components for data fetching, Client Components for interactivity
- API routes for mutations, direct database queries for reads

**v1.0 Shipped (2026-01-19):**

- Association transaction viewing with dual navigation (team details + dedicated page)
- TeamFilter component for multi-team selection
- Advanced filtering: date range, missing receipts toggle, vendor search, column sorting
- PDF receipt viewing with react-pdf (page navigation, zoom controls)
- Defense-in-depth security with DAL pattern per CVE-2025-29927 mitigation
- Production-scale performance: 595ms dashboard load for 50 teams/20K transactions (70% under 2s target)
- Inline error states with retry capability, empty state variants, centralized error messaging
- 15 plans across 4 phases completed in 18.7 hours
- Comprehensive security audit with 15+ test cases

**Primary Use Case:**
Association treasurers can now identify which teams have transactions with missing receipts, filter by date ranges or specific teams, and view PDF/image receipts directly in the browser - enabling efficient compliance monitoring across all teams.

## Constraints

- **Tech Stack**: Next.js 15 App Router, TypeScript, Prisma, Supabase — Must use existing architecture
- **Authentication**: Clerk with existing role system — No new auth patterns
- **Authorization**: Existing permission guards and role checks — Extend, don't replace
- **UI Library**: shadcn/ui with Radix primitives — Use existing component library
- **Database**: Existing Prisma schema — Add queries, not schema changes (receipts already stored)
- **Performance**: Association users may view hundreds of transactions — Pagination required

## Key Decisions

| Decision                                                                 | Rationale                                                                                                                                          | Outcome       |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- |
| Read-only access for association users                                   | Association users monitor compliance but don't own transaction data; team treasurers are responsible                                               | ✓ Good (v1.0) |
| Dual view (team details + dedicated page)                                | Team details for focused investigation, dedicated page for cross-team analysis                                                                     | ✓ Good (v1.0) |
| Highlight missing receipts                                               | Primary use case is catching missing receipt violations                                                                                            | ✓ Good (v1.0) |
| Association-scoped visibility                                            | Security requirement: Ontario association can't see Alberta data                                                                                   | ✓ Good (v1.0) |
| Use existing drawer pattern                                              | Consistency with parent transaction viewing                                                                                                        | ✓ Good (v1.0) |
| Defense-in-depth security pattern                                        | Association user checks before role checks - fail fast to prevent expensive queries, blocks edge case where association user has TREASURER role    | ✓ Good (v1.0) |
| URL as single source of truth for filter state                           | Enables shareable/bookmarkable filtered views, prevents state synchronization bugs between components                                              | ✓ Good (v1.0) |
| 50-item pagination limit for association views                           | Association users may view hundreds/thousands of transactions; larger page size reduces "Load More" clicks while maintaining reasonable load times | ✓ Good (v1.0) |
| react-pdf with current-page-only rendering                               | Cleaner React API than PDF.js direct integration, current-page-only keeps memory low even for 100+ page documents                                  | ✓ Good (v1.0) |
| Inline error states with retry capability                                | Primary content fetch failures should replace content area (not toast), maintaining context and providing clear user feedback                      | ✓ Good (v1.0) |
| Production-scale validation before launch                                | Validate performance with realistic data (50 teams, 20K transactions) to ensure <2s dashboard load requirement                                     | ✓ Good (v1.0) |
| Centralized error messages (no technical details)                        | Consistency across application, type safety, ensures no stack traces or error codes leak to users                                                  | ✓ Good (v1.0) |
| 300ms search debounce                                                    | Balance responsiveness (users see instant input) and API efficiency (don't fire request on every keystroke)                                        | ✓ Good (v1.0) |
| DAL pattern documentation per Next.js CVE-2025-29927 mitigation guidance | Future developers understand security architecture and why permission checks exist in data access layer                                            | ✓ Good (v1.0) |

---

_Last updated: 2026-01-19 after v1.1 milestone initialization_
