# TeamTreasure MVP Product Requirements Document

**Version:** 1.0 MVP
**Date:** November 19, 2025
**Target Launch:** 10 weeks from start
**Status:** Active Development

---

## Executive Summary

### MVP Mission
Prove that dual approval + transparent budget tracking prevents fraud better than Excel spreadsheets for volunteer-run hockey teams.

### Core Value Proposition
TeamTreasure replaces Excel with professional financial management that:
1. **Prevents fraud** through dual approval workflow
2. **Saves time** by automating reports and calculations
3. **Builds trust** through parent transparency

### What We're NOT Building (Yet)
- ❌ Bank integration (Plaid)
- ❌ Bank reconciliation
- ❌ Receipt OCR
- ❌ Payment tracking
- ❌ Mobile native app
- ❌ Advanced reporting (tax, audit trail, cash flow)
- ❌ Multi-team dashboards

These are Phase 2 features. MVP focuses on manual transaction entry with automated approval workflows.

---

## Target Users

### Primary: Volunteer Treasurer
- Age 35-50, parent with full-time job
- Currently using Excel
- Spends 15+ hours per season on finances
- **Success Metric:** <10 minutes per week after setup

### Secondary: Team President
- Needs to approve large expenses
- Wants confidence fraud is prevented
- **Success Metric:** Approve expense in <30 seconds from phone

### Tertiary: Parent
- Paid $800-$2,500 for season
- Wants to know where money goes
- **Success Metric:** Can see budget breakdown anytime

---

## MVP Features (In Priority Order)

## Feature 1: Transaction Management ⭐ CRITICAL

### Description
Treasurer can manually enter income and expenses, link to budget categories, and attach receipts.

### User Stories
- As a treasurer, I want to add an expense in under 2 minutes so I can track spending quickly
- As a treasurer, I want to attach receipts so I have proof of purchases
- As a board member, I want to see all transactions so I can monitor spending

### Requirements

#### Transaction Creation
- **POST** `/api/transactions` - Create transaction
  - Type: INCOME or EXPENSE
  - Amount: Decimal (2 decimal places, positive only)
  - Category: Link to budget category (required)
  - Vendor/Payee: String (required)
  - Description: Text (optional, max 500 chars)
  - Transaction Date: Date (default: today, cannot be future)
  - Receipt: File upload (optional for <$100, required for >$100)
  - Status: Auto-set to PENDING if >$200, else APPROVED

#### Transaction Listing
- **GET** `/api/transactions` - List transactions with filters
  - Filter by: Type, Status, Category, Date Range
  - Sort by: Date (desc default), Amount, Vendor
  - Pagination: 50 per page
  - Include: Category name, Creator name, Approval status

#### Transaction Details
- **GET** `/api/transactions/:id` - Get single transaction
  - All transaction fields
  - Approval history with timestamps
  - Receipt URL (if exists)
  - Creator details
  - Budget impact (category budget remaining after this transaction)

#### Transaction Update
- **PUT** `/api/transactions/:id` - Update transaction
  - Can only update if status = DRAFT or PENDING
  - Cannot update if status = APPROVED or REJECTED
  - Log all changes in audit trail

#### Transaction Delete
- **DELETE** `/api/transactions/:id` - Soft delete
  - Set deletedAt timestamp
  - Can only delete if status = DRAFT
  - Cannot delete approved transactions
  - Log deletion in audit trail

### Validation Rules
```typescript
TransactionSchema = {
  type: enum(INCOME, EXPENSE),
  amount: positive decimal, max 100000,
  categoryId: valid category ID from team,
  vendor: string, min 1, max 255,
  description: string, max 500, optional,
  transactionDate: date, max today,
  receiptUrl: url, optional
}
```

### Business Logic
```typescript
// On transaction create:
1. Validate all fields
2. Check user has TREASURER role
3. Determine if approval required:
   - If EXPENSE and amount > $200 → status = PENDING
   - Else → status = APPROVED
4. If status = PENDING → Create Approval record
5. Calculate new budget remaining for category
6. Create audit log entry
7. If approval required → Send email to president

// On transaction update:
1. Check status allows update
2. Validate all fields
3. Log changes in audit trail
4. Recalculate budget if amount/category changed

// On transaction delete:
1. Check status = DRAFT
2. Set deletedAt = now
3. Recalculate budget for category
4. Log deletion in audit trail
```

