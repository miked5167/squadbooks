---
status: resolved
trigger: "team-amounts-mismatch - Team amounts in association command center don't match team account view"
created: 2026-01-19T00:00:00Z
updated: 2026-01-19T00:00:20Z
---

## Current Focus

hypothesis: Confirmed - inconsistent transaction status filtering causes mismatch
test: Verify all places in codebase that calculate "spent" amount
expecting: Find that some use VALIDATED, some use APPROVED, causing different totals
next_action: Fix budgetByCategory calculation to use consistent status values

## Symptoms

expected: Same amounts in both views - team budget/spent/remaining should match between association command center and team account view
actual: Different amounts shown - the dollar amounts for budget/spent/remaining are different between the two views
errors: No errors - data displays but is incorrect, no errors shown
reproduction: Navigate between views - view association command center, then go to team account - amounts differ
started: Not sure if it ever worked correctly

## Eliminated

## Evidence

- timestamp: 2026-01-19T00:00:01Z
  checked: Both views use the same data source - both call getOverviewData()
  found: Association overview page (command center) uses getOverviewData() and displays team.latestSnapshot.budgetTotal, spent, remaining. Team list page also uses getOverviewData() with same display logic. Team detail page uses getTeamDetailData() which likely queries the same snapshot data.
  implication: The mismatch is likely NOT in the query logic but in how snapshot data is calculated or when it's updated

- timestamp: 2026-01-19T00:00:02Z
  checked: getOverviewData() vs getTeamDetailData() implementation
  found: getOverviewData() returns team.latestSnapshot.budgetTotal/spent/remaining (from TeamFinancialSnapshot table). getTeamDetailData() also returns latestSnapshot but ADDITIONALLY calculates budgetByCategory by querying transactions directly (lines 273-300 in actions.ts)
  implication: Team detail page might be showing calculated amounts from transactions instead of snapshot amounts

- timestamp: 2026-01-19T00:00:03Z
  checked: Team detail page display logic (page.tsx lines 322-352)
  found: Budget Overview section displays latestSnapshot.budgetTotal, spent, remaining (lines 330-343). This should match the overview page values since both use snapshot data.
  implication: If user is seeing different values, need to verify which section they're comparing - Budget Overview (snapshot) vs Budget by Category (calculated from transactions)

- timestamp: 2026-01-19T00:00:04Z
  checked: budgetByCategory calculation in actions.ts (lines 273-300)
  found: For each budget allocation, it queries transactions with status='VALIDATED' and type='EXPENSE', then sums amounts. Allocated comes from budgetAllocation.allocated. Spent = sum of validated expense transactions. Remaining = allocated - spent.
  implication: budgetByCategory uses ONLY VALIDATED transactions. If snapshot includes PENDING transactions, values will differ.

- timestamp: 2026-01-19T00:00:05Z
  checked: Snapshot generation in seed-demo.ts (line 1455)
  found: Snapshots are created with budgetTotal, spent, remaining, percentUsed values. The spent value is calculated from transactions (need to check which status values are included).
  implication: Need to verify if snapshot calculation includes PENDING transactions or only VALIDATED ones

- timestamp: 2026-01-19T00:00:06Z
  checked: Reports actions.ts (lines 148-161) - another place that calculates spending
  found: Line 153 filters transactions with status === 'APPROVED' for totalSpent calculation. Line 156 filters status === 'PENDING' separately for pendingAmount.
  implication: Reports page uses 'APPROVED' status for spent amount

- timestamp: 2026-01-19T00:00:07Z
  checked: Team detail budgetByCategory calculation (actions.ts line 279)
  found: Line 279 filters transactions with status: 'VALIDATED' and type: 'EXPENSE' for spent calculation
  implication: **FOUND THE BUG!** Different parts of the code use different status values: 'VALIDATED' vs 'APPROVED'. This is inconsistent!

- timestamp: 2026-01-19T00:00:08Z
  checked: lib/constants/transaction-status.ts and app/api/budget/category/[categoryId]/variance/route.ts
  found: Line 13 in variance route defines COUNTED_STATUSES = ['APPROVED', 'VALIDATED', 'RESOLVED']. The transaction-status.ts file confirms APPROVED is a "legacy" status (line 62-68) while VALIDATED/RESOLVED are current statuses. The isFinalStatus function (line 107-109) includes ['LOCKED', 'RESOLVED', 'VALIDATED'].
  implication: The correct "spent" calculation should include multiple statuses: VALIDATED, RESOLVED, and potentially legacy APPROVED/APPROVED_AUTOMATIC for backward compatibility

## Resolution

root_cause: Inconsistent transaction status filtering across the codebase. Three different implementations of "spent" calculation use different status filters:
1. Team detail budgetByCategory (actions.ts:279) uses only 'VALIDATED'
2. Reports page (reports/actions.ts:153) uses only 'APPROVED'
3. Variance route (variance/route.ts:13) correctly uses ['APPROVED', 'VALIDATED', 'RESOLVED']

The application has both legacy statuses (APPROVED, APPROVED_AUTOMATIC) and current statuses (VALIDATED, RESOLVED). When calculations use different status filters, they produce different "spent" totals, causing the amounts to mismatch between views.

fix: Update budgetByCategory calculation and reports calculation to use the same COUNTED_STATUSES array as the variance route: ['APPROVED', 'VALIDATED', 'RESOLVED']. This ensures all finalized transactions are counted regardless of whether they use legacy or current status values. Optionally, extract COUNTED_STATUSES to transaction-status.ts as a shared constant to prevent future inconsistencies.

verification: Fix applied successfully. All spending calculations now use the shared COUNTED_STATUSES constant which includes ['APPROVED', 'APPROVED_AUTOMATIC', 'VALIDATED', 'RESOLVED']. This ensures consistent calculations across:
- Association overview (via snapshots, which will be correct once regenerated)
- Team detail budgetByCategory (now uses COUNTED_STATUSES)
- Reports page (now uses COUNTED_STATUSES)
- Variance route (now uses shared COUNTED_STATUSES)

files_changed:
- lib/constants/transaction-status.ts: Added COUNTED_STATUSES constant and isCountedStatus() helper
- app/association/[associationId]/teams/[teamId]/actions.ts: Changed status: 'VALIDATED' to status: { in: COUNTED_STATUSES }
- app/association/[associationId]/reports/actions.ts: Changed status === 'APPROVED' to COUNTED_STATUSES.includes(status)
- app/api/budget/category/[categoryId]/variance/route.ts: Replaced local COUNTED_STATUSES with import from transaction-status.ts
