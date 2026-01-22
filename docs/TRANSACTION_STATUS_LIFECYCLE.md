# Transaction Status & Validation Lifecycle

This document explains how transactions flow through the Squadbooks system, from bank import to final validation.

## Transaction Statuses

| Status | Description | When Used |
|--------|-------------|-----------|
| **DRAFT** | Incomplete transaction | User started entry but didn't finish |
| **PENDING** | Awaiting approval (legacy) | Old manual approval workflow |
| **APPROVED** | Approved by treasurer (legacy) | Old manual approval workflow |
| **REJECTED** | Rejected (legacy) | Old manual approval workflow |
| **APPROVED_AUTOMATIC** | Auto-approved | Met auto-approval rules (legacy) |
| **IMPORTED** | Bank import, not yet validated | Fresh from Plaid import |
| **VALIDATED** | Passed all validation rules | Compliant transaction |
| **EXCEPTION** | Failed validation | Has violations needing resolution |
| **RESOLVED** | Was exception, now fixed | Exception that was corrected |
| **LOCKED** | End of season, immutable | Season closure - no further edits |

## Validation-First Model

The new validation-first model replaces the legacy manual approval workflow (PENDING → APPROVED/REJECTED).

### How It Works

1. **Bank Import**: Transactions arrive from Plaid with status `IMPORTED`
2. **Automatic Validation**: The validation engine runs rules against each transaction
3. **Status Assignment**: Based on validation results:
   - **VALIDATED** - Transaction passed all rules (compliant)
   - **EXCEPTION** - Transaction has blocking violations
   - **RESOLVED** - A previous exception that is now compliant

### Key Benefits

- No manual approval bottleneck
- Consistent rule enforcement across all teams
- Clear audit trail of why transactions were flagged
- Exceptions can be fixed and re-validated automatically

## Violation Severities

Violations are categorized by severity to determine blocking behavior:

| Severity | Effect | Example |
|----------|--------|---------|
| **INFO** | Informational only, does not block | Receipt missing but within grace period |
| **WARNING** | Attention needed, not blocking | Approaching budget limit |
| **ERROR** | Blocks validation → `EXCEPTION` | Missing receipt (after grace period) |
| **CRITICAL** | Immediate attention required | Cash-like transaction over limit |

> **Compliance Rule**: A transaction is compliant if it has NO violations with severity `ERROR` or `CRITICAL`.

## Violation Codes

The validation engine produces these violation codes:

### Budget Violations
| Code | Description |
|------|-------------|
| `BUDGET_OVERRUN` | Total budget exceeded |
| `CATEGORY_OVER_LIMIT` | Category allocation exceeded beyond tolerance |
| `CATEGORY_NOT_ALLOCATED` | Category has no budget allocation |
| `ENVELOPE_CAP_EXCEEDED` | Envelope spending cap exceeded |

### Receipt/Documentation Violations
| Code | Description |
|------|-------------|
| `MISSING_RECEIPT` | Required receipt not uploaded |
| `RECEIPT_AMOUNT_MISMATCH` | Receipt amount differs from transaction |
| `MISSING_DESCRIPTION` | Required description not provided |

### Threshold Violations
| Code | Description |
|------|-------------|
| `THRESHOLD_BREACH` | Transaction exceeds amount limit |
| `LARGE_TRANSACTION` | Transaction flagged as unusually large |

### Category/Classification Violations
| Code | Description |
|------|-------------|
| `UNAPPROVED_CATEGORY` | Category not in approved budget |
| `INVALID_CATEGORY` | Category is invalid |
| `UNCATEGORIZED` | Transaction has no category assigned |

### Vendor/Payment Method Violations
| Code | Description |
|------|-------------|
| `CASH_LIKE_TRANSACTION` | Venmo, Cash App, Zelle, etc. |
| `UNVERIFIED_VENDOR` | Vendor not in approved list |
| `SUSPICIOUS_VENDOR` | Vendor flagged for review |