### API Endpoints

```typescript
// POST /api/transactions
{
  type: "EXPENSE",
  amount: 250.00,
  categoryId: "cat_123",
  vendor: "Dick's Sporting Goods",
  description: "Team jerseys - 18 players",
  transactionDate: "2025-01-15",
  receiptUrl: "https://storage.../receipt.jpg"
}

// Response
{
  id: "txn_456",
  status: "PENDING", // >$200 requires approval
  budgetRemaining: 4250.00,
  approvalRequired: true,
  message: "Transaction created. Approval required from president."
}

// GET /api/transactions?status=PENDING&page=1
{
  transactions: [
    {
      id: "txn_456",
      type: "EXPENSE",
      amount: 250.00,
      vendor: "Dick's Sporting Goods",
      category: { id: "cat_123", name: "Equipment & Jerseys" },
      transactionDate: "2025-01-15",
      status: "PENDING",
      creator: { id: "user_789", name: "Sarah Thompson" },
      createdAt: "2025-01-15T10:30:00Z"
    }
  ],
  pagination: { page: 1, perPage: 50, total: 3 }
}
```

### UI Components (Already Built)
- ✅ TransactionList component
- ✅ TransactionRow component
- ✅ TransactionDetails page
- ✅ CreateExpenseForm
- ✅ CreatePaymentForm
- ✅ TransactionFilters

### What Needs Building
- [ ] Transaction API routes
- [ ] Transaction validation schemas (Zod)
- [ ] Transaction repository functions
- [ ] Receipt upload to Supabase Storage
- [ ] Budget recalculation on transaction create/update
- [ ] Hook up UI forms to API
- [ ] Display real data in transaction list

### Success Metrics
- Treasurer can add expense in <2 minutes
- 95% of expenses have receipts attached
- Transaction list loads in <500ms
- Budget remaining updates in real-time

---

## Feature 2: Budget Management ⭐ CRITICAL

### Description
Set season budget by category, track actual spending, and display variance (budget vs. actual).

### User Stories
- As a treasurer, I want to set our season budget so I can track if we're on track
- As a president, I want to see budget vs. actual so I know our financial health
- As a parent, I want to see the team budget so I understand where fees go

### Requirements

#### Budget Allocation
- **POST** `/api/budget/allocations` - Set budget for category
  - Season: String (e.g., "2024-2025")
  - Category ID: Link to category
  - Allocated Amount: Decimal (positive)
  - Creates or updates existing allocation

#### Get Budget
- **GET** `/api/budget` - Get current season budget
  - Returns all categories with:
    - Budgeted amount
    - Actual spent (sum of APPROVED EXPENSE transactions)
    - Remaining (budgeted - actual)
    - Percentage used
  - Group by heading (Ice Time, Equipment, etc.)
  - Calculate totals

### Budget Calculations

```typescript
// For each category:
budgeted = BudgetAllocation.allocated
actual = SUM(Transaction.amount
  WHERE categoryId = category.id
  AND type = EXPENSE
  AND status = APPROVED
  AND deletedAt IS NULL)
remaining = budgeted - actual
percentUsed = (actual / budgeted) * 100

// Color coding:
percentUsed < 70 → Green
percentUsed 70-90 → Yellow
percentUsed > 90 → Red

// Team totals:
totalBudget = Team.budgetTotal
totalSpent = SUM(actual across all categories)
totalRemaining = totalBudget - totalSpent
```

### API Endpoints

