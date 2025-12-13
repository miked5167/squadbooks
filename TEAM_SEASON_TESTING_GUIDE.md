# Team Season Lifecycle Testing Guide

## Overview

This guide provides comprehensive testing instructions for the Team Season Lifecycle state machine implementation.

## Prerequisites

- Database schema has been updated with TeamSeason, TeamPolicySnapshot, and TeamSeasonStateChange models
- Migration script has been run (if testing with existing teams)
- Test users exist for each role (Treasurer, Coach, Parent)

## Testing Scripts

### 1. Check Team Seasons

View current state of team seasons:

```bash
# View all team seasons
npx tsx scripts/check-team-seasons.ts

# Filter by association
npx tsx scripts/check-team-seasons.ts --association-id=<uuid>

# Filter by state
npx tsx scripts/check-team-seasons.ts --state=PRESENTED
```

### 2. Test Workflow

Set up testing environment and view available actions:

```bash
npx tsx scripts/test-team-season-workflow.ts <team-id> [season-label]
```

This will:
- Create TeamSeason if it doesn't exist
- Show current state
- Display available actions for each role
- Show state change history

### 3. Reset State (Testing Only)

Reset a team season to a specific state for testing:

```bash
npx tsx scripts/reset-team-season-state.ts <team-id> <season-label> <target-state> --force
```

Example:
```bash
npx tsx scripts/reset-team-season-state.ts clt1234567 2024-2025 BUDGET_DRAFT --force
```

**WARNING**: This bypasses normal transition guards. Use only for testing.

## Test Scenarios

### Scenario 1: Happy Path (Full Lifecycle)

**Objective**: Test complete workflow from setup to active season

**Steps**:

1. **SETUP → BUDGET_DRAFT** (Treasurer starts budget)
   - Create or navigate to budget
   - Verify state is BUDGET_DRAFT
   - Verify "Edit Budget" button is visible

2. **BUDGET_DRAFT → BUDGET_REVIEW** (Treasurer submits)
   - Click "Submit for Review"
   - Verify state changes to BUDGET_REVIEW
   - Verify treasurer can no longer edit
   - Verify coach receives notification

3. **BUDGET_REVIEW → TEAM_APPROVED** (Coach approves)
   - Login as coach
   - Navigate to budget review page
   - Click "Approve Budget"
   - Verify state changes to TEAM_APPROVED
   - Verify "Present to Parents" button appears

4. **TEAM_APPROVED → PRESENTED** (Coach presents)
   - Click "Present to Parents"
   - Verify state changes to PRESENTED
   - Verify parent acknowledgement buttons appear
   - Verify parent notification emails sent

5. **PRESENTED → LOCKED** (Parent threshold met)
   - Login as parent(s)
   - Acknowledge budget
   - Continue until threshold met (e.g., 66% of families)
   - Verify state automatically changes to LOCKED
   - Verify budget becomes read-only

6. **LOCKED → ACTIVE** (First transaction)
   - Login as treasurer
   - Create a transaction
   - Verify state automatically changes to ACTIVE
   - Verify transactions are allowed

**Expected Results**:
- All transitions succeed
- Audit log entries created for each transition
- UI buttons show/hide appropriately
- Email notifications sent at appropriate steps

### Scenario 2: Budget Update Loop

**Objective**: Test proposing updates to a presented/locked budget

**Setup**: Start with state = PRESENTED or LOCKED

**Steps**:

1. **PRESENTED → BUDGET_REVIEW** (Treasurer proposes update)
   - Login as treasurer
   - Click "Propose Update"
   - Enter change summary
   - Make budget changes
   - Save new version
   - Verify state changes to BUDGET_REVIEW
   - Verify version number incremented

2. **BUDGET_REVIEW → TEAM_APPROVED** (Coach approves update)
   - Login as coach
   - Review new version
   - Click "Approve Budget"
   - Verify state changes to TEAM_APPROVED

3. **TEAM_APPROVED → PRESENTED** (Present new version)
   - Click "Present to Parents"
   - Verify state changes to PRESENTED
   - Verify previous parent acknowledgements don't count
   - Verify parents notified about new version

4. **PRESENTED → LOCKED** (Parent threshold met again)
   - Parents re-acknowledge new version
   - Verify state changes to LOCKED when threshold met

**Expected Results**:
- Budget versioning works correctly
- Parent acknowledgements reset for new version
- Old acknowledgements preserved but don't count toward new threshold
- Change summary displayed to parents

### Scenario 3: Coach Requests Changes

**Objective**: Test rejection workflow

**Setup**: Start with state = BUDGET_REVIEW

**Steps**:

