# Squadbooks - Association Transaction Oversight

## What This Is

A hockey association management platform that enables association presidents and treasurers to monitor team spending, verify receipt compliance, and ensure teams follow association policies. This feature adds transaction viewing and receipt oversight capabilities for association administrators.

## Core Value

Association leaders can quickly identify teams with missing receipts and verify compliance with spending policies across all teams in their association.

## Requirements

### Validated

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

### Active

- [ ] Association users can view all transactions from all teams in their association
- [ ] Association users cannot view transactions from other associations (scoped visibility)
- [ ] Transactions viewable from team details page (contextual investigation)
- [ ] Dedicated transactions page for cross-team analysis
- [ ] Filter transactions by team, date range, amount, status
- [ ] Search transactions by description or metadata
- [ ] Highlight/filter transactions with missing receipts
- [ ] Sort transactions by date, amount, category
- [ ] Click transaction to view full details and receipt in right-side drawer
- [ ] View receipt image with transaction metadata (who uploaded, when, amount, category)
- [ ] Download receipt from drawer
- [ ] Association users have read-only access (cannot create, edit, or delete transactions)

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

**Current User Flow:**

- Association users have dashboard showing team overview
- Dashboard identifies teams violating policies or missing receipts
- Association users drill down to investigate specific teams
- Missing: ability to view team transactions and receipts

**Primary Use Case:**
Association treasurers need to identify which teams have transactions with missing receipts so they can follow up with team treasurers to ensure compliance.

## Constraints

- **Tech Stack**: Next.js 15 App Router, TypeScript, Prisma, Supabase — Must use existing architecture
- **Authentication**: Clerk with existing role system — No new auth patterns
- **Authorization**: Existing permission guards and role checks — Extend, don't replace
- **UI Library**: shadcn/ui with Radix primitives — Use existing component library
- **Database**: Existing Prisma schema — Add queries, not schema changes (receipts already stored)
- **Performance**: Association users may view hundreds of transactions — Pagination required

## Key Decisions

| Decision                                  | Rationale                                                                                            | Outcome   |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------- |
| Read-only access for association users    | Association users monitor compliance but don't own transaction data; team treasurers are responsible | — Pending |
| Dual view (team details + dedicated page) | Team details for focused investigation, dedicated page for cross-team analysis                       | — Pending |
| Highlight missing receipts                | Primary use case is catching missing receipt violations                                              | — Pending |
| Association-scoped visibility             | Security requirement: Ontario association can't see Alberta data                                     | — Pending |
| Use existing drawer pattern               | Consistency with parent transaction viewing                                                          | — Pending |

---

_Last updated: 2026-01-18 after initialization_