```typescript
// POST /api/budget/allocations
{
  season: "2024-2025",
  categoryId: "cat_123",
  allocated: 5000.00
}

// Response
{
  id: "alloc_789",
  allocated: 5000.00,
  message: "Budget allocated successfully"
}

// GET /api/budget
{
  season: "2024-2025",
  totalBudget: 25000.00,
  totalSpent: 18750.00,
  totalRemaining: 6250.00,
  percentUsed: 75.0,
  categories: [
    {
      id: "cat_123",
      name: "Equipment & Jerseys",
      heading: "Equipment",
      budgeted: 5000.00,
      actual: 4250.00,
      remaining: 750.00,
      percentUsed: 85.0,
      status: "warning" // green, warning, danger
    }
  ]
}
```

### UI Components (Already Built)
- ✅ BudgetView page
- ✅ CategoryRow component
- ✅ BudgetProgressBar
- ✅ BudgetProgressCompact
- ✅ BudgetSummary card
- ✅ Budget snapshot on dashboard

### What Needs Building
- [ ] Budget API routes
- [ ] Budget calculation functions
- [ ] Hook up budget page to real data
- [ ] Real-time budget updates on transaction create

### Success Metrics
- Budget vs. actual updates within 1 second of transaction approval
- Dashboard shows accurate budget status
- All categories have allocated budgets

---

## Feature 3: Dual Approval Workflow ⭐ CRITICAL (Differentiator)

### Description
Expenses over $200 require approval from non-treasurer board member. Treasurer CANNOT approve own expenses. All approvals logged immutably.

### User Stories
- As a president, I want to approve large expenses from my phone so I can provide oversight
- As a board member, I want to see receipt before approving so I can verify legitimacy
- As an auditor, I want to see approval history so I can verify dual control

### Requirements

#### Approval Rules
```typescript
// Determine if approval required:
if (transaction.type === EXPENSE && transaction.amount > 200) {
  return true; // Approval required
}
return false; // Auto-approved
```

#### Approval Creation
- When transaction created with amount >$200:
  1. Set transaction.status = PENDING
  2. Create Approval record:
     - Transaction ID
     - Approver ID (president or board member)
     - Status = PENDING
     - Created at timestamp
  3. Send email notification to approver

#### Approval Actions
- **POST** `/api/approvals/:id/approve` - Approve transaction
  - Check: Approver cannot be transaction creator (fraud prevention)
  - Check: Approver has PRESIDENT or BOARD_MEMBER role
  - Set: Approval.status = APPROVED
  - Set: Approval.approvedAt = now
  - Set: Transaction.status = APPROVED
  - Log: Audit trail
  - Send: Email to treasurer confirming approval

- **POST** `/api/approvals/:id/reject` - Reject transaction
  - Require: Comment explaining rejection
  - Set: Approval.status = REJECTED
  - Set: Transaction.status = REJECTED
  - Log: Audit trail
  - Send: Email to treasurer with rejection reason

#### Approval Listing
- **GET** `/api/approvals` - Get pending approvals for user
  - Filter: approvedBy = current user
  - Filter: status = PENDING
  - Include: Full transaction details, receipt URL
  - Sort: createdAt desc

### Fraud Prevention Checks

```typescript
// CRITICAL: Prevent self-approval
if (transaction.createdBy === approval.approvedBy) {
  throw new Error("Cannot approve own expenses");
}

// Verify approver role
if (!["PRESIDENT", "BOARD_MEMBER"].includes(user.role)) {
  throw new Error("Insufficient permissions to approve");
}

// Verify approval belongs to transaction
if (approval.transactionId !== transaction.id) {
  throw new Error("Invalid approval");
}

// Prevent double approval
if (approval.status !== "PENDING") {
  throw new Error("Approval already processed");
}
```

### Audit Trail

Every approval action creates immutable audit log:

```typescript
AuditLog.create({
  teamId: transaction.teamId,
  userId: approver.id,
  action: "APPROVE_EXPENSE", // or REJECT_EXPENSE
  entityType: "Approval",
  entityId: approval.id,
  oldValues: { status: "PENDING" },
  newValues: {
    status: "APPROVED",
    approvedAt: now,
    comment: "Looks good"
  },
  ipAddress: request.ip,
  userAgent: request.userAgent
})
```

### Email Notifications

