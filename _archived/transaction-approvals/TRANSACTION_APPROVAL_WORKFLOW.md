# Transaction Approval Workflow with Pre-Authorized Budget Envelopes

## Overview

This implementation adds a sophisticated transaction approval workflow to HuddleBooks that **eliminates approval fatigue** for recurring budgeted expenses (like ice time) while maintaining strong financial controls and auditability.

### Key Features

1. **Pre-Authorized Budget Envelopes**: Auto-approve recurring expenses within strict guardrails
2. **Intelligent Transaction Routing**: Automatically route transactions based on envelopes, thresholds, and budget status
3. **Anti-Fraud Protection**: Prevent self-approval and enforce locked budget constraints
4. **Complete Audit Trail**: Track all approval decisions with detailed reasons
5. **Flexible Constraints**: Vendor matching, date ranges, period caps, and per-transaction limits

---

## Architecture

### Data Models

#### 1. BudgetEnvelope

Pre-authorized spending limits for specific categories with optional constraints.

```typescript
model BudgetEnvelope {
  id                   String           // Unique envelope ID
  teamId               String           // Team this envelope belongs to
  budgetId             String           // Must be a LOCKED budget
  categoryId           String           // Budget category (e.g., "Ice Time")

  // Vendor Constraints (optional)
  vendorMatchType      VendorMatchType  // ANY, EXACT, CONTAINS
  vendorMatch          String?          // Vendor name to match

  // Spending Caps
  capAmount            Decimal          // Maximum total for this envelope
  periodType           PeriodType       // SEASON_WIDE or MONTHLY

  // Date Constraints (optional)
  startDate            Date?
  endDate              Date?

  // Per-Transaction Limit (prevents abuse)
  maxSingleTransaction Decimal?

  // Status
  isActive             Boolean

  // Audit
  createdBy            String
  createdAt            DateTime
  deactivatedAt        DateTime?
  deactivatedBy        String?
}
```

#### 2. Enhanced Transaction Model

```typescript
model Transaction {
  // ... existing fields ...

  // New envelope tracking fields
  envelopeId      String?    // Link to envelope if auto-approved
  approvalReason  String?    // Why auto-approved or requires approval

  // New status option
  status          TransactionStatus  // DRAFT, PENDING, APPROVED, APPROVED_AUTOMATIC, REJECTED
}
```

---

## Transaction Routing Logic

### Flow Diagram

```
Transaction Created
    ↓
Is EXPENSE? ─NO→ Auto-Approve (Income)
    ↓ YES
Find Locked Budget
    ↓
Budget LOCKED? ─NO→ Route to Approval Threshold Check
    ↓ YES
Find Active Envelopes for Category
    ↓
Envelope Exists? ─NO→ Route to Approval Threshold Check
    ↓ YES
Match Vendor? ─NO→ Route to Approval Threshold Check
    ↓ YES
Within Date Range? ─NO→ Route to Approval Threshold Check
    ↓ YES
Amount <= Single Transaction Limit? ─NO→ PENDING (Approval Required)
    ↓ YES
Amount <= Remaining Cap? ─NO→ PENDING (Approval Required)
    ↓ YES
✓ APPROVED_AUTOMATIC (Auto-Approved via Envelope)
    ↓
Log: "Auto-approved within pre-authorized envelope.
      Spent: $X, Remaining: $Y for the season"

Approval Threshold Check:
    ↓
Amount >= Threshold? ─NO→ APPROVED_AUTOMATIC (Under Threshold)
    ↓ YES
PENDING (Approval Required)
```

### Routing Rules

| Scenario | Status | Requires Approval Records? | Reason |
|----------|--------|---------------------------|--------|
| Matches active envelope, within cap | `APPROVED_AUTOMATIC` | No | "Auto-approved within pre-authorized envelope" |
| Exceeds envelope cap | `PENDING` | Yes | "Transaction would exceed envelope cap" |
| No envelope, under threshold | `APPROVED_AUTOMATIC` | No | "Auto-approved - under threshold" |
| No envelope, >= threshold | `PENDING` | Yes | "Amount meets or exceeds approval threshold" |
| Income transaction | `APPROVED_AUTOMATIC` | No | "Income transactions don't require approval" |

