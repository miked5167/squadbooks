# Validation-First Transaction Workflow

## Overview

HuddleBooks uses a **validation-first approach** to transaction processing that automatically identifies compliance issues and guides treasurers to resolution. This replaces the manual approval workflow with intelligent rule-based validation.

### Key Principles

1. **Automatic Validation**: Every transaction is validated against association rules upon creation or edit
2. **Clear Exceptions**: Non-compliant transactions are flagged with specific violations
3. **Actionable Guidance**: Each exception includes plain-language instructions for resolution
4. **Manual Override**: Treasurers can resolve exceptions with documented justification
5. **Audit Trail**: All validation results and resolutions are logged

---

## Transaction Lifecycle

### Status Flow

```
IMPORTED → VALIDATED/EXCEPTION → RESOLVED → LOCKED
```

**Status Definitions:**

| Status | Description | Next Steps |
|--------|-------------|------------|
| `IMPORTED` | Received from bank sync, pending validation | Automatically validated |
| `VALIDATED` | Passes all compliance checks | Can be locked at season end |
| `EXCEPTION` | Fails one or more validation rules | Requires review and resolution |
| `RESOLVED` | Exception manually resolved by treasurer | Can be locked at season end |
| `LOCKED` | Season closed, immutable | No changes allowed |

---

## Validation Rules Engine

### Five Core Rules

**Rule 1: Approved Category**
- Transaction category must exist in approved budget
- **Violation**: `UNAPPROVED_CATEGORY`
- **Fix**: Assign to a valid budget category or request budget amendment

**Rule 2: Category Budget**
- Transaction must not exceed category allocation beyond tolerance
- **Violation**: `CATEGORY_OVER_LIMIT`
- **Fix**: Recategorize, request budget increase, or split transaction

**Rule 3: Receipt Requirement**
- Transactions ≥ $100 require receipt attachment
- **Violation**: `MISSING_RECEIPT`
- **Fix**: Attach receipt document

**Rule 4: Transaction Limit**
- Individual transactions cannot exceed association limit (default: $1,000)
- **Violation**: `THRESHOLD_BREACH`
- **Fix**: Split transaction or request exception approval

**Rule 5: Cash-Like Payments**
- Cash, gift cards, reloadable cards require additional documentation
- **Violation**: `CASH_LIKE_TRANSACTION`
- **Severity**: CRITICAL if over limit, ERROR otherwise
- **Fix**: Provide supporting documentation

### Association Rules Configuration

```typescript
interface AssociationRules {
  transactionAmountLimit: number              // Default: $1,000
  categoryOverrunTolerancePercent: number     // Default: 0%
  receiptRequiredOverAmount: number           // Default: $100
  cashLikeRequiresReview: boolean             // Default: true
  requireApprovalOnBudgetChange: boolean      // Default: false
}
```

---

## Exceptions Inbox

### Overview

The Exceptions Inbox replaces the old "Approvals" page with a validation-focused workflow.

**Location**: `/exceptions`

**Access**: Treasurers and Assistant Treasurers only

### Tabs

1. **Exceptions** - Transactions flagged by validation rules (action required)
2. **Imported** - Bank imports pending validation
3. **Validated** - Compliant transactions
4. **Resolved** - Manually resolved exceptions

### Filters

- **Search**: By vendor or description
- **Category**: Filter by budget category
- **Severity**: CRITICAL, HIGH, MEDIUM, LOW

### Severity Levels

| Severity | Description | Examples |
|----------|-------------|----------|
| CRITICAL | Immediate attention required | Cash-like payment over limit |
| HIGH | Multiple errors or high-dollar violations | $500+ missing receipt + category overrun |
| MEDIUM | Single significant error | Missing receipt, category overrun |
| LOW | Minor violations | Single ERROR-level issue |

---

## Exception Resolution

### Resolution Options

**1. CORRECT**
- Fix the underlying issue (attach receipt, recategorize, etc.)
- Transaction automatically re-validated
- If compliant, status → VALIDATED

**2. OVERRIDE**
- Manually approve despite violations
- Requires written justification
- Status → RESOLVED
- Creates audit log entry

**3. REVALIDATE**
- Re-run validation after external changes (budget update, etc.)
- No justification required

### Resolution Dialog

```
┌─────────────────────────────────────────┐
│ Resolve Exception                       │
├─────────────────────────────────────────┤
│                                         │
│ Reason for Resolution *                │
│ ┌─────────────────────────────────────┐ │
│ │ Board approved this expenditure at  │ │
│ │ the November meeting. Tournament    │ │
│ │ fee was urgent and could not wait   │ │
│ │ for budget amendment.               │ │
│ └─────────────────────────────────────┘ │
│                                         │
│        [Cancel]  [Resolve Exception]    │
└─────────────────────────────────────────┘
```

