# Budget Versioning & Approval Workflow Implementation

## Overview

Complete implementation of budget versioning workflow with parent approvals and threshold-based locking.

---

## ✅ Completed

### 1. Database Schema (Prisma)

Created comprehensive schema with:

- **`budgets`** table - Main budget lifecycle tracker
  - Status: DRAFT → REVIEW → TEAM_APPROVED → PRESENTED → APPROVED → LOCKED
  - Tracks current and presented version numbers
  - Locked state with timestamp and user

- **`budget_versions`** table - Version history
  - Each edit creates a new version
  - Version number (1, 2, 3...)
  - Change summary (required for v2+)
  - Coach approval tracking per version

- **`budget_allocations`** table - Category allocations per version
  - References budgetVersionId (not teamId anymore)
  - Preserves all historical allocations

- **`budget_version_approvals`** table - Parent acknowledgements per version
  - One approval per family per version
  - Audit trail (IP, user agent)
  - Optional comments and questions

- **`budget_threshold_configs`** table - Locking thresholds
  - COUNT mode: Lock when >= N families approve
  - PERCENT mode: Lock when >= X% approve
  - Tracks eligible family count

### 2. Data Migration

**Script**: `scripts/migrate-budget-versioning.ts`

**Results**:
- ✅ Migrated 11 budgets successfully
- ✅ Created 11 BudgetVersion v1 records
- ✅ Updated 204 budget allocations
- ✅ Created 11 threshold configs (default: 80% approval)
- ⚠️ 6 teams without users skipped (orphaned test data)

**Safe to re-run** - Script is idempotent.

### 3. Type Definitions

**File**: `lib/types/budget-workflow.ts`

Complete TypeScript types for:
- Budget workflow entities
- State transition inputs
- Approval progress tracking
- Error handling
- UI helpers (status badges, descriptions)

---

## 📋 Next Steps

### 4. Server Actions (Pending)

Need to create **`app/budget/actions.ts`** with:

#### Treasurer Actions:
```typescript
- createBudget(teamId, season, allocations)
- updateBudgetDraft(budgetId, allocations)
- submitForReview(budgetId) // DRAFT → REVIEW
- proposeUpdate(budgetId, changeSummary, allocations) // Creates new version while PRESENTED
- representToParents(budgetId, versionNumber) // After update
```

#### Coach Actions:
```typescript
- approveBudget(budgetVersionId, notes) // REVIEW → TEAM_APPROVED
- requestChanges(budgetVersionId, notes) // REVIEW → DRAFT
```

#### Team Actions:
```typescript
- presentToParents(budgetId, versionNumber) // TEAM_APPROVED → PRESENTED
```

#### Parent Actions:
```typescript
- acknowledgeBudget(versionId, familyId, comment?) // Approval + threshold check
```

#### System Actions:
```typescript
- checkThresholdAndLock(budgetId) // PRESENTED → APPROVED → LOCKED (automatic)
- updateEligibleFamilyCount(teamId) // When roster changes
```

### 5. Treasurer UI (Pending)

**Pages to create/update**:

#### `/budget/new` - Budget Builder
- Template selection or scratch
- Category allocation UI
- Save as DRAFT
- Submit for Review button

#### `/budget/[id]` - Budget Detail
- **DRAFT**: Edit allocations, Submit for Review
- **REVIEW**: "Awaiting coach approval" banner
- **TEAM_APPROVED**: "Present to Parents" button
- **PRESENTED**:
  - Read-only view
  - "Propose Update" button
  - Progress indicator (X of Y families approved)
- **APPROVED/LOCKED**: Read-only with locked badge

#### "Propose Update" Flow
- Modal/page with editable allocations based on presented version
- **Required**: Change Summary field (1-2 sentences)
- "Re-present to Parents" button
- Creates new version, resets approvals for that version

### 6. Coach Review UI (Pending)

**Page**: `/budget/[id]/review` (Coach only)

- Show specific version details
- Category breakdown
- **Actions**:
  - ✅ Approve → TEAM_APPROVED (with optional notes)
  - ❌ Request Changes → DRAFT (with required notes)

### 7. Parent Budget View (Pending)

**Page**: `/budget/[id]/view` (Parent only)

**Display**:
- Version badge: "Version X"
- Last updated timestamp
- Change Summary (if versionNumber > 1)
- Budget breakdown by category
- Approval progress: "X of Y families approved (Z%)"
- Threshold rule: "Locks at 80% approval" or "Locks after 14 families"

**Re-approval Banner** (if parent approved older version):
```
⚠️ Budget Updated
The budget has been updated since you approved it.
Please review Version X and re-approve.
```

**Actions**:
- **Acknowledge & Approve** button (idempotent per family per version)
- Optional: Comment/question field

**After Acknowledgement**:
- Success message
- Updated progress bar
- If threshold met → Budget auto-locks

### 8. Threshold Logic (Pending)

**File**: `lib/budget-workflow/threshold.ts`

```typescript
async function checkAndLockBudget(budgetId: string) {
  // 1. Get budget with presented version and threshold config
  // 2. Count approvals for presented version
  // 3. Check if threshold met:
  //    - COUNT mode: approvedCount >= countThreshold
  //    - PERCENT mode: (approvedCount / eligibleCount) * 100 >= percentThreshold
  // 4. If met:
  //    - Update budget: status = APPROVED, then LOCKED
  //    - Set lockedAt and lockedBy (system)
  // 5. Return whether locked
}
```

