# Team Setup & Budget Approval - Complete Walkthrough

## Overview
This walkthrough covers the complete end-to-end flow for setting up a team and managing budget approvals through the Squadbooks system, including the new Association-level Budget Update & Reporting Policy.

---

## ✅ System Status

**Database**: All migrations applied and synced
**Schema**: Budget versioning workflow complete
**UI Components**: All budget components implemented
**Server Actions**: All budget workflow actions implemented
**Association Policies**: Fully configured and ready

---

## Part 1: Association Setup (Optional but Recommended)

### Step 1: Create Association
**URL**: `http://localhost:3001/association/onboarding`

**Flow**:
1. **Association Basics** (Step 1)
   - Name: "Greater Toronto Hockey League"
   - Abbreviation: "GTHL"
   - Province/State: "Ontario"
   - Country: "Canada"
   - Currency: "CAD"
   - Season: "2025-2026"

2. **Admin Setup** (Step 2)
   - Admin Name: Your name
   - Admin Email: Your email

3. **Board Members** (Step 3)
   - Add 1-3 board members (optional)
   - Or skip this step

4. **Policies & Permissions** (Step 4) ⭐ NEW FEATURE

   **Alert Thresholds** (recommended defaults):
   - Budget Warning: 80%
   - Budget Critical: 95%
   - Bank Reconciliation Warning: 30 days
   - Bank Reconciliation Critical: 60 days
   - Pending Approvals Warning: 5
   - Pending Approvals Critical: 10
   - Inactivity Warning: 21 days

   **Budget Update & Reporting Policy**:

   **A) Parent Re-approval on Budget Changes**
   - ✅ Enable: Require parent re-approval on budget changes
   - **Triggers** (at least one required):
     - Total Budget Change: 10% (percentage)
     - Category Change: 25% (percentage)
     - ☐ Always require re-approval for ice/facilities changes

   **B) Association Budget Reports**
   - ☐ Disable for now (or enable with frequency)
   - Frequency Options: Monthly, Quarterly, Mid-season & Year-end, Year-end only
   - Due Day: 15 (if monthly/quarterly)

   **Enhanced Report Schedules** (optional):
   - Can configure custom schedules for parents and association
   - Supports recurring (monthly/quarterly/etc.) or specific dates
   - Configure content requirements (budget vs actual, category breakdown, narrative)

5. **Pre-Season Budget Configuration** (Step 5)
   - Can enable/disable pre-season budget requirements
   - Set deadline, number of versions required
   - Auto-approve option

**Result**: Association created with all policies configured

---

## Part 2: Team Treasurer Setup

### Step 1: Team Onboarding
**URL**: `http://localhost:3001/onboarding`

**Onboarding Steps**:

#### Step 1: Team Basics
- **Team Name**: "Storm U13 AA"
- **Team Type**: REPRESENTATIVE
- **Age Division**: U13
- **Competitive Level**: AA
- **Season**: "2025-2026"
- Click **Continue**

#### Step 2: Add Roster
- **Upload Excel**: Use provided template or skip
- **Or Add Families Manually**:
  - Family 1: Smith Family
    - Primary Email: parent1@example.com
    - Player: Johnny Smith, Jersey #12
  - Family 2: Jones Family
    - Primary Email: parent2@example.com
    - Player: Sarah Jones, Jersey #7
  - Family 3: Williams Family
    - Primary Email: parent3@example.com
    - Player: Mike Williams, Jersey #23
- Click **Continue** (or **Skip** if testing without roster)

#### Step 3: Build Budget
**Categories Auto-Created** (2-layer system):
- Ice & Facilities (Ice Time, Arena Fees)
- Equipment & Apparel (Jerseys, Practice Equipment)
- Officials & Fees (Referee Fees, League Fees)
- Team Operations (Travel, Tournaments, etc.)

**Suggested Allocations**:
- Ice Time: $15,000
- Referee Fees: $3,000
- Jerseys: $2,500
- Tournament Fees: $4,500
- League Fees: $2,000
- Travel: $3,000
**Total Budget**: $30,000