**Required Fields:**
- Reason (minimum 20 characters)

**Audit Trail:**
- User who resolved
- Timestamp
- Resolution method (CORRECT/OVERRIDE/REVALIDATE)
- Justification text

---

## Integration with Budget Envelopes

Budget envelopes (pre-authorized spending limits) work seamlessly with validation:

### Envelope Validation

Transactions within active envelopes:
- ✅ Auto-categorized correctly
- ✅ Stay within envelope caps
- ✅ Match vendor constraints
- ✅ Pass validation automatically

### Envelope vs Validation

| Feature | Budget Envelopes | Validation Rules |
|---------|------------------|------------------|
| Purpose | Pre-authorize recurring expenses | Ensure compliance |
| Timing | Before transaction creation | After transaction creation |
| Scope | Category + vendor specific | All transactions |
| Action | Auto-approve within limits | Flag violations |
| Override | Not applicable | Requires justification |

**Example: Ice Time Envelope**

```
Envelope Configuration:
- Category: Ice Time
- Vendor: Contains "Arena"
- Cap: $5,000/season
- Single limit: $500

Transaction: $300 to "City Arena"
→ Envelope: Approved within limits
→ Validation: Passes all 5 rules
→ Status: VALIDATED
→ No treasurer action needed
```

---

## API Endpoints

### Exceptions Management

```
GET    /api/exceptions
       Returns all transactions with validation status

POST   /api/exceptions/resolve
       Body: { transactionId, resolution, reason, correctedData? }
       Resolves an exception with audit logging
```

### Validation Trigger

Validation runs automatically:
- On transaction creation
- On transaction update
- On recategorization
- After budget changes (optional)

Manual trigger available:
```
POST   /api/transactions/[id]/validate
       Force re-validation of a transaction
```

---

## UI Components

### ExceptionDetailsDrawer

Shows for each transaction:

**1. Validation Status**
- Current status badge
- Severity indicator
- Compliance score (0-100)

**2. Violations List**
- ❌ Missing receipt for expenses $100 or more
- ❌ Transaction amount $350 exceeds category budget by 15%
- Each with severity icon and plain-language message

**3. What to Fix**
- ✓ Attach receipt for this transaction
- ✓ Review budget allocation or recategorize
- Actionable bullet points derived from violations

**4. Transaction Details**
- Date, vendor, amount, category
- Created by, receipt status
- All standard transaction fields

**5. Resolution Actions**
- "Resolve Exception" button (if status = EXCEPTION)
- Opens justification dialog

---

## Dashboard Integration

### Exceptions KPI Card

Replaces "Pending Approvals" with "Exceptions":

```
┌─────────────────────────────────┐
│ Exceptions                      │
│                                 │
│ 5                              │
│ transactions                    │
│                                 │
│ Review required                 │
│ [Action Needed]                │
│                                 │
│ [Review Exceptions →]          │
└─────────────────────────────────┘
```

**Count**: Transactions with status = EXCEPTION

**Click**: Navigates to `/exceptions`

---

## Compliance Score Calculation

```typescript
function calculateComplianceScore(violations: Violation[]): number {
  if (violations.length === 0) return 100

  const penalties = {
    INFO: 0,
    WARNING: 5,
    ERROR: 15,
    CRITICAL: 30,
  }

  const totalPenalty = violations.reduce((sum, v) =>
    sum + penalties[v.severity], 0
  )

  return Math.max(0, 100 - totalPenalty)
}
```

**Examples:**
- No violations: 100/100
- 1 WARNING: 95/100
- 1 ERROR: 85/100
- 2 ERRORs: 70/100
- 1 CRITICAL: 70/100
- 1 CRITICAL + 2 ERRORs: 40/100

---

## Testing Scenarios

### Scenario 1: Missing Receipt

**Transaction:**
- Amount: $150
- Category: Equipment
- Receipt: None

**Validation Result:**
```json
{
  "compliant": false,
  "violations": [
    {
      "code": "MISSING_RECEIPT",
      "severity": "ERROR",
      "message": "Receipt required for expenses $100 or more"
    }
  ],
  "score": 85
}
```

**Status**: EXCEPTION
**Fix**: Attach receipt → Auto-revalidates → VALIDATED

### Scenario 2: Category Overrun

