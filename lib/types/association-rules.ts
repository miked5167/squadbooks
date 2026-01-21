/**
 * Association Rules for Transaction Validation
 *
 * These rules define thresholds and toggles that control validation behavior
 */

export interface AssociationRules {
  // Transaction amount limit - any transaction over this requires review
  transactionAmountLimit: number

  // Category overrun tolerance as a percentage (e.g., 10 = 10% over budget allowed)
  categoryOverrunTolerancePercent: number

  // Receipt required for expenses over this amount
  receiptRequiredOverAmount: number

  // Whether cash-like transactions (cash, gift cards, etc.) require review
  cashLikeRequiresReview: boolean

  // Whether approval is required when budget changes
  requireApprovalOnBudgetChange: boolean
}

/**
 * Default association rules (conservative defaults)
 */
export const DEFAULT_ASSOCIATION_RULES: AssociationRules = {
  transactionAmountLimit: 1000, // $1000 max per transaction
  categoryOverrunTolerancePercent: 0, // No overrun allowed
  receiptRequiredOverAmount: 100, // Receipt required for $100+
  cashLikeRequiresReview: true, // Cash-like transactions need review
  requireApprovalOnBudgetChange: false, // Budget changes don't auto-flag
}

/**
 * Cash-like transaction types and vendors
 */
export const CASH_LIKE_VENDORS = [
  'cash',
  'petty cash',
  'gift card',
  'prepaid card',
  'visa gift',
  'mastercard gift',
  'reloadable card',
  'money order',
]

/**
 * Check if a transaction is cash-like based on vendor or description
 */
export function isCashLikeTransaction(vendor: string, description?: string): boolean {
  const text = `${vendor} ${description || ''}`.toLowerCase()
  return CASH_LIKE_VENDORS.some(cashType => text.includes(cashType))
}

/**
 * Calculate the percentage over budget for a category
 */
export function calculateOverrunPercentage(
  allocated: number,
  spent: number,
  newAmount: number
): number {
  if (allocated === 0) return Infinity
  const totalSpent = spent + newAmount
  const overage = totalSpent - allocated
  return (overage / allocated) * 100
}
