# Team Season Lifecycle Implementation Summary

## Overview

Successfully implemented a complete Team Season Lifecycle state machine for HuddleBooks. This provides server-enforced workflow transitions, role-based UI gating, and comprehensive audit trails for team budget management.

## Implementation Date

2025-12-13

## What Was Implemented

### 1. Core Service Layer ✅

**Files Created:**
- `lib/services/team-season-lifecycle.ts` - Main transition logic with permission guards
- `lib/services/team-season-auto-transitions.ts` - Automatic transitions (PRESENTED→LOCKED, LOCKED→ACTIVE)
- `lib/services/team-policy-snapshot.ts` - Policy snapshot management
- `lib/db/team-season-rollup.ts` - Association-level rollup queries
- `lib/types/team-season.ts` - TypeScript types

**Key Functions:**
```typescript
transitionTeamSeason(teamSeasonId, action, actorUserId, metadata)
getAvailableActions(teamSeasonId, userId)
areTransactionsAllowed(state)
checkAndLockBudget(teamSeasonId, budgetVersionId)
autoActivateOnFirstTransaction(teamId, seasonLabel)
createTeamSeasonWithSnapshot(teamId, associationId, seasonLabel, ...)
```

### 2. Budget Workflow Integration ✅

**File Modified:**
- `app/budget/actions.ts`

**Integrations Added:**
- `submitForReview()` → Calls `transitionTeamSeason(..., 'SUBMIT_BUDGET_FOR_REVIEW', ...)`
- `approveBudget()` → Calls `'APPROVE_BUDGET'` or `'REQUEST_BUDGET_CHANGES'`
- `presentToParents()` → Calls `'PRESENT_BUDGET'`
- `acknowledgeBudget()` → Calls `checkAndLockBudget()` for auto-lock
- `proposeUpdate()` → Calls `'PROPOSE_BUDGET_UPDATE'`

**Helper Function:**
```typescript
async function getOrCreateTeamSeason(teamId: string, season: string)
```
- Auto-creates TeamSeason with policy snapshot if needed
- Gracefully handles teams not connected to associations

### 3. Transaction Lifecycle Checks ✅

**File Modified:**
- `app/api/transactions/route.ts`

**Changes:**
- Added imports for lifecycle services
- Added state check before transaction creation
- Returns 403 with helpful error messages if state doesn't allow transactions
- Calls `autoActivateOnFirstTransaction()` after successful transaction creation
- Blocks transactions in SETUP, BUDGET_DRAFT, BUDGET_REVIEW, TEAM_APPROVED, PRESENTED, ARCHIVED
- Allows transactions in LOCKED, ACTIVE, CLOSEOUT

**Error Messages by State:**
```typescript
{
  SETUP: "Team season is in setup. Complete team setup before creating transactions.",
  BUDGET_DRAFT: "Budget is still in draft. Submit budget for review before creating transactions.",
  BUDGET_REVIEW: "Budget is under review. Wait for budget approval before creating transactions.",
  TEAM_APPROVED: "Budget is approved but not yet presented to parents...",
  PRESENTED: "Waiting for parent approvals. Transactions will be allowed once budget is locked.",
  ARCHIVED: "Season is archived. Transactions cannot be created for archived seasons."
}
```

### 4. UI State-Based Gating ✅

**Files Modified:**
- `app/budget/[id]/page.tsx` - Treasurer budget detail page
- `app/budget/[id]/review/page.tsx` - Coach review page

**Changes:**
- Added queries to get TeamSeason for the budget's team and season
- Call `getAvailableActions(teamSeasonId, userId)` to determine available actions
- Replace hardcoded status checks with action availability checks:
  - `canSubmitForReview = availableActions.includes('SUBMIT_BUDGET_FOR_REVIEW')`
  - `canPresentToParents = availableActions.includes('PRESENT_BUDGET')`
  - `canProposeUpdate = availableActions.includes('PROPOSE_BUDGET_UPDATE')`
  - `canReview = availableActions.includes('APPROVE_BUDGET') || availableActions.includes('REQUEST_BUDGET_CHANGES')`

