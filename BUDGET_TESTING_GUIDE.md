# Budget Testing Guide
**Last Updated:** December 15, 2025

Your budget testing environment is now set up! This guide explains how to test the budget features you recently implemented: budget versioning & updates, parent transparency features, and association-level policies.

---

## 🎯 Quick Start Summary

**Pre-Season Budgets Created:** 6 budgets in various states
**Active Team Budgets:** 10 teams with version 1 budgets in DRAFT status
**Demo User:** `user_demo_coach_preseason`
**Dev Mode:** ✅ Enabled (`NEXT_PUBLIC_DEV_MODE=true`)

---

## 📊 Pre-Season Budgets (For Parent Transparency Testing)

Six pre-season budgets have been seeded with realistic data:

### 1. Thunder U15 AA - **DRAFT**
- **Status:** DRAFT (Coach still editing)
- **Total:** $28,000
- **Public Link:** `http://localhost:3000/public-budget/draft-e6Yqq2w-MV`
- **Use for:** Testing draft creation and editing

### 2. Lightning U13 A - **SUBMITTED**
- **Status:** SUBMITTED (Ready for association review)
- **Total:** $22,000
- **Public Link:** `http://localhost:3000/public-budget/submitted-bdEg6Z4sm_`
- **Use for:** Testing submission workflow

### 3. Storm U11 Select - **APPROVED** ⭐
- **Status:** APPROVED (Ready for parent interest)
- **Total:** $15,000
- **Public Link:** `http://localhost:3000/public-budget/storm-u11-select-2025-abc123xyz`
- **Parent Interests:** 8 families registered
- **Use for:** Testing parent interest registration and public budget views

### 4. Hawks U9 Development - **APPROVED** ⭐ (High Interest)
- **Status:** APPROVED
- **Total:** $12,000
- **Public Link:** `http://localhost:3000/public-budget/hawks-u9-dev-2025-xyz789abc`
- **Parent Interests:** 10 families registered
- **Use for:** Testing public budget engagement with high parent participation

### 5. Blaze U17 AAA - **REJECTED**
- **Status:** REJECTED (Association declined)
- **Total:** $45,000
- **Public Link:** `http://localhost:3000/public-budget/rejected-agMWQTVged`
- **Use for:** Testing rejection workflow and feedback

### 6. Wolves U14 BB - **APPROVED** ⭐
- **Status:** APPROVED
- **Total:** $24,500
- **Public Link:** `http://localhost:3000/public-budget/wolves-u14-bb-2025-def456ghi`
- **Parent Interests:** 3 families registered
- **Use for:** Testing approved budgets with moderate interest

---

## 🧪 Testing Scenarios

### Scenario 1: Parent Transparency Features ⭐ **Start Here**

**Objective:** Test public budget views and parent interest registration

#### Steps:
1. **Open a public budget link (no login required):**
   ```
   http://localhost:3000/public-budget/hawks-u9-dev-2025-xyz789abc
   ```

2. **Verify what parents see:**
   - Team name and season
   - Total budget breakdown
   - Per-player cost estimate
   - Budget categories with allocations
   - Visual charts/graphs
   - "Express Interest" button

3. **Test parent interest registration:**
   - Click "Express Interest" button
   - Fill out parent information (name, email, phone)
   - Add player information
   - Submit form
   - Verify confirmation message

4. **View from coach perspective:**
   ```
   http://localhost:3000/dashboard
   ```
   - Navigate to pre-season budgets
   - See parent interest count
   - View list of interested families

5. **Test budget status transitions:**
   - Edit a DRAFT budget (`Thunder U15 AA`)
   - Submit for approval
   - View SUBMITTED status
   - Approve from association view
   - Verify public link activates

---

### Scenario 2: Budget Versioning & Updates

**Objective:** Test budget version creation and parent re-approval workflow

#### Steps:
1. **Set up a test team with budget:**
   ```bash
   # Create a fresh budget for testing
   npx tsx scripts/create-budget-for-team.ts
   ```

2. **Navigate to budget dashboard:**
   ```
   http://localhost:3000/budget
   ```

3. **Submit budget for review (DRAFT → REVIEW):**
   - Click "Submit for Review" button
   - Add submission notes (optional)
   - Verify status changes to REVIEW

4. **Coach approves budget (REVIEW → TEAM_APPROVED):**
   ```
   http://localhost:3000/budget/[budgetId]/review
   ```
   - Review budget details
   - Click "Approve Budget"
   - Verify status changes to TEAM_APPROVED

5. **Present to parents (TEAM_APPROVED → PRESENTED):**
   - Return to budget view
   - Click "Present to Parents"
   - Verify status changes to PRESENTED
   - Check that parent notification emails are queued