1. **BUDGET_REVIEW → BUDGET_DRAFT** (Coach requests changes)
   - Login as coach
   - Navigate to budget review page
   - Click "Request Changes"
   - Enter detailed feedback
   - Submit
   - Verify state changes to BUDGET_DRAFT
   - Verify treasurer receives notification with feedback

2. **Make changes and resubmit**
   - Login as treasurer
   - Make requested changes
   - Click "Submit for Review"
   - Verify state changes back to BUDGET_REVIEW

**Expected Results**:
- Transition to BUDGET_DRAFT succeeds
- Coach's notes saved and displayed to treasurer
- Treasurer can edit budget
- Resubmission works correctly

### Scenario 4: Transaction Lifecycle Checks

**Objective**: Verify transactions are blocked in early states

**Steps**:

1. **Test SETUP state**
   - Reset team season to SETUP
   - Try to create transaction via API or UI
   - Verify transaction is blocked
   - Verify error message: "Team season is in setup..."

2. **Test BUDGET_DRAFT state**
   - Reset to BUDGET_DRAFT
   - Try to create transaction
   - Verify transaction is blocked
   - Verify error message: "Budget is still in draft..."

3. **Test BUDGET_REVIEW state**
   - Reset to BUDGET_REVIEW
   - Try to create transaction
   - Verify transaction is blocked
   - Verify error message: "Budget is under review..."

4. **Test PRESENTED state**
   - Reset to PRESENTED
   - Try to create transaction
   - Verify transaction is blocked
   - Verify error message: "Waiting for parent approvals..."

5. **Test LOCKED state**
   - Reset to LOCKED
   - Try to create transaction
   - Verify transaction succeeds
   - Verify state changes to ACTIVE

6. **Test ACTIVE state**
   - Reset to ACTIVE
   - Create transaction
   - Verify transaction succeeds
   - Verify state remains ACTIVE

7. **Test ARCHIVED state**
   - Reset to ARCHIVED
   - Try to create transaction
   - Verify transaction is blocked
   - Verify error message: "Season is archived..."

**Expected Results**:
- Transactions blocked in SETUP, BUDGET_DRAFT, BUDGET_REVIEW, TEAM_APPROVED, PRESENTED, ARCHIVED
- Transactions allowed in LOCKED, ACTIVE, CLOSEOUT
- Auto-activation on first transaction (LOCKED → ACTIVE)
- Appropriate error messages

### Scenario 5: Permission Checks

**Objective**: Verify role-based action permissions

**Steps**:

1. **Treasurer Actions**
   - Login as treasurer
   - In BUDGET_DRAFT: Verify can submit for review
   - In BUDGET_REVIEW: Verify cannot approve (coach only)
   - In PRESENTED: Verify can propose update
   - In ACTIVE: Verify can create transactions

2. **Coach Actions**
   - Login as coach
   - In BUDGET_REVIEW: Verify can approve/request changes
   - In TEAM_APPROVED: Verify can present to parents
   - In BUDGET_DRAFT: Verify cannot submit for review (treasurer only)

3. **Parent Actions**
   - Login as parent
   - In PRESENTED: Verify can acknowledge budget
   - In LOCKED/ACTIVE: Verify budget is read-only
   - Verify cannot edit budget

**Expected Results**:
- Each role sees only appropriate actions
- Permission errors for unauthorized actions
- UI buttons hidden for unavailable actions

### Scenario 6: Association Rollup

**Objective**: Test association-level visibility

**Steps**:

1. **Create multiple team seasons**
   - Create 3+ teams in same association
   - Set them to different states (BUDGET_DRAFT, PRESENTED, ACTIVE)

2. **Query rollup API**
   ```bash
   curl http://localhost:3000/api/association/<association-id>/team-seasons/rollup?includeStats=true
   ```

3. **Verify response includes**:
   - All team seasons for association
   - Current state for each
   - Approval progress for PRESENTED teams
   - Needs attention flags
   - State statistics

4. **Test filters**:
   ```bash
   # Filter by state
   curl http://localhost:3000/api/association/<association-id>/team-seasons/rollup?state=PRESENTED

   # Filter by needs attention
   curl http://localhost:3000/api/association/<association-id>/team-seasons/rollup?needsAttention=true
   ```

**Expected Results**:
- Rollup returns all teams
- Filters work correctly
- Stats calculated accurately
- Needs attention flags set appropriately

### Scenario 7: Automatic Transitions

**Objective**: Test system-triggered transitions

**Steps**:

1. **Auto-lock on parent threshold**
   - Start with PRESENTED state
   - Track approval count
   - Have parents acknowledge until threshold met
   - Verify state changes to LOCKED automatically
   - Verify audit log shows SYSTEM actor

