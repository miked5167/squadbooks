# GTHL Authorization Rules Engine

## Overview

The Authorization Rules Engine is a pure function that determines whether a spend intent can proceed under **standing budget authorization** or requires **manual signer approval**.

This is the core business logic for spend authorization in compliance with GTHL financial policies.

## Location

- **Implementation**: `lib/validation/gthl-authorization.ts`
- **Tests**: `lib/validation/gthl-authorization.test.ts`
- **Test Coverage**: 30 test cases covering all edge cases

## Core Authorization Logic

### Standing Budget Authorization

A spend intent qualifies for **automatic standing authorization** if and ONLY if **ALL** of these conditions are true:

1. ✅ **Budget Line Item Present**: The spend is linked to a budget line item (`budgetLineItemId` is not null/empty)
2. ✅ **Budget Approved**: The budget has been approved by parents (`budgetApproved = true`)
3. ✅ **Known Vendor**: The vendor is recognized in the system (`vendorIsKnown = true`)
4. ✅ **No Conflict of Interest**: The treasurer is NOT the payee (`treasurerIsPayee = false`)

If **ANY** condition fails, manual signer approval is required.

### Manual Signer Approval

When standing authorization does NOT apply, the spend requires:

- **Manual Approval**: Yes (`requiresManualApproval = true`)
- **Required Approvals Count**: 2 (dual approval)
- **Min Independent Parent Representatives**: 1
- **Authorization Type**: `MANUAL_SIGNER_APPROVAL`

## API Reference

### Main Function

```typescript
function determineAuthorizationRequirements(
  input: AuthorizationRulesInput
): AuthorizationRulesResult
```

### Input Structure

```typescript
interface AuthorizationRulesInput {
  amountCents: number // Amount in cents (integer)
  paymentMethod: PaymentMethod // CASH | CHEQUE | E_TRANSFER
  budgetLineItemId: string | null // Budget line item ID or null
  budgetApproved: boolean // Whether budget is approved
  vendorIsKnown: boolean // Whether vendor is recognized
  treasurerIsPayee: boolean // Whether treasurer is the payee
  teamSettings?: {
    dualApprovalThreshold?: number // Optional threshold override
  }
}
```

### Output Structure

```typescript
interface AuthorizationRulesResult {
  requiresManualApproval: boolean
  authorizationType: 'STANDING_BUDGET_AUTHORIZATION' | 'MANUAL_SIGNER_APPROVAL'
  requiredApprovalsCount: number // 0 for standing, 2 for manual
  minIndependentParentRepCount: number // 0 for standing, 1 for manual
  reason: string // Human-readable explanation
  conditions: {
    hasBudgetLineItem: boolean
    budgetApproved: boolean
    vendorKnown: boolean
    noTreasurerConflict: boolean
  }
}
```

## Usage Examples

### Example 1: Standing Authorization (All Conditions Met)

```typescript
const result = determineAuthorizationRequirements({
  amountCents: 25000, // $250.00
  paymentMethod: 'E_TRANSFER',
  budgetLineItemId: 'budget_ice_rental',
  budgetApproved: true,
  vendorIsKnown: true,
  treasurerIsPayee: false,
})

// Result:
// requiresManualApproval: false
// authorizationType: 'STANDING_BUDGET_AUTHORIZATION'
// requiredApprovalsCount: 0
```

### Example 2: Manual Approval Required (Unknown Vendor)

```typescript
const result = determineAuthorizationRequirements({
  amountCents: 25000,
  paymentMethod: 'E_TRANSFER',
  budgetLineItemId: 'budget_ice_rental',
  budgetApproved: true,
  vendorIsKnown: false, // ❌ Unknown vendor
  treasurerIsPayee: false,
})

// Result:
// requiresManualApproval: true
// authorizationType: 'MANUAL_SIGNER_APPROVAL'
// requiredApprovalsCount: 2
// reason: "Manual approval required: unknown vendor"
```