Click **Continue**

#### Step 4: Power-Up (Optional)
- **Add Approver**: Invite co-treasurer or president
- **Connect Bank**: Connect via Plaid (optional)
- Click **Continue** or **Skip**

**Result**: Team created with treasurer role assigned

---

## Part 3: Budget Versioning Workflow

### Current Budget Status
After onboarding, initial budget is in **DRAFT** status.

### Treasurer Flow

#### 1. View Budget Dashboard
**URL**: `http://localhost:3001/budget`
**Shows**:
- Budget status badge: "DRAFT"
- KPI cards: Total Budget, Total Spent, Remaining, Health
- Category breakdown with allocations
- Budget allocation chart by category group

#### 2. View Budget Detail
**URL**: `http://localhost:3001/budget/[budgetId]`
**Actions Available**:
- ✏️ **Edit Budget** (DRAFT status only)
- 📤 **Submit for Review** → Sends to coach

**Click**: Submit for Review
**Status**: DRAFT → REVIEW

---

### Coach Flow (if applicable)

#### 3. Review Budget
**URL**: `http://localhost:3001/budget/[budgetId]/review`
**Shows**:
- Budget version details
- Category breakdown
- Total budget summary

**Actions**:
- ✅ **Approve** → REVIEW → TEAM_APPROVED
  - Optional: Add approval notes
- ❌ **Request Changes** → REVIEW → DRAFT
  - Required: Add change notes

**Click**: Approve (with optional notes)
**Status**: REVIEW → TEAM_APPROVED

---

### Present to Parents

#### 4. Present Budget to Parents
**URL**: `http://localhost:3001/budget/[budgetId]`
**Status**: TEAM_APPROVED
**Action**:
- Click **Present to Parents** button
- **Status**: TEAM_APPROVED → PRESENTED
- Budget Version 1 is now "presented"

**What Happens**:
- `presentedVersionNumber` set to 1
- Parents can now view and acknowledge
- Approval threshold tracking begins (e.g., 80% of families)

---

## Part 4: Parent Acknowledgment Flow

### Parent Access

#### 1. Parent Views Budget
**URL**: `http://localhost:3001/budget/[budgetId]/view`
**Parent View Shows**:
- Budget summary with KPI cards
- Category breakdown (read-only)
- Budget allocation chart
- Funding sources (if income tracked)
- **Approval Progress**: "X of Y families acknowledged (Z%)"
- **Threshold Rule**: "Locks at 80% approval"

#### 2. Parent Acknowledges Budget
**Action**: Click **"Acknowledge & Approve Budget"** button
**What Happens**:
- Creates `BudgetVersionApproval` record
- Records IP address and user agent (audit trail)
- Increments approval count
- Checks threshold (e.g., 80% of eligible families)
- **If threshold met**: Auto-locks budget
  - PRESENTED → APPROVED → LOCKED

**After Acknowledgment**:
- ✅ Success message shown
- Green badge: "You've Acknowledged This Budget"
- Timestamp displayed
- Progress bar updates

#### 3. Other Parents Acknowledge
Repeat for each family:
- Family 2 acknowledges (Progress: 2/3 = 67%)
- Family 3 acknowledges (Progress: 3/3 = 100%)
- **Threshold met (80%)** → Budget auto-locks

**Final Status**: LOCKED

---

## Part 5: Budget Update Scenario (Version 2)

### Treasurer Proposes Update

#### Scenario
Ice arena increases rates mid-season. Treasurer needs to update Ice Time budget from $15,000 to $17,000 (13% increase).

**Association Policy Check**:
- Association set: "Require re-approval on 10% total budget change"
- Change: +$2,000 = 6.6% of total budget
- OR Category Change: +$2,000 = 13% of Ice Time category (exceeds 10% threshold)
- **Result**: Parent re-approval REQUIRED