---

## API Endpoints

### Envelope Management

```
GET    /api/budget-envelopes?teamId=X&budgetId=Y
POST   /api/budget-envelopes
PATCH  /api/budget-envelopes/[id]
DELETE /api/budget-envelopes/[id]  (soft delete)
```

### Existing Approval Endpoints (Already Implemented)

```
GET    /api/approvals?status=pending
POST   /api/approvals/[id]/approve
POST   /api/approvals/[id]/reject
```

---

## Key Services

### 1. Envelope Matcher (`lib/services/envelope-matcher.ts`)

**Functions:**

- `matchTransactionToEnvelope(transaction)` - Find matching envelope and check constraints
- `routeTransaction(transaction, threshold)` - Determine status and approval routing
- `getEnvelopeSpendingSummary(teamId, budgetId)` - Get spending stats for all envelopes
- `calculateEnvelopeSpent(envelopeId, periodType, date)` - Calculate spent amount (season or monthly)

**Example Usage:**

```typescript
const routingDecision = await routeTransaction(
  {
    amount: 250,
    categoryId: "cat_ice_time",
    vendor: "Arena Ice",
    transactionDate: new Date(),
    teamId: "team_123",
    type: "EXPENSE",
  },
  200 // approval threshold
);

// Result:
{
  status: "APPROVED_AUTOMATIC",
  approvalReason: "Auto-approved within pre-authorized envelope. Spent: $2,500.00, Remaining: $2,500.00 for the season",
  envelopeId: "env_abc123",
  requiresApprovalRecords: false
}
```

---

## UI Components

### 1. EnvelopeList (`components/budget-envelopes/EnvelopeList.tsx`)

Displays all envelopes with:
- Real-time spending progress bars
- Category badges and status indicators
- Vendor constraints and date ranges
- Create/Edit/Delete actions (if budget is LOCKED)

**Usage:**

```tsx
import { EnvelopeList } from "@/components/budget-envelopes/EnvelopeList";

<EnvelopeList
  teamId={team.id}
  budgetId={budget.id}
  budgetStatus={budget.status}
/>
```

### 2. CreateEnvelopeDialog (`components/budget-envelopes/CreateEnvelopeDialog.tsx`)

Modal for creating new envelopes with:
- Category selection
- Cap amount and period type (season/monthly)
- Vendor matching (ANY, EXACT, CONTAINS)
- Date range constraints
- Max single transaction limit

### 3. EditEnvelopeDialog (`components/budget-envelopes/EditEnvelopeDialog.tsx`)

Modal for editing existing envelopes:
- Update all constraints
- Activate/deactivate envelope
- Cannot change category (create new envelope instead)

---

## Integration Steps

### 1. Add Envelope Management to Budget Page

```tsx
// app/budget/page.tsx (or wherever budgets are displayed)

import { EnvelopeList } from "@/components/budget-envelopes/EnvelopeList";

export default function BudgetPage() {
  const budget = /* fetch budget */;
  const team = /* fetch team */;

  return (
    <div>
      {/* Existing budget components */}

      {/* Add envelope section AFTER budget is locked */}
      {budget.status === "LOCKED" && (
        <EnvelopeList
          teamId={team.id}
          budgetId={budget.id}
          budgetStatus={budget.status}
        />
      )}
    </div>
  );
}
```

### 2. Update Transaction Creation UI (Optional Enhancement)

Show hints when an envelope exists for the selected category:

```tsx
// components/expenses/NewExpenseForm.tsx

const [envelopeHint, setEnvelopeHint] = useState<string | null>(null);

// When category changes, fetch envelope info
useEffect(() => {
  if (selectedCategoryId) {
    fetchEnvelopeInfo(selectedCategoryId);
  }
}, [selectedCategoryId]);

async function fetchEnvelopeInfo(categoryId: string) {
  const res = await fetch(`/api/budget-envelopes?teamId=${teamId}&budgetId=${budgetId}`);
  const data = await res.json();
  const envelope = data.envelopes?.find((e: any) => e.categoryId === categoryId && e.isActive);

  if (envelope) {
    setEnvelopeHint(
      `This category has a pre-authorized envelope. ` +
      `Transactions up to $${envelope.remaining.toFixed(2)} will auto-approve.`
    );
  } else {
    setEnvelopeHint(null);
  }
}

// Display hint in form
{envelopeHint && (
  <Alert className="bg-green-50 border-green-200">
    <CheckCircle2 className="h-4 w-4 text-green-600" />
    <AlertDescription className="text-green-800">
      {envelopeHint}
    </AlertDescription>
  </Alert>
)}
```

### 3. Enhance Approvals Queue UI (Optional)

Show approval reason and envelope context:

```tsx
// components/approvals/ApprovalCard.tsx

<Card>
  <CardHeader>
    <CardTitle>{transaction.vendor} - ${transaction.amount}</CardTitle>
    {transaction.approvalReason && (
      <CardDescription className="text-yellow-600">
        <AlertCircle className="inline h-4 w-4 mr-1" />
        {transaction.approvalReason}
      </CardDescription>
    )}
  </CardHeader>

  {/* Rest of approval card */}
</Card>
```

### 4. Display Audit Trail in Reports

```tsx
// app/reports/transactions/page.tsx

<Table>
  <TableRow>
    <TableCell>{transaction.vendor}</TableCell>
    <TableCell>${transaction.amount}</TableCell>
    <TableCell>
      <Badge variant={
        transaction.status === "APPROVED_AUTOMATIC" ? "success" : "default"
      }>
        {transaction.status}
      </Badge>
    </TableCell>
    <TableCell className="text-xs text-muted-foreground">
      {transaction.approvalReason || "Manual approval"}
    </TableCell>
  </TableRow>
</Table>
```

---

## Security & Validation

### Guards Implemented

1. **Budget Must Be LOCKED**
   - Envelopes can only be created/used with LOCKED budgets
   - Prevents envelope usage during budget editing

2. **Self-Approval Prevention**
   - Existing approval system prevents users from approving their own transactions
   - Located in `lib/db/approvals.ts` lines 150-153 and 263-266

3. **Role-Based Access**
   - Only TREASURER role can create/edit envelopes
   - Only TREASURER/ASSISTANT_TREASURER can approve transactions

4. **Envelope Cap Enforcement**
   - Server-side calculation of spent amounts
   - Prevents exceeding envelope cap
   - Respects period type (monthly vs season-wide)

5. **Vendor Matching**
   - Case-insensitive matching
   - Three modes: ANY, EXACT, CONTAINS
   - Prevents approval for wrong vendors

6. **Date Range Validation**
   - Optional start/end date constraints
   - Prevents usage outside designated periods

7. **Per-Transaction Limit**
   - Optional `maxSingleTransaction` prevents one huge expense
   - Separate from total cap

---

## Testing Scenarios

### Scenario 1: Ice Time Envelope

**Setup:**
- Category: "Ice Time"
- Vendor: CONTAINS "Arena"
- Cap: $5,000 (Season-Wide)
- Max Single: $500
- Budget: LOCKED

**Test Cases:**

| Transaction | Vendor | Amount | Expected Status | Reason |
|------------|--------|--------|----------------|---------|
| Practice Ice | "City Arena" | $250 | APPROVED_AUTOMATIC | Matches envelope, within cap |
| Game Ice | "City Arena" | $300 | APPROVED_AUTOMATIC | Matches envelope, within cap |
| Tournament Ice | "City Arena" | $600 | PENDING | Exceeds maxSingleTransaction |
| Practice Ice | "Other Facility" | $250 | PENDING | Vendor doesn't match |
| ... (after $4,800 spent) | "City Arena" | $250 | PENDING | Would exceed cap ($5,000) |

### Scenario 2: Monthly Referee Fees