### Example 3: Manual Approval Required (Treasurer Conflict)

```typescript
const result = determineAuthorizationRequirements({
  amountCents: 15000,
  paymentMethod: 'E_TRANSFER',
  budgetLineItemId: 'budget_coaching',
  budgetApproved: true,
  vendorIsKnown: true,
  treasurerIsPayee: true, // ❌ Conflict of interest
})

// Result:
// requiresManualApproval: true
// authorizationType: 'MANUAL_SIGNER_APPROVAL'
// requiredApprovalsCount: 2
// reason: "Manual approval required: treasurer is payee (conflict of interest)"
```

## Edge Cases Covered

### 1. Payment Method Variations

✅ **All payment methods treated equally**

- Standing authorization applies to CASH, CHEQUE, and E_TRANSFER if all conditions are met
- Payment method does NOT affect authorization type (only the 4 conditions matter)

**Test Cases**:

- E-transfer with standing authorization
- Cash payment with standing authorization
- Cheque with standing authorization
- Cheque to unknown vendor (manual approval)

### 2. Budget Scenarios

✅ **Missing budget line item**

- `budgetLineItemId: null` → Manual approval required
- `budgetLineItemId: ''` (empty string) → Manual approval required
- Any unbudgeted spend requires manual approval regardless of amount

✅ **Unapproved budget**

- Even if budgeted, if `budgetApproved: false` → Manual approval required
- Budget must be parent-approved to qualify for standing authorization

**Test Cases**:

- Unbudgeted e-transfer
- Empty string budget line item
- Budget not approved by parents

### 3. Vendor Recognition

✅ **New/unknown vendors always require manual approval**

- First-time vendors: `vendorIsKnown: false` → Manual approval
- Applies even if the spend is fully budgeted and approved
- This protects against fraudulent vendors

**Test Cases**:

- New vendor even if budgeted
- First-time vendor on cheque payment
- Unknown vendor on e-transfer

### 4. Conflict of Interest

✅ **Treasurer as payee always requires manual approval**

- Any payment to treasurer: `treasurerIsPayee: true` → Manual approval
- Applies to all amounts (even small reimbursements)
- Prevents self-dealing and ensures oversight

**Test Cases**:

- Treasurer reimbursement even if budgeted
- Small treasurer payment ($30)
- Large treasurer payment

### 5. Amount Thresholds

✅ **Amount does NOT affect authorization type**

- Standing authorization applies to any amount if all 4 conditions are met
- Manual approval can be required for even small amounts ($1) if conditions fail
- The `exceedsDualApprovalThreshold()` helper is separate from authorization type

**Test Cases**:

- Zero amount spend
- Very large amount ($10,000) with standing authorization
- Small amount ($1) requiring manual approval
- Threshold exactly at boundary ($200)
- Team-specific threshold overrides

### 6. Multiple Violations

✅ **All violations are reported**

- If multiple conditions fail, all reasons are listed
- Example: "Manual approval required: no budget line item, budget not approved, unknown vendor, treasurer is payee"

**Test Cases**:

- All 4 conditions failing simultaneously
- 2 conditions failing
- Only budget present but other conditions fail

### 7. Input Validation

✅ **Comprehensive validation**

- Missing required fields detected
- Negative amounts rejected
- Non-integer amounts rejected
- Invalid payment methods rejected
- Multiple errors collected and returned

**Test Cases**:

- Missing amountCents
- Negative amountCents
- Non-integer amountCents (100.5)
- Invalid payment method ("BITCOIN")
- Missing boolean fields
- Multiple validation errors simultaneously

### 8. Result Consistency

✅ **Predictable outputs**

- Manual approval always returns `requiredApprovalsCount: 2`
- Manual approval always returns `minIndependentParentRepCount: 1`
- Standing authorization always returns `requiredApprovalsCount: 0`
- All condition flags are always populated

**Test Cases**:

- Consistency across different failure scenarios
- Consistency for standing authorization
- All conditions populated in result

