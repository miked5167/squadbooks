/**
 * Rules-Based Validation Engine V1
 *
 * Implements 5 core validation rules for transaction compliance:
 * 1. Unapproved category -> exception
 * 2. Category overrun beyond tolerance -> exception
 * 3. Missing receipt beyond threshold -> exception
 * 4. Transaction over limit -> exception
 * 5. Cash-like types -> exception (severity medium unless over limit)
 */

import {
  ValidationResult,
  ValidationContext,
  Violation,
  ViolationCode,
  ViolationSeverity,
} from '@/lib/types/validation'
import {
  isCashLikeTransaction,
  calculateOverrunPercentage,
  DEFAULT_ASSOCIATION_RULES,
} from '@/lib/types/association-rules'

/**
 * Rule 1: Check if transaction category is in approved budget
 */
export function validateApprovedCategory(context: ValidationContext): Violation | null {
  const { transaction, budget } = context

  // If no budget, skip this check
  if (!budget) return null

  // If no category assigned, this is caught by uncategorized check
  if (!transaction.categoryId) return null

  // Check if category exists in budget allocations
  const categoryAllocation = budget.allocations.find(
    (a) => a.categoryId === transaction.categoryId
  )

  if (!categoryAllocation) {
    return {
      code: ViolationCode.UNAPPROVED_CATEGORY,
      severity: ViolationSeverity.ERROR,
      message: `Category not found in approved budget`,
      ruleId: 'RULE_1_UNAPPROVED_CATEGORY',
      metadata: {
        categoryId: transaction.categoryId,
        budgetId: budget.id,
      },
    }
  }

  return null
}

/**
 * Rule 2: Check if transaction causes category overrun beyond tolerance
 */
export function validateCategoryOverrun(context: ValidationContext): Violation | null {
  const { transaction, budget, associationRules } = context

  // Only check expenses
  if (transaction.type !== 'EXPENSE') return null

  // If no budget or category, skip this check
  if (!budget || !transaction.categoryId) return null

  // Find category allocation
  const allocation = budget.allocations.find(
    (a) => a.categoryId === transaction.categoryId
  )

  if (!allocation) return null // Caught by Rule 1

  // Get tolerance from association rules
  const rules = associationRules || DEFAULT_ASSOCIATION_RULES
  const tolerance = rules.categoryOverrunTolerancePercent

  // Calculate overrun percentage
  const overrunPercent = calculateOverrunPercentage(
    allocation.allocated,
    allocation.spent,
    transaction.amount
  )

  // If overrun exceeds tolerance, flag as violation
  if (overrunPercent > tolerance) {
    const newSpent = allocation.spent + transaction.amount
    const overage = newSpent - allocation.allocated

    return {
      code: ViolationCode.CATEGORY_OVER_LIMIT,
      severity: ViolationSeverity.ERROR,
      message: `Transaction would exceed category budget by ${overrunPercent.toFixed(1)}% (tolerance: ${tolerance}%)`,
      ruleId: 'RULE_2_CATEGORY_OVERRUN',
      metadata: {
        categoryId: transaction.categoryId,
        allocated: allocation.allocated,
        currentSpent: allocation.spent,
        newSpent,
        overage,
        overrunPercent: overrunPercent.toFixed(2),
        tolerance,
      },
    }
  }

  return null
}

/**
 * Rule 3: Check if receipt is required but missing
 */
export function validateRequiredReceipt(context: ValidationContext): Violation | null {
  const { transaction, associationRules } = context

  // Only check expenses
  if (transaction.type !== 'EXPENSE') return null

  // Get receipt threshold from association rules
  const rules = associationRules || DEFAULT_ASSOCIATION_RULES
  const threshold = rules.receiptRequiredOverAmount

  // Check if receipt is required
  const requiresReceipt = transaction.amount >= threshold

  // If receipt required but missing, flag violation
  if (requiresReceipt && !transaction.receiptUrl) {
    return {
      code: ViolationCode.MISSING_RECEIPT,
      severity: ViolationSeverity.ERROR,
      message: `Receipt required for expenses $${threshold} or more`,
      ruleId: 'RULE_3_MISSING_RECEIPT',
      metadata: {
        amount: transaction.amount,
        threshold,
        hasReceipt: false,
      },
    }
  }

  return null
}

/**
 * Rule 4: Check if transaction exceeds amount limit
 */