```typescript
// To approver on transaction create:
Subject: "Expense Approval Needed: $250 - Dick's Sporting Goods"
Body: "
Sarah Thompson has submitted an expense for approval:

Amount: $250.00
Vendor: Dick's Sporting Goods
Category: Equipment & Jerseys
Description: Team jerseys - 18 players
Receipt: [View Receipt]

[Approve] [Request More Info] [Reject]
"

// To treasurer on approval:
Subject: "Expense Approved: $250 - Dick's Sporting Goods"
Body: "
Your expense has been approved by John Miller (President).

Amount: $250.00
Vendor: Dick's Sporting Goods
Approved at: Jan 15, 2025 2:45 PM
"

// To treasurer on rejection:
Subject: "Expense Rejected: $250 - Dick's Sporting Goods"
Body: "
Your expense has been rejected by John Miller (President).

Reason: Please provide itemized receipt showing individual jersey costs.
"
```

### API Endpoints

```typescript
// GET /api/approvals
{
  approvals: [
    {
      id: "apr_123",
      status: "PENDING",
      transaction: {
        id: "txn_456",
        amount: 250.00,
        vendor: "Dick's Sporting Goods",
        category: { name: "Equipment & Jerseys" },
        description: "Team jerseys - 18 players",
        receiptUrl: "https://...",
        creator: { name: "Sarah Thompson" },
        createdAt: "2025-01-15T10:30:00Z"
      },
      createdAt: "2025-01-15T10:30:00Z"
    }
  ]
}

// POST /api/approvals/:id/approve
{
  comment: "Looks good, we needed new jerseys"
}

// Response
{
  success: true,
  approval: {
    id: "apr_123",
    status: "APPROVED",
    approvedAt: "2025-01-15T14:45:00Z"
  },
  transaction: {
    id: "txn_456",
    status: "APPROVED"
  },
  message: "Expense approved successfully"
}

// POST /api/approvals/:id/reject
{
  comment: "Please provide itemized receipt"
}

// Response
{
  success: true,
  approval: {
    id: "apr_123",
    status: "REJECTED"
  },
  message: "Expense rejected"
}
```

### UI Components (Already Built)
- ✅ ApprovalQueue page
- ✅ ApprovalCard component
- ✅ ApprovalHistory timeline
- ✅ Approve/Reject buttons

### What Needs Building
- [ ] Approval API routes
- [ ] Self-approval prevention logic
- [ ] Email notification system (Resend integration)
- [ ] Audit log creation on approval actions
- [ ] Hook up approval UI to real data
- [ ] Email templates

### Success Metrics
- 100% of expenses >$200 have approvals
- Zero instances of self-approval
- Average approval time <24 hours
- All approvals logged in audit trail

---

## Feature 4: Basic Reporting ⭐ IMPORTANT

### Description
Generate and export financial reports showing budget vs. actual, transaction history, and monthly summaries.

### User Stories
- As a treasurer, I want to generate board meeting reports in 30 seconds
- As a president, I want to export transaction history to Excel
- As a parent, I want to see a summary of team spending

### Requirements

#### Report Types

**1. Monthly Financial Summary**
- Total income by category
- Total expenses by category
- Net income/loss
- Budget vs. actual variance
- Date range: Month-to-date, YTD, custom

**2. Budget Variance Report**
- Budget by category
- Actual spending by category
- Variance ($ and %)
- Over-budget categories highlighted
- Visual progress bars

**3. Transaction History**
- All transactions with filters
- Date, vendor, category, amount, status
- Approval information
- Export to Excel (CSV)

### Report Generation

```typescript
// Monthly Financial Summary
GET /api/reports/monthly-summary?month=2025-01

Response:
{
  month: "January 2025",
  income: {
    total: 12000.00,
    byCategory: [
      { category: "Registration Fees", amount: 10000.00 },
      { category: "Fundraising", amount: 2000.00 }
    ]
  },
  expenses: {
    total: 8500.00,
    byCategory: [
      { category: "Ice Time", amount: 5000.00 },
      { category: "Equipment", amount: 2500.00 },
      { category: "Travel", amount: 1000.00 }
    ]
  },
  netIncome: 3500.00
}

// Budget Variance Report
GET /api/reports/budget-variance

Response:
{
  season: "2024-2025",
  categories: [
    {
      category: "Ice Time",
      budgeted: 13750.00,
      actual: 12450.00,
      variance: 1300.00,
      percentUsed: 90.5,
      status: "warning"
    }
  ]
}

// Transaction History Export
GET /api/reports/transactions/export?format=csv

Returns CSV file with columns:
Date, Type, Vendor, Category, Amount, Status, Approved By, Receipt
```