#### 1. Propose Update
**URL**: `http://localhost:3001/budget/[budgetId]`
**Status**: PRESENTED (before locking) or need to unlock if already LOCKED
**Action**:
- Click **"Propose Update"** button
- **Modal Opens**:
  - Shows current allocations (editable)
  - **Required**: Change Summary field
    - Example: "Updated ice time costs based on new arena rates (+$2,000)"
  - Update Ice Time: $15,000 → $17,000
  - Adjust other categories to balance (optional)

**Click**: "Re-present to Parents"

**What Happens**:
- Creates BudgetVersion #2
- New allocations saved
- `presentedVersionNumber` = 2
- **Previous approvals still exist but don't count**
- **New approval count**: 0/3 (reset)
- Status remains: PRESENTED

---

### Parent Re-approval

#### 1. Parent Sees Re-approval Banner
**URL**: `http://localhost:3001/budget/[budgetId]/view`
**Shows**:
```
⚠️ Budget Updated
The budget has been updated since you approved it.
Please review Version 2 and re-approve.

What Changed: Updated ice time costs based on new arena rates (+$2,000)
```

**Version Badge**: "Version 2"
**Progress**: "0 of 3 families approved (0%)"

#### 2. Parents Re-acknowledge
- Family 1 acknowledges Version 2 (Progress: 1/3 = 33%)
- Family 2 acknowledges Version 2 (Progress: 2/3 = 67%)
- Family 3 acknowledges Version 2 (Progress: 3/3 = 100%)
- **Threshold met** → Budget auto-locks

**Final Status**: LOCKED (Version 2)

---

## Part 6: Association Reporting (If Enabled)

### If Association Enabled Budget Reports

#### Association Admin View
**URL**: `http://localhost:3001/association/[associationId]/teams`
**Shows**:
- All teams in association
- Budget compliance status
- Report submission status
- Alerts for teams exceeding thresholds

#### Team Submits Report
Based on frequency set (monthly, quarterly, etc.):
- Treasurer generates budget update report
- Includes: Budget vs Actual, Category Breakdown, Changes
- Submits to association by due date
- Association receives notification

#### Policy Enforcement
If team exceeds re-approval thresholds:
- System flags budget update required
- Association can see which teams need parent re-approval
- Tracks compliance with association policies

---

## Testing Checklist

### ✅ Association Setup
- [ ] Create association with all policies configured
- [ ] Set parent re-approval triggers (10% total, 25% category)
- [ ] Set association budget report frequency (if desired)
- [ ] Configure enhanced report schedules (optional)

### ✅ Team Onboarding
- [ ] Complete team basics (name, type, division, level, season)
- [ ] Add roster with 3+ families
- [ ] Build budget with categories and allocations
- [ ] Complete onboarding

### ✅ Budget Workflow - Version 1
- [ ] Treasurer: Submit for review (DRAFT → REVIEW)
- [ ] Coach: Approve budget (REVIEW → TEAM_APPROVED)
- [ ] Treasurer: Present to parents (TEAM_APPROVED → PRESENTED)
- [ ] Parent 1: Acknowledge budget
- [ ] Parent 2: Acknowledge budget
- [ ] Parent 3: Acknowledge budget (triggers auto-lock)
- [ ] Verify: Budget status = LOCKED

### ✅ Budget Update - Version 2
- [ ] Treasurer: Propose update with change summary
- [ ] Verify: Version number incremented to 2
- [ ] Verify: Previous approvals preserved but don't count
- [ ] Verify: Approval count reset to 0
- [ ] Parent 1: See re-approval banner, re-acknowledge
- [ ] Parent 2: Re-acknowledge Version 2
- [ ] Parent 3: Re-acknowledge Version 2
- [ ] Verify: Budget auto-locks at threshold

### ✅ Association Policy Validation
- [ ] Verify: 10% budget change triggers re-approval requirement
- [ ] Verify: 25% category change triggers re-approval
- [ ] Verify: Ice facility changes trigger re-approval (if enabled)
- [ ] Verify: Association can view team compliance
- [ ] Verify: Reports submitted on schedule (if enabled)

