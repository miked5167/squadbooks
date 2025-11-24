/**
 * Team Health Calculator
 *
 * Calculates team health status based on financial metrics and operational indicators.
 * Uses configurable thresholds from DashboardConfig.
 */

import { HealthStatus, RedFlag } from '@/types'
import { TeamSummary } from '@/types/huddlebooks'
import { DashboardConfig } from '@/generated/prisma'

// ============================================
// TYPES
// ============================================

export type HealthCalculationResult = {
  status: HealthStatus
  flags: RedFlag[]
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  const diff = Math.abs(date1.getTime() - date2.getTime())
  return Math.floor(diff / msPerDay)
}

/**
 * Get days since a given date
 */
function daysSince(date: Date | null): number | null {
  if (!date) return null
  return daysBetween(new Date(), date)
}

// ============================================
// HEALTH STATUS CALCULATION
// ============================================

/**
 * Calculate team health status based on summary data and configuration
 *
 * Evaluates:
 * 1. Budget utilization
 * 2. Bank reconciliation status
 * 3. Pending approvals count
 * 4. Team activity/inactivity
 *
 * Returns health status ('healthy', 'needs_attention', 'at_risk') and list of red flags.
 */
export function calculateHealthStatus(
  summary: TeamSummary,
  config: DashboardConfig
): HealthCalculationResult {
  const flags: RedFlag[] = []
  let criticalCount = 0
  let warningCount = 0

  // ============================================
  // 1. BUDGET UTILIZATION CHECK
  // ============================================

  const percentUsed = summary.percentUsed

  if (percentUsed >= Number(config.budgetCriticalPct)) {
    criticalCount++
    flags.push({
      code: 'BUDGET_CRITICAL',
      message: `Budget ${percentUsed.toFixed(1)}% used (critical threshold: ${config.budgetCriticalPct}%)`,
      severity: 'critical',
    })
  } else if (percentUsed >= Number(config.budgetWarningPct)) {
    warningCount++
    flags.push({
      code: 'BUDGET_WARNING',
      message: `Budget ${percentUsed.toFixed(1)}% used (warning threshold: ${config.budgetWarningPct}%)`,
      severity: 'warning',
    })
  }

  // ============================================
  // 2. BANK RECONCILIATION CHECK
  // ============================================

  const daysSinceReconciled = summary.bankReconciledThrough
    ? daysSince(summary.bankReconciledThrough)
    : null

  if (!summary.bankConnected) {
    warningCount++
    flags.push({
      code: 'BANK_NOT_CONNECTED',
      message: 'Bank account not connected',
      severity: 'warning',
    })
  } else if (daysSinceReconciled !== null) {
    if (daysSinceReconciled > config.bankCriticalDays) {
      criticalCount++
      flags.push({
        code: 'BANK_RECONCILIATION_CRITICAL',
        message: `Bank not reconciled in ${daysSinceReconciled} days (critical threshold: ${config.bankCriticalDays} days)`,
        severity: 'critical',
      })
    } else if (daysSinceReconciled > config.bankWarningDays) {
      warningCount++
      flags.push({
        code: 'BANK_RECONCILIATION_WARNING',
        message: `Bank not reconciled in ${daysSinceReconciled} days (warning threshold: ${config.bankWarningDays} days)`,
        severity: 'warning',
      })
    }
  }

  // ============================================
  // 3. PENDING APPROVALS CHECK
  // ============================================

  const pendingApprovals = summary.pendingApprovals

  if (pendingApprovals >= config.approvalsCriticalCount) {
    criticalCount++
    flags.push({
      code: 'PENDING_APPROVALS_CRITICAL',
      message: `${pendingApprovals} pending approvals (critical threshold: ${config.approvalsCriticalCount})`,
      severity: 'critical',
    })
  } else if (pendingApprovals >= config.approvalsWarningCount) {
    warningCount++
    flags.push({
      code: 'PENDING_APPROVALS_WARNING',
      message: `${pendingApprovals} pending approvals (warning threshold: ${config.approvalsWarningCount})`,
      severity: 'warning',
    })
  }

  // ============================================
  // 4. INACTIVITY CHECK
  // ============================================

  const daysSinceActivity = summary.lastActivityAt
    ? daysSince(summary.lastActivityAt)
    : null

  if (daysSinceActivity !== null && daysSinceActivity > config.inactivityWarningDays) {
    warningCount++
    flags.push({
      code: 'INACTIVITY_WARNING',
      message: `No activity in ${daysSinceActivity} days (warning threshold: ${config.inactivityWarningDays} days)`,
      severity: 'warning',
    })
  }

  // ============================================
  // 5. MISSING RECEIPTS CHECK (Bonus)
  // ============================================

  if (summary.missingReceipts > 0) {
    warningCount++
    flags.push({
      code: 'MISSING_RECEIPTS',
      message: `${summary.missingReceipts} transactions missing receipts`,
      severity: 'warning',
    })
  }

  // ============================================
  // DETERMINE OVERALL HEALTH STATUS
  // ============================================

  let status: HealthStatus

  // At-risk: Any critical flags OR multiple serious issues
  if (criticalCount > 0) {
    status = 'at_risk'
  }
  // Needs attention: Any warning flags
  else if (warningCount > 0) {
    status = 'needs_attention'
  }
  // Healthy: No flags
  else {
    status = 'healthy'
  }

  return {
    status,
    flags,
  }
}