2. **Auto-activate on first transaction**
   - Start with LOCKED state
   - Create first transaction
   - Verify state changes to ACTIVE automatically
   - Create second transaction
   - Verify state remains ACTIVE

**Expected Results**:
- Transitions happen automatically without manual action
- Audit logs show SYSTEM as actor
- Rollup data updated

### Scenario 8: Policy Snapshots

**Objective**: Verify policy snapshots are immutable

**Steps**:

1. **Create team season**
   - Note association's current policies
   - Create team season
   - Verify policy snapshot created

2. **Change association policies**
   - Update DashboardConfig settings
   - Update AssociationRules
   - Verify changes saved

3. **Check team season still uses old policies**
   - Query team season's policy snapshot
   - Verify snapshot has original values
   - Verify new teams get new snapshot

**Expected Results**:
- Policy snapshot frozen at season creation
- Changes to association policies don't affect existing seasons
- New seasons get updated policies

## Automated Testing

### Unit Tests

Create tests for core functions:

```typescript
// Example test structure
describe('Team Season Lifecycle', () => {
  describe('transitionTeamSeason', () => {
    it('should allow BUDGET_DRAFT → BUDGET_REVIEW for treasurer', async () => {
      // Test implementation
    })

    it('should reject BUDGET_DRAFT → LOCKED (invalid transition)', async () => {
      // Test implementation
    })

    it('should reject BUDGET_REVIEW → TEAM_APPROVED for non-coach', async () => {
      // Test implementation
    })
  })

  describe('areTransactionsAllowed', () => {
    it('should allow transactions in LOCKED state', () => {
      expect(areTransactionsAllowed('LOCKED')).toBe(true)
    })

    it('should block transactions in BUDGET_DRAFT state', () => {
      expect(areTransactionsAllowed('BUDGET_DRAFT')).toBe(false)
    })
  })

  describe('getAvailableActions', () => {
    it('should return correct actions for treasurer in BUDGET_DRAFT', async () => {
      // Test implementation
    })
  })
})
```

### Integration Tests

Test end-to-end workflows:

```typescript
describe('Budget Workflow Integration', () => {
  it('should complete happy path from SETUP to ACTIVE', async () => {
    // Create team season
    // Transition through each state
    // Verify final state is ACTIVE
  })

  it('should handle budget update loop', async () => {
    // Start with PRESENTED
    // Propose update
    // Approve
    // Present
    // Verify LOCKED
  })
})
```

## Troubleshooting

### Common Issues

**Issue**: Transition fails with "Invalid transition"
- **Check**: Current state and available transitions in `team-season-lifecycle.ts`
- **Fix**: Verify state is correct and transition is allowed

**Issue**: Button doesn't appear in UI
- **Check**: `getAvailableActions()` returns expected action
- **Fix**: Verify user role and team season state

**Issue**: Transaction blocked unexpectedly
- **Check**: Team season state
- **Fix**: Ensure state is LOCKED, ACTIVE, or CLOSEOUT

**Issue**: Auto-transition doesn't happen
- **Check**: `checkAndLockBudget()` or `autoActivateOnFirstTransaction()` being called
- **Fix**: Verify integration in budget actions and transaction API

### Debug Queries

```sql
-- Check current state
SELECT ts.*, t.name as team_name
FROM team_seasons ts
JOIN teams t ON t.id = ts.team_id
WHERE ts.season_label = '2024-2025';

-- Check state change history
SELECT * FROM team_season_state_changes
WHERE team_season_id = '<team-season-id>'
ORDER BY created_at DESC;

-- Check approval progress
SELECT COUNT(*) as approvals, ts.eligible_families_count
FROM budget_parent_acknowledgements bpa
JOIN team_seasons ts ON ts.presented_version_id = bpa.budget_version_id
WHERE ts.id = '<team-season-id>';
```

## Success Criteria

- [ ] All 8 test scenarios pass
- [ ] No unauthorized transitions allowed
- [ ] UI correctly shows/hides buttons by role and state
- [ ] Transactions blocked before LOCKED state
- [ ] Auto-transitions work (PRESENTED→LOCKED, LOCKED→ACTIVE)
- [ ] Policy snapshots are immutable
- [ ] Audit trail complete for all transitions
- [ ] Association rollup API returns correct data
- [ ] Email notifications sent at appropriate steps

## Next Steps

After testing is complete:

1. Deploy to staging environment
2. Run migration script on production data (dry-run first)
3. Update user documentation
4. Train users on new workflow
5. Monitor audit logs after deployment
