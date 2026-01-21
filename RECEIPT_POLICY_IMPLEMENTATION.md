# Receipt Policy Governance Implementation

## Status: Phase 1 Complete (Data Layer & Validation Logic)

---

## Business Rules Implemented

### 1. Association-Level Policy (Primary Source)

- ✅ Receipt policies set at ASSOCIATION level
- ✅ Associations may enable category-based receipt thresholds
- ✅ One association policy applies to all teams (no per-team policies from association)

### 2. Team Override (Strictness Only)

- ✅ Teams may ONLY make global receipt threshold stricter (lower $)
- ✅ Teams CANNOT set per-category thresholds
- ✅ Teams CANNOT create exemptions

### 3. Exception Handling

- ✅ Grace period implemented - transactions get INFO violation during grace period
- ✅ After grace period: EXCEPTION status with required resolution notes
- ⏳ Manual override system (audit trail) - To be implemented in UI

---

## Phase 1: Data Layer & Core Logic ✅

### A. Database Schema (Supabase)

**Migration: `20250118000002_add_association_receipt_policies.sql`**

```sql
ALTER TABLE associations ADD COLUMN:
  - receipts_enabled BOOLEAN DEFAULT true
  - receipt_global_threshold_cents INTEGER DEFAULT 10000
  - receipt_grace_period_days INTEGER DEFAULT 7
  - receipt_category_thresholds_enabled BOOLEAN DEFAULT false
  - receipt_category_overrides JSONB DEFAULT '{}'::jsonb
  - allowed_team_threshold_override BOOLEAN DEFAULT false
```

**Migration: `20250118000003_add_team_receipt_override.sql`**

```sql
ALTER TABLE team_settings ADD COLUMN:
  - receipt_global_threshold_override_cents INTEGER

CONSTRAINT: Must be NULL or >= 0
```

### B. Prisma Schema ✅

- Updated `Association` model with 6 new receipt policy fields
- Updated `TeamSettings` model with `receiptGlobalThresholdOverrideCents`
- Fields properly mapped with snake_case database column names

### C. Core Services ✅

**File: `lib/services/receipt-policy.ts`**

- `calculateReceiptRequirement()` - Calculates effective threshold
  - Respects disabled receipts globally
  - Handles category exemptions
  - Applies team override (stricter only via MIN function)
  - Applies category-specific thresholds
- `isWithinGracePeriod()` - Grace period calculation
- `getReceiptStatus()` - Receipt status determination

**File: `lib/services/validation-engine-v1.ts`** (Updated)

- `validateRequiredReceipt()` - Enhanced with new policy system
  - Grace period logic: INFO violation during grace period
  - ERROR violation after grace period expires
  - Backward compatible with legacy association rules

### D. Types ✅

**File: `lib/types/validation.ts`** (Updated)

- Added `receiptPolicy?` field to `ValidationContext`
- Includes all policy configuration fields

---

## Phase 2: API Layer (TODO)

### A. Association Receipt Policy API ⏳

**Endpoint: `PUT /api/association/[associationId]/receipt-policy`**

- Required permissions: `association_admin`
- Validates threshold values
- Rejects per-team category policies
- Returns: Updated association with receipt policy

**Validation Rules:**

- `receiptGlobalThresholdCents` >= 0
- `receiptGracePeriodDays` >= 0
- `receiptCategoryOverrides` must be valid JSONB with categoryId keys
- Each override must have `thresholdCents?: number` or `exempt?: boolean`

### B. Team Receipt Override API ⏳

**Endpoint: `PUT /api/teams/[teamId]/receipt-override`**

- Required permissions: `team_treasurer` or `team_admin`
- Validates override is stricter (lower) than association threshold
- Checks if association allows team overrides
- Returns: Updated team settings

**Validation Rules:**

- Check `association.allowedTeamThresholdOverride === true`
- Verify `override <= association.receiptGlobalThresholdCents`
- Reject if attempting to set category-specific rules

---

## Phase 3: UI Layer (TODO)