### ✅ Edge Cases
- [ ] Parent tries to acknowledge already acknowledged version (should be idempotent)
- [ ] Treasurer tries to edit locked budget (should be blocked)
- [ ] Parent views budget before it's presented (graceful handling)
- [ ] Roster changes update eligible family count
- [ ] Threshold recalculated correctly after roster changes

---

## Key URLs for Testing

### Association
- Association Onboarding: `http://localhost:3001/association/onboarding`
- Association Settings: `http://localhost:3001/association/[associationId]/settings`
- Team Dashboard: `http://localhost:3001/association/[associationId]/teams`

### Team (Treasurer)
- Team Onboarding: `http://localhost:3001/onboarding`
- Budget List: `http://localhost:3001/budget`
- Budget Detail: `http://localhost:3001/budget/[budgetId]`
- Budget Edit: `http://localhost:3001/budget/[budgetId]/edit`

### Team (Coach)
- Budget Review: `http://localhost:3001/budget/[budgetId]/review`

### Team (Parent)
- Budget View: `http://localhost:3001/budget/[budgetId]/view`
- Dashboard: `http://localhost:3001/dashboard`

---

## Expected Behavior Summary

### Budget Status Flow
```
DRAFT (Treasurer editing)
  ↓ Submit for Review
REVIEW (Coach reviewing)
  ↓ Approve
TEAM_APPROVED (Ready to present)
  ↓ Present to Parents
PRESENTED (Parents approving)
  → Propose Update (creates new version, stays PRESENTED)
  ↓ Threshold Met (automatic)
APPROVED
  ↓ (automatic)
LOCKED (Final, immutable)
```

### Versioning Example
- **V1**: Initial budget, 3 families approve, locked
- **Update needed**: Arena rate increase
- **V2**: Treasurer proposes update, parents re-approve
- Both versions preserved in database
- Only current version counts for approvals

### Association Policy Enforcement
- **Re-approval Triggers**: Any of:
  - Total budget change ≥ 10%
  - Category change ≥ 25%
  - Any ice/facilities change (if enabled)
- **Reports**: Due on schedule (monthly/quarterly)
- **Alerts**: Association sees non-compliant teams

---

## Troubleshooting

### Budget not showing
- Check user role (must be TREASURER, ASSISTANT_TREASURER, PRESIDENT, or BOARD_MEMBER)
- Verify budget belongs to user's team

### Cannot submit for review
- Budget must be in DRAFT status
- Must have at least one allocation

### Cannot acknowledge
- Budget must be in PRESENTED status
- User must belong to a family on roster
- Cannot acknowledge same version twice

### Threshold not triggering
- Check eligible family count
- Verify threshold config (80% default)
- Count mode: Need exact count
- Percent mode: Need percentage of eligible

### Association policies not enforcing
- Verify dashboard config created with association
- Check trigger thresholds are set
- Verify association-team link exists

---

## Next Development Steps (Future Enhancements)

1. **Email Notifications**
   - Budget presented → Email all parents
   - Budget approved → Email treasurer
   - Report due soon → Email treasurer
   - Budget threshold exceeded → Email treasurer & association

2. **Mobile Responsiveness**
   - Optimize budget tables for mobile
   - Improve acknowledgment flow on small screens

3. **Budget Templates**
   - Save budget as template
   - Create new budget from template
   - Association-wide templates

4. **Automated Reminders**
   - Remind parents to acknowledge (deadline approaching)
   - Remind treasurer of association report deadlines
   - Alert when budget thresholds exceeded per policy

5. **Analytics & Insights**
   - Budget variance analysis
   - Benchmarking across teams
   - Historical comparison
   - Spend patterns by category

---

## Notes

- **Database**: All schema changes deployed and synced
- **Server Actions**: Complete implementation in `app/budget/actions.ts`
- **UI Components**: All budget components implemented in `components/budget/`
- **Association Policies**: Stored in `dashboard_config` table, enforced during budget updates
- **Audit Trail**: All approvals tracked with IP, user agent, timestamps

**Ready for Testing!** 🎉
