# Codebase Structure

**Analysis Date:** 2026-01-18

## Directory Layout

```
squadbooks/
├── app/                      # Next.js App Router (pages and API routes)
│   ├── api/                  # API route handlers
│   ├── dashboard/            # Dashboard pages
│   ├── transactions/         # Transaction management pages
│   ├── association/          # Association oversight pages
│   ├── budget/              # Budget pages
│   └── page.tsx             # Landing page
├── components/              # React components
│   ├── ui/                  # shadcn/ui primitives
│   ├── dashboard/           # Dashboard-specific components
│   ├── transactions/        # Transaction components
│   ├── budget/             # Budget components
│   └── association/        # Association components
├── lib/                    # Shared utilities and business logic
│   ├── services/           # Business logic services
│   ├── db/                # Database queries and data access
│   ├── permissions/       # Authorization logic
│   ├── auth/             # Authentication utilities
│   ├── validations/      # Zod validation schemas
│   ├── types/           # TypeScript type definitions
│   └── utils/          # Utility functions
├── prisma/             # Database schema and migrations
│   ├── schema.prisma   # Prisma schema definition
│   ├── migrations/    # Database migration files
│   └── seed-demo.ts  # Demo data seeding
├── public/           # Static assets
└── scripts/         # Build and maintenance scripts
```

## Directory Purposes

