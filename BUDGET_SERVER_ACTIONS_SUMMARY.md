# Budget Workflow Server Actions - Implementation Summary

## ✅ Completed Server-Side Implementation

All server-side logic for the budget versioning workflow has been implemented and is ready to use.

---

## Files Created

### 1. **Threshold Logic** (`lib/budget-workflow/threshold.ts`)

**Functions:**

#### `checkThresholdAndLock(budgetId: string)`
- Checks if approval threshold is met for presented version
- Automatically transitions: PRESENTED → LOCKED when threshold met
- Returns approval progress and lock status
- Called after each parent acknowledgement

**Logic:**
```typescript
// COUNT mode: Lock when >= N families approve
// PERCENT mode: Lock when >= X% of eligible families approve

if (thresholdMet) {
  budget.status = LOCKED
  budget.lockedAt = now
  budget.lockedBy = 'SYSTEM'
}
```

#### `getApprovalProgress(budgetId: string)`
- Returns current approval progress for a budget
- Used for UI progress indicators
- Does not trigger locking

#### `updateEligibleFamilyCount(teamId: string, season: string)`
- Updates eligible family count when roster changes
- Recomputes percentage progress
- **Does NOT unlock** if already locked

---

### 2. **Server Actions** (`app/budget/actions.ts`)

All actions are server-side with proper authorization checks.

#### **Treasurer Actions:**

**`createBudget(teamId, season, allocations)`**
- Creates Budget + BudgetVersion v1 + Allocations + ThresholdConfig
- Default threshold: 80% of active families
- Status: DRAFT
- Authorization: TREASURER or ASSISTANT_TREASURER only

**`updateBudgetDraft(budgetId, allocations)`**
- Updates allocations for DRAFT budgets only
- Deletes old allocations, creates new ones
- Updates version totalBudget
- Authorization: Treasurer for same team

**`submitForReview(budgetId)`**
- Transition: DRAFT → REVIEW
- Submits budget to coach for approval
- Authorization: Treasurer only

**`proposeUpdate(budgetId, changeSummary, allocations)`**
- Creates NEW version while budget is PRESENTED
- **Required:** changeSummary (1-2 sentences explaining changes)
- Increments versionNumber
- Sets budget.presentedVersionNumber = new version
- **Resets approvals** (old approvals remain for old version)
- Status stays PRESENTED (for new version)
- Authorization: Treasurer only

**Flow Example:**
```
Version 1 presented → 10 families approve
Treasurer proposes update → Version 2 created
Version 1 approvals preserved but don't count
Parents must re-approve Version 2
```

#### **Coach Actions:**

**`approveBudget(budgetId, versionNumber, userId, approved, notes?)`**
- If `approved = true`: REVIEW → TEAM_APPROVED
- If `approved = false`: REVIEW → DRAFT (request changes)
- Records coach approval timestamp and notes on BudgetVersion
- Authorization: PRESIDENT or BOARD_MEMBER only

#### **Team Actions:**

**`presentToParents(budgetId, versionNumber)`**
- Transition: TEAM_APPROVED → PRESENTED
- Sets budget.presentedVersionNumber
- Verifies version has coach approval
- Authorization: Treasurer or Coach

#### **Parent Actions:**

**`acknowledgeBudget(budgetVersionId, familyId, userId, comment?, hasQuestions?)`**
- Creates BudgetVersionApproval record
- **Idempotent:** Can call multiple times, only creates once per family per version
- Automatically calls `checkThresholdAndLock()`
- If threshold met → Budget auto-locks
- Returns: `{ locked: boolean, progress: ApprovalProgress }`
- Authorization: Parent must belong to the family

---

### 3. **Query Helpers** (`lib/budget-workflow/queries.ts`)

Reusable data fetching functions:

#### `getBudgetWithVersions(budgetId)`
- Returns budget with current and presented versions
- Includes allocations, approvals, threshold config
- Fully typed

#### `getBudgetVersion(budgetId, versionNumber)`
- Returns specific version with all allocations
- Includes approval count and details

#### `getTeamBudgets(teamId)`
- Returns all budgets for a team
- For budget list pages

#### `canEditBudget(budgetId, userId)`
- Permission check: Can user edit this budget?
- True if treasurer AND budget is DRAFT or PRESENTED

#### `canApproveBudget(budgetId, userId)`
- Permission check: Can user approve this budget?
- True if coach/board AND budget is REVIEW

#### `getFamilyApproval(budgetVersionId, familyId)`
- Check if family already approved a version
- For showing "already approved" vs "acknowledge" button

---

## State Transition Matrix

| From            | To              | Trigger                    | Who                |
|-----------------|-----------------|----------------------------|--------------------|
| DRAFT           | REVIEW          | `submitForReview()`        | Treasurer          |
| REVIEW          | TEAM_APPROVED   | `approveBudget(true)`      | Coach              |
| REVIEW          | DRAFT           | `approveBudget(false)`     | Coach              |
| TEAM_APPROVED   | PRESENTED       | `presentToParents()`       | Treasurer or Coach |
| PRESENTED       | PRESENTED*      | `proposeUpdate()`          | Treasurer          |
| PRESENTED       | LOCKED          | `acknowledgeBudget()` + threshold | System (automatic) |

\* Creates new version but stays in PRESENTED state

---

## Authorization Rules

### Treasurers Can:
- ✅ Create budgets
- ✅ Edit budgets in DRAFT
- ✅ Submit for review (DRAFT → REVIEW)
- ✅ Propose updates when PRESENTED (creates new version)
- ✅ Present to parents (TEAM_APPROVED → PRESENTED)