**Setup:**
- Category: "Referee Fees"
- Vendor: ANY
- Cap: $1,000 (Monthly)
- Budget: LOCKED

**Test Cases:**

| Month | Total Spent This Month | New Transaction | Expected Status |
|-------|------------------------|-----------------|-----------------|
| October | $800 | $150 | APPROVED_AUTOMATIC |
| October | $950 | $100 | PENDING (would exceed $1,000) |
| November | $0 | $150 | APPROVED_AUTOMATIC (cap reset) |

### Scenario 3: No Envelope, Threshold Check

**Setup:**
- Category: "Equipment" (no envelope)
- Approval Threshold: $200

**Test Cases:**

| Transaction | Amount | Expected Status | Reason |
|------------|--------|----------------|---------|
| Pucks | $50 | APPROVED_AUTOMATIC | Under threshold |
| Jerseys | $150 | APPROVED_AUTOMATIC | Under threshold |
| Goalie Pads | $450 | PENDING | Meets/exceeds threshold |

---

## Audit Trail Examples

All transactions now include `approvalReason` field with descriptive text:

```
"Auto-approved within pre-authorized envelope. Spent: $2,500.00, Remaining: $2,500.00 for the season"

"Auto-approved - amount $150.00 is below approval threshold of $200.00"

"Transaction amount $600.00 exceeds envelope single transaction limit of $500.00"

"Transaction would exceed envelope cap. Amount: $300.00, Remaining: $250.00 for the season"

"No pre-authorized envelope for this category"
```

---

## Database Migration

The schema changes have been applied via `npx prisma db push`. To create a formal migration:

```bash
# Create migration
npx prisma migrate dev --name add_budget_envelopes_and_approval_workflow

# Apply to production
npx prisma migrate deploy
```

---

## Future Enhancements

### Planned (Not Implemented)

1. **Email/Mobile Approval Links**
   - Generate secure one-time approval links
   - Send to approvers' email/SMS
   - Implement token expiry and audit logging

2. **Association-Level Approval Rules**
   - Allow associations to override team thresholds
   - Enforce maximum approval limits
   - Require specific approver compositions

3. **Envelope Templates**
   - Save envelope configurations as templates
   - Apply templates across multiple teams
   - Association-level template library

4. **Budget Alerts**
   - Notify when envelope reaches 80% capacity
   - Alert when envelope is exhausted
   - Forecast envelope depletion dates

5. **Approval Analytics Dashboard**
   - Time-to-approval metrics
   - Approval vs auto-approval ratios
   - Bottleneck identification

---

## Files Created/Modified

### New Files

**Backend:**
- `lib/services/envelope-matcher.ts` - Core matching and routing logic
- `app/api/budget-envelopes/route.ts` - List and create envelopes
- `app/api/budget-envelopes/[id]/route.ts` - Update and delete envelopes

**Frontend:**
- `components/budget-envelopes/EnvelopeList.tsx` - Main envelope list UI
- `components/budget-envelopes/CreateEnvelopeDialog.tsx` - Create envelope modal
- `components/budget-envelopes/EditEnvelopeDialog.tsx` - Edit envelope modal

**Documentation:**
- `TRANSACTION_APPROVAL_WORKFLOW.md` - This file

### Modified Files

**Schema:**
- `prisma/schema.prisma` - Added BudgetEnvelope model, enhanced Transaction model

**Backend:**
- `lib/db/transactions.ts` - Integrated envelope routing in createTransaction()

---

## Summary

This implementation provides a **production-ready transaction approval workflow** that:

✅ **Eliminates approval fatigue** for recurring expenses via pre-authorized envelopes
✅ **Maintains strong controls** with vendor matching, caps, and date ranges
✅ **Prevents fraud** with self-approval protection and locked budget enforcement
✅ **Provides complete auditability** with detailed approval reasons
✅ **Scales efficiently** with intelligent routing and minimal database queries
✅ **Offers flexible configuration** for teams and associations

The system is designed to handle HuddleBooks' specific needs (ice time, referee fees, equipment) while remaining flexible enough for any recurring budgeted expense category.