**app/**

- Purpose: Next.js App Router - all routes, pages, and API endpoints
- Contains: Server Components (page.tsx), Client Components, API routes (route.ts), layouts
- Key files: `page.tsx` (landing), `dashboard/page.tsx`, `transactions/page.tsx`
- Organization: File-system routing - folders define URL paths

**app/api/**

- Purpose: Backend API endpoints
- Contains: HTTP route handlers organized by resource
- Structure: Each endpoint folder contains `route.ts` with exported GET, POST, PUT, DELETE functions
- Examples: `app/api/transactions/route.ts`, `app/api/budget/route.ts`
- Dynamic routes: `[id]` folders for parameterized paths

**components/**

- Purpose: Reusable React components
- Contains: UI components, feature components, layouts
- Organization: By feature domain (dashboard, transactions, budget) and ui primitives
- Pattern: `components/ui/` for shared primitives, feature folders for domain-specific components

**components/ui/**

- Purpose: shadcn/ui component library primitives
- Contains: Button, Card, Dialog, Table, Badge, etc.
- Pattern: Single component per file, exported as named export
- Styling: Tailwind CSS with class-variance-authority for variants

**lib/services/**

- Purpose: Core business logic and domain services
- Contains: Validation engines, rule enforcement, transaction processing
- Key files:
  - `validation-engine-v1.ts` - 5 core validation rules
  - `rule-enforcement-engine.ts` - Association policy enforcement
  - `transaction-validator.ts` - Transaction validation orchestration
  - `coach-compensation.ts` - Coach compensation limit checking
  - `receipt-policy.ts` - Receipt requirement logic

**lib/db/**

- Purpose: Database query functions and data access layer
- Contains: Typed Prisma queries organized by domain
- Key files:
  - `transactions.ts` - Transaction CRUD and queries
  - `budget.ts` - Budget operations
  - `audit.ts` - Audit logging
  - `governance.ts` - Association governance

**lib/permissions/**

- Purpose: Authorization and access control
- Contains: Permission definitions, role checks, server-side guards
- Key files:
  - `permissions.ts` - Permission enum and hasPermission()
  - `server-permissions.ts` - Server-side auth guards (requireAuth, requirePermission, requireTeamAccess)

**lib/validations/**

- Purpose: Input validation schemas using Zod
- Contains: Schema definitions for API inputs and form validation
- Key files:
  - `transaction.ts` - Transaction input schemas
  - `pre-season-budget.ts` - Budget schemas
  - `rule-schemas.ts` - Association rule schemas

**lib/types/**

- Purpose: TypeScript type definitions
- Contains: Shared interfaces, enums, and type utilities
- Key files:
  - `validation.ts` - ValidationContext, Violation types
  - `association-rules.ts` - Association policy types
  - `budget.ts` - Budget-related types
  - `team-season.ts` - Team season lifecycle types

**prisma/**

- Purpose: Database schema and tooling
- Contains: Prisma schema, migrations, seed scripts
- Key files:
  - `schema.prisma` - Database schema definition (69KB)
  - `seed-demo.ts` - Demo data generator
  - `migrations/` - SQL migration files

## Key File Locations

**Entry Points:**

- `app/page.tsx`: Landing page (public marketing site)
- `app/dashboard/page.tsx`: Main application dashboard
- `middleware.ts`: Request middleware (Clerk auth setup)

**Configuration:**

- `next.config.js`, `next.config.ts`: Next.js configuration
- `tsconfig.json`: TypeScript configuration with `@/*` path alias
- `tailwind.config.ts`: Tailwind CSS configuration
- `prisma/schema.prisma`: Database schema
- `.env.local`: Environment variables (not in repo)

**Core Logic:**

- `lib/prisma.ts`: Prisma client singleton
- `lib/logger.ts`: Centralized logging
- `lib/auth/server-auth.ts`: Server-side authentication
- `lib/permissions/server-permissions.ts`: Authorization guards
- `lib/db/transactions.ts`: Transaction business logic (1140 lines)

**Testing:**

- `vitest.config.ts`: Unit test configuration
- `vitest.config.integration.ts`: Integration test configuration
- `playwright.config.ts`: End-to-end test configuration
- Test files: `*.test.ts` pattern (e.g., `lib/logger.test.ts`)

## Naming Conventions

**Files:**

- Pages: `page.tsx` (Next.js convention)
- API routes: `route.ts` (Next.js convention)
- Components: PascalCase (e.g., `TransactionDetailsDrawer.tsx`)
- Utilities: kebab-case (e.g., `server-auth.ts`)
- Tests: `*.test.ts` or `*.spec.ts`

**Directories:**

- Features: kebab-case (e.g., `budget-approvals`)
- Dynamic routes: `[paramName]` (e.g., `[id]`, `[teamId]`)
- Route groups: `(groupName)` for organization without affecting URL

**Variables:**

- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE (e.g., `DEFAULT_CATEGORIES`)
- Types/Interfaces: PascalCase

**Database:**

- Tables: PascalCase singular (e.g., `Transaction`, `BudgetAllocation`)
- Fields: camelCase
- Enums: UPPER_SNAKE_CASE values

## Where to Add New Code

**New Feature:**

- Primary code: `app/[feature-name]/page.tsx` for pages
- Components: `components/[feature-name]/` for feature-specific UI
- API: `app/api/[feature-name]/route.ts` for backend
- Business logic: `lib/services/[feature-name].ts` or `lib/db/[feature-name].ts`
- Tests: Colocate tests as `*.test.ts` next to implementation

**New Component/Module:**

- Implementation: `components/[domain]/ComponentName.tsx`
- Shared UI primitive: `components/ui/component-name.tsx`
- Reusable hook: `lib/hooks/use-feature-name.ts`

**Utilities:**

- Shared helpers: `lib/utils.ts` or `lib/utils/[specific-util].ts`
- Type definitions: `lib/types/[domain].ts`
- Validation schemas: `lib/validations/[domain].ts`

**Database Changes:**

- Schema: Edit `prisma/schema.prisma`
- Migration: Run `npm run db:migrate` to generate migration
- Seed data: Add to `prisma/seed-demo.ts` for demo scenarios

**API Endpoint:**

- Create: `app/api/[resource]/route.ts`
- Dynamic: `app/api/[resource]/[id]/route.ts` for item-specific operations
- Nested: `app/api/[resource]/[id]/[action]/route.ts` for actions (approve, reject, etc.)

## Special Directories

**.next/**

- Purpose: Next.js build output and cache
- Generated: Yes (on build/dev)
- Committed: No
- Note: Delete to force clean rebuild

**node_modules/**

- Purpose: npm package dependencies
- Generated: Yes (on npm install)
- Committed: No

**.planning/**

- Purpose: Project planning and documentation (GSD system)
- Generated: Via GSD commands
- Committed: Yes
- Structure: `codebase/`, `phases/`, `research/`

**.claude/**

- Purpose: Claude Code configuration and custom commands
- Generated: Manual setup
- Committed: Partial (settings in .gitignore)
- Contains: GSD command definitions, hooks, skills

**prisma/migrations/**

- Purpose: Database migration history
- Generated: Via `prisma migrate dev`
- Committed: Yes
- Pattern: `TIMESTAMP_migration_name/` folders with migration.sql

**public/**

- Purpose: Static assets served at root URL
- Committed: Yes
- Contains: Images (huddlebooks-logo.png), icons, fonts
- Access: Via `/filename` in code (no /public prefix)

**scripts/**

- Purpose: Build and maintenance scripts
- Contains: Database bootstrapping, test setup utilities
- Key files: `bootstrap-test-db.ts`, `seed-pre-season-budgets.ts`
- Usage: Run via npm scripts or tsx directly

**app/api/dev/**

- Purpose: Development-only API endpoints
- Contains: Database reset, demo data loading, testing utilities
- Security: Should be protected in production
- Examples: `reset-demo-transactions`, `load-demo-association`

---

_Structure analysis: 2026-01-18_
