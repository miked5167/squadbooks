# House League Auto-Approval Feature

## ✅ Implementation Complete

House league teams now automatically skip parent budget approval when presenting budgets. This matches GTHL workflow requirements where house league teams have standardized fees that don't require parent acknowledgment.

---

## 🎯 What Changed

### 1. **Budget Workflow Logic** (`app/budget/actions.ts`)

**Modified Function:** `presentToParents()`

**New Behavior:**
- Checks team type when presenting budget
- **HOUSE_LEAGUE teams:** Automatically transition from TEAM_APPROVED → LOCKED (bypass PRESENTED)
- **REPRESENTATIVE/Other teams:** Normal flow TEAM_APPROVED → PRESENTED (wait for parent approval)

**Code Location:** Lines 772-820 in `app/budget/actions.ts`

```typescript
// HOUSE LEAGUE AUTO-APPROVAL: Skip parent approval for house league teams
const isHouseLeague = budget.team?.teamType === 'HOUSE_LEAGUE'

if (isHouseLeague) {
  // Auto-approve: Skip PRESENTED and go directly to LOCKED
  await prisma.budget.update({
    where: { id: budget.id },
    data: {
      status: BudgetStatus.LOCKED,
      presentedVersionNumber: input.versionNumber,
      lockedAt: new Date(),
      lockedBy: 'SYSTEM',
    },
  })
  // ... lifecycle transitions
}
```

---

### 2. **UI Component Updates** (`components/budget/PresentToParentsButton.tsx`)

**Modified:** Toast success message handling

**New Behavior:**
- Shows **"House league budget auto-approved and locked"** for house league teams
- Shows standard message for competitive teams

**Code Location:** Lines 45-47

```typescript
// House league teams get auto-approved
const successMessage = result.message || 'Budget presented to parents! They can now view and acknowledge it.'
toast.success(successMessage)
```

---

### 3. **Testing Guide Updated** (`BUDGET_TESTING_GUIDE.md`)

**Added:**
- **Scenario 4:** House League Auto-Approval testing steps
- **Testing Checklist:** House league specific test cases
- **Comparison:** Side-by-side house league vs. competitive team workflows

---

## 🔄 Budget Workflow Comparison

### House League Teams (HOUSE_LEAGUE)
```
DRAFT
  ↓ [Submit for Review]
REVIEW
  ↓ [Coach Approves]
TEAM_APPROVED
  ↓ [Present to Parents] ⚡ AUTO-APPROVAL
LOCKED (instantly)
  ↓ [First Transaction]
ACTIVE
```

### Competitive Teams (REPRESENTATIVE, etc.)
```
DRAFT
  ↓ [Submit for Review]
REVIEW
  ↓ [Coach Approves]
TEAM_APPROVED
  ↓ [Present to Parents]
PRESENTED
  ↓ [Parents Acknowledge] (wait for threshold)
APPROVED
  ↓ [Threshold Met - Auto]
LOCKED
  ↓ [First Transaction]
ACTIVE
```

---

## 🧪 Testing Instructions

### Quick Test (5 Minutes)

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Create house league team:**
   ```
   http://localhost:3000/onboarding
   ```
   - Team Name: "Test House League"
   - **Team Type: HOUSE_LEAGUE** ← Critical!
   - Add 5-10 families
   - Create budget: $10,000

3. **Complete workflow:**
   - Submit for review
   - Coach approves
   - Click "Present to Parents"

4. **Verify:**
   - ✅ Success toast: "House league budget auto-approved and locked"
   - ✅ Budget status = LOCKED (not PRESENTED)
   - ✅ No approval progress bar displayed
   - ✅ `lockedBy` = "SYSTEM"

### Full Test Scenario

See **Scenario 4** in `BUDGET_TESTING_GUIDE.md` for complete step-by-step testing instructions.

---

## 📊 Team Type Values

The system supports these team types (defined in `prisma/schema.prisma`):

| Team Type | Parent Approval Required? | Use Case |
|-----------|--------------------------|----------|
| `HOUSE_LEAGUE` | ❌ No (auto-approved) | Recreational, standardized fees |
| `REPRESENTATIVE` | ✅ Yes | Competitive, travel teams |
| `ADULT_RECREATIONAL` | ✅ Yes | Adult leagues |
| `OTHER` | ✅ Yes | Other team types |

**Only `HOUSE_LEAGUE` bypasses parent approval.**

---

## 🔍 Technical Details

### Files Modified

1. **`app/budget/actions.ts`**
   - Added team type check in `presentToParents()`
   - Auto-lock logic for house league teams
   - Team season lifecycle integration

2. **`components/budget/PresentToParentsButton.tsx`**
   - Updated toast message handling
   - Shows different success message for house league

3. **`BUDGET_TESTING_GUIDE.md`**
   - Added Scenario 4 for house league testing
   - Updated testing checklist
   - Added house league edge cases

### Database Fields Used

**Budget Table:**
- `status`: BudgetStatus enum (DRAFT, REVIEW, TEAM_APPROVED, PRESENTED, LOCKED, ACTIVE)
- `lockedAt`: Timestamp when budget was locked
- `lockedBy`: User ID or "SYSTEM" for auto-locked budgets

**Team Table:**
- `teamType`: TeamType enum (HOUSE_LEAGUE, REPRESENTATIVE, etc.)

### Key Decision Points

**Why auto-lock instead of auto-approve?**
- House league budgets skip the PRESENTED state entirely
- They go straight to LOCKED, which is the final approved state
- This prevents any accidental parent acknowledgment requests

**Why set lockedBy = "SYSTEM"?**
- Indicates automatic system action vs. manual treasurer action
- Provides audit trail for who/what locked the budget
- Helps debug and track budget lifecycle

**What about budget updates?**
- House league budget updates (Version 2, 3, etc.) also auto-approve
- Same logic applies: TEAM_APPROVED → LOCKED (skip PRESENTED)
- Parents don't need to re-acknowledge house league updates

---

## ✨ Benefits

1. **Reduced Administrative Burden**
   - No need to wait for parent acknowledgments
   - Faster budget finalization for house league teams

2. **GTHL Compliance**
   - Matches GTHL workflow requirements
   - House league teams have standardized fees

3. **Clear Distinction**
   - System automatically handles different team types
   - No manual intervention required

4. **Audit Trail**
   - `lockedBy: "SYSTEM"` clearly shows auto-approval
   - Timestamps provide full history

---

## 🚀 Next Steps

1. **Test the implementation:**
   - Follow Scenario 4 in `BUDGET_TESTING_GUIDE.md`
   - Create both house league and competitive teams
   - Compare the workflows side-by-side

2. **Verify budget updates:**
   - Test proposing updates to house league budgets
   - Confirm they also auto-approve (no parent re-acknowledgment)

3. **Check edge cases:**
   - Team type changes mid-season
   - Budget updates while in LOCKED state
   - Multiple version cycles

---

## 📝 Notes

- The existing TypeScript errors in the codebase are **unrelated** to this implementation (they're in association report routes)
- House league logic is **isolated** to the budget workflow actions
- No database migration required (uses existing `teamType` field)
- Backwards compatible (existing budgets not affected)

---

## ❓ Questions or Issues?

If you encounter any issues:
1. Check the team type is set to `HOUSE_LEAGUE`
2. Verify coach has approved the budget (status = TEAM_APPROVED)
3. Check browser console for errors
4. Review the success toast message

**Expected Success Message:**
> "House league budget auto-approved and locked"

**Expected Budget Status:**
> LOCKED (not PRESENTED)

---

**Implementation Date:** December 15, 2025
**Feature Status:** ✅ Complete and Ready for Testing
