import { PendingApproval, PendingApprovalWithRisk, RiskLevel } from '../types/approvals'

// Default threshold amount - transactions above this require approval
const DEFAULT_THRESHOLD = 200

// High-risk vendor patterns (gas stations, cash-heavy businesses)
const HIGH_RISK_VENDORS = [
  'shell',
  'esso',
  'petro',
  'gas',
  'fuel',
  'cash',
  'atm',
]

/**
 * Calculate risk level for an approval based on various factors
 */
export function calculateRiskLevel(approval: PendingApproval): PendingApprovalWithRisk {
  const reasons: string[] = []
  let riskScore = 0

  const amount = Number(approval.transaction.amount)
  const hasReceipt = Boolean(approval.transaction.receiptUrl)
  const vendor = approval.transaction.vendor.toLowerCase()

  // Factor 1: Amount vs threshold
  const thresholdMultiplier = amount / DEFAULT_THRESHOLD
  if (thresholdMultiplier > 3) {
    riskScore += 3
    reasons.push(`Over 3× approval threshold ($${amount.toFixed(2)} vs $${DEFAULT_THRESHOLD})`)
  } else if (thresholdMultiplier > 2) {
    riskScore += 2
    reasons.push(`Over 2× approval threshold ($${amount.toFixed(2)} vs $${DEFAULT_THRESHOLD})`)
  } else if (thresholdMultiplier > 1.5) {
    riskScore += 1
    reasons.push(`Over 1.5× approval threshold ($${amount.toFixed(2)} vs $${DEFAULT_THRESHOLD})`)
  }

  // Factor 2: Missing receipt
  if (!hasReceipt && amount > 100) {
    riskScore += 2
    reasons.push('Missing receipt for transaction over $100')
  } else if (!hasReceipt) {
    riskScore += 1
    reasons.push('Missing receipt')
  }

  // Factor 3: High-risk vendor patterns
  const isHighRiskVendor = HIGH_RISK_VENDORS.some((pattern) =>
    vendor.includes(pattern)
  )
  if (isHighRiskVendor) {
    riskScore += 1
    reasons.push('Transaction from potentially high-risk vendor category')
  }

  // Factor 4: Missing description for large amounts
  if (!approval.transaction.description && amount > 300) {
    riskScore += 1
    reasons.push('No description provided for large transaction')
  }

  // Determine final risk level based on score
  let riskLevel: RiskLevel
  if (riskScore >= 4) {
    riskLevel = 'HIGH'
  } else if (riskScore >= 2) {
    riskLevel = 'MEDIUM'
  } else {
    riskLevel = 'LOW'
  }

  return {
    ...approval,
    riskLevel,
    riskReasons: reasons,
  }
}

/**
 * Get badge color for risk level
 */
export function getRiskBadgeClass(level: RiskLevel): string {
  switch (level) {
    case 'HIGH':
      return 'bg-red-100 text-red-700 border-red-300'
    case 'MEDIUM':
      return 'bg-amber-100 text-amber-700 border-amber-300'
    case 'LOW':
      return 'bg-green-100 text-green-700 border-green-300'
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300'
  }
}

/**
 * Sort risk levels for grouping (HIGH -> MEDIUM -> LOW)
 */
export function sortByRiskLevel(a: PendingApprovalWithRisk, b: PendingApprovalWithRisk): number {
  const riskOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
  return riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
}