### A. Association Settings Page ⏳

**Component: `app/association/[id]/settings/receipts/page.tsx`**

**Sections:**

1. **Global Receipt Policy**
   - Toggle: Enable receipt policy
   - Input: Receipt required for expenses ≥ $X (in dollars, converts to cents)
   - Input: Grace period (days)

2. **Team Overrides**
   - Toggle: Allow teams to require receipts at lower threshold
   - Help text: "Teams can only make requirements stricter"

3. **Category-Specific Thresholds**
   - Toggle: Enable category-specific thresholds
   - Table: Category | Exempt | Threshold
     - Shows all categories
     - Checkbox for exempt
     - Input for custom threshold (optional)
   - Help text: "Category thresholds apply to all teams"

**UI Enforcement:**

- Disable category table if toggle is off
- Show warning when enabling category thresholds
- Confirm dialog before saving changes

### B. Team Settings Page ✅

**Component: `app/association/[associationId]/teams/[teamId]/TeamReceiptOverride.tsx`**

**Integration:** Add `<TeamReceiptOverride teamId={teamId} />` to the team detail page.
Suggested location: As a new card section alongside budget overview or alerts.

**Sections:**

1. **Association Policy (Read-Only)**
   - Display current association threshold
   - Display grace period
   - Display if category overrides are enabled

2. **Team Override (Conditional)**
   - Only shown if `association.allowedTeamThresholdOverride === true`
   - Input: Team receipt threshold
   - Validation: Must be <= association threshold
   - Validation: Must be > 0
   - Help text: "Your threshold must be equal to or stricter than the association threshold of $X"

**UI Enforcement:**

- Hide override section if not allowed
- Client-side validation before submission
- Show error if override is higher than association
- No UI for category rules (not allowed for teams)

---

## Phase 4: Testing (TODO)

### A. Unit Tests ⏳

**File: `lib/services/__tests__/receipt-policy.test.ts`**

Test cases:

- ✅ Receipts disabled globally → receipt optional
- ✅ Category exempt → receipt optional
- ✅ Team override lower (stricter) → team override applies
- ✅ Team override higher (looser) → rejected/ignored
- ✅ Category threshold set → category threshold applies
- ✅ Grace period logic:
  - Within grace → INFO violation
  - After grace → ERROR violation
- ✅ Multiple rules interaction

### B. Integration Tests ⏳

**File: `lib/services/__tests__/validation-engine-integration.test.ts`**

Test cases:

- Receipt upload triggers revalidation
- INFO violation converts to ERROR after grace period
- EXCEPTION converts to VALIDATED when receipt added
- Validation respects category exemptions
- Team override properly enforced

---

## Phase 5: Code Migration (TODO)

### Files to Update ⏳

1. **`lib/db/transactions.ts:142`**
   - Remove hard-coded `teamSettings.receiptRequiredThreshold` reference
   - Use new `receiptPolicy` from association

2. **`lib/services/validate-imported-transactions.ts:93`**
   - Update to use new receipt policy system
   - Pass `receiptPolicy` to validation context

3. **`scripts/backfill-transaction-validation.ts:166`**
   - Update backfill script to use new policy
   - Migrate old threshold references

4. **`lib/constants/validation.ts`**
   - Remove `MANDATORY_RECEIPT_THRESHOLD = $250`
   - Update documentation to reference association policy

---

## Implementation Summary

### ✅ Completed (Phases 1-3, 5)

**Phase 1: Data Layer & Core Logic**

- ✅ Supabase migrations (1 file - association receipt policies)
- ✅ Prisma schema updates
- ✅ Receipt policy calculation service (`lib/services/receipt-policy.ts`)
- ✅ Validation engine updates with grace period
- ✅ Type definitions

**Phase 2: API Layer**

- ✅ Association admin permission function (`lib/auth/permissions.ts`)
- ✅ Zod validation schemas (`lib/validations/receipt-policy.ts`)
- ✅ Association receipt policy API (`/api/association/[associationId]/receipt-policy`)
- ✅ Team receipt override API (`/api/teams/[teamId]/receipt-override`)