export function validateTransactionLimit(context: ValidationContext): Violation | null {
  const { transaction, associationRules } = context

  // Get limit from association rules
  const rules = associationRules || DEFAULT_ASSOCIATION_RULES
  const limit = rules.transactionAmountLimit

  // Check if transaction exceeds limit
  if (transaction.amount > limit) {
    return {
      code: ViolationCode.THRESHOLD_BREACH,
      severity: ViolationSeverity.ERROR,
      message: `Transaction amount $${transaction.amount} exceeds limit of $${limit}`,
      ruleId: 'RULE_4_TRANSACTION_LIMIT',
      metadata: {
        amount: transaction.amount,
        limit,
        overage: transaction.amount - limit,
      },
    }
  }

  return null
}

/**
 * Rule 5: Check if transaction is cash-like (requires review)
 */
export function validateCashLike(context: ValidationContext): Violation | null {
  const { transaction, associationRules } = context

  // Get setting from association rules
  const rules = associationRules || DEFAULT_ASSOCIATION_RULES

  // Skip if cash-like review not required
  if (!rules.cashLikeRequiresReview) return null

  // Check if transaction is cash-like
  const isCashLike = isCashLikeTransaction(
    transaction.vendor,
    transaction.description || undefined
  )

  if (isCashLike) {
    // Determine severity: CRITICAL if over limit, MEDIUM otherwise
    const limit = rules.transactionAmountLimit
    const severity =
      transaction.amount > limit ? ViolationSeverity.CRITICAL : ViolationSeverity.ERROR

    return {
      code: ViolationCode.CASH_LIKE_TRANSACTION,
      severity,
      message:
        severity === ViolationSeverity.CRITICAL
          ? `Cash-like transaction over limit ($${transaction.amount} > $${limit}) requires review`
          : `Cash-like transaction requires review`,
      ruleId: 'RULE_5_CASH_LIKE',
      metadata: {
        vendor: transaction.vendor,
        amount: transaction.amount,
        limit,
        overLimit: transaction.amount > limit,
      },
    }
  }

  return null
}

/**
 * Check if transaction is uncategorized
 */
export function validateCategorized(context: ValidationContext): Violation | null {
  const { transaction } = context

  // If no category assigned, flag as violation
  if (!transaction.categoryId && !transaction.systemCategoryId) {
    return {
      code: ViolationCode.UNCATEGORIZED,
      severity: ViolationSeverity.ERROR,
      message: 'Transaction must be assigned to a category',
      ruleId: 'VALIDATION_UNCATEGORIZED',
      metadata: {},
    }
  }

  return null
}

/**
 * Calculate compliance score based on violations
 */
export function calculateComplianceScore(violations: Violation[]): number {
  if (violations.length === 0) return 100

  // Weight violations by severity
  const severityWeights = {
    [ViolationSeverity.INFO]: 0,
    [ViolationSeverity.WARNING]: 5,
    [ViolationSeverity.ERROR]: 15,
    [ViolationSeverity.CRITICAL]: 30,
  }

  const totalPenalty = violations.reduce((sum, v) => {
    return sum + severityWeights[v.severity]
  }, 0)

  // Score is 100 minus total penalty, minimum 0
  return Math.max(0, 100 - totalPenalty)
}

/**
 * Main validation engine - runs all rules and returns ValidationResult
 */
export function validateTransaction(context: ValidationContext): ValidationResult {
  const violations: Violation[] = []

  // Run all validation rules
  const categoryCheck = validateCategorized(context)
  if (categoryCheck) violations.push(categoryCheck)

  const approvedCategoryCheck = validateApprovedCategory(context)
  if (approvedCategoryCheck) violations.push(approvedCategoryCheck)

  const overrunCheck = validateCategoryOverrun(context)
  if (overrunCheck) violations.push(overrunCheck)

  const receiptCheck = validateRequiredReceipt(context)
  if (receiptCheck) violations.push(receiptCheck)

  const limitCheck = validateTransactionLimit(context)
  if (limitCheck) violations.push(limitCheck)

  const cashLikeCheck = validateCashLike(context)
  if (cashLikeCheck) violations.push(cashLikeCheck)

  // Determine compliance (no ERROR or CRITICAL violations)
  const compliant = !violations.some(
    (v) => v.severity === ViolationSeverity.ERROR || v.severity === ViolationSeverity.CRITICAL
  )

  // Calculate score
  const score = calculateComplianceScore(violations)

  return {
    compliant,
    violations,
    score,
    validatedAt: new Date(),
    checksRun: {
      budget: context.budget !== undefined,
      receipt: true,
      category: true,
      envelope: false,
      threshold: true,
      associationRules: context.associationRules !== undefined,
      dates: false,
      vendor: true,
      duplicates: false,
    },
  }
}

/**
 * Derive transaction status from validation result
 */
export function deriveStatus(
  validation: ValidationResult
): 'VALIDATED' | 'EXCEPTION' {
  return validation.compliant ? 'VALIDATED' : 'EXCEPTION'
}