**Transaction:**
- Amount: $200
- Category: Referees (allocated: $1,000, spent: $950)
- Tolerance: 0%

**Validation Result:**
```json
{
  "compliant": false,
  "violations": [
    {
      "code": "CATEGORY_OVER_LIMIT",
      "severity": "ERROR",
      "message": "Transaction would exceed category budget by 15% (tolerance: 0%)"
    }
  ],
  "score": 85
}
```

**Status**: EXCEPTION
**Fix Options**:
1. Recategorize to different category
2. Request budget increase
3. Override with justification

### Scenario 3: Cash Payment Over Limit

**Transaction:**
- Amount: $1,200
- Vendor: "Petty Cash"
- Association Limit: $1,000

**Validation Result:**
```json
{
  "compliant": false,
  "violations": [
    {
      "code": "CASH_LIKE_TRANSACTION",
      "severity": "CRITICAL",
      "message": "Cash-like transaction over limit ($1,200 > $1,000) requires review"
    },
    {
      "code": "THRESHOLD_BREACH",
      "severity": "ERROR",
      "message": "Transaction amount $1,200 exceeds limit of $1,000"
    }
  ],
  "score": 40
}
```

**Status**: EXCEPTION (HIGH severity)
**Fix**: Split into smaller transactions or provide board approval documentation

---

## Migration from Approval Workflow

### What Changed

| Old (Approval-Based) | New (Validation-First) |
|---------------------|------------------------|
| Manual review of every transaction | Automatic validation |
| Approve/Reject buttons | Resolve exceptions |
| Pending approval queue | Exceptions inbox |
| Binary approve/reject | Specific violations + guidance |
| "Approved" status | "Validated" status |
| Approval workflow | Validation rules |

### What Stayed the Same

✅ Budget envelopes for recurring expenses
✅ Role-based access (Treasurer/Assistant Treasurer)
✅ Audit logging
✅ Transaction tracking
✅ Budget enforcement

### Database Changes

**New Columns:**
- `validationJson` - Full validation result
- `exceptionReason` - Concatenated violation messages
- `exceptionSeverity` - LOW/MEDIUM/HIGH/CRITICAL
- `receiptStatus` - ATTACHED/REQUIRED_MISSING/NONE

**New Statuses:**
- `IMPORTED` - From bank sync
- `VALIDATED` - Passes validation
- `EXCEPTION` - Has violations
- `RESOLVED` - Manually resolved
- `LOCKED` - Season closed

**Deprecated:**
- `APPROVED` (replaced by VALIDATED)
- `PENDING` (replaced by EXCEPTION)

---

## Future Enhancements

### Planned

1. **Email Notifications**
   - Alert treasurers when new exceptions occur
   - Daily/weekly digest of pending exceptions

2. **Exception Analytics**
   - Exception rate trends
   - Common violation types
   - Resolution time metrics

3. **Smart Suggestions**
   - Auto-suggest category based on vendor
   - Recommend budget amendments
   - Predict violations before submission

4. **Association Dashboards**
   - Team compliance scores
   - Exception patterns across teams
   - Rule effectiveness analysis

---

## Files Reference

### Core Validation
- `lib/services/validation-engine-v1.ts` - Main validation engine
- `lib/services/validate-imported-transactions.ts` - Batch validation
- `lib/types/validation.ts` - TypeScript types
- `lib/types/association-rules.ts` - Rules configuration

### UI Components
- `app/exceptions/page.tsx` - Exceptions Inbox
- `components/exceptions/ExceptionDetailsDrawer.tsx` - Exception details
- `components/exceptions/ExceptionTable.tsx` - Transaction table
- `components/exceptions/ExceptionFiltersToolbar.tsx` - Filters

### API Routes
- `app/api/exceptions/route.ts` - List transactions
- `app/api/exceptions/resolve/route.ts` - Resolve exceptions
- `app/api/plaid/sync-transactions/route.ts` - Import with validation
- `lib/db/transactions.ts` - Transaction CRUD with validation

### Tests
- `lib/services/__tests__/validation-engine-v1.test.ts` - Unit tests

---

## Summary

The validation-first workflow provides:

✅ **Automated Compliance** - Every transaction validated against 5 core rules
✅ **Clear Guidance** - Plain-language violation messages and fix instructions
✅ **Efficient Review** - Only exceptions require treasurer attention
✅ **Complete Audit Trail** - All validations and resolutions logged
✅ **Flexible Overrides** - Manual resolution with required justification
✅ **Scalable Architecture** - Handles thousands of transactions efficiently

This approach reduces treasurer workload while improving compliance and transparency.