6. **Parents acknowledge budget:**
   ```
   http://localhost:3000/budget/[budgetId]/view
   ```
   - View as parent (switch user or use parent account)
   - Review budget breakdown
   - Click "Acknowledge & Approve Budget"
   - Add optional comment
   - Submit acknowledgment

7. **Monitor approval progress:**
   - Refresh budget view
   - Check approval percentage (e.g., "5 of 8 families - 62%")
   - Verify threshold indicator (e.g., "Locks at 80%")

8. **Test budget update (creates Version 2):**
   - While in PRESENTED status, click "Propose Update"
   - Enter change summary: *"Increased ice rental costs by 15% due to arena rate increase"*
   - Modify budget allocations:
     - Ice Rental: $8,000 → $9,200 (+15%)
   - Save changes
   - **Verify:**
     - New Version 2 created
     - Status remains PRESENTED
     - Previous approvals preserved in database
     - Approval progress resets to 0%
     - Parents must re-acknowledge Version 2

9. **Parents re-acknowledge Version 2:**
   - Parents see notification about budget update
   - View shows Version 2 changes
   - Parents acknowledge Version 2
   - Progress tracking starts fresh

10. **Auto-lock when threshold met:**
    - Once 80% of families acknowledge (e.g., 7 of 8 families)
    - Budget automatically transitions: PRESENTED → APPROVED → LOCKED
    - System records `lockedAt` timestamp and `lockedBy: 'SYSTEM'`
    - Budget becomes read-only

11. **First transaction triggers ACTIVE:**
    - Add first transaction (registration fee, ice rental, etc.)
    - Budget automatically transitions: LOCKED → ACTIVE
    - Season officially begins

---

### Scenario 3: Association-Level Policies

**Objective:** Test re-approval thresholds and policy enforcement

#### Prerequisites:
- Association must have policy configured
- Budget must be in PRESENTED or LOCKED status

#### Steps:
1. **Configure association policy:**
   ```
   http://localhost:3000/association/[associationId]/settings
   ```
   - Navigate to "Budget Update Policy"
   - Set thresholds:
     - **Total budget change threshold:** 10%
     - **Category change threshold:** 25%
     - **Require re-approval for ice/facilities changes:** Yes
   - Save policy

2. **Test threshold-based re-approval:**
   - Create budget update that exceeds 10% total change
   - Example: $30,000 → $33,500 (+11.67%)
   - **Verify:** System requires parent re-approval
   - **Verify:** Association sees compliance warning

3. **Test category threshold:**
   - Create budget update with 30% category change
   - Example: Travel & Tournaments: $5,000 → $6,500 (+30%)
   - **Verify:** System flags category violation
   - **Verify:** Parents must re-acknowledge

4. **Test mandatory fields:**
   - Try to update ice rental allocation
   - **Verify:** System always requires re-approval (per policy)
   - **Verify:** Warning message displayed to treasurer

5. **Association compliance dashboard:**
   ```
   http://localhost:3000/association/[associationId]/compliance
   ```
   - View all teams
   - Check policy compliance status
   - See teams with pending re-approvals
   - View policy violation history

---

### Scenario 4: House League Auto-Approval ⚡ **New Feature**

**Objective:** Test automatic budget approval for house league teams (no parent acknowledgment required)

#### Background:
House league teams have standardized fees and do not require parent budget approval. When a house league team budget is presented to parents, it automatically locks without waiting for parent acknowledgments.

#### Steps:
1. **Create a house league team:**
   ```
   http://localhost:3000/onboarding
   ```
   - Team Name: "Timbits House League"
   - **Team Type: HOUSE_LEAGUE** ← Important!
   - Division: U9
   - Season: 2025-2026
   - Add 8-10 families to roster
   - Create budget: $12,000

2. **Submit budget for review:**
   ```
   http://localhost:3000/budget
   ```
   - Click "Submit for Review"
   - **Verify:** Status changes to REVIEW

3. **Coach approves budget:**
   ```
   http://localhost:3000/budget/[budgetId]/review
   ```
   - Review budget allocations
   - Click "Approve Budget"
   - **Verify:** Status changes to TEAM_APPROVED

4. **Present to parents (auto-approval trigger):**
   ```
   http://localhost:3000/budget/[budgetId]
   ```
   - Click "Present to Parents" button
   - Review confirmation dialog
   - Click "Present to Parents"
   - **Verify:**
     - Success message: **"House league budget auto-approved and locked"**
     - Budget status immediately changes to **LOCKED** (skips PRESENTED)
     - No approval progress bar shown
     - Budget is ready for transactions

