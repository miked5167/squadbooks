/**
 * Transaction validation engine for the validation-first lifecycle model
 */

import {
  ValidationResult,
  ValidationContext,
  Violation,
  ViolationCode,
  ViolationSeverity,
  ValidationChecks,
} from '@/lib/types/validation'

/**
 * Compute validation result for a transaction
 *
 * @param context - Transaction and budget context
 * @returns Validation result with compliance status and violations
 */
export async function computeValidation(
  context: ValidationContext
): Promise<ValidationResult> {
  const violations: Violation[] = []
  const checksRun: ValidationChecks = {
    budget: false,
    receipt: false,
    category: false,
    envelope: false,
    threshold: false,
    associationRules: false,
    dates: false,
    vendor: false,
    duplicates: false,
  }

  // 1. Category validation
  checksRun.category = true
  if (!context.transaction.categoryId && !context.transaction.systemCategoryId) {
    violations.push({
      code: ViolationCode.UNCATEGORIZED,
      severity: ViolationSeverity.ERROR,
      message: 'Transaction must be assigned to a category',
    })
  }

  // 2. Receipt validation (only for expenses)
  if (context.transaction.type === 'EXPENSE') {
    checksRun.receipt = true
    const requiresReceipt =
      context.transaction.amount >= context.teamSettings.receiptThreshold

    if (requiresReceipt && !context.transaction.receiptUrl) {
      violations.push({
        code: ViolationCode.MISSING_RECEIPT,
        severity: ViolationSeverity.ERROR,
        message: `Receipt required for expenses $${context.teamSettings.receiptThreshold} or more`,
        metadata: {
          amount: context.transaction.amount,
          threshold: context.teamSettings.receiptThreshold,
        },
      })
    }
  }

  // 3. Budget compliance check
  if (context.budget && context.transaction.type === 'EXPENSE') {
    checksRun.budget = true
    const categoryId =
      context.transaction.systemCategoryId || context.transaction.categoryId

    if (categoryId) {
      const allocation = context.budget.allocations.find(
        (a) => a.categoryId === categoryId
      )

      if (!allocation) {
        violations.push({
          code: ViolationCode.CATEGORY_NOT_ALLOCATED,
          severity: ViolationSeverity.ERROR,
          message: 'Category not allocated in current budget',
          metadata: { categoryId },
        })
      } else {
        const remaining = allocation.allocated - allocation.spent

        if (context.transaction.amount > remaining) {
          violations.push({
            code: ViolationCode.CATEGORY_OVER_LIMIT,
            severity: ViolationSeverity.ERROR,
            message: `Transaction amount $${context.transaction.amount.toFixed(2)} exceeds remaining budget $${remaining.toFixed(2)}`,
            metadata: {
              amount: context.transaction.amount,
              allocated: allocation.allocated,
              spent: allocation.spent,
              remaining,
            },
          })
        }
      }
    }
  }

  // 4. Envelope check (pre-authorized spending)
  if (context.envelopes && context.transaction.type === 'EXPENSE') {
    checksRun.envelope = true
    const matchingEnvelope = findMatchingEnvelope(context)

    if (matchingEnvelope) {
      // Has pre-authorization, but check limits
      const remaining = matchingEnvelope.capAmount - matchingEnvelope.spent

      if (context.transaction.amount > remaining) {
        violations.push({
          code: ViolationCode.ENVELOPE_CAP_EXCEEDED,
          severity: ViolationSeverity.ERROR,
          message: 'Transaction exceeds pre-authorized envelope cap',
          metadata: {
            envelopeId: matchingEnvelope.id,
            cap: matchingEnvelope.capAmount,
            spent: matchingEnvelope.spent,
            remaining,
          },
        })
      }

      if (
        matchingEnvelope.maxSingleTransaction &&
        context.transaction.amount > matchingEnvelope.maxSingleTransaction
      ) {
        violations.push({
          code: ViolationCode.LARGE_TRANSACTION,
          severity: ViolationSeverity.WARNING,
          message: 'Transaction exceeds single transaction limit for envelope',
          metadata: {
            amount: context.transaction.amount,
            limit: matchingEnvelope.maxSingleTransaction,
          },
        })
      }
    }
  }

  // 5. Threshold check
  checksRun.threshold = true
  if (
    context.transaction.type === 'EXPENSE' &&
    context.transaction.amount >= context.teamSettings.largeTransactionThreshold
  ) {
    violations.push({
      code: ViolationCode.THRESHOLD_BREACH,
      severity: ViolationSeverity.WARNING,
      message: `Large transaction exceeds $${context.teamSettings.largeTransactionThreshold} threshold`,
      metadata: {
        amount: context.transaction.amount,
        threshold: context.teamSettings.largeTransactionThreshold,
      },
    })
  }

  // 6. Date validation
  checksRun.dates = true
  const now = new Date()
  const txnDate = new Date(context.transaction.transactionDate)

  if (txnDate > now) {
    violations.push({
      code: ViolationCode.TRANSACTION_TOO_FUTURE,
      severity: ViolationSeverity.ERROR,
      message: 'Transaction date cannot be in the future',
      metadata: { transactionDate: txnDate },
    })
  }

  if (context.season) {
    if (txnDate < context.season.startDate || txnDate > context.season.endDate) {
      violations.push({
        code: ViolationCode.OUTSIDE_SEASON_DATES,
        severity: ViolationSeverity.WARNING,
        message: 'Transaction date is outside season dates',
        metadata: {
          transactionDate: txnDate,
          seasonStart: context.season.startDate,
          seasonEnd: context.season.endDate,
        },
      })
    }
  }

  // 7. Vendor validation (cash-like detection)
  checksRun.vendor = true
  const cashLikeVendors = [
    'venmo',
    'cash app',
    'cashapp',
    'paypal',
    'zelle',
    'apple pay',
    'google pay',
  ]
  const vendorLower = context.transaction.vendor.toLowerCase()

  if (cashLikeVendors.some((v) => vendorLower.includes(v))) {
    violations.push({
      code: ViolationCode.CASH_LIKE_TRANSACTION,
      severity: ViolationSeverity.WARNING,
      message: 'Cash-like payment method detected - ensure proper documentation',
      metadata: { vendor: context.transaction.vendor },
    })
  }

  // 8. Association rules (placeholder for future expansion)
  if (context.associationRules && context.associationRules.length > 0) {
    checksRun.associationRules = true
    // TODO: Implement custom association rule validation
  }

  // Determine overall compliance
  // Only ERROR and CRITICAL violations block compliance
  const blockingViolations = violations.filter(
    (v) =>
      v.severity === ViolationSeverity.ERROR ||
      v.severity === ViolationSeverity.CRITICAL
  )
  const compliant = blockingViolations.length === 0

  // Optional: Calculate compliance score (0-100)
  const score = calculateComplianceScore(violations)

  return {
    compliant,
    violations,
    score,
    validatedAt: new Date(),
    checksRun,
  }
}