**Called by**:
- Parent acknowledgement action (after each approval)
- Manual admin trigger (if needed)

### 9. Roster Change Handling (Pending)

When families are added/removed:
```typescript
async function updateEligibleFamilyCount(teamId: string) {
  // 1. Count active families with active players
  // 2. Update budget_threshold_configs.eligibleFamilyCount
  // 3. DO NOT unlock if already locked
  // 4. Recompute percentage progress for PRESENTED budgets
}
```

---

## Workflow Diagram

```
DRAFT (Treasurer editing)
  ↓ [Submit for Review]
REVIEW (Coach reviewing)
  ↓ [Approve] OR ↓ [Request Changes → DRAFT]
TEAM_APPROVED (Ready to present)
  ↓ [Present to Parents]
PRESENTED (Parents approving)
  → Can "Propose Update" → Creates Version 2 → Back to PRESENTED
  ↓ [Threshold Met - Automatic]
APPROVED
  ↓ [Automatic]
LOCKED (Final, immutable)
```

---

## Versioning Example

### Version 1 (Initial Presentation)
- Presented to parents on Jan 1
- 10 families approve
- Treasurer notices Ice Time category needs update

### Version 2 (After Update)
- Treasurer clicks "Propose Update"
- Edits allocations, enters change summary: "Updated ice time costs based on new arena rates"
- Clicks "Re-present to Parents"
- **Result**:
  - New BudgetVersion created (versionNumber = 2)
  - budget.presentedVersionNumber = 2
  - Previous approvals (for v1) remain in database but don't count
  - Parents must re-approve Version 2
  - Progress resets to 0 of eligible families

### Locking
- When 80% of families approve Version 2
- System automatically: PRESENTED → APPROVED → LOCKED
- No further versions can be created

---

## Safety Rules

✅ **DO**:
- Allow edits in DRAFT and PRESENTED (via "Propose Update")
- Preserve all historical versions and approvals
- Auto-lock when threshold met
- Show clear version badges and change summaries

❌ **DON'T**:
- Allow edits after LOCKED
- Delete old approvals when creating new version
- Unlock budget once LOCKED
- Allow amending commits after coach approval without re-approval

---

## Testing Checklist

### Treasurer Flow
- [ ] Create budget from scratch (DRAFT)
- [ ] Submit for review (DRAFT → REVIEW)
- [ ] Edit while in REVIEW (should be blocked or return to DRAFT)
- [ ] Propose update while PRESENTED
- [ ] Re-present after update

### Coach Flow
- [ ] Approve budget (REVIEW → TEAM_APPROVED)
- [ ] Request changes (REVIEW → DRAFT with notes)
- [ ] Cannot approve DRAFT or PRESENTED budgets

### Team Flow
- [ ] Present to parents (TEAM_APPROVED → PRESENTED)
- [ ] Cannot present if not TEAM_APPROVED

### Parent Flow
- [ ] View budget details
- [ ] Acknowledge once per version (idempotent)
- [ ] See re-approval banner if budget updated
- [ ] View progress toward threshold

### Threshold & Locking
- [ ] COUNT mode: Lock when >= N families approve
- [ ] PERCENT mode: Lock when >= X% approve
- [ ] Auto-lock happens immediately after threshold met
- [ ] Cannot unlock once locked
- [ ] Roster changes update eligible count but don't unlock

---

## File Structure

```
prisma/
  schema.prisma                          ✅ Complete
  migrations/
    budget_versioning_workflow.sql      ✅ Complete

scripts/
  migrate-budget-versioning.ts          ✅ Complete
  check-unmigrated-budgets.ts           ✅ Created

lib/
  types/
    budget-workflow.ts                  ✅ Complete
  budget-workflow/
    threshold.ts                        ⏳ Pending
    transitions.ts                      ⏳ Pending

app/
  budget/
    actions.ts                          ⏳ Pending
    new/
      page.tsx                          ⏳ Pending
    [id]/
      page.tsx                          ⏳ Pending
      review/
        page.tsx                        ⏳ Pending (Coach)
      view/
        page.tsx                        ⏳ Pending (Parent)
    components/
      BudgetBuilder.tsx                 ⏳ Pending
      ProposeUpdateModal.tsx            ⏳ Pending
      ApprovalProgress.tsx              ⏳ Pending
      VersionBadge.tsx                  ⏳ Pending
      CoachReviewForm.tsx               ⏳ Pending
      ParentAcknowledgeButton.tsx       ⏳ Pending
```

---

## Current Status

**Schema**: ✅ Complete and deployed
**Migration**: ✅ 204 allocations migrated successfully
**Types**: ✅ Complete type definitions
**Server Actions**: ✅ All 9 actions implemented
**Query Helpers**: ✅ Complete
**Threshold Logic**: ✅ Auto-locking implemented
**UI**: ⏳ Next to implement
**Testing**: ⏳ Pending

**Next Immediate Step**: Implement UI pages and components

See `BUDGET_SERVER_ACTIONS_SUMMARY.md` for complete server-side implementation details.