5. **Confirm locked state:**
   - Refresh page
   - **Verify:**
     - Status badge shows "LOCKED"
     - `lockedBy` = "SYSTEM"
     - `lockedAt` timestamp is set
     - "Present to Parents" button is gone
     - No parent approval progress displayed

6. **Test transaction availability:**
   - Try adding a transaction
   - **Verify:** Transaction can be added immediately (budget is active)

#### Compare with Competitive Team:
Create a second team with **Team Type: REPRESENTATIVE** and follow the same steps.

**Expected Difference:**
- **House League:** TEAM_APPROVED → **LOCKED** (instant)
- **Representative:** TEAM_APPROVED → PRESENTED → (wait for parent approval) → LOCKED

---

## 🔧 Development Tools Available

### API Routes (Require `NEXT_PUBLIC_DEV_MODE=true`)

#### Reset Team to Clean State
```bash
curl -X POST http://localhost:3000/api/dev/reset-team \
  -H "Content-Type: application/json" \
  -d '{"teamId": "YOUR_TEAM_ID"}'
```
Clears all transactions, approvals, alerts, and snapshots. Keeps team structure, players, families.

#### Generate 9 Months of Transaction Data
```bash
curl -X POST http://localhost:3000/api/dev/fast-forward-season \
  -H "Content-Type: application/json" \
  -d '{"teamId": "YOUR_TEAM_ID"}'
```
Creates:
- Registration fees for all players
- Monthly ice rental expenses
- 5 tournament fees
- Weekly referee fees
- Travel expenses (hotels + gas)
- Fundraising income
- Pending transactions for approval testing

**Note:** Team must have a treasurer assigned to use this tool.

#### Load Demo Team Dashboard
```bash
curl -X POST http://localhost:3000/api/dev/load-demo-team
```
Sets cookie to view pre-configured demo team.

### Scripts

#### Create Budget for Team
```bash
npx tsx scripts/create-budget-for-team.ts
```
Creates initial budget for most recent team with realistic category allocations.

#### Test Team Season Workflow
```bash
npx tsx scripts/test-team-season-workflow.ts <team-id> [season]
```
Interactive tool for testing team season state transitions.

#### Check Team Seasons
```bash
npx tsx scripts/check-team-seasons.ts [--association-id=<uuid>] [--state=PRESENTED]
```
View current state of all team seasons with optional filters.

#### Reset Team Season State
```bash
npx tsx scripts/reset-team-season-state.ts <team-id> <season> <target-state> --force
```
Reset team season to specific state for testing (bypasses guards).

---

## 📋 Testing Checklist

### Budget Versioning
- [ ] Create budget in DRAFT
- [ ] Submit for review (DRAFT → REVIEW)
- [ ] Coach approves (REVIEW → TEAM_APPROVED)
- [ ] Present to parents (TEAM_APPROVED → PRESENTED)
- [ ] Parents acknowledge (track progress)
- [ ] Auto-lock at threshold (PRESENTED → LOCKED)
- [ ] Propose update (creates Version 2)
- [ ] Parents re-acknowledge Version 2
- [ ] Verify old approvals preserved but don't count
- [ ] Test multiple version cycles (v1 → v2 → v3)

### Parent Transparency
- [ ] Open public budget link (no auth required)
- [ ] View budget breakdown and charts
- [ ] Submit parent interest form
- [ ] Verify email notifications sent
- [ ] View parent dashboard with budget overview
- [ ] Test budget category breakdown visualization
- [ ] Verify transaction preview for parents
- [ ] Test quick actions for parent tasks

### Association Policies
- [ ] Configure re-approval thresholds (10% total, 25% category)
- [ ] Test budget update that triggers re-approval
- [ ] Test category change threshold
- [ ] Test mandatory ice/facilities field
- [ ] View association compliance dashboard
- [ ] Verify policy violation alerts
- [ ] Test report schedules

### House League Auto-Approval ⚡
- [ ] Create house league team with HOUSE_LEAGUE team type
- [ ] Submit budget for review (DRAFT → REVIEW)
- [ ] Coach approves budget (REVIEW → TEAM_APPROVED)
- [ ] Present to parents (TEAM_APPROVED → LOCKED instantly)
- [ ] Verify success message: "House league budget auto-approved and locked"
- [ ] Confirm no approval progress bar shown
- [ ] Verify lockedBy = "SYSTEM"
- [ ] Test transactions work immediately after auto-lock
- [ ] Compare with REPRESENTATIVE team (should require parent approval)