/**
 * Derive transaction status from validation result
 *
 * @param validation - Validation result
 * @param currentStatus - Current transaction status (optional)
 * @returns New status to set
 */
export function deriveStatusFromValidation(
  validation: ValidationResult,
  currentStatus?: string
): 'VALIDATED' | 'EXCEPTION' {
  // If compliant, transaction is validated
  if (validation.compliant) {
    return 'VALIDATED'
  }

  // If not compliant, transaction needs exception review
  return 'EXCEPTION'
}

/**
 * Find matching envelope for transaction
 */
function findMatchingEnvelope(context: ValidationContext) {
  if (!context.envelopes) return null

  const categoryId =
    context.transaction.systemCategoryId || context.transaction.categoryId

  if (!categoryId) return null

  return context.envelopes.find((envelope) => {
    // Category must match
    if (envelope.categoryId !== categoryId) return false

    // Check vendor match
    if (envelope.vendorMatchType === 'ANY') return true

    if (envelope.vendorMatch) {
      const vendorLower = context.transaction.vendor.toLowerCase()
      const matchLower = envelope.vendorMatch.toLowerCase()

      if (envelope.vendorMatchType === 'EXACT') {
        return vendorLower === matchLower
      } else if (envelope.vendorMatchType === 'CONTAINS') {
        return vendorLower.includes(matchLower)
      }
    }

    return false
  })
}

/**
 * Calculate compliance score (0-100)
 * Higher score = better compliance
 */
function calculateComplianceScore(violations: Violation[]): number {
  if (violations.length === 0) return 100

  // Weight violations by severity
  const weights = {
    [ViolationSeverity.INFO]: 0,
    [ViolationSeverity.WARNING]: 5,
    [ViolationSeverity.ERROR]: 20,
    [ViolationSeverity.CRITICAL]: 40,
  }

  const totalPenalty = violations.reduce(
    (sum, v) => sum + weights[v.severity],
    0
  )

  const score = Math.max(0, 100 - totalPenalty)
  return score
}

/**
 * Check if a violation code should block a transaction
 */
export function isBlockingViolation(code: ViolationCode): boolean {
  const blockingCodes = [
    ViolationCode.BUDGET_OVERRUN,
    ViolationCode.CATEGORY_OVER_LIMIT,
    ViolationCode.CATEGORY_NOT_ALLOCATED,
    ViolationCode.ENVELOPE_CAP_EXCEEDED,
    ViolationCode.MISSING_RECEIPT,
    ViolationCode.UNAPPROVED_CATEGORY,
    ViolationCode.INVALID_CATEGORY,
    ViolationCode.UNCATEGORIZED,
    ViolationCode.TRANSACTION_TOO_FUTURE,
    ViolationCode.MISSING_REQUIRED_FIELD,
    ViolationCode.INVALID_AMOUNT,
  ]

  return blockingCodes.includes(code)
}

/**
 * Get human-readable description of violation severity
 */
export function getViolationSeverityLabel(severity: ViolationSeverity): string {
  const labels = {
    [ViolationSeverity.INFO]: 'Information',
    [ViolationSeverity.WARNING]: 'Warning',
    [ViolationSeverity.ERROR]: 'Error',
    [ViolationSeverity.CRITICAL]: 'Critical',
  }
  return labels[severity]
}

/**
 * Get display color for violation severity
 */
export function getViolationSeverityColor(
  severity: ViolationSeverity
): string {
  const colors = {
    [ViolationSeverity.INFO]: 'blue',
    [ViolationSeverity.WARNING]: 'yellow',
    [ViolationSeverity.ERROR]: 'red',
    [ViolationSeverity.CRITICAL]: 'red',
  }
  return colors[severity]
}