### Date/Timing Violations
| Code | Description |
|------|-------------|
| `TRANSACTION_TOO_OLD` | Transaction date is too far in the past |
| `TRANSACTION_TOO_FUTURE` | Transaction date is in the future |
| `OUTSIDE_SEASON_DATES` | Transaction outside season boundaries |

### Other Violations
| Code | Description |
|------|-------------|
| `ASSOCIATION_RULE_VIOLATION` | Violates association-level rule |
| `PROHIBITED_EXPENSE_TYPE` | Expense type not allowed |
| `POTENTIAL_DUPLICATE` | May be a duplicate transaction |
| `MISSING_REQUIRED_FIELD` | Required data field is empty |
| `INVALID_AMOUNT` | Transaction amount is invalid |
| `INVALID_DATE` | Transaction date is invalid |

## Validation Rules (V1 Engine)

The V1 validation engine implements these core rules:

1. **Uncategorized Check** - Transaction must have a category assigned
2. **Approved Category** - Category must exist in the approved budget
3. **Category Overrun** - Spending must not exceed category allocation beyond tolerance
4. **Required Receipt** - Receipt required for transactions over threshold (with grace period)
5. **Transaction Limit** - Amount must not exceed association limit
6. **Cash-Like Review** - Cash-like payments (Venmo, Cash App) require review

## Transaction Lifecycle Diagram

```
                           ┌─────────────────┐
                           │   Bank Import   │
                           │     (Plaid)     │
                           └────────┬────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │    IMPORTED     │
                           └────────┬────────┘
                                    │
                                    ▼
                           ┌─────────────────┐
                           │   Validation    │
                           │     Engine      │
                           └────────┬────────┘
                                    │
               ┌────────────────────┼────────────────────┐
               │                    │                    │
               ▼                    ▼                    ▼
      ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
      │   VALIDATED     │  │   EXCEPTION     │  │ INFO violations │
      │  (compliant)    │  │ (has violations)│  │  (still valid)  │
      └─────────────────┘  └────────┬────────┘  └─────────────────┘
                                    │
                                    │ User fixes issue
                                    │ (add receipt, change category, etc.)
                                    │
                                    ▼
                           ┌─────────────────┐
                           │  Re-validation  │
                           └────────┬────────┘
                                    │
               ┌────────────────────┴────────────────────┐
               │                                         │
               ▼                                         ▼
      ┌─────────────────┐                       ┌─────────────────┐
      │    RESOLVED     │                       │   EXCEPTION     │
      │ (was exception, │                       │ (still has      │
      │   now fixed)    │                       │  violations)    │
      └─────────────────┘                       └─────────────────┘
```

## Season Closure

At end of season:

```
VALIDATED ──┐
            │
RESOLVED ───┼──────► LOCKED (immutable)
            │
EXCEPTION ──┘  (requires resolution first)
```

Once `LOCKED`, transactions cannot be modified.

## Resolution Actions

When fixing an `EXCEPTION` transaction, these actions are available:

| Action | Description |
|--------|-------------|
| `REVALIDATE` | Run validation again after user makes corrections |
| `OVERRIDE` | Override the violation with justification (requires authorization) |
| `CORRECT` | Directly correct transaction data (category, vendor, etc.) |

## Compliance Score

Each transaction receives a compliance score (0-100):

- **100**: No violations
- **95**: Minor INFO violations only
- **85**: WARNING violations present
- **<70**: ERROR/CRITICAL violations

Score penalties by severity:
- INFO: 0 points
- WARNING: 5 points
- ERROR: 15 points
- CRITICAL: 30 points

---

## Source References

- `prisma/schema.prisma` - TransactionStatus enum (line 1517)
- `lib/types/validation.ts` - Violation severities and codes
- `lib/services/validation-engine-v1.ts` - Validation rules implementation
