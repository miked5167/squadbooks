/**
 * GTHL Authorization Rules Engine for Spend Intents
 *
 * This module implements the authorization logic for determining whether a spend intent
 * can proceed under standing budget authorization or requires manual signer approval.
 *
 * Key Rules:
 * - Standing authorization applies ONLY if ALL conditions are met:
 *   1. Budget line item is present
 *   2. Budget is approved
 *   3. Vendor is known/recognized
 *   4. Treasurer is NOT the payee
 *
 * - Otherwise, manual signer approval is required
 *
 * This is a pure function with no database calls or side effects.
 */

import type { PaymentMethod, AuthorizationType } from '@prisma/client'

/**
 * Input parameters for the authorization rules engine
 */
export interface AuthorizationRulesInput {
  /** Amount in cents (integer) */
  amountCents: number

  /** Payment method being used */
  paymentMethod: PaymentMethod

  /** Whether this spend is linked to a budget line item */
  budgetLineItemId: string | null

  /** Whether the budget has been approved by parents */
  budgetApproved: boolean

  /** Whether the vendor is recognized/known in the system */
  vendorIsKnown: boolean

  /** Whether the treasurer is the payee (conflict of interest) */
  treasurerIsPayee: boolean

  /** Team-specific settings (optional overrides) */
  teamSettings?: {
    /** Dual approval threshold in cents (default: 20000 = $200) */
    dualApprovalThreshold?: number
  }
}

/**
 * Output from the authorization rules engine
 */
export interface AuthorizationRulesResult {
  /** Whether this spend requires manual approval from signers */
  requiresManualApproval: boolean

  /** The type of authorization required */
  authorizationType: AuthorizationType

  /** Number of required approvals (typically 2 for dual approval) */
  requiredApprovalsCount: number

  /** Minimum number of independent parent representatives required */
  minIndependentParentRepCount: number

  /** Human-readable explanation of why this authorization type was chosen */
  reason: string

  /** Specific conditions that were evaluated */
  conditions: {
    hasBudgetLineItem: boolean
    budgetApproved: boolean
    vendorKnown: boolean
    noTreasurerConflict: boolean
  }
}

/**
 * Default configuration values
 */
const DEFAULTS = {
  DUAL_APPROVAL_THRESHOLD_CENTS: 20000, // $200.00
  REQUIRED_APPROVALS_COUNT: 2,
  MIN_INDEPENDENT_PARENT_REP_COUNT: 1,
} as const

/**
 * Determines the authorization requirements for a spend intent
 *
 * This is a pure function that applies GTHL authorization rules to determine
 * whether a spend can proceed under standing budget authorization or requires
 * manual signer approval.
 *
 * @param input - The authorization input parameters
 * @returns Authorization rules result with decision and metadata
 *
 * @example
 * ```typescript
 * const result = determineAuthorizationRequirements({
 *   amountCents: 25000,
 *   paymentMethod: 'E_TRANSFER',
 *   budgetLineItemId: 'budget_123',
 *   budgetApproved: true,
 *   vendorIsKnown: true,
 *   treasurerIsPayee: false,
 * });
 *
 * if (result.authorizationType === 'STANDING_BUDGET_AUTHORIZATION') {
 *   // Proceed automatically
 * } else {
 *   // Require manual approvals
 * }
 * ```
 */
export function determineAuthorizationRequirements(
  input: AuthorizationRulesInput
): AuthorizationRulesResult {
  // Extract input parameters
  const {
    amountCents,
    paymentMethod,
    budgetLineItemId,
    budgetApproved,
    vendorIsKnown,
    treasurerIsPayee,
    teamSettings,
  } = input

  // Evaluate individual conditions
  const conditions = {
    hasBudgetLineItem: budgetLineItemId !== null && budgetLineItemId !== '',
    budgetApproved: budgetApproved === true,
    vendorKnown: vendorIsKnown === true,
    noTreasurerConflict: treasurerIsPayee === false,
  }

  // Standing authorization applies ONLY if ALL conditions are true
  const canUseStandingAuthorization =
    conditions.hasBudgetLineItem &&
    conditions.budgetApproved &&
    conditions.vendorKnown &&
    conditions.noTreasurerConflict

  if (canUseStandingAuthorization) {
    // Standing budget authorization - no manual approval needed
    return {
      requiresManualApproval: false,
      authorizationType: 'STANDING_BUDGET_AUTHORIZATION',
      requiredApprovalsCount: 0, // No approvals needed for standing authorization
      minIndependentParentRepCount: 0, // Not applicable for standing authorization
      reason:
        'Spend qualifies for standing budget authorization (budgeted, approved, known vendor, no conflict)',
      conditions,
    }
  }

  // Manual signer approval is required - determine why
  const reasons: string[] = []

  if (!conditions.hasBudgetLineItem) {
    reasons.push('no budget line item')
  }
  if (!conditions.budgetApproved) {
    reasons.push('budget not approved')
  }
  if (!conditions.vendorKnown) {
    reasons.push('unknown vendor')
  }
  if (!conditions.noTreasurerConflict) {
    reasons.push('treasurer is payee (conflict of interest)')
  }

  const reasonText =
    reasons.length > 0
      ? `Manual approval required: ${reasons.join(', ')}`
      : 'Manual approval required'

  return {
    requiresManualApproval: true,
    authorizationType: 'MANUAL_SIGNER_APPROVAL',
    requiredApprovalsCount: DEFAULTS.REQUIRED_APPROVALS_COUNT,
    minIndependentParentRepCount: DEFAULTS.MIN_INDEPENDENT_PARENT_REP_COUNT,
    reason: reasonText,
    conditions,
  }
}

/**
 * Helper function to check if a spend amount exceeds the dual approval threshold
 *
 * This is useful for additional validation but doesn't affect the authorization type.
 * Even standing authorization spends may exceed thresholds and trigger additional checks.
 *
 * @param amountCents - Amount in cents
 * @param teamSettings - Optional team settings with custom threshold
 * @returns Whether the amount exceeds the threshold
 */
export function exceedsDualApprovalThreshold(
  amountCents: number,
  teamSettings?: { dualApprovalThreshold?: number }
): boolean {
  const threshold = teamSettings?.dualApprovalThreshold ?? DEFAULTS.DUAL_APPROVAL_THRESHOLD_CENTS
  return amountCents >= threshold
}

/**
 * Helper function to validate authorization input
 *
 * @param input - The authorization input to validate
 * @returns Validation result with any errors
 */
export function validateAuthorizationInput(input: Partial<AuthorizationRulesInput>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (input.amountCents === undefined || input.amountCents === null) {
    errors.push('amountCents is required')
  } else if (input.amountCents < 0) {
    errors.push('amountCents must be non-negative')
  } else if (!Number.isInteger(input.amountCents)) {
    errors.push('amountCents must be an integer')
  }

  if (!input.paymentMethod) {
    errors.push('paymentMethod is required')
  } else if (!['CASH', 'CHEQUE', 'E_TRANSFER'].includes(input.paymentMethod)) {
    errors.push('paymentMethod must be CASH, CHEQUE, or E_TRANSFER')
  }

  if (input.budgetApproved === undefined || input.budgetApproved === null) {
    errors.push('budgetApproved is required')
  }

  if (input.vendorIsKnown === undefined || input.vendorIsKnown === null) {
    errors.push('vendorIsKnown is required')
  }

  if (input.treasurerIsPayee === undefined || input.treasurerIsPayee === null) {
    errors.push('treasurerIsPayee is required')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
