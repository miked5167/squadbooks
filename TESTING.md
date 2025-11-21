# Testing Guide

This document explains how to test the Squadbooks application with the test data.

## Test Data Created

**Team:** Springfield Ice Hawks (U13, 2024-2025 season)
**Budget:** $10,000.00

### Test Users

| Role | Email | Clerk ID | Description |
|------|-------|----------|-------------|
| Treasurer | treasurer@icehawks.com | test_treasurer_001 | Can create/edit transactions |
| President | president@icehawks.com | test_president_001 | Can approve transactions >$200 |
| Parent | parent@icehawks.com | test_parent_001 | Can view transactions (read-only) |

### Created Data

- **28 categories** across 7 headings:
  - Ice Time & Facilities (4 categories)
  - Equipment & Jerseys (4 categories)
  - Coaching & Officials (4 categories)
  - Travel & Tournaments (4 categories)
  - League & Registration (4 categories)
  - Team Operations (4 categories)
  - Fundraising & Income (4 categories)

- **9 budget allocations** totaling $10,000:
  - Ice Time - Practice: $2,000
  - Ice Time - Games: $1,500
  - Team Jerseys: $1,200
  - Team Equipment: $800
  - Head Coach Fee: $1,000
  - Referee Fees: $500
  - Tournament Registration: $1,500
  - Team Meals: $500
  - League Registration: $1,000

- **3 sample transactions**:
  1. **INCOME** - Player Registration ($5,000) - APPROVED
  2. **EXPENSE** - Ice Time Practice ($180) - APPROVED (auto-approved, under $200)
  3. **EXPENSE** - Team Jerseys ($850) - PENDING (requires approval, over $200)

## How to Test

### Option 1: Update Your Clerk User to Match Test Data

After signing up with Clerk, you'll need to link your Clerk user to one of the test users in the database.

1. Sign up at http://localhost:3000/sign-up
2. After signing up, get your Clerk user ID from the Clerk Dashboard
3. Update the database to link your Clerk ID to a test user:

```sql
-- Connect your Clerk user to the Treasurer role
UPDATE "users"
SET "clerkId" = 'your_clerk_user_id_here'
WHERE email = 'treasurer@icehawks.com';
```

You can run this in the Supabase SQL Editor or using Prisma Studio:

```bash
npm run db:studio
```

### Option 2: Use Prisma Studio

1. Start Prisma Studio:
```bash
npm run db:studio
```

2. Navigate to the `User` table
3. Find the user with email `treasurer@icehawks.com`
4. Update the `clerkId` field to match your actual Clerk user ID
5. Save the changes

### Option 3: Create New Test Data

If you need to reset or create fresh test data:

**Create test data:**
```bash
curl -X POST http://localhost:3000/api/admin/setup-test-data
```

**Delete test data:**
```bash
curl -X DELETE http://localhost:3000/api/admin/setup-test-data
```

## Testing the Transaction Flow

### As Treasurer

1. **View Dashboard**
   - Navigate to http://localhost:3000/dashboard
   - See team overview and quick actions

2. **View Transactions**
   - Navigate to http://localhost:3000/transactions
   - See 3 existing transactions
   - Filter by status (All, Approved, Pending, Draft)

3. **Create a New Expense** (under $200)
   - Click "Add Expense" or navigate to http://localhost:3000/expenses/new
   - Fill in:
     - Amount: $150.00
     - Category: Select any category (e.g., "Ice Time - Practice")
     - Vendor: "Test Vendor"
     - Date: Today
     - Description: "Test expense under $200"
   - Click "Create Expense"
   - Should be auto-approved
   - Check transactions list - should appear as APPROVED

4. **Create a New Expense** (over $200)
   - Click "Add Expense"
   - Fill in:
     - Amount: $500.00
     - Category: Select any category
     - Vendor: "Expensive Vendor"
     - Date: Today
     - Description: "Test expense over $200"
   - Click "Create Expense"
   - Should require approval
   - Check transactions list - should appear as PENDING