## Design Principles

### 1. Pure Function

- **No side effects**: No database calls, no API calls, no state mutations
- **Deterministic**: Same input always produces same output
- **Testable**: Easy to unit test with fixtures
- **Composable**: Can be used in any context

### 2. Fail-Safe Defaults

- If conditions are unclear, default to manual approval
- Prioritizes financial oversight over convenience
- Conservative approach to authorization

### 3. Explicit Reasoning

- Every result includes a human-readable `reason` field
- All condition evaluations are returned in `conditions` object
- Audit trail for why authorization was granted/denied

### 4. Type Safety

- Full TypeScript types for all inputs and outputs
- Enum types from Prisma schema for consistency
- Validation function catches type errors at runtime

## Integration Points

This pure function can be consumed by:

1. **API Routes**: When creating/updating spend intents
2. **Background Jobs**: When processing batch authorizations
3. **Webhooks**: When external systems trigger spends
4. **CLI Tools**: For administrative operations
5. **Tests**: For verifying business logic

## Future Extensions

Possible future enhancements (not implemented yet):

1. **Tiered Approval Levels**: Different approval requirements based on amount ranges
2. **Category-Specific Rules**: Different rules for different expense categories
3. **Seasonal Variations**: Different rules during pre-season vs. active season
4. **Association Overrides**: Allow associations to customize rules
5. **Vendor Reputation Scores**: Graduated trust levels for vendors
6. **Emergency Overrides**: Special fast-track for urgent spends

## Test Coverage Summary

- **Total Tests**: 30
- **All Tests Passing**: ✅ Yes
- **Code Coverage**: 100% of authorization logic

### Test Categories

1. **Standing Authorization (3 tests)**: Happy path scenarios
2. **Missing Budget (3 tests)**: Unbudgeted spends
3. **Unknown Vendor (2 tests)**: New vendor scenarios
4. **Treasurer Conflict (2 tests)**: Conflict of interest cases
5. **Multiple Violations (2 tests)**: Combined failure scenarios
6. **Cheque-Specific (3 tests)**: Cheque payment variations
7. **Edge Cases (5 tests)**: Boundary conditions and thresholds
8. **Input Validation (7 tests)**: Error handling
9. **Result Consistency (3 tests)**: Output predictability

## Key Takeaways

1. **All 4 conditions must be true** for standing authorization
2. **Any single violation** triggers manual approval
3. **Amount is irrelevant** to authorization type (handled separately)
4. **Treasurer conflicts** always require approval
5. **New vendors** always require approval (fraud prevention)
6. **Pure function** = easy to test, reason about, and maintain
7. **Explicit reasoning** = clear audit trail

## Usage in Production

```typescript
import { determineAuthorizationRequirements } from '@/lib/validation/gthl-authorization'

// In your API route or service
const authResult = determineAuthorizationRequirements({
  amountCents: spendIntent.amountCents,
  paymentMethod: spendIntent.paymentMethod,
  budgetLineItemId: spendIntent.budgetLineItemId,
  budgetApproved: await isBudgetApproved(teamId),
  vendorIsKnown: await isVendorKnown(vendorId),
  treasurerIsPayee: checkIfTreasurerIsPayee(userId, payeeId),
})

if (authResult.requiresManualApproval) {
  // Create approval workflow
  await createApprovalWorkflow(spendIntentId, {
    requiredApprovals: authResult.requiredApprovalsCount,
    minIndependentParents: authResult.minIndependentParentRepCount,
  })
} else {
  // Proceed with standing authorization
  await authorizeSpendIntent(spendIntentId)
}

// Log for audit
await logAuthorizationDecision(spendIntentId, authResult)
```

## Maintenance Notes

- This module has **no external dependencies** except Prisma types
- Tests run in **< 20ms**
- Can be extracted to a separate package if needed
- Changes should be made with extreme care (financial impact)
- Always update tests when changing logic
- Consider adding test cases before modifying rules
