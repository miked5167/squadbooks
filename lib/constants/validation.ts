/**
 * Validation constants for financial transactions
 */

/**
 * Minimum transaction amount that requires a receipt attachment
 * Expenses at or above this threshold cannot be approved without a receipt
 */
export const MANDATORY_RECEIPT_THRESHOLD = 250.0

/**
 * Default dual approval threshold
 * Transactions at or above this amount require approval from two authorized users
 */
export const DEFAULT_DUAL_APPROVAL_THRESHOLD = 200.0
