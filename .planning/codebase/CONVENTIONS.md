# Coding Conventions

**Analysis Date:** 2026-01-18

## Naming Patterns

**Files:**

- Components: PascalCase - `AssociationLayout.tsx`, `EmptyState.tsx`
- Utilities/logic: kebab-case - `transaction-validator.ts`, `rule-enforcement-engine.ts`
- Tests: Co-located with `.test.ts` or `.spec.ts` suffix
- API routes: Next.js App Router convention - `route.ts` in directory structure

**Functions:**

- Functions: camelCase - `requiresApproval()`, `buildValidationContext()`, `getCurrentUser()`
- React components: PascalCase - `AssociationLayout`, `Button`, `SeverityBadge`
- Async functions: Prefix with verb - `async function getTeamSettings()`, `async function createTransaction()`

**Variables:**

- Local variables: camelCase - `budgetRecord`, `currentVersion`, `teamSettings`
- Constants: UPPER_SNAKE_CASE - `DEFAULT_DUAL_APPROVAL_THRESHOLD`, `MANDATORY_RECEIPT_THRESHOLD`
- React props: camelCase - `associationId`, `headerRight`, `breadcrumbs`

**Types:**

- Interfaces/Types: PascalCase - `ValidationContext`, `CreateTransactionInput`, `BudgetHealth`
- Enums: PascalCase - `Permission`, `AuditAction`, `EntityType`
- Type exports: Named exports - `export type { Logger }`, `export interface OnboardingEvent`

## Code Style

**Formatting:**

- Tool: Prettier
- Config: `C:/Users/miked/Squadbooks/.prettierrc`
- Key settings:
  - No semicolons (`semi: false`)
  - Single quotes (`singleQuote: true`)
  - Tab width: 2 spaces
  - Trailing commas: ES5
  - Print width: 100
  - Arrow parens: avoid
  - Tailwind plugin enabled

**Linting:**

- Tool: ESLint
- Config: `C:/Users/miked/Squadbooks/.eslintrc.json`
- Extends: `next/core-web-vitals`, `next/typescript`, `prettier`
- Key rules:
  - `no-console`: warn (allow `console.warn` and `console.error`)
  - `@typescript-eslint/no-explicit-any`: warn
  - `@typescript-eslint/consistent-type-imports`: warn (prefer type imports)
  - `@typescript-eslint/no-unused-vars`: warn (allow `_` prefix for ignored vars)
  - `@typescript-eslint/naming-convention`: enforces camelCase/PascalCase/UPPER_CASE
  - Test files: console and `any` allowed

**TypeScript:**

- Strict mode: enabled
- Target: ES2017
- Module resolution: bundler
- Path aliases: `@/*` maps to project root
- No explicit return types required (rule disabled)

## Import Organization

**Order:**

1. External packages (React, Next.js, Prisma)
2. Type imports (with `type` keyword)
3. Internal absolute imports (via `@/` alias)
4. Relative imports (if any)

**Example:**

```typescript
import { prisma } from '@/lib/prisma'
import type { TransactionType, TransactionStatus, Prisma } from '@prisma/client'
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilter,
} from '@/lib/validations/transaction'
import { logger } from '@/lib/logger'
```

**Path Aliases:**

- `@/` - Project root
- Usage: Always prefer absolute imports via `@/` over relative paths
- Example: `import { cn } from '@/lib/utils'`

## Error Handling

**Patterns:**

- Use try-catch for async operations
- Log errors via centralized logger: `logger.error('message', error, context)`
- Server-side: Return `NextResponse.json()` with error details
- Client-side: Use toast notifications via `sonner`
- Never throw raw strings - always use `Error` objects

**Example:**

```typescript
try {
  const result = await createTransaction(data)
  logger.info('Transaction created', { id: result.id })
  return result
} catch (error) {
  logger.error('Failed to create transaction', error, { data })
  throw error
}
```

## Logging

**Framework:** Custom logger (`@/lib/logger`)

**Patterns:**

