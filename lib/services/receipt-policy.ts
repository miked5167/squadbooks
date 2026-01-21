/**
 * Receipt Policy Calculation Logic
 *
 * Implements association-level receipt policies with optional team overrides and category thresholds.
 */

export interface ReceiptPolicyConfig {
  // Association-level settings
  receiptsEnabled: boolean
  receiptGlobalThresholdCents: number
  receiptGracePeriodDays: number
  receiptCategoryThresholdsEnabled: boolean
  receiptCategoryOverrides: Record<
    string,
    {
      thresholdCents?: number
      exempt?: boolean
    }
  >
  allowedTeamThresholdOverride: boolean

  // Team-level override (optional)
  teamReceiptGlobalThresholdOverrideCents?: number | null
}

export interface ReceiptRequirement {
  required: boolean
  thresholdCents: number
  source: 'exempt' | 'category' | 'team' | 'association' | 'disabled'
  gracePeriodDays: number
}

/**
 * Calculate effective receipt threshold for a transaction
 *
 * Business rules:
 * 1. If receipts disabled globally -> receipt optional
 * 2. If category exempt -> receipt optional
 * 3. Calculate effective threshold:
 *    - Start with association global threshold
 *    - If team override allowed AND team override exists -> use MIN(association, team)
 *    - If category thresholds enabled AND category override exists -> use category threshold
 * 4. Receipt required if amount >= effective threshold
 */
export function calculateReceiptRequirement(
  amountCents: number,
  categoryId: string | null,
  policy: ReceiptPolicyConfig
): ReceiptRequirement {
  // Rule 1: If receipts disabled globally, receipt is optional
  if (!policy.receiptsEnabled) {
    return {
      required: false,
      thresholdCents: 0,
      source: 'disabled',
      gracePeriodDays: policy.receiptGracePeriodDays,
    }
  }

  // Rule 2: Check if category is exempt
  if (
    policy.receiptCategoryThresholdsEnabled &&
    categoryId &&
    policy.receiptCategoryOverrides[categoryId]?.exempt
  ) {
    return {
      required: false,
      thresholdCents: 0,
      source: 'exempt',
      gracePeriodDays: policy.receiptGracePeriodDays,
    }
  }

  // Rule 3: Calculate effective threshold
  let effectiveThreshold = policy.receiptGlobalThresholdCents
  let source: ReceiptRequirement['source'] = 'association'

  // Apply team override if allowed and exists (must be stricter - lower amount)
  if (
    policy.allowedTeamThresholdOverride &&
    policy.teamReceiptGlobalThresholdOverrideCents !== null &&
    policy.teamReceiptGlobalThresholdOverrideCents !== undefined
  ) {
    effectiveThreshold = Math.min(
      effectiveThreshold,
      policy.teamReceiptGlobalThresholdOverrideCents
    )
    source = 'team'
  }

  // Apply category-specific threshold if enabled
  if (
    policy.receiptCategoryThresholdsEnabled &&
    categoryId &&
    policy.receiptCategoryOverrides[categoryId]?.thresholdCents !== undefined
  ) {
    const categoryThreshold = policy.receiptCategoryOverrides[categoryId].thresholdCents!
    // Category threshold replaces the effective threshold entirely
    effectiveThreshold = categoryThreshold
    source = 'category'
  }

  // Rule 4: Determine if receipt is required
  const required = amountCents >= effectiveThreshold

  return {
    required,
    thresholdCents: effectiveThreshold,
    source,
    gracePeriodDays: policy.receiptGracePeriodDays,
  }
}

/**
 * Check if transaction is within grace period for receipt upload
 */
export function isWithinGracePeriod(
  transactionDate: Date,
  gracePeriodDays: number,
  currentDate: Date = new Date()
): boolean {
  const gracePeriodMs = gracePeriodDays * 24 * 60 * 60 * 1000
  const elapsedMs = currentDate.getTime() - transactionDate.getTime()
  return elapsedMs < gracePeriodMs
}

/**
 * Determine receipt status for a transaction
 *
 * Returns:
 * - 'NONE': Receipt not required
 * - 'ATTACHED': Receipt required and present
 * - 'REQUIRED_MISSING': Receipt required but missing
 */
export function getReceiptStatus(
  hasReceipt: boolean,
  requirement: ReceiptRequirement
): 'NONE' | 'ATTACHED' | 'REQUIRED_MISSING' {
  if (!requirement.required) {
    return 'NONE'
  }

  return hasReceipt ? 'ATTACHED' : 'REQUIRED_MISSING'
}