### Edge Cases
- [ ] Parent tries to acknowledge twice (should be idempotent)
- [ ] Treasurer tries to edit LOCKED budget (should block)
- [ ] Coach tries to approve DRAFT (should require REVIEW status)
- [ ] Roster changes update eligible family count
- [ ] Threshold recalculation after roster changes
- [ ] Budget updates while families are mid-approval
- [ ] Team deletion with budget versions
- [ ] House league budget update creates Version 2 (still auto-approves)

---

## 🗺️ Key URLs Reference

### Public Budget Pages (No Auth Required)
```
http://localhost:3000/public-budget/hawks-u9-dev-2025-xyz789abc
http://localhost:3000/public-budget/storm-u11-select-2025-abc123xyz
http://localhost:3000/public-budget/wolves-u14-bb-2025-def456ghi
```

### Authenticated Pages
```
# Main dashboard (shows budgets and approvals)
http://localhost:3000/dashboard

# Budget list
http://localhost:3000/budget

# Specific budget view
http://localhost:3000/budget/[budgetId]

# Budget review (coach)
http://localhost:3000/budget/[budgetId]/review

# Budget view (parent)
http://localhost:3000/budget/[budgetId]/view

# Approvals dashboard
http://localhost:3000/approvals

# Association settings
http://localhost:3000/association/[associationId]/settings

# Association compliance dashboard
http://localhost:3000/association/[associationId]/compliance
```

### Team Onboarding (Create New Team)
```
http://localhost:3000/onboarding
```
Complete flow: Team basics → Roster → Budget → Optional settings

---

## 🐛 Troubleshooting

### Issue: Public budget link returns 404
**Solution:** Verify budget status is APPROVED. Only approved pre-season budgets have active public links.

### Issue: Cannot generate transactions
**Error:** "Team must have a treasurer to generate transactions"
**Solution:** Assign a treasurer to the team:
```bash
# Use team onboarding or add via dashboard
http://localhost:3000/dashboard → Team Settings → Add Team Member → Role: Treasurer
```

### Issue: Approval threshold not locking automatically
**Check:**
1. Budget status is PRESENTED
2. Threshold config exists (default 80%)
3. Sufficient families have acknowledged
4. Family count is correct (not including inactive families)

### Issue: Budget update doesn't trigger re-approval
**Check:**
1. Association policy is configured
2. Budget change exceeds threshold (10% total or 25% category)
3. Mandatory fields (ice rental) were changed
4. Budget is in correct status (PRESENTED or LOCKED)

### Issue: Parent can't acknowledge budget
**Check:**
1. Family is linked to team roster
2. User has parent role
3. Budget is in PRESENTED status
4. Family hasn't already acknowledged this version

---

## 📖 Related Documentation

- **BUDGET_VERSIONING_WORKFLOW.md** - Complete workflow overview and schema details
- **TEAM_BUDGET_APPROVAL_WALKTHROUGH.md** - Step-by-step approval walkthrough
- **TEAM_SEASON_TESTING_GUIDE.md** - Comprehensive testing scenarios
- **BUDGET_SERVER_ACTIONS_SUMMARY.md** - Server actions and state transitions
- **PRE_SEASON_BUDGET_TESTING.md** - Pre-season budget specific testing

---

## 🎬 Quick Test Run (5 Minutes)

Want to see everything in action quickly? Follow these steps:

1. **Test Parent View (No Login):**
   ```
   http://localhost:3000/public-budget/hawks-u9-dev-2025-xyz789abc
   ```
   - Submit a parent interest form
   - View budget breakdown

2. **Create Budget Through Onboarding:**
   ```
   http://localhost:3000/onboarding
   ```
   - Create team: "Test Titans"
   - Add 5 sample families
   - Build budget: $25,000
   - Complete onboarding

3. **Test Budget Workflow:**
   ```
   http://localhost:3000/budget
   ```
   - Submit for review
   - Approve as coach
   - Present to parents
   - View approval progress

4. **Propose Budget Update:**
   - Click "Propose Update"
   - Change: Ice Rental +20%
   - Submit update
   - Verify Version 2 created

**Done!** You've tested the core budget features in 5 minutes.

---

## ✅ Summary

Your environment is ready to test:
- ✅ **6 pre-season budgets** in various states (DRAFT, SUBMITTED, APPROVED, REJECTED)
- ✅ **10 active team budgets** ready for versioning tests
- ✅ **Public budget pages** accessible without authentication
- ✅ **Dev tools** for generating data and resetting state
- ✅ **Comprehensive testing scripts** for automation

**Next Steps:**
1. Start with Scenario 1 (Parent Transparency) using public links
2. Move to Scenario 2 (Budget Versioning) with onboarding flow
3. Test Scenario 3 (Association Policies) for advanced features

**Need help?** Check the troubleshooting section or refer to the related documentation files.

Happy testing! 🚀
