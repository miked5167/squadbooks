# Codebase Concerns

**Analysis Date:** 2026-01-18

## Tech Debt

**GTHL Policy Validation - Incomplete Implementation:**

- Issue: Core GTHL compliance validation functions are stubbed out with TODO comments
- Files: `lib/validation/gthl-policy.ts` (15+ TODO comments across all validation functions)
- Impact: GTHL policy compliance checking is non-functional. All validation functions return hardcoded false values for critical checks (signingAuthorityCheck, independentParentCheck, documentationCheck, reviewCheck, approvalTimingCheck)
- Fix approach: Implement full validation logic for e-transfer, cheque, and cash withdrawal policies including signing authority verification, independent parent checks, and documentation requirements

**Budget Workflow State Management:**

- Issue: TODO comments indicate incomplete association admin permission checks and missing email notification system
- Files: `lib/db/pre-season-budget.ts` (lines 107, 388, 518, 552, 661, 662, 817)
- Impact: Missing access control checks could allow unauthorized budget approvals. Parent notifications for budget changes not sent.
- Fix approach: Implement proper association admin verification and integrate email notification system for all state transitions

**Plaid Access Token Security:**

- Issue: Access tokens stored in plaintext in database and returned to frontend without encryption
- Files: `app/api/plaid/exchange-token/route.ts` (line 132 "TODO: Encrypt this in production")
- Impact: Sensitive Plaid access tokens exposed in API responses and stored unencrypted. Critical security vulnerability for production deployment.
- Fix approach: Implement encryption at rest for access tokens in database. Remove access token from API response or encrypt before transmission. Use environment-based encryption keys.

**Transaction Validation State Inconsistency:**

- Issue: Imported transactions may have validation data missing or category overrides not applied
- Files: `lib/services/validate-imported-transactions.ts` (lines 82, 127 - hardcoded TODO values)
- Impact: Budget categories show incorrect spent amounts (hardcoded to 0). Receipt thresholds use hardcoded defaults instead of association-specific settings.
- Fix approach: Load actual spent amounts from transaction aggregates. Pull receipt policy from association settings table.

**Custom Association Rules Not Implemented:**

- Issue: Transaction validator has placeholder for custom association rule validation
- Files: `lib/services/transaction-validator.ts` (line 214 "TODO: Implement custom association rule validation")
- Impact: Teams cannot enforce association-specific policies beyond built-in rules
- Fix approach: Design and implement extensible rule engine that loads association-specific rules from database and applies them during validation

**TeamSeason State Transitions - Missing Updates:**

- Issue: Budget approval workflow doesn't update TeamSeason state after association approval
- Files: `lib/budget-workflow/association-approval.ts` (line 143 "TODO: Update TeamSeason state if it exists")
- Impact: Team season lifecycle state may be out of sync with actual budget approval status, causing incorrect dashboard displays
- Fix approach: Call transitionTeamSeason() after successful association approval to move state to appropriate phase

## Known Bugs

**Console.log Debugging Statements in Production Code:**

- Symptoms: Debug console statements left throughout codebase
- Files: Over 60 instances across app routes, components, and lib files including `app/api/transactions/route.ts:298`, `app/api/plaid/exchange-token/route.ts:46,56,66,115`, `lib/storage.ts:70,92,106`, `lib/services/rule-enforcement-engine.ts:264`
- Trigger: Normal application execution
- Workaround: None - logs clutter console and may expose sensitive data
- Fix: Implement structured logging with logger service (already exists at `lib/logger.ts`) and replace all console.\* calls

**Test/Debug Scripts Committed to Repository:**

- Symptoms: Multiple ad-hoc testing scripts in repository root
- Files: `check-dashboard.ts`, `check-exceptions.ts`, `check-missing-receipts.ts`, `check-receipt-policy.ts`, `check-team-data.ts`, `check-teams.ts`, `fix-spending.ts`, `run-validation-on-existing.ts`
- Trigger: Repository pollution
- Workaround: Scripts can be ignored but clutter workspace
- Fix: Move to `scripts/__dev__/` directory or add to .gitignore

## Security Considerations

**Environment Variable Management:**

- Risk: Multiple environment files with different database configurations create risk of connecting to wrong database
- Files: `.env.local`, `.env.test`, `.env.test.integration`, `.env.IMPORTANT-README.md` (documents accidental wrong database connection incident)
- Current mitigation: Documentation warning about database project confusion (Hockey Directory vs Squadbooks)
- Recommendations: Implement runtime database connection verification. Add database name assertion on startup. Create pre-commit hook to validate environment file configurations.

**Supabase Storage Authorization Bypass:**

- Risk: Storage operations use admin client that bypasses Row Level Security
- Files: `lib/storage.ts` (lines 10-18, 60-67)
- Current mitigation: Comments indicate "Authorization is handled in the API route" but this is fragile
- Recommendations: Implement explicit permission checks before storage operations. Consider using user-scoped tokens instead of service role for file uploads. Audit all storage API routes for proper authorization.

**Clerk Webhook Secret Validation:**