### Coaches Can:
- ✅ Approve budgets (REVIEW → TEAM_APPROVED)
- ✅ Request changes (REVIEW → DRAFT)
- ✅ Present to parents (TEAM_APPROVED → PRESENTED)

### Parents Can:
- ✅ View budget details (read-only)
- ✅ Acknowledge budgets when PRESENTED
- ✅ Submit comments/questions

### System Automatically:
- ✅ Locks budget when threshold met
- ✅ Prevents edits after LOCKED
- ✅ Tracks all approvals per version

---

## Validation & Safety

### ✅ Implemented Protections:

1. **Status Transitions**
   - Only allowed transitions can occur
   - Checked via `canTransition()` function

2. **Locked Budgets**
   - Cannot edit or create new versions
   - Cannot unlock (final state)

3. **Version Integrity**
   - Parents can only approve presented version
   - Old approvals preserved but don't count toward new version
   - Change summary required for v2+

4. **Authorization**
   - Every action checks user role and team membership
   - Parents can only acknowledge for their own family

5. **Idempotency**
   - Parent acknowledgements are idempotent per family per version
   - Safe to call multiple times

6. **Data Integrity**
   - All state changes wrapped in transactions
   - Cascading deletes properly configured

---

## Error Handling

All actions return `BudgetWorkflowResult<T>`:

```typescript
{
  success: boolean
  data?: T
  error?: {
    code: BudgetWorkflowError
    message: string
    details?: Record<string, unknown>
  }
}
```

**Error Codes:**
- `BUDGET_NOT_FOUND`
- `VERSION_NOT_FOUND`
- `INVALID_STATUS_TRANSITION`
- `UNAUTHORIZED`
- `BUDGET_LOCKED`
- `ALREADY_ACKNOWLEDGED`
- `VERSION_MISMATCH`
- `MISSING_CHANGE_SUMMARY`
- `INVALID_ALLOCATIONS`
- `THRESHOLD_NOT_MET`

---

## Example Workflows

### Complete Budget Lifecycle

```typescript
// 1. Treasurer creates budget
await createBudget(teamId, '2025-2026', allocations)
// Status: DRAFT

// 2. Treasurer submits for review
await submitForReview({ budgetId, userId })
// Status: REVIEW

// 3. Coach approves
await approveBudget({
  budgetId,
  versionNumber: 1,
  userId: coachId,
  approved: true,
  notes: 'Looks good!'
})
// Status: TEAM_APPROVED

// 4. Present to parents
await presentToParents({
  budgetId,
  versionNumber: 1,
  userId: treasurerId
})
// Status: PRESENTED
// presentedVersionNumber: 1

// 5. Parents acknowledge (one by one)
await acknowledgeBudget({
  budgetVersionId: version1Id,
  familyId: family1Id,
  userId: parent1Id
})
// Still PRESENTED (threshold not met)

// ... more parents acknowledge ...

// 6. When 80% approve, system auto-locks
await acknowledgeBudget({
  budgetVersionId: version1Id,
  familyId: lastFamilyId,
  userId: lastParentId
})
// Returns: { locked: true, progress: {...} }
// Status: LOCKED ✅
```

### Budget Update After Presentation

```typescript
// Budget is PRESENTED (version 1)
// 10 families have approved

// Treasurer needs to update ice time allocation
await proposeUpdate({
  budgetId,
  userId: treasurerId,
  changeSummary: 'Updated ice time costs due to new arena rates',
  allocations: updatedAllocations
})
// Creates Version 2
// presentedVersionNumber: 2
// Status: still PRESENTED (but for v2 now)
// Previous 10 approvals remain for v1, don't count

// Parents see:
// - "Budget Updated" banner
// - "Version 2" badge
// - Change summary displayed
// - Must re-acknowledge

// Parents re-acknowledge Version 2
// When threshold met → Auto-locks
```

---

## Next Steps (UI Implementation)

### Pending UI Pages:

1. **`/budget/new`** - Budget creation form
2. **`/budget/[id]`** - Budget detail (treasurer view)
3. **`/budget/[id]/review`** - Coach review page
4. **`/budget/[id]/view`** - Parent read-only view

### Pending Components:

1. **`BudgetBuilder.tsx`** - Category allocation editor
2. **`ProposeUpdateModal.tsx`** - Update budget form with change summary
3. **`ApprovalProgress.tsx`** - Progress bar for parent approvals
4. **`VersionBadge.tsx`** - "Version X" display with change summary
5. **`CoachReviewForm.tsx`** - Approve/request changes form
6. **`ParentAcknowledgeButton.tsx`** - Acknowledge & Approve button

---

## Testing Checklist

### Server Actions (Can test via API routes or console):

- [ ] Create budget
- [ ] Update budget draft
- [ ] Submit for review (DRAFT → REVIEW)
- [ ] Coach approve (REVIEW → TEAM_APPROVED)
- [ ] Coach request changes (REVIEW → DRAFT)
- [ ] Present to parents (TEAM_APPROVED → PRESENTED)
- [ ] Parent acknowledge (once per family per version)
- [ ] Threshold checking (COUNT mode)
- [ ] Threshold checking (PERCENT mode)
- [ ] Auto-lock when threshold met
- [ ] Propose update (creates new version)
- [ ] Re-acknowledgement after update
- [ ] Idempotency (parent acknowledges twice)
- [ ] Authorization checks (all roles)
- [ ] Locked budget protections

---

## Current Status

✅ **Schema:** Complete
✅ **Migration:** 204 allocations migrated
✅ **Types:** Complete
✅ **Threshold Logic:** Complete
✅ **Server Actions:** Complete (all 9 actions)
✅ **Query Helpers:** Complete
⏳ **UI Pages:** Pending
⏳ **Components:** Pending
⏳ **E2E Testing:** Pending

**Ready for UI implementation!**