**Existing Workflow Components (Already Using Integrated Actions):**
- `SubmitForReviewButton.tsx` - Calls `submitForReview()`
- `CoachReviewActions.tsx` - Calls `approveBudget()`
- `PresentToParentsButton.tsx` - Calls `presentToParents()`
- `ProposeUpdateButton.tsx` - Redirects to edit page with propose mode
- `ParentAcknowledgeButton.tsx` - Calls `acknowledgeBudget()`

### 5. API Endpoints ✅

**File Created:**
- `app/api/association/[associationId]/team-seasons/rollup/route.ts`

**Endpoint:**
```
GET /api/association/[associationId]/team-seasons/rollup
```

**Query Parameters:**
- `state` - Filter by TeamSeasonState
- `seasonLabel` - Filter by season
- `needsAttention` - Filter teams needing attention
- `includeStats` - Include statistics summary

**Response:**
```json
{
  "rollup": [
    {
      "teamSeasonId": "...",
      "teamName": "Storm U13 AA",
      "division": "U13",
      "seasonLabel": "2024-2025",
      "state": "PRESENTED",
      "stateUpdatedAt": "2024-12-01T10:00:00Z",
      "approvalsProgress": {
        "approvedCount": 12,
        "eligibleCount": 18,
        "percentApproved": 66.67
      },
      "needsAttention": false,
      "needsAttentionReasons": []
    }
  ],
  "stats": {
    "total": 25,
    "byState": {
      "SETUP": 2,
      "BUDGET_DRAFT": 5,
      ...
    }
  }
}
```

### 6. Migration Scripts ✅

**Files Created:**
- `scripts/migrate-team-seasons.ts` - Create TeamSeason records for existing teams
- `scripts/check-team-seasons.ts` - Check current state of team seasons
- `scripts/test-team-season-workflow.ts` - Interactive workflow testing
- `scripts/reset-team-season-state.ts` - Reset state for testing (WARNING: Testing only)

**Migration Script Features:**
- Dry-run mode with `--dry-run` flag
- Maps existing Budget status to appropriate TeamSeasonState
- Creates policy snapshots for each team season
- Creates initial state change audit logs
- Comprehensive error handling and reporting
- Skips teams not connected to associations

**Usage:**
```bash
# Dry run to see what would happen
npx tsx scripts/migrate-team-seasons.ts --dry-run

# Execute migration
npx tsx scripts/migrate-team-seasons.ts
```

### 7. Testing Documentation ✅

**Files Created:**
- `TEAM_SEASON_TESTING_GUIDE.md` - Comprehensive testing guide

**Test Scenarios Documented:**
1. Happy Path (Full Lifecycle)
2. Budget Update Loop
3. Coach Requests Changes
4. Transaction Lifecycle Checks
5. Permission Checks
6. Association Rollup
7. Automatic Transitions
8. Policy Snapshots

**Testing Scripts:**
- Check team seasons: `npx tsx scripts/check-team-seasons.ts`
- Test workflow: `npx tsx scripts/test-team-season-workflow.ts <team-id>`
- Reset state: `npx tsx scripts/reset-team-season-state.ts <team-id> <season> <state> --force`

### 8. Documentation ✅

**Files Created/Updated:**
- `TEAM_SEASON_LIFECYCLE_IMPLEMENTATION.md` - Complete implementation guide
- `TEAM_SEASON_TESTING_GUIDE.md` - Testing scenarios and procedures
- `TEAM_SEASON_IMPLEMENTATION_SUMMARY.md` - This file

## State Machine

### 9 Canonical States

1. **SETUP** - Initial team setup, no budget yet
2. **BUDGET_DRAFT** - Treasurer creating/editing budget
3. **BUDGET_REVIEW** - Budget submitted to coach for review
4. **TEAM_APPROVED** - Coach approved budget
5. **PRESENTED** - Budget presented to parents for acknowledgement
6. **LOCKED** - Parent threshold met, budget locked
7. **ACTIVE** - Season active, transactions allowed
8. **CLOSEOUT** - Closeout initiated
9. **ARCHIVED** - Season archived (terminal state)

### Allowed Transitions

