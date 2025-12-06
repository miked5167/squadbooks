# Pre-Season Budget Builder - Testing Guide

## Overview
The Pre-Season Budget Builder module is now complete with dummy data. This guide will help you test all features.

## Quick Start

1. **Start the dev server** (if not already running):
   ```bash
   npm run dev
   ```

2. **View the server URL** - It should show something like:
   ```
   - Local: http://localhost:3000
   ```

## Testing URLs

### Coach Views (Requires Login)

**Budget List**
- http://localhost:3000/pre-season-budget

This shows all budgets for the logged-in coach:
- Thunder U15 AA (DRAFT)
- Lightning U13 A (SUBMITTED)
- Storm U11 Select (APPROVED)
- Hawks U9 Development (APPROVED - 10 interests!)
- Blaze U17 AAA (REJECTED)
- Wolves U14 BB (APPROVED)

**Individual Budget Details**
Click any budget card to see:
- Complete budget breakdown
- Parent interest submissions
- Actions (submit, approve, activate team)

### Association Admin Views (Requires Admin Role)

**Budget Review Dashboard**
- http://localhost:3000/association/pre-season-budgets

Shows budgets awaiting approval in tabs:
- Pending Review
- Approved
- Rejected

### Public Budget Views (NO LOGIN REQUIRED)

These are the pages parents see when coaches share the budget link:

**Storm U11 Select**
- http://localhost:3000/public-budget/storm-u11-select-2025-abc123xyz
- $1,071 per player
- 8 families already interested

**Hawks U9 Development**
- http://localhost:3000/public-budget/hawks-u9-dev-2025-xyz789abc
- $1,000 per player
- 10 families interested (ready to activate!)

**Wolves U14 BB**
- http://localhost:3000/public-budget/wolves-u14-bb-2025-def456ghi
- $1,531 per player
- 3 families interested

## Features to Test

### 1. Coach Workflow
- ✅ Create new budget with wizard
- ✅ Save as draft
- ✅ Submit for approval
- ✅ View submitted budgets
- ✅ See rejection feedback (Blaze U17 AAA)
- ✅ View parent interests
- ✅ Activate team when ready (Hawks U9 has enough!)

### 2. Association Admin Workflow
- ✅ View pending budgets
- ✅ Review budget details
- ✅ Approve budgets (generates public link)
- ✅ Reject budgets with feedback
- ✅ See parent interest counts

### 3. Public Parent View
- ✅ View complete budget breakdown
- ✅ See per-player cost prominently
- ✅ View all category allocations
- ✅ See social proof (X families interested)
- ✅ Express interest via form
- ✅ Submit without login

### 4. Team Activation
- Hawks U9 Development has 10 interests out of 12 projected (83%)
- Click "Activate Team" button in coach detail view
- This will:
  - Create the team in HuddleBooks
  - Import all budget allocations
  - Send registration emails to interested parents
  - Lock the budget

## Database Seeding

To reset and reseed all test data:

```bash
npm run seed:preseason
```

This will:
- Clean up existing pre-season budget data
- Create 6 budgets in various states
- Add 21 parent interest submissions
- Generate public links for approved budgets

## Troubleshooting

### Public Pages Not Loading

If you're getting errors on public budget pages, check:

1. **Dev server is running on correct port**
   - Check console output for port number
   - Update URLs if running on different port (e.g., 3001)

2. **Database is seeded**
   ```bash
   npm run seed:preseason
   ```

3. **Public slugs are correct**
   ```bash
   npx tsx scripts/get-public-slugs.ts
   ```

4. **Check browser console** for errors:
   - Open DevTools (F12)
   - Look for component or API errors

### Database Issues

If you see Prisma errors:

```bash
npx prisma generate
npx prisma db push
npm run seed:preseason
```

## Next Steps

Once testing is complete, consider:
1. ✅ Email notifications when budgets are approved/rejected
2. ✅ Unit tests for budget calculations
3. ✅ E2E tests for complete workflows
4. ✅ CSV export of parent interests
5. ✅ Budget templates for common team types

## Notes

- All test data uses `user_demo_coach_preseason` as the coach Clerk ID
- Association is "Metro Hockey Association"
- Parent emails are example.com addresses
- Budget allocations are realistic hockey team distributions