**Phase 3: UI Layer**

- ✅ Receipt policy form component for association settings
- ✅ Receipt override component for team page (integration pending)

**Phase 5: Code Migration**

- ✅ Updated `lib/db/transactions.ts` to use new receipt policy
- ✅ Updated `lib/services/validate-imported-transactions.ts`

### 📋 Remaining

**Phase 3: UI Integration**

- Add `<TeamReceiptOverride teamId={teamId} />` to team detail page

**Phase 4: Testing (Optional)**

- Unit tests for receipt-policy.ts
- Integration tests for validation engine
- API endpoint tests
- UI component tests

**Phase 5: Additional Migration**

- Update `scripts/backfill-transaction-validation.ts` (if needed)
- Remove/deprecate constants in `lib/constants/validation.ts`

---

## Key Design Decisions

1. **Grace Period as INFO Violation**
   - Transactions missing receipts within grace period get INFO severity
   - This allows them to be VALIDATED but flagged for attention
   - After grace period, severity escalates to ERROR → EXCEPTION status

2. **Threshold in Cents**
   - Database stores all thresholds in cents for precision
   - UI displays in dollars for user friendliness
   - Avoids floating-point precision issues

3. **Team Override via MIN Function**
   - `effectiveThreshold = MIN(associationThreshold, teamOverride)`
   - Mathematically impossible for team to be looser
   - Enforced in both calculation logic and API validation

4. **Category Overrides Replace Global**
   - When category threshold is set, it replaces the effective threshold entirely
   - Does NOT apply MIN with global threshold
   - Gives associations full control per category

5. **Backward Compatibility**
   - Validation engine checks for `receiptPolicy` in context
   - Falls back to `associationRules.receiptRequiredOverAmount` if not present
   - Gradual migration path

---

## Next Steps

1. **Create API endpoints** for association and team receipt policy management
2. **Build UI components** for settings pages
3. **Write comprehensive tests** for threshold calculation logic
4. **Update existing code** to use new policy system
5. **Run migration** to populate default values for existing associations
6. **User documentation** on how to configure receipt policies

---

## Files Changed

### Created (Phase 1 - Data Layer)

- `supabase/migrations/20250118000002_add_association_receipt_policies.sql`
- `lib/services/receipt-policy.ts` (core business logic)

### Created (Phase 2 - API Layer)

- `lib/validations/receipt-policy.ts` (Zod schemas)
- `app/api/association/[associationId]/receipt-policy/route.ts` (association API)
- `app/api/teams/[teamId]/receipt-override/route.ts` (team API)

### Created (Phase 3 - UI Layer)

- `app/association/[associationId]/settings/components/ReceiptPolicyForm.tsx`
- `app/association/[associationId]/teams/[teamId]/TeamReceiptOverride.tsx`

### Modified (Phase 1 - Data Layer)

- `prisma/schema.prisma` (Association + TeamSettings models)
- `lib/services/validation-engine-v1.ts` (validateRequiredReceipt with grace period)
- `lib/types/validation.ts` (ValidationContext interface)

### Modified (Phase 2 - API Layer)

- `lib/auth/permissions.ts` (added requireAssociationAdmin function)

### Modified (Phase 3 - UI Layer)

- `app/association/[associationId]/settings/page.tsx` (added ReceiptPolicyForm)

### Modified (Phase 5 - Code Migration)

- `lib/db/transactions.ts` (buildValidationContext to use receipt policy)
- `lib/services/validate-imported-transactions.ts` (buildValidationContext to use receipt policy)

---

## Verification Checklist

Before marking complete, verify:

- [ ] All migrations applied successfully
- [ ] Prisma client regenerated
- [ ] No TypeScript errors in modified files
- [ ] All business rules tested
- [ ] API endpoints secure (proper permissions)
- [ ] UI enforces business rules
- [ ] Tests passing
- [ ] Old code references updated
- [ ] Documentation complete
