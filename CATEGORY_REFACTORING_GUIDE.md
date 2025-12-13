# HuddleBooks Budget Category Refactoring Guide

## Overview

This document describes the refactoring of HuddleBooks budget categories to use a **2-layer model**:

1. **Display Categories** - Parent-friendly rollups shown in UI charts
2. **System Categories** - Internal canonical categories used for accounting, approvals, pre-authorization, and benchmarks

## Goals

- ✅ Keep existing display categories as-is for parent friendliness
- ✅ Introduce internal system categories and map each to a display category
- ✅ Ensure budget allocation chart uses expense categories only
- ✅ Add separate "Funding Sources" section for income categories
- ✅ Preserve existing budgets/transactions with safe migration path

## Data Model

### DisplayCategory

Display categories are parent-friendly rollups shown in UI charts.

**Fields:**
- `id` - CUID primary key
- `name` - Display name (e.g., "Ice & Facilities")
- `slug` - URL-friendly slug (e.g., "ice-facilities")
- `sortOrder` - Display order
- `type` - `EXPENSE_ROLLUP` or `INCOME_ROLLUP`
- `color` - Hex color for charts

**Expense Display Categories:**
1. Ice & Facilities (#0EA5E9)
2. Equipment & Uniforms (#8B5CF6)
3. Tournament & League Fees (#F59E0B)
4. Travel & Accommodation (#10B981)
5. Coaching & Officials (#EF4444)
6. Fundraising & Events (#EC4899)
7. Administrative (#64748B)
8. Other (#94A3B8)

### SystemCategory

System categories are the internal canonical categories used for accounting.

**Fields:**
- `id` - CUID primary key
- `name` - Category name (e.g., "Practice Ice", "Game Ice")
- `slug` - URL-friendly slug
- `type` - `EXPENSE` or `INCOME`
- `displayCategoryId` - FK to DisplayCategory (nullable for income)
- `isCommon` - Recommended for most teams
- `isDiscouraged` - For "Other/Misc" categories
- `preauthEligible` - For future pre-authorization routing

**Example System Categories:**

**Ice & Facilities:**
- Practice Ice (common, preauth eligible)
- Game Ice (common, preauth eligible)
- Exhibition/Extra Ice
- Facility Rental (common, preauth eligible)
- Ice Maintenance

**Equipment & Uniforms:**
- Team Jerseys (common)
- Socks/Apparel (common)
- Practice Jerseys (common)
- Pucks/Training Aids (common)
- Team Equipment (common)
- Goalie Equipment
- Equipment Repairs

**Tournament & League Fees:**
- Tournament Entry Fees (common, preauth eligible)
- League/Association Team Fees (common, preauth eligible)
- Exhibition Fees (common)
- League Registration (common, preauth eligible)

**Travel & Accommodation:**
- Hotels/Accommodations (common, preauth eligible)
- Team Meals (common, preauth eligible)
- Transportation (Bus/Fuel/Parking) (common, preauth eligible)
- Travel Insurance

**Coaching & Officials:**
- Skills Coach (common, preauth eligible)
- Goalie Coach (common, preauth eligible)
- Coaching Clinics/Certification
- Referees/Officials (common, preauth eligible)
- Coaching Fees (common, preauth eligible)
- Trainer Fees

**Fundraising & Events:**
- Fundraising Supplies (common)
- Fundraising Platform Fees (common)
- Event Costs (Party/Banquet) (common)
- Team Events (common)
- Awards & Prizes (common)

**Administrative:**
- Bank Fees (common, preauth eligible)
- Cheque Printing
- Accounting/Admin
- Team Insurance (common, preauth eligible)
- Insurance (common, preauth eligible)
- Office Supplies
- Software & Tools
- Marketing & Advertising

**Other:**
- Miscellaneous (discouraged)
- Contingency/Reserve
- Uncategorized (discouraged)

**Income System Categories (no display category):**
- Player/Team Fees (common)
- Registration Fees (common)
- Tryout Fees (common)
- Sponsorships (common)
- Donations (common)
- Fundraising Income (General) (common)
- Fundraising Revenue (common)
- Raffle/50-50 Proceeds (common)
- Grant/Subsidy
- Carry-over from Prior Season
- Apparel Sales
- Other Income

### Updated Models

The following models now reference `SystemCategory` instead of `Category`:

- **BudgetAllocation** - `systemCategoryId` (required)
- **Transaction** - `systemCategoryId` (required)
- **PreSeasonAllocation** - `systemCategoryId` (required)
- **BudgetEnvelope** - `systemCategoryId` (required)

The legacy `Category` model is kept for backward compatibility but is deprecated.

## Migration Steps

### 1. Run Database Migration

```bash
# Generate Prisma client with new schema
npx prisma generate

# Apply migration to create new tables
npx prisma migrate deploy
```

### 2. Seed Display and System Categories

```bash
# Populate DisplayCategory and SystemCategory tables
npx tsx scripts/seed-2layer-categories.ts
```

This will create:
- 8 expense display categories
- ~50+ expense system categories
- ~12 income system categories

### 3. Migrate Existing Data

```bash
# Map existing Category records to SystemCategory
# Updates BudgetAllocation, Transaction, PreSeasonAllocation, BudgetEnvelope
npx tsx scripts/migrate-to-2layer-categories.ts
```

This script:
- Maps legacy categories to system categories based on name
- Updates all foreign key references
- Falls back to "Miscellaneous" (expense) or "Other Income" (income) for unmatched categories
- Reports which categories were auto-mapped

### 4. Update Application Code

#### Budget Aggregation

**Before:**
```typescript
// Grouped by Category.heading
const allocations = await prisma.budgetAllocation.findMany({
  include: { category: true },
});
```

**After:**
```typescript
import {
  getExpenseAllocationsByDisplayCategory,
  getIncomeBySystemCategory,
  getBudgetSummary,
} from '@/lib/budget/category-aggregation';

// Get expense allocations grouped by display category
const expenseGroups = await getExpenseAllocationsByDisplayCategory({
  budgetVersionId: 'xxx',
});

// Get income by system category
const fundingSources = await getIncomeBySystemCategory({
  budgetVersionId: 'xxx',
});

// Get summary including net position
const summary = await getBudgetSummary({
  teamId: 'xxx',
  budgetVersionId: 'xxx',
});
```

#### UI Components

**Budget Allocation Chart (Expenses Only):**
```typescript
import { BudgetAllocationChart } from '@/components/dashboard/BudgetAllocationChart';

<BudgetAllocationChart
  groups={expenseGroups} // Only expense display categories
  totalBudget={summary.totalBudget}
/>
```

**Funding Sources (Income Only):**
```typescript
import { FundingSourcesSummary } from '@/components/budget/FundingSourcesSummary';

<FundingSourcesSummary
  fundingSources={fundingSources}
  totalIncome={summary.totalIncome}
  totalExpenses={summary.totalSpent}
/>
```

### 5. Verify Migration

1. Check that display categories are created:
   ```sql
   SELECT * FROM display_categories ORDER BY "sortOrder";
   ```

2. Check that system categories are created and linked:
   ```sql
   SELECT sc.name, dc.name as display_category, sc.type
   FROM system_categories sc
   LEFT JOIN display_categories dc ON sc."displayCategoryId" = dc.id
   ORDER BY sc.type, dc."sortOrder", sc.name;
   ```

3. Verify budget allocations are migrated:
   ```sql
   SELECT COUNT(*) FROM budget_allocations WHERE "systemCategoryId" IS NOT NULL;
   ```

4. Verify transactions are migrated:
   ```sql
   SELECT COUNT(*) FROM transactions WHERE "systemCategoryId" IS NOT NULL;
   ```

## UI Behavior Changes

### 1. Budget Allocation by Category (Existing View)

**Before:**
- Showed expense AND income categories mixed together
- "Fundraising & Income" appeared in the allocation chart

**After:**
- Shows ONLY expense categories
- Grouped by display categories (e.g., "Ice & Facilities")
- "Fundraising & Income" removed from this chart

### 2. Funding Sources (New Section)

**New UI element** that shows:
- Income categories by system category name
- Total budgeted vs. received for each source
- Net position = income - expenses
- Breakdown of total income and total expenses

## Benefits

1. **Clearer separation** - Expenses and income are no longer mixed in allocation charts
2. **Better benchmarking** - System categories allow for industry-standard comparisons
3. **Pre-authorization ready** - `preauthEligible` field enables future envelope routing
4. **Parent-friendly UI** - Display categories remain simple and familiar
5. **Detailed accounting** - System categories provide granular tracking
6. **Backward compatible** - Legacy Category model preserved during transition

## Future Enhancements

1. **Remove legacy Category model** - After all code updated to use SystemCategory
2. **Association-level category templates** - Associations can define required system categories
3. **Pre-authorization routing** - Auto-route transactions to envelopes based on systemCategory
4. **Benchmarking** - Compare team spending across standard system categories
5. **Smart categorization** - AI-powered transaction categorization using system categories

## Troubleshooting

### Issue: Migration script reports unmatched categories

**Solution:** Check the `CATEGORY_MAPPING` in `scripts/migrate-to-2layer-categories.ts` and add manual mappings for your custom categories. Re-run the migration script.

### Issue: Budget allocation chart is empty

**Solution:** Ensure you've run both seed and migration scripts. Check that `systemCategory.type = 'EXPENSE'` for allocations.

### Issue: Income not showing in Funding Sources

**Solution:** Verify that income system categories exist with `type = 'INCOME'` and that budget allocations reference them.

## Support

For questions or issues with the category refactoring:
1. Check this guide
2. Review the seed and migration scripts
3. Inspect the database directly to verify data migration
4. Test with a small subset of data first before full migration