### UI Components (Already Built)
- ✅ Reports page with report list
- ✅ Report cards with descriptions
- ✅ Export buttons (Excel/PDF)

### What Needs Building
- [ ] Report API routes
- [ ] Report generation functions
- [ ] CSV export functionality
- [ ] PDF generation (optional for MVP)
- [ ] Hook up reports page to real data
- [ ] Date range filtering

### Success Metrics
- Report generation in <5 seconds
- CSV export works for all transactions
- Reports accurate with transaction data

---

## Feature 5: Parent Dashboard 🎯 KEY DIFFERENTIATOR

### Description
Read-only dashboard for parents showing team budget breakdown, recent transactions, and financial health.

### User Stories
- As a parent, I want to see where my $1,200 registration goes
- As a parent, I want to see recent team spending
- As a parent, I want to verify team is financially healthy

### Requirements

#### Parent View Access
- Parents can ONLY see:
  - Team budget summary
  - Budget breakdown by category (pie chart)
  - Recent transactions (last 30 days)
  - Financial health indicator
  - Total budget, total spent, remaining

- Parents CANNOT see:
  - Other families' payment status (Phase 2)
  - Pending/rejected transactions
  - Approver names
  - Admin features

#### Data Filters
```typescript
// Parent dashboard data
GET /api/dashboard/parent

Response:
{
  team: {
    name: "Bantam AA Storm",
    season: "2024-2025"
  },
  budget: {
    total: 25000.00,
    spent: 18750.00,
    remaining: 6250.00,
    percentUsed: 75.0
  },
  categoryBreakdown: [
    {
      category: "Ice Time",
      amount: 12450.00,
      percentage: 50,
      color: "#0EA5E9"
    }
  ],
  recentTransactions: [
    {
      date: "2025-01-15",
      vendor: "Dick's Sporting Goods",
      category: "Equipment",
      amount: 250.00,
      status: "APPROVED"
    }
  ],
  financialHealth: {
    status: "healthy", // healthy, warning, danger
    message: "On track with budget"
  }
}
```

### UI Components (Already Built)
- ✅ Parent dashboard (same as treasurer dashboard with restricted data)
- ✅ Budget breakdown pie chart
- ✅ Recent transactions list
- ✅ Financial health card

### What Needs Building
- [ ] Parent dashboard API route
- [ ] Role-based data filtering
- [ ] Financial health calculation
- [ ] Hook up parent view to real data

### Success Metrics
- 70% of parents view dashboard during season
- Parents can see budget breakdown
- Financial health status accurate

---

## Non-Functional Requirements

### Performance
- Page load: <3 seconds
- API response: <500ms for queries, <2s for reports
- Dashboard: <1 second to load
- Transaction list: <500ms with pagination

### Security
- All API routes protected by authentication
- Role-based access control enforced
- Treasurer cannot approve own expenses (enforced in DB and API)
- All approvals logged immutably
- Passwords hashed (handled by Clerk)
- Environment variables for secrets

### Data Integrity
- Money stored as Decimal (2 decimal places)
- All financial operations logged in audit trail
- Soft deletes for transactions (keep audit trail)
- Immutable approvals (cannot delete or edit)

### Browser Support
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+
- Mobile responsive (iOS Safari, Chrome Android)

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast ratios met

---

## Technical Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4.1.17
- **UI Components:** shadcn/ui
- **State:** React hooks (useState, useEffect)
- **Forms:** React Hook Form + Zod validation