- Use structured logging with context objects
- Development: Console output with emojis
- Production: Sentry integration for errors/warnings
- Available levels:
  - `logger.debug()` - Verbose, dev-only
  - `logger.info()` - Important events
  - `logger.warn()` - Recoverable issues
  - `logger.error()` - Critical failures
  - `logger.api()` - API request logging
  - `logger.query()` - Database operations
  - `logger.auth()` - Authentication events
  - `logger.business()` - Domain events

**Example:**

```typescript
logger.info('Transaction created', { id: 'tx_123', amount: 100 })
logger.warn('Slow query detected', { query: 'SELECT...', duration: 5000 })
logger.error('Failed to process payment', error, { userId: '123' })
```

## Comments

**When to Comment:**

- Complex business logic requiring explanation
- Non-obvious algorithm choices
- Important security or validation rules
- JSDoc for public API functions

**JSDoc/TSDoc:**

- Used for complex functions and business logic
- Include description, parameters, return values
- Example:

```typescript
/**
 * Business Logic: Determine if a transaction requires approval
 * Rule: EXPENSE transactions above the dual approval threshold require approval
 * The threshold is configured per-team in Settings (default: $200)
 */
export async function requiresApproval(
  type: TransactionType,
  amount: number,
  teamId: string
): Promise<boolean>
```

## Function Design

**Size:** Keep functions focused and under 100 lines when possible

**Parameters:**

- Use object parameters for 3+ arguments
- Destructure in function signature
- Use `Partial<>` for optional overrides

**Return Values:**

- Explicit types on public functions
- Return `null` for "not found" cases
- Return `Promise<void>` for side-effect functions
- Use branded types for IDs when appropriate

**Example:**

```typescript
export async function getCurrentUser(): Promise<User | null> {
  const auth = await clerkAuth()
  if (!auth?.userId) return null

  return await prisma.user.findUnique({
    where: { clerkUserId: auth.userId },
  })
}
```

## Module Design

**Exports:**

- Named exports preferred over default exports
- Export types separately: `export type { Logger }`
- Export constants at module level
- Group related exports

**Barrel Files:**

- Not heavily used
- Prefer direct imports from source files
- Example: `import { logger } from '@/lib/logger'` not `from '@/lib'`

## Validation

**Framework:** Zod

**Patterns:**

- Define schemas in `lib/validations/` directory
- Use `.parse()` for API boundaries
- Use `.safeParse()` when validation might fail
- Export schema and inferred types

**Example:**

```typescript
export const CreateTransactionSchema = z.object({
  type: TransactionTypeEnum,
  amount: z
    .number()
    .positive({ message: 'Amount must be positive' })
    .max(100000, { message: 'Amount cannot exceed $100,000' }),
  // ...
})

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>
```

## React Patterns

**Component Structure:**

- Functional components with TypeScript
- Props interfaces defined inline or above component
- Use `React.forwardRef` for components that need refs
- Destructure props in function signature

**Hooks:**

- Follow rules of hooks (enforced by ESLint)
- Custom hooks in `lib/hooks/` directory
- Prefix with `use` - `usePermissions()`, `useExceptions()`

**Styling:**

- Tailwind CSS utility classes
- Use `cn()` helper from `@/lib/utils` for conditional classes
- Component variants via `class-variance-authority` (CVA)

**Example:**

```typescript
interface AssociationLayoutProps {
  associationId: string
  title: string
  children: React.ReactNode
  headerRight?: React.ReactNode
}

export function AssociationLayout({
  associationId,
  title,
  children,
  headerRight,
}: AssociationLayoutProps) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      {/* ... */}
    </main>
  )
}
```

## Database Access

**ORM:** Prisma

**Patterns:**

- Import client: `import { prisma } from '@/lib/prisma'`
- Use type-safe queries
- Include only needed fields with `select`
- Use transactions for multi-step operations
- Log slow queries via `logger.query()`

**Example:**

```typescript
const teamSettings = await prisma.teamSettings.findUnique({
  where: { teamId },
  select: {
    receiptGlobalThresholdOverrideCents: true,
    dualApprovalThreshold: true,
  },
})
```

---

_Convention analysis: 2026-01-18_