// ============================================
// HEALTH SCORE CALCULATION (PHASE 2)
// ============================================

/**
 * Calculate numeric health score (0-100)
 *
 * Higher is better. 100 = perfect health, 0 = critical issues.
 * Optional feature for Phase 2.
 */
export function calculateHealthScore(summary: TeamSummary, config: DashboardConfig): number {
  let score = 100

  // Budget utilization penalty (0-30 points)
  const percentUsed = summary.percentUsed
  if (percentUsed >= Number(config.budgetCriticalPct)) {
    score -= 30
  } else if (percentUsed >= Number(config.budgetWarningPct)) {
    score -= 15
  }

  // Bank reconciliation penalty (0-25 points)
  const daysSinceReconciled = summary.bankReconciledThrough
    ? daysSince(summary.bankReconciledThrough)
    : null

  if (!summary.bankConnected) {
    score -= 10
  } else if (daysSinceReconciled !== null) {
    if (daysSinceReconciled > config.bankCriticalDays) {
      score -= 25
    } else if (daysSinceReconciled > config.bankWarningDays) {
      score -= 12
    }
  }

  // Pending approvals penalty (0-20 points)
  const pendingApprovals = summary.pendingApprovals
  if (pendingApprovals >= config.approvalsCriticalCount) {
    score -= 20
  } else if (pendingApprovals >= config.approvalsWarningCount) {
    score -= 10
  }

  // Inactivity penalty (0-15 points)
  const daysSinceActivity = summary.lastActivityAt
    ? daysSince(summary.lastActivityAt)
    : null

  if (daysSinceActivity !== null && daysSinceActivity > config.inactivityWarningDays) {
    score -= 15
  }

  // Missing receipts penalty (0-10 points)
  if (summary.missingReceipts > 5) {
    score -= 10
  } else if (summary.missingReceipts > 0) {
    score -= 5
  }

  // Ensure score stays within 0-100 range
  return Math.max(0, Math.min(100, score))
}

// ============================================
// DEFAULT CONFIGURATION
// ============================================

/**
 * Default dashboard configuration values
 *
 * Used when no custom configuration exists for an association.
 */
export const DEFAULT_CONFIG: Omit<
  DashboardConfig,
  'id' | 'associationId' | 'createdAt' | 'updatedAt'
> = {
  budgetWarningPct: 80.0 as any, // Decimal type
  budgetCriticalPct: 95.0 as any, // Decimal type
  bankWarningDays: 30,
  bankCriticalDays: 60,
  approvalsWarningCount: 5,
  approvalsCriticalCount: 10,
  inactivityWarningDays: 21,
}