### Backend
- **API:** Next.js API Routes
- **Database:** PostgreSQL 15+ (Supabase)
- **ORM:** Prisma 6.19.0
- **Authentication:** Clerk
- **File Storage:** Supabase Storage

### Third-Party Services
- **Email:** Resend
- **Analytics:** Google Analytics (optional)
- **Monitoring:** Sentry (optional)

---

## Data Models (Summary)

### Core Models
```typescript
Team {
  id, name, level, season, budgetTotal
}

User {
  id, clerkId, email, name, role, teamId
}

Category {
  id, teamId, name, heading, color, sortOrder
}

Transaction {
  id, teamId, type, status, amount, categoryId,
  vendor, description, transactionDate, receiptUrl,
  createdBy
}

Approval {
  id, transactionId, approvedBy, status,
  comment, approvedAt
}

BudgetAllocation {
  id, teamId, categoryId, season, allocated
}

AuditLog {
  id, teamId, userId, action, entityType, entityId,
  oldValues, newValues, ipAddress, createdAt
}
```

---

## API Routes Summary

### Transactions
- `GET /api/transactions` - List with filters
- `GET /api/transactions/:id` - Get details
- `POST /api/transactions` - Create
- `PUT /api/transactions/:id` - Update
- `DELETE /api/transactions/:id` - Soft delete

### Budget
- `GET /api/budget` - Get current budget
- `POST /api/budget/allocations` - Set allocation

### Approvals
- `GET /api/approvals` - Get pending
- `POST /api/approvals/:id/approve` - Approve
- `POST /api/approvals/:id/reject` - Reject

### Reports
- `GET /api/reports/monthly-summary` - Monthly report
- `GET /api/reports/budget-variance` - Variance report
- `GET /api/reports/transactions/export` - CSV export

### Dashboard
- `GET /api/dashboard/parent` - Parent view

---

## Development Phases

### Phase 1: Transaction System (Weeks 1-2)
- [ ] Transaction API routes (GET, POST, PUT, DELETE)
- [ ] Transaction validation (Zod schemas)
- [ ] Receipt upload to Supabase Storage
- [ ] Hook up expense form to API
- [ ] Hook up payment form to API
- [ ] Display real transactions on dashboard
- [ ] Transaction filtering and search

**Deliverable:** Treasurer can add/edit/delete transactions with receipts

### Phase 2: Budget System (Weeks 3-4)
- [ ] Budget API routes (GET, POST)
- [ ] Budget calculation functions
- [ ] Hook up budget page to real data
- [ ] Real-time budget updates on transaction create
- [ ] Budget allocation per category
- [ ] Budget vs. actual calculations
- [ ] Dashboard budget snapshot with real data

**Deliverable:** Budget tracking works, variance calculated correctly

### Phase 3: Dual Approval (Weeks 5-6)
- [ ] Approval API routes (GET, POST)
- [ ] Approval workflow on transaction create
- [ ] Self-approval prevention logic
- [ ] Email notifications (Resend integration)
- [ ] Approval queue page with real data
- [ ] Approve/reject functionality
- [ ] Audit log for all approvals
- [ ] Approval history timeline

**Deliverable:** Dual approval works, fraud prevention enforced

### Phase 4: Reporting (Weeks 7-8)
- [ ] Report API routes
- [ ] Monthly financial summary
- [ ] Budget variance report
- [ ] Transaction history export (CSV)
- [ ] Parent dashboard API
- [ ] Hook up reports page to real data
- [ ] Hook up parent dashboard to real data

**Deliverable:** Reports generate correctly, parents can see budget

### Phase 5: Testing & Polish (Weeks 9-10)
- [ ] End-to-end testing
- [ ] Security audit (self-approval prevention)
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] UI polish
- [ ] Beta testing with 3-5 teams
- [ ] Feedback gathering
- [ ] Critical fixes

**Deliverable:** MVP ready for launch

---

## Success Criteria

### MVP is ready when:

✅ **Functional Requirements**
- [ ] Treasurer can add expenses in <2 minutes
- [ ] President can approve expenses from phone in <30 seconds
- [ ] System prevents treasurer from approving own expenses
- [ ] All approvals logged immutably in audit trail
- [ ] Budget vs. actual calculates correctly
- [ ] Parents can see team budget breakdown
- [ ] Reports can be generated and exported to CSV
- [ ] Receipt upload works (PDF, JPG, PNG)