- Risk: Webhook secret fallback to empty string if environment variable missing
- Files: `app/api/webhooks/clerk/route.ts` (line 26)
- Current mitigation: None - will fail silently with empty secret
- Recommendations: Throw error on startup if CLERK_WEBHOOK_SECRET not set. Add environment variable validation layer.

**API Key Exposure Risk:**

- Risk: Multiple API keys referenced without rotation strategy
- Files: `RESEND_API_KEY`, `ANTHROPIC_API_KEY`, `PLAID_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `CLERK_SECRET_KEY`
- Current mitigation: Environment variables not committed to repository
- Recommendations: Implement API key rotation policy. Use secret management service for production. Add key expiry monitoring.

## Performance Bottlenecks

**N+1 Query Pattern in Dashboard:**

- Problem: Dashboard loads teams, then iterates fetching budget allocations and transactions separately
- Files: `app/dashboard/page.tsx` (lines 60-72 show sequential findMany calls)
- Cause: No eager loading or query optimization for related data
- Improvement path: Refactor to single query with Prisma includes/selects. Consider implementing dashboard data aggregation table that pre-computes metrics.

**Transaction Validation on Every Update:**

- Problem: Full validation engine runs synchronously on transaction updates including re-validation
- Files: `lib/db/transactions.ts` (lines 992-1000), validation imports entire validation service
- Cause: Validation engine checks all rules every time, no incremental validation
- Improvement path: Implement change detection to only re-validate affected rules. Move validation to background job queue for large batches. Cache validation results with invalidation strategy.

**Large File Complexity:**

- Problem: Multiple files exceed 1000 lines indicating high complexity
- Files: `lib/email.ts` (1986 lines), `lib/db/transactions.ts` (1139 lines), `app/budget/actions.ts` (1103 lines), `lib/services/coach-compensation.ts` (954 lines)
- Cause: God object pattern with too many responsibilities in single files
- Improvement path: Split email.ts into separate modules per email type. Extract transaction validation logic from transactions.ts. Decompose budget actions into smaller service modules.

**Prisma Transaction Overuse:**

- Problem: Heavy use of explicit transactions for operations that may not require atomicity
- Files: 28 instances of `prisma.$transaction` across codebase including simple CRUD operations
- Cause: Defensive programming but adds connection pool pressure and latency
- Improvement path: Audit all transaction usage. Remove transactions from operations that don't require multi-statement atomicity. Use optimistic locking for concurrent updates instead.

## Fragile Areas

**Receipt Validation Status Flow:**

- Files: `app/association/[associationId]/teams/[teamId]/TeamReceiptOverride.tsx`, `components/exceptions/ExceptionDetailsDrawer.tsx`
- Why fragile: Complex conditional logic for receipt requirements across association policy, category overrides, and team overrides. Receipt status field separate from validation system creates state inconsistency risk.
- Safe modification: Always re-run full validation after any receipt policy change. Test all policy combinations (association enabled/disabled, category thresholds, team overrides). Never manually set receipt_status field without triggering validation.
- Test coverage: Gaps in testing all receipt policy combinations

**Team Season Lifecycle State Machine:**

- Files: `lib/services/team-season-lifecycle.ts` (421 lines), `lib/services/team-season-auto-transitions.ts` (272 lines)
- Why fragile: Complex state transition rules with 8 lifecycle states (PRE_SEASON, BUDGET_DRAFT, BUDGET_REVIEW, etc.). Auto-transition logic can trigger unexpected state changes. Budget approval workflow doesn't always update team season state (see tech debt above).
- Safe modification: Use `transitionTeamSeason()` function for all state changes, never update state field directly. Test state transitions with comprehensive fixtures covering all paths. Verify guards prevent invalid transitions.
- Test coverage: Some transition paths not covered by tests

**Exception Resolution and Re-validation:**

- Files: `components/exceptions/ExceptionDetailsDrawer.tsx` (lines 267-290), `app/api/exceptions/resolve/route.ts`
- Why fragile: Multi-step process that updates transaction fields, resolves violation records, and re-validates. If any step fails, state becomes inconsistent. Transaction updates can create new violations while resolving old ones.
- Safe modification: Always use transaction wrapper for exception resolution. Verify re-validation clears expected violations. Handle case where resolution creates new violations (edge case not currently handled).
- Test coverage: Limited testing of exception resolution edge cases

**Budget Approval Threshold Logic:**

- Files: `lib/budget-workflow/threshold.ts`, `lib/budget-workflow/association-approval.ts`, `app/budget/actions.ts`
- Why fragile: Parent acknowledgment percentage calculated from family count but families can be added/removed. Lock state determined by threshold but manual unlocking allowed. Multiple entry points for budget state changes.
- Safe modification: Always check budget lock state before allowing modifications. Recalculate thresholds when family roster changes. Audit all budget update paths ensure they respect lifecycle state.
- Test coverage: Threshold edge cases (exactly at percentage, rounding) not fully tested

## Scaling Limits

**Prisma Connection Pool:**

- Current capacity: Default connection pool (likely 10-20 connections based on Supabase free tier)
- Limit: With heavy transaction usage and long-running queries, will hit connection exhaustion under 50+ concurrent users
- Scaling path: Configure explicit connection pool limits in Prisma schema. Implement connection pooling proxy (PgBouncer). Optimize long-running queries. Upgrade Supabase tier for larger connection limits.

**File Storage in Supabase:**

- Current capacity: Supabase free tier (1GB storage, limited bandwidth)
- Limit: At 5MB max receipt size, approximately 200 receipts before storage exhaustion. Bandwidth limits will be hit earlier with multiple teams downloading receipts.
- Scaling path: Upgrade Supabase tier. Implement image compression for photo receipts. Archive old season receipts to cold storage. Consider CDN for receipt delivery.

**Client-Side Rendering of Large Transaction Lists:**

- Current capacity: Transaction tables load all data at once with in-memory filtering
- Limit: Teams with >500 transactions will see UI performance degradation. >1000 transactions causes browser lag.
- Scaling path: Implement server-side pagination in transaction API routes. Add virtual scrolling to transaction tables. Pre-aggregate transaction metrics to reduce query sizes.

## Dependencies at Risk

**Next.js 15 - Canary/RC Release:**

- Risk: Running Next.js 15.1.3 which is a recent major version upgrade
- Impact: Breaking changes from Next.js 14 to 15 (App Router changes, React 19 upgrade) may have introduced subtle bugs. Less battle-tested than 14.x LTS.
- Migration plan: Monitor Next.js 15 release notes and upgrade guides. Test thoroughly before upgrading to 15.x patch versions. Consider staying on 15.1.x until 15.2 stabilizes.

**React 19 - Bleeding Edge:**

- Risk: React 19.0.0 just released, ecosystem compatibility issues likely
- Impact: Some third-party component libraries may not support React 19. useFormStatus, useOptimistic, and other new hooks may have undiscovered bugs. Server Components implementation still evolving.
- Migration plan: Audit all third-party components for React 19 compatibility. Watch for React 19.x patch releases. Keep React DevTools updated for debugging.

**Clerk Authentication - Vendor Lock-in:**

- Risk: Tightly coupled to Clerk for all authentication, no abstraction layer
- Impact: Difficult to migrate to alternative auth provider. Clerk pricing increases or service changes affect entire application. Clerk outages block all user access.
- Migration plan: Create auth abstraction layer wrapping Clerk SDK. Implement fallback authentication strategy. Document migration path to alternative providers (Auth0, Supabase Auth).

## Missing Critical Features

**Email Notification System - Partially Implemented:**

- Problem: Email templates exist but notification triggering not connected to workflow state changes
- Blocks: Parents don't receive budget approval notifications, treasurers not notified of association feedback, approval request emails not sent
- Priority: High - critical for production use where in-app notifications insufficient

**Audit Log Failures Not Monitored:**

- Problem: Audit logging wrapped in try-catch that swallows errors silently
- Blocks: Cannot guarantee audit trail completeness for compliance. No alerting when audit system fails.
- Priority: Medium - required for regulatory compliance and forensic analysis

**Background Job Queue:**

- Problem: No job queue system for long-running tasks (bulk validation, report generation, email batches)
- Blocks: Cannot scale transaction imports, season-end processing, or large report generation. Everything runs synchronously blocking API responses.
- Priority: High - will become critical as transaction volume grows

**Multi-Team Association Dashboard:**

- Problem: Association admins have limited consolidated view across teams
- Blocks: Cannot easily monitor compliance across all teams. Financial health rollups require manual aggregation.
- Priority: Medium - affects association administrator effectiveness

## Test Coverage Gaps

**Coach Compensation Limit Enforcement:**

- What's not tested: Edge cases around enforcement mode transitions (WARN_ONLY → BLOCK), exception approval workflows, multi-season cap calculations
- Files: `lib/services/coach-compensation.ts` (954 lines, no corresponding test file found)
- Risk: Critical business logic for association compliance not covered by automated tests
- Priority: High - financial policy enforcement must be reliable

**Plaid Bank Reconciliation:**

- What's not tested: Error handling for Plaid API failures, transaction deduplication edge cases, account linking/unlinking flows
- Files: `lib/plaid/reconcile.ts`, `lib/plaid/exceptions.ts`
- Risk: Bank reconciliation errors could result in duplicate transactions or missing financial data
- Priority: High - financial data integrity critical

**Permission System Authorization:**

- What's not tested: Complex permission scenarios (user switches teams, role changes, association admin overrides)
- Files: `lib/permissions/server-permissions.ts` (331 lines), test file exists but coverage incomplete
- Risk: Authorization bypass could expose sensitive financial data or allow unauthorized modifications
- Priority: Critical - security boundary

**Budget Workflow State Transitions:**

- What's not tested: All state transition paths, concurrent modification scenarios, threshold calculation edge cases
- Files: `app/budget/actions.ts` (1103 lines), `lib/budget-workflow/association-approval.ts` (414 lines)
- Risk: Budget approval workflow is core business process. State corruption could block teams from operating.
- Priority: High - affects all teams using platform

---

_Concerns audit: 2026-01-18_