**Happy Path:**
```
SETUP → BUDGET_DRAFT → BUDGET_REVIEW → TEAM_APPROVED →
PRESENTED → LOCKED → ACTIVE → CLOSEOUT → ARCHIVED
```

**Budget Update Loop:**
```
PRESENTED/LOCKED/ACTIVE → BUDGET_REVIEW → TEAM_APPROVED →
PRESENTED → LOCKED
```

**Rejection Path:**
```
BUDGET_REVIEW → BUDGET_DRAFT (coach requests changes)
```

**Automatic Transitions:**
- PRESENTED → LOCKED (when parent approval threshold met)
- LOCKED → ACTIVE (on first transaction)

### Role-Based Actions

**Treasurer:**
- BUDGET_DRAFT: Submit for Review
- PRESENTED/LOCKED/ACTIVE: Propose Update
- ACTIVE: Initiate Closeout

**Coach:**
- BUDGET_REVIEW: Approve / Request Changes
- TEAM_APPROVED: Present to Parents

**Parent:**
- PRESENTED: Acknowledge/Approve Budget
- LOCKED/ACTIVE/CLOSEOUT/ARCHIVED: Read-only

**System (Automatic):**
- PRESENTED → LOCKED (threshold met)
- LOCKED → ACTIVE (first transaction)

## Hard Rules Enforced

1. ✅ **No editing locked/archived budgets** - Updates must use "Propose Update" to create new BudgetVersion
2. ✅ **Parent acknowledgements only in PRESENTED** - Cannot approve unless state is PRESENTED
3. ✅ **Transactions blocked before LOCKED** - Transactions only allowed in LOCKED, ACTIVE, CLOSEOUT states
4. ✅ **ARCHIVED is terminal** - No outgoing transitions, no financial modifications
5. ✅ **Policy snapshots immutable** - Captured at season creation, never modified

## Data Model

### TeamSeason
```prisma
model TeamSeason {
  id                                String   @id @default(cuid())
  teamId                            String
  associationId                     String   @db.Uuid
  seasonLabel                       String
  seasonStart                       DateTime @db.Date
  seasonEnd                         DateTime @db.Date

  state                             TeamSeasonState @default(SETUP)
  stateUpdatedAt                    DateTime @default(now())

  presentedVersionId                String?
  lockedVersionId                   String?

  activeAt                          DateTime?
  closedAt                          DateTime?
  archivedAt                        DateTime?

  policySnapshotId                  String?
  lastActivityAt                    DateTime?
  eligibleFamiliesCount             Int?
  approvalsCountForPresentedVersion Int?

  team                              Team
  policySnapshot                    TeamPolicySnapshot?
  stateChanges                      TeamSeasonStateChange[]

  @@unique([teamId, seasonLabel])
}
```

### TeamPolicySnapshot
```prisma
model TeamPolicySnapshot {
  id                                        String   @id @default(cuid())
  associationId                             String   @db.Uuid

  budgetWarningPct                          Decimal?
  budgetCriticalPct                         Decimal?

  requireParentReapprovalOnBudgetChange     Boolean?
  parentReapprovalTotalBudgetChangeAmount   Decimal?
  parentReapprovalTotalBudgetChangePercent  Decimal?
  parentReapprovalCategoryChangeAmount      Decimal?
  parentReapprovalCategoryChangePercent     Decimal?

  dualApprovalThreshold                     Decimal?

  rulesSnapshot                             Json?

  createdAt                                 DateTime @default(now())
  teamSeasons                               TeamSeason[]
}
```

### TeamSeasonStateChange
```prisma
model TeamSeasonStateChange {
  id             String           @id @default(cuid())
  teamSeasonId   String

  fromState      TeamSeasonState?
  toState        TeamSeasonState
  action         TeamSeasonAction

  actorUserId    String?
  actorType      String           // TREASURER, COACH, PARENT, SYSTEM

  metadata       Json?
  createdAt      DateTime         @default(now())

  teamSeason     TeamSeason       @relation(...)
}
```

## Key Features

### 1. Server-Enforced Transitions
- All transitions validated by `transitionTeamSeason()`
- Invalid transitions rejected with clear error messages
- Permission checks based on user role