✅ **Technical Requirements**
- [ ] No critical bugs in happy path
- [ ] Dashboard loads in <3 seconds
- [ ] API responses in <500ms
- [ ] Mobile responsive (works on phones)
- [ ] Role-based access control enforced
- [ ] All money calculations use Decimal (no floating point errors)

✅ **User Validation**
- [ ] 3 beta teams use it for 1 month successfully
- [ ] Treasurer reports saving 10+ hours per season
- [ ] President approves expenses via mobile
- [ ] Parents view budget dashboard
- [ ] No fraud incidents
- [ ] Positive feedback on ease of use

---

## Out of Scope for MVP

### Phase 2 Features (Build After Launch)
- Bank integration (Plaid)
- Bank reconciliation
- Receipt OCR
- Payment tracking (who paid, who owes)
- Family/contact management
- Online payment processing (Stripe)
- Fundraising management
- Tournament expense tracking
- Advanced reports (tax, audit trail, cash flow)
- Multi-season comparison
- Budget templates
- Multi-team dashboards
- Mobile native app
- SMS notifications
- Advanced analytics

### Why These Are Phase 2
- **Bank integration:** Complex to test, expensive, not needed to prove core value
- **Payment tracking:** Nice to have, but treasurer can track in Excel for MVP
- **Receipt OCR:** Adds complexity, manual entry is fine for MVP
- **Mobile app:** Mobile-responsive web is sufficient for MVP

---

## Risk Mitigation

### Risk: Users resist change from Excel
**Mitigation:**
- Simple onboarding (10-minute setup)
- Time savings (10 min/week vs 15+ hours/season)
- Free trial (30 days)

### Risk: Treasurer approves own expense (fraud)
**Mitigation:**
- Database constraint prevents self-approval
- API validation enforces rule
- Unit tests verify enforcement

### Risk: Budget calculations wrong
**Mitigation:**
- Use Decimal type (not Float)
- Unit tests for all money math
- Manual verification during beta

### Risk: Email notifications don't send
**Mitigation:**
- Use reliable service (Resend)
- Log all email attempts
- Show in-app notifications as backup

### Risk: Performance issues at scale
**Mitigation:**
- Database indexes on foreign keys
- Pagination on transaction lists
- Caching for budget calculations

---

## Pricing (For Reference)

**Team Tier:** $149/year
- Unlimited users
- Unlimited transactions
- Dual approval workflow
- Receipt attachments
- Budget tracking
- Basic reports
- Email support

**Target:** 500 teams in Year 1 = $74,500 ARR

---

## Next Steps

1. **Week 1-2:** Build Transaction API and hook up forms
2. **Week 3-4:** Build Budget API and calculations
3. **Week 5-6:** Build Approval workflow with email
4. **Week 7-8:** Build Reports and Parent dashboard
5. **Week 9-10:** Test, polish, beta with 3-5 teams
6. **Week 11:** Launch to first 50 teams

---

## Questions for Implementation

### Technical Decisions
- [ ] CSV export library: Use Papa Parse or custom?
- [ ] Email template design: HTML or plain text?
- [ ] Audit log: Log every field change or just critical actions?
- [ ] Pagination: Client-side or server-side?

### Product Decisions
- [ ] Approval threshold: Fixed $200 or configurable per team?
- [ ] Receipt requirement: Fixed $100 or configurable?
- [ ] Transaction deletion: Allow soft delete for all or only DRAFT?
- [ ] Multiple approvers: Support >1 approver for >$1000?

### Beta Testing
- [ ] How to recruit 3-5 beta teams?
- [ ] What support to provide during beta?
- [ ] How to collect feedback?
- [ ] What metrics to track?

---

**End of MVP PRD**

*This is a focused, buildable MVP that proves the core value proposition: fraud prevention through dual approval + transparent budget tracking. Everything else is Phase 2.*
