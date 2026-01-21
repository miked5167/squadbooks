# Architecture

**Analysis Date:** 2026-01-18

## Pattern Overview

**Overall:** Next.js 15 App Router with Server-Side Rendering and API Routes

**Key Characteristics:**

- File-system based routing with nested layouts
- Server Components by default, Client Components ('use client') for interactivity
- Collocated API routes in `app/api/` directory
- Prisma ORM with Supabase PostgreSQL database
- Role-based access control with Clerk authentication
- Service layer pattern for business logic

## Layers

**Presentation Layer (React Components):**

- Purpose: Render UI and handle user interactions
- Location: `app/**/page.tsx`, `components/`
- Contains: Server Components, Client Components, UI primitives
- Depends on: Service layer (via API routes), shared types
- Used by: Next.js App Router
- Pattern: Server Components fetch data directly; Client Components use API routes

**API Layer (Route Handlers):**

- Purpose: Handle HTTP requests, authentication, and authorization
- Location: `app/api/**/route.ts`
- Contains: HTTP handlers (GET, POST, PUT, DELETE), request validation
- Depends on: Service layer, database layer, auth layer
- Used by: Client Components, external integrations
- Pattern: Each route.ts exports named functions (GET, POST, etc.)

**Service Layer (Business Logic):**

- Purpose: Implement core business rules and domain logic
- Location: `lib/services/`, `lib/db/`
- Contains: Validation engines, transaction processing, rule enforcement, data aggregation
- Depends on: Database layer, types
- Used by: API routes, Server Components
- Key services: `validation-engine-v1.ts`, `rule-enforcement-engine.ts`, `transaction-validator.ts`

**Database Layer (Data Access):**

- Purpose: Abstract database operations and provide reusable queries
- Location: `lib/db/`
- Contains: Prisma queries, transaction management, audit logging
- Depends on: Prisma client, schema
- Used by: Service layer
- Pattern: Functions export typed queries with business context

**Permission Layer (Authorization):**

- Purpose: Enforce role-based access control and team boundaries
- Location: `lib/permissions/`, `lib/auth/`
- Contains: Permission checks, role requirements, team access validation
- Depends on: Prisma, Clerk auth
- Used by: API routes, Server Components
- Pattern: `requireAuth()`, `requirePermission()`, `requireTeamAccess()`

## Data Flow

**Transaction Creation Flow:**

1. User submits form in Client Component (`components/transactions/`)
2. Client calls API endpoint `POST /api/transactions/route.ts`
3. API validates authentication via `requireAuth()`
4. Service layer (`lib/db/transactions.ts`) builds validation context
5. Validation engine (`lib/services/validation-engine-v1.ts`) runs 5 core rules
6. Rule enforcement engine checks association policies (coach comp, receipt requirements)
7. Transaction created in database with validation result and exception status
8. Approval workflow triggered if amount exceeds dual approval threshold
9. Audit log created via `lib/db/audit.ts`
10. Response returned to client with transaction and validation status

**State Management:**

- Server state: Database (Prisma + Supabase PostgreSQL)
- Client state: React useState, form state via react-hook-form
- Optimistic updates: Client updates UI, revalidates via API call
- Cache invalidation: `revalidatePath()` for Server Components

**Budget Validation Flow:**

1. Association defines policies (receipt thresholds, coach comp caps, category limits)
2. Team creates pre-season budget with category allocations
3. Budget approved by association and parents
4. Transactions validated against budget allocations in real-time
5. Exceptions generated for violations (missing receipts, overruns, unapproved categories)
6. Treasurers resolve exceptions or request overrides
7. Association monitors compliance via dashboard and alerts

## Key Abstractions

**ValidationContext:**

- Purpose: Encapsulates all data needed to validate a transaction
- Examples: `lib/types/validation.ts`, `lib/db/transactions.ts:buildValidationContext`
- Pattern: Context object pattern - gathers budget, envelopes, receipt policy, season dates