### 2. Automatic Transitions
- Parent threshold → Auto-lock budget
- First transaction → Auto-activate season
- No manual intervention required

### 3. Audit Trail
- Every state change logged in `TeamSeasonStateChange`
- Actor tracking (user or system)
- Metadata for additional context
- Complete history for compliance

### 4. UI Gating
- Buttons shown/hidden based on state + role
- Uses `getAvailableActions()` for dynamic rendering
- Prevents unauthorized actions

### 5. Transaction Controls
- Blocks transactions before budget is locked
- Helpful error messages by state
- Auto-activation on first transaction

### 6. Policy Snapshots
- Captured at season creation
- Immutable for season duration
- Association can change policies without affecting existing seasons

### 7. Association Rollup
- Single API endpoint for all team states
- Filtering by state, season, needs attention
- Statistics for dashboard views

## Migration Strategy

1. **Run dry-run** to see what will be created:
   ```bash
   npx tsx scripts/migrate-team-seasons.ts --dry-run
   ```

2. **Review output** and verify mappings are correct

3. **Execute migration**:
   ```bash
   npx tsx scripts/migrate-team-seasons.ts
   ```

4. **Verify results**:
   ```bash
   npx tsx scripts/check-team-seasons.ts
   ```

5. **Test workflows** with existing teams

## Next Steps

### Immediate
- [ ] Run migration on development database
- [ ] Execute test scenarios from testing guide
- [ ] Verify all 8 test scenarios pass

### Short Term
- [ ] Deploy to staging environment
- [ ] Run migration on staging data
- [ ] User acceptance testing

### Long Term
- [ ] Update user documentation
- [ ] Train users on new workflow
- [ ] Monitor audit logs after deployment
- [ ] Add dashboard widgets for association rollup

## Files Summary

### Core Implementation
- `lib/services/team-season-lifecycle.ts` - 450 lines
- `lib/services/team-season-auto-transitions.ts` - 150 lines
- `lib/services/team-policy-snapshot.ts` - 165 lines
- `lib/db/team-season-rollup.ts` - 210 lines
- `lib/types/team-season.ts` - 50 lines

### Integration
- `app/budget/actions.ts` - Modified (added lifecycle transitions)
- `app/api/transactions/route.ts` - Modified (added lifecycle checks)
- `app/budget/[id]/page.tsx` - Modified (added state-based gating)
- `app/budget/[id]/review/page.tsx` - Modified (added state-based gating)
- `app/api/association/[associationId]/team-seasons/rollup/route.ts` - 68 lines

### Migration & Testing
- `scripts/migrate-team-seasons.ts` - 215 lines
- `scripts/check-team-seasons.ts` - 145 lines
- `scripts/test-team-season-workflow.ts` - 230 lines
- `scripts/reset-team-season-state.ts` - 160 lines

### Documentation
- `TEAM_SEASON_LIFECYCLE_IMPLEMENTATION.md` - Complete guide
- `TEAM_SEASON_TESTING_GUIDE.md` - Testing procedures
- `TEAM_SEASON_IMPLEMENTATION_SUMMARY.md` - This file

**Total Lines of Code**: ~2,300 lines (implementation + scripts + docs)

## Success Criteria Met

- ✅ 9 canonical states implemented
- ✅ Server-enforced transitions with guards
- ✅ Role-based permission checks
- ✅ UI gating based on state + role
- ✅ Transaction lifecycle controls
- ✅ Automatic transitions (threshold and first transaction)
- ✅ Policy snapshots immutable
- ✅ Audit trail for all state changes
- ✅ Association rollup API
- ✅ Migration script for existing teams
- ✅ Testing utilities and documentation
- ✅ NO workflow engine infrastructure (straightforward enum + guards)

## Contact / Support

For questions or issues:
- Check audit logs in `team_season_state_changes` table
- Review transition guards in `team-season-lifecycle.ts`
- Verify permissions in service layer
- Consult state machine diagram in project docs
- Review testing guide for troubleshooting steps

---

**Implementation Status**: ✅ COMPLETE

**Ready for**: Testing and deployment to staging