5. **Create an Income Transaction**
   - Navigate to http://localhost:3000/payments/new
   - Fill in:
     - Amount: $1,000.00
     - Category: "Registration Fees"
     - Payer: "Fundraiser Event"
     - Date: Today
   - Click "Create Payment"
   - Should be auto-approved
   - Check transactions list - should appear as APPROVED with green color

6. **Upload a Receipt**
   - Create a new expense
   - Select a receipt file (PDF, JPG, PNG, or WebP under 5MB)
   - Submit the form
   - After creation, view in transactions list
   - Click "View" link to open the receipt

### As President (Future Phase 3)

1. Navigate to Approvals page
2. See pending transactions requiring approval
3. Review transaction details and receipts
4. Approve or reject with comments

### As Parent (View-only)

1. Navigate to Dashboard
2. View team budget and spending
3. View approved transactions only
4. Cannot create or edit transactions
5. Cannot access approval queue

## Testing Checklist

### Transaction Creation
- [ ] Create expense under $200 (should auto-approve)
- [ ] Create expense over $200 (should require approval)
- [ ] Create income transaction (should auto-approve)
- [ ] Upload receipt with transaction
- [ ] Validation errors show correctly
- [ ] Success messages appear
- [ ] Redirect to transactions list after creation

### Transaction List
- [ ] All transactions display correctly
- [ ] Filter by status works (All, Approved, Pending, Draft)
- [ ] Transaction types color-coded (green=income, red=expense)
- [ ] Status badges show correctly
- [ ] Receipt links work
- [ ] Empty state shows when no transactions
- [ ] Loading state shows while fetching

### Categories
- [ ] All 28 categories load in dropdowns
- [ ] Categories grouped by heading
- [ ] Can select any category

### Authorization
- [ ] Treasurer can create/edit transactions
- [ ] Non-treasurer cannot access expense/payment forms
- [ ] All transactions scoped to user's team
- [ ] Cannot access other team's data

### Validation
- [ ] Amount must be positive
- [ ] Amount cannot exceed $100,000
- [ ] Date cannot be in future
- [ ] Required fields validated
- [ ] File upload validates MIME type
- [ ] File upload validates size (<5MB)

## Common Issues

### "Unauthorized" Error
- Make sure you're signed in
- Make sure your Clerk ID is linked to a test user in the database

### "User not found" Error
- Your Clerk user ID doesn't match any user in the database
- Update the `clerkId` field for a test user to match yours

### "Category is required" Error
- Make sure categories were created
- Check Prisma Studio to verify categories exist for your team

### Receipt Upload Fails
- Make sure Supabase Storage bucket "receipts" is created
- Run the storage setup: `curl -X POST http://localhost:3000/api/admin/setup-storage`
- Check file size (<5MB) and type (PDF, JPG, PNG, WebP)

## Resetting Test Data

To start fresh:

```bash
# Delete existing test data
curl -X DELETE http://localhost:3000/api/admin/setup-test-data

# Create new test data
curl -X POST http://localhost:3000/api/admin/setup-test-data
```

## Next Steps

After validating Phase 1 works:
- Set up Supabase Storage bucket and RLS policies
- Test receipt upload flow
- Begin Phase 2: Budget tracking system
- Begin Phase 3: Approval workflow for president

## Useful Commands

```bash
# Start development server
npm run dev

# Open Prisma Studio
npm run db:studio

# Check database
npm run db:push

# View API logs
# Check the terminal running `npm run dev`
```

## Database Access

**Prisma Studio:** http://localhost:5555 (run `npm run db:studio`)

**Supabase Dashboard:** https://supabase.com/dashboard/project/vynfjwduiehdwbfwyqzh

## Test Data Summary

```json
{
  "team": {
    "name": "Springfield Ice Hawks",
    "level": "U13",
    "season": "2024-2025",
    "budgetTotal": "$10,000.00"
  },
  "users": 3,
  "categories": 28,
  "budgetAllocations": 9,
  "transactions": 3,
  "totalBudgetAllocated": "$10,000.00",
  "totalIncome": "$5,000.00",
  "totalExpensesApproved": "$180.00",
  "totalExpensesPending": "$850.00",
  "currentBalance": "$4,820.00"
}
```