**Transaction Status State Machine:**

- Purpose: Represents lifecycle of transaction validation
- States: IMPORTED → VALIDATED | EXCEPTION → RESOLVED → LOCKED
- Computed from: validation.compliant flag, resolvedAt timestamp, budget status
- Pattern: Status computed dynamically from validation data, not stored enum

**Violation:**

- Purpose: Represents a single policy violation with severity and metadata
- Examples: `lib/types/validation.ts`, validation engine outputs
- Pattern: Code + Severity + Message + Metadata
- Severities: CRITICAL (blocks), ERROR (exception), WARNING (flag)

**Permission System:**

- Purpose: Declarative permission checking based on UserRole
- Examples: `lib/permissions/permissions.ts`, `lib/permissions/server-permissions.ts`
- Pattern: Role-based with permission enum, hierarchical (ADMIN > ASSOCIATION_ADMIN > TREASURER)

**Service Pattern:**

- Purpose: Encapsulate complex business logic with clear inputs/outputs
- Examples: `lib/services/validation-engine-v1.ts`, `lib/services/rule-enforcement-engine.ts`
- Pattern: Pure functions or classes with dependency injection

## Entry Points

**Landing Page:**

- Location: `app/page.tsx`
- Triggers: Direct navigation to root URL
- Responsibilities: Marketing page for unauthenticated users, redirects authenticated users

**Dashboard:**

- Location: `app/dashboard/page.tsx`
- Triggers: Post-login redirect, primary app navigation
- Responsibilities: Show financial summary, budget health, exceptions, role-specific views

**Transaction Pages:**

- Location: `app/transactions/page.tsx`
- Triggers: Navigation from dashboard, transaction management
- Responsibilities: List transactions with filters, show validation status, handle exceptions

**API Route Entry:**

- Location: `app/api/**/route.ts`
- Triggers: Client fetch requests, webhooks
- Responsibilities: Authenticate, authorize, validate input, call services, return response

**Middleware:**

- Location: `middleware.ts`
- Triggers: All requests (configured via matcher)
- Responsibilities: Make Clerk auth available, does NOT enforce protection (routes handle own auth)

## Error Handling

**Strategy:** Layered error handling with specific error types

**Patterns:**

- API routes: Try-catch with typed error responses, HTTP status codes
- Permission errors: `PermissionError` class with statusCode property
- Validation errors: Return validation results with violations array, don't throw
- Database errors: Logged via `lib/logger.ts`, generic error message to client
- Non-blocking failures: Email sending, audit logging, alerts run as Promise.resolve().then() to avoid blocking main flow

## Cross-Cutting Concerns

**Logging:**

- Approach: Centralized logger in `lib/logger.ts`
- Levels: info, warn, error with structured metadata
- Integration: Sentry for production error tracking

**Validation:**

- Approach: Multi-layered validation system
- Input validation: Zod schemas in `lib/validations/`
- Business validation: Validation engine with 5 core rules
- Rule enforcement: Association-level policies via `rule-enforcement-engine.ts`

**Authentication:**

- Approach: Clerk for user management and session handling
- Server: `lib/auth/server-auth.ts` provides `auth()` and `currentUser()`
- Client: Clerk React hooks and components
- Session: Managed by Clerk, accessed via middleware

**Authorization:**

- Approach: Role-based permissions with team scoping
- Roles: ADMIN, ASSOCIATION_ADMIN, TREASURER, ASSISTANT_TREASURER, COACH, PARENT
- Team access: Users scoped to single team or association (access all teams)
- API protection: `requireAuth()`, `requirePermission()`, `requireTeamAccess()` guards

**Audit Trail:**

- Approach: Comprehensive audit logging for all financial actions
- Storage: Database via `lib/db/audit.ts`
- Events: CREATE/UPDATE/DELETE for transactions, budgets, approvals
- Metadata: Old values, new values, user, team, timestamp

---

_Architecture analysis: 2026-01-18_
