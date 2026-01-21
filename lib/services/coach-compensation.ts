/**
 * Coach Compensation Policy Service
 *
 * Handles all logic for coach compensation limits including:
 * - Cap calculation and enforcement
 * - Transaction validation against caps
 * - Budget validation against caps
 * - Exception handling
 * - Compliance status evaluation
 */

import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export type EnforcementMode = 'WARN_ONLY' | 'REQUIRE_EXCEPTION' | 'BLOCK'

export type CapStatus = 'OK' | 'APPROACHING' | 'EXCEEDED'

export interface CoachCompPolicyConfig {
  enforcementMode: EnforcementMode
  categoryIds: string[]  // System category IDs that count as coach compensation
  approachingThreshold: number  // Default 0.90 (90%)
  effectiveDate: Date
}

export interface CoachCompPolicy {
  id: string
  ruleId: string
  associationId: string
  isActive: boolean
  config: CoachCompPolicyConfig
  limits: CoachCompensationLimit[]
}

export interface CoachCompensationLimit {
  id: string
  ruleId: string
  season: string | null
  ageGroup: string
  skillLevel: string
  capAmountCents: number
}

export interface TeamCapStatus {
  teamId: string
  teamSeasonId: string
  ageGroup: string | null
  skillLevel: string | null
  baseCap: number
  exceptionDelta: number
  effectiveCap: number
  budgeted: number
  actual: number
  remaining: number
  percentUsed: number
  status: CapStatus
  hasException: boolean
  exceptionStatus?: 'PENDING' | 'APPROVED' | 'DENIED'
}

export interface ValidationResult {
  allowed: boolean
  severity: 'ok' | 'warn' | 'error' | 'critical'
  message?: string
  currentActual?: number
  projectedActual?: number
  cap?: number
  percentUsed?: number
}

// ============================================================================
// CORE POLICY FUNCTIONS
// ============================================================================

/**
 * Get the active coach compensation policy for an association
 */
export async function getCoachCompPolicy(
  associationId: string
): Promise<CoachCompPolicy | null> {
  const rule = await prisma.associationRule.findFirst({
    where: {
      associationId,
      ruleType: 'COACH_COMPENSATION_LIMIT',
      isActive: true,
    },
    include: {
      coachCompensationLimits: {
        orderBy: [
          { season: 'desc' },
          { ageGroup: 'asc' },
          { skillLevel: 'asc' },
        ],
      },
    },
  })

  if (!rule) return null

  return {
    id: rule.id,
    ruleId: rule.id,
    associationId: rule.associationId,
    isActive: rule.isActive,
    config: rule.config as CoachCompPolicyConfig,
    limits: rule.coachCompensationLimits.map(limit => ({
      id: limit.id,
      ruleId: limit.ruleId,
      season: limit.season,
      ageGroup: limit.ageGroup,
      skillLevel: limit.skillLevel,
      capAmountCents: limit.capAmountCents,
    })),
  }
}

/**
 * Parse age group from team name (e.g., "U13 AA Storm" -> "U13")
 */
export function parseAgeGroup(teamName: string): string | null {
  const match = teamName.match(/U(\d+)/i)
  if (!match) return null
  return `U${match[1]}`
}

/**
 * Get effective coach compensation cap for a team
 * Includes base cap + approved exceptions
 */
export async function getEffectiveCapForTeam(params: {
  policyId: string
  teamId: string
  teamSeasonId?: string
  season: string | null
  ageGroup: string | null
  skillLevel: string | null
}): Promise<{
  baseCap: number
  exceptionDelta: number
  effectiveCap: number
  hasException: boolean
  exceptionStatus?: 'PENDING' | 'APPROVED' | 'DENIED'
}> {
  const { policyId, teamId, teamSeasonId, season, ageGroup, skillLevel } = params

  // Default: no cap (unlimited)
  let baseCap = 0

  // Find the most specific cap limit (season-specific first, then default)
  if (ageGroup && skillLevel) {
    // Try season-specific limit first
    if (season) {
      const seasonSpecificLimit = await prisma.coachCompensationLimit.findFirst({
        where: {
          ruleId: policyId,
          season,
          ageGroup,
          skillLevel,
        },
      })
      if (seasonSpecificLimit) {
        baseCap = seasonSpecificLimit.capAmountCents
      }
    }

    // Fallback to default limit (season is null)
    if (baseCap === 0) {
      const defaultLimit = await prisma.coachCompensationLimit.findFirst({
        where: {
          ruleId: policyId,
          season: null,
          ageGroup,
          skillLevel,
        },
      })
      if (defaultLimit) {
        baseCap = defaultLimit.capAmountCents
      }
    }
  }

  // Check for approved exceptions
  let exceptionDelta = 0
  let hasException = false
  let exceptionStatus: 'PENDING' | 'APPROVED' | 'DENIED' | undefined

  const exception = await prisma.teamRuleOverride.findFirst({
    where: {
      teamId,
      ruleId: policyId,
      isActive: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (exception) {
    hasException = true

    // Determine status from override config
    const overrideConfig = exception.overrideConfig as any

    if (exception.approvedBy) {
      exceptionStatus = 'APPROVED'
      exceptionDelta = overrideConfig?.approvedDeltaCents || 0
    } else {
      exceptionStatus = 'PENDING'
    }

    // Check if denied (could be tracked in config)
    if (overrideConfig?.status === 'DENIED') {
      exceptionStatus = 'DENIED'
      exceptionDelta = 0
    }
  }

  return {
    baseCap,
    exceptionDelta,
    effectiveCap: baseCap + exceptionDelta,
    hasException,
    exceptionStatus,
  }
}

/**
 * Calculate actual coach compensation spend for a team
 * Sums APPROVED + RESOLVED transactions in designated coach categories
 */
export async function calculateActualSpend(params: {
  teamId: string
  categoryIds: string[]
  season?: string
  fromDate?: Date
  toDate?: Date
}): Promise<number> {
  const { teamId, categoryIds, fromDate, toDate } = params

  if (categoryIds.length === 0) return 0

  const whereClause: Prisma.TransactionWhereInput = {
    teamId,
    type: 'EXPENSE',
    status: {
      in: ['APPROVED', 'RESOLVED'],
    },
    systemCategoryId: {
      in: categoryIds,
    },
  }

  if (fromDate) {
    whereClause.transactionDate = { gte: fromDate }
  }
  if (toDate) {
    whereClause.transactionDate = { ...whereClause.transactionDate, lte: toDate }
  }

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    select: {
      amount: true,
    },
  })

  return transactions.reduce((sum, txn) => sum + Number(txn.amount), 0)
}

/**
 * Calculate budgeted coach compensation amount
 */
export async function calculateBudgetedAmount(params: {
  budgetId: string
  categoryIds: string[]
}): Promise<number> {
  const { budgetId, categoryIds } = params

  if (categoryIds.length === 0) return 0

  const allocations = await prisma.budgetAllocation.findMany({
    where: {
      budgetId,
      category: {
        systemCategoryId: {
          in: categoryIds,
        },
      },
    },
    select: {
      allocated: true,
    },
  })

  return allocations.reduce((sum, alloc) => sum + Number(alloc.allocated), 0)
}

/**
 * Evaluate cap status for a team
 */
export function evaluateCapStatus(params: {
  actual: number
  cap: number
  approachingThreshold?: number
}): CapStatus {
  const { actual, cap, approachingThreshold = 0.90 } = params

  if (cap === 0) return 'OK' // No cap configured

  const percentUsed = actual / cap

  if (percentUsed >= 1.0) return 'EXCEEDED'
  if (percentUsed >= approachingThreshold) return 'APPROACHING'
  return 'OK'
}

/**
 * Get complete cap status for a team
 */
export async function getTeamCapStatus(params: {
  teamId: string
  teamSeasonId?: string
  season: string | null
  associationId: string
}): Promise<TeamCapStatus | null> {
  const { teamId, teamSeasonId, season, associationId } = params

  // Get policy
  const policy = await getCoachCompPolicy(associationId)
  if (!policy || !policy.isActive) return null

  // Get team details
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      name: true,
      competitiveLevel: true,
      associationTeam: {
        select: {
          teamName: true,
        },
      },
    },
  })

  if (!team) return null

  const teamName = team.associationTeam?.[0]?.teamName || team.name
  const ageGroup = parseAgeGroup(teamName)
  const skillLevel = team.competitiveLevel

  // Get effective cap
  const capInfo = await getEffectiveCapForTeam({
    policyId: policy.ruleId,
    teamId,
    teamSeasonId,
    season,
    ageGroup,
    skillLevel,
  })

  // Calculate actual spend (YTD for current season)
  const actual = await calculateActualSpend({
    teamId,
    categoryIds: policy.config.categoryIds,
    season,
  })

  // Calculate budgeted (if budget exists)
  let budgeted = 0
  const budget = await prisma.budget.findFirst({
    where: {
      teamId,
      status: 'LOCKED',
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
    },
  })

  if (budget) {
    budgeted = await calculateBudgetedAmount({
      budgetId: budget.id,
      categoryIds: policy.config.categoryIds,
    })
  }

  const remaining = capInfo.effectiveCap - actual
  const percentUsed = capInfo.effectiveCap > 0 ? (actual / capInfo.effectiveCap) * 100 : 0

  const status = evaluateCapStatus({
    actual,
    cap: capInfo.effectiveCap,
    approachingThreshold: policy.config.approachingThreshold,
  })

  return {
    teamId,
    teamSeasonId: teamSeasonId || teamId,
    ageGroup,
    skillLevel,
    baseCap: capInfo.baseCap,
    exceptionDelta: capInfo.exceptionDelta,
    effectiveCap: capInfo.effectiveCap,
    budgeted,
    actual,
    remaining,
    percentUsed,
    status,
    hasException: capInfo.hasException,
    exceptionStatus: capInfo.exceptionStatus,
  }
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate a transaction against coach compensation policy
 */
export async function validateTransaction(params: {
  transaction: {
    id?: string
    teamId: string
    systemCategoryId: string | null
    amount: number
  }
  season: string | null
  associationId: string
  isEdit?: boolean
  oldAmount?: number
}): Promise<ValidationResult> {
  const { transaction, season, associationId, isEdit = false, oldAmount = 0 } = params

  // Get policy
  const policy = await getCoachCompPolicy(associationId)

  if (!policy || !policy.isActive) {
    return { allowed: true, severity: 'ok' }
  }

  // Check if transaction category is in scope
  if (
    !transaction.systemCategoryId ||
    !policy.config.categoryIds.includes(transaction.systemCategoryId)
  ) {
    return { allowed: true, severity: 'ok' }
  }

  // Get team details
  const team = await prisma.team.findUnique({
    where: { id: transaction.teamId },
    select: {
      id: true,
      name: true,
      competitiveLevel: true,
      associationTeam: {
        select: {
          teamName: true,
        },
      },
    },
  })

  if (!team) {
    return { allowed: true, severity: 'ok', message: 'Team not found' }
  }

  const teamName = team.associationTeam?.[0]?.teamName || team.name
  const ageGroup = parseAgeGroup(teamName)
  const skillLevel = team.competitiveLevel

  // Get effective cap
  const capInfo = await getEffectiveCapForTeam({
    policyId: policy.ruleId,
    teamId: transaction.teamId,
    season,
    ageGroup,
    skillLevel,
  })

  // No cap configured
  if (capInfo.effectiveCap === 0) {
    return {
      allowed: true,
      severity: 'warn',
      message: `No cap configured for ${ageGroup} ${skillLevel}. Please contact your association administrator.`,
    }
  }

  // Calculate current actual spend
  const currentActual = await calculateActualSpend({
    teamId: transaction.teamId,
    categoryIds: policy.config.categoryIds,
    season,
  })

  // Calculate projected actual (account for edits)
  const projectedActual = currentActual - (isEdit ? oldAmount : 0) + transaction.amount

  const percentUsed = (projectedActual / capInfo.effectiveCap) * 100

  // Check if exceeds cap
  if (projectedActual > capInfo.effectiveCap) {
    const overage = projectedActual - capInfo.effectiveCap

    switch (policy.config.enforcementMode) {
      case 'WARN_ONLY':
        return {
          allowed: true,
          severity: 'warn',
          message: `This transaction will exceed your coach compensation cap by $${(overage / 100).toFixed(2)}`,
          currentActual,
          projectedActual,
          cap: capInfo.effectiveCap,
          percentUsed,
        }

      case 'REQUIRE_EXCEPTION':
        // Check if approved exception exists
        if (capInfo.exceptionStatus === 'APPROVED') {
          return {
            allowed: true,
            severity: 'ok',
            message: 'Exception approved',
            currentActual,
            projectedActual,
            cap: capInfo.effectiveCap,
            percentUsed,
          }
        }

        return {
          allowed: false,
          severity: 'error',
          message: `This transaction exceeds your coach compensation cap. An approved exception is required. Please request an exception from your association.`,
          currentActual,
          projectedActual,
          cap: capInfo.effectiveCap,
          percentUsed,
        }

      case 'BLOCK':
        return {
          allowed: false,
          severity: 'critical',
          message: `This transaction is blocked. It would exceed your coach compensation cap of $${(capInfo.effectiveCap / 100).toFixed(2)}.`,
          currentActual,
          projectedActual,
          cap: capInfo.effectiveCap,
          percentUsed,
        }

      default:
        return { allowed: true, severity: 'ok' }
    }
  }

  // Check if approaching cap
  if (percentUsed >= (policy.config.approachingThreshold * 100)) {
    return {
      allowed: true,
      severity: 'warn',
      message: `You have used ${percentUsed.toFixed(1)}% of your coach compensation cap`,
      currentActual,
      projectedActual,
      cap: capInfo.effectiveCap,
      percentUsed,
    }
  }

  return {
    allowed: true,
    severity: 'ok',
    currentActual,
    projectedActual,
    cap: capInfo.effectiveCap,
    percentUsed,
  }
}

/**
 * Validate budget against coach compensation policy
 */
export async function validateBudget(params: {
  budgetId: string
  teamId: string
  season: string | null
  associationId: string
}): Promise<ValidationResult> {
  const { budgetId, teamId, season, associationId } = params

  // Get policy
  const policy = await getCoachCompPolicy(associationId)

  if (!policy || !policy.isActive) {
    return { allowed: true, severity: 'ok' }
  }

  // Get team details
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      name: true,
      competitiveLevel: true,
      associationTeam: {
        select: {
          teamName: true,
        },
      },
    },
  })

  if (!team) {
    return { allowed: true, severity: 'ok', message: 'Team not found' }
  }

  const teamName = team.associationTeam?.[0]?.teamName || team.name
  const ageGroup = parseAgeGroup(teamName)
  const skillLevel = team.competitiveLevel

  // Get effective cap
  const capInfo = await getEffectiveCapForTeam({
    policyId: policy.ruleId,
    teamId,
    season,
    ageGroup,
    skillLevel,
  })

  // No cap configured
  if (capInfo.effectiveCap === 0) {
    return {
      allowed: true,
      severity: 'warn',
      message: `No cap configured for ${ageGroup} ${skillLevel}`,
    }
  }

  // Calculate budgeted amount
  const budgeted = await calculateBudgetedAmount({
    budgetId,
    categoryIds: policy.config.categoryIds,
  })

  const percentUsed = (budgeted / capInfo.effectiveCap) * 100

  // Check if exceeds cap
  if (budgeted > capInfo.effectiveCap) {
    const overage = budgeted - capInfo.effectiveCap

    switch (policy.config.enforcementMode) {
      case 'WARN_ONLY':
        return {
          allowed: true,
          severity: 'warn',
          message: `Budgeted coach compensation exceeds cap by $${(overage / 100).toFixed(2)}`,
          projectedActual: budgeted,
          cap: capInfo.effectiveCap,
          percentUsed,
        }

      case 'REQUIRE_EXCEPTION':
        if (capInfo.exceptionStatus === 'APPROVED') {
          return {
            allowed: true,
            severity: 'ok',
            message: 'Exception approved',
            projectedActual: budgeted,
            cap: capInfo.effectiveCap,
            percentUsed,
          }
        }

        return {
          allowed: false,
          severity: 'error',
          message: `Budgeted coach compensation requires an approved exception`,
          projectedActual: budgeted,
          cap: capInfo.effectiveCap,
          percentUsed,
        }

      case 'BLOCK':
        return {
          allowed: false,
          severity: 'critical',
          message: `Budget blocked. Coach compensation exceeds cap of $${(capInfo.effectiveCap / 100).toFixed(2)}`,
          projectedActual: budgeted,
          cap: capInfo.effectiveCap,
          percentUsed,
        }
    }
  }

  return {
    allowed: true,
    severity: 'ok',
    projectedActual: budgeted,
    cap: capInfo.effectiveCap,
    percentUsed,
  }
}

/**
 * Alert generation for coach compensation violations
 */

export interface AlertGenerationInput {
  teamId: string
  associationId: string
  associationTeamId: string
  season: string | null
  actual: number
  cap: number
  percentUsed: number
  ageGroup: string | null
  skillLevel: string | null
}

export async function generateOrUpdateCoachCompAlerts(input: AlertGenerationInput): Promise<void> {
  const {
    teamId,
    associationId,
    associationTeamId,
    season,
    actual,
    cap,
    percentUsed,
    ageGroup,
    skillLevel,
  } = input

  // No cap configured - resolve any existing alerts
  if (cap === 0) {
    await resolveCoachCompAlerts(associationTeamId)
    return
  }

  const now = new Date()

  // EXCEEDED: actual > cap
  if (actual > cap) {
    const overage = actual - cap
    const overageDollars = (overage / 100).toFixed(2)
    const capDollars = (cap / 100).toFixed(2)

    const title = `Coach compensation cap exceeded by $${overageDollars}`
    const description = `Team has spent $${(actual / 100).toFixed(2)} on coach compensation, exceeding the cap of $${capDollars}${ageGroup && skillLevel ? ` (${ageGroup} ${skillLevel})` : ''}.${season ? ` Season: ${season}` : ''}`

    // Create or update EXCEEDED alert
    await prisma.alert.upsert({
      where: {
        uq_active_alert: {
          associationTeamId,
          alertType: 'COACH_COMP_EXCEEDED',
          status: 'active',
        },
      },
      create: {
        associationId,
        associationTeamId,
        alertType: 'COACH_COMP_EXCEEDED',
        severity: 'HIGH',
        title,
        description,
        status: 'active',
        lastTriggeredAt: now,
      },
      update: {
        title,
        description,
        lastTriggeredAt: now,
        // Keep existing resolvedAt and resolvedByTeamUserId if present
      },
    })

    // Resolve any APPROACHING alerts since we've exceeded
    await prisma.alert.updateMany({
      where: {
        associationTeamId,
        alertType: 'COACH_COMP_APPROACHING',
        status: 'active',
        resolvedAt: null,
      },
      data: {
        status: 'resolved',
        resolvedAt: now,
        notes: 'Automatically resolved - cap now exceeded',
      },
    })
  }
  // APPROACHING: actual >= 90% of cap (but not exceeded)
  else if (percentUsed >= 90) {
    const capDollars = (cap / 100).toFixed(2)
    const remainingCents = cap - actual
    const remainingDollars = (remainingCents / 100).toFixed(2)

    const title = `Coach compensation approaching cap (${percentUsed.toFixed(1)}%)`
    const description = `Team has used ${percentUsed.toFixed(1)}% of their coach compensation cap ($${(actual / 100).toFixed(2)} of $${capDollars}). $${remainingDollars} remaining${ageGroup && skillLevel ? ` (${ageGroup} ${skillLevel})` : ''}.${season ? ` Season: ${season}` : ''}`

    // Create or update APPROACHING alert
    await prisma.alert.upsert({
      where: {
        uq_active_alert: {
          associationTeamId,
          alertType: 'COACH_COMP_APPROACHING',
          status: 'active',
        },
      },
      create: {
        associationId,
        associationTeamId,
        alertType: 'COACH_COMP_APPROACHING',
        severity: 'MEDIUM',
        title,
        description,
        status: 'active',
        lastTriggeredAt: now,
      },
      update: {
        title,
        description,
        lastTriggeredAt: now,
      },
    })

    // Resolve any EXCEEDED alerts since we're back under cap
    await prisma.alert.updateMany({
      where: {
        associationTeamId,
        alertType: 'COACH_COMP_EXCEEDED',
        status: 'active',
        resolvedAt: null,
      },
      data: {
        status: 'resolved',
        resolvedAt: now,
        notes: 'Automatically resolved - spending back under cap',
      },
    })
  }
  // OK: under 90%
  else {
    // Resolve all coach comp alerts
    await resolveCoachCompAlerts(associationTeamId)
  }
}

export async function resolveCoachCompAlerts(associationTeamId: string): Promise<void> {
  const now = new Date()

  await prisma.alert.updateMany({
    where: {
      associationTeamId,
      alertType: {
        in: ['COACH_COMP_APPROACHING', 'COACH_COMP_EXCEEDED'],
      },
      status: 'active',
      resolvedAt: null,
    },
    data: {
      status: 'resolved',
      resolvedAt: now,
      notes: 'Automatically resolved - spending within acceptable limits',
    },
  })
}

export async function triggerCoachCompAlertsForTeam(params: {
  teamId: string
  season: string | null
  associationId: string
}): Promise<void> {
  const { teamId, season, associationId } = params

  // Get association team ID
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      name: true,
      competitiveLevel: true,
      associationTeam: {
        where: { associationId },
        select: { id: true },
      },
    },
  })

  if (!team || team.associationTeam.length === 0) {
    return
  }

  const associationTeamId = team.associationTeam[0].id

  // Get active policy
  const policy = await getCoachCompPolicy(associationId)
  if (!policy || !policy.isActive) {
    // No policy - resolve any existing alerts
    await resolveCoachCompAlerts(associationTeamId)
    return
  }

  // Parse age group from team name
  const ageGroup = parseAgeGroup(team.name)
  const skillLevel = team.competitiveLevel

  if (!ageGroup || !skillLevel) {
    // Can't determine team classification - resolve alerts
    await resolveCoachCompAlerts(associationTeamId)
    return
  }

  // Get effective cap
  const capInfo = await getEffectiveCapForTeam({
    policyId: policy.ruleId,
    teamId,
    season,
    ageGroup,
    skillLevel,
  })

  // Calculate actual spend
  const actual = await calculateActualSpend({
    teamId,
    season,
    categoryIds: policy.config.categoryIds,
  })

  const percentUsed = capInfo.effectiveCap > 0 ? (actual / capInfo.effectiveCap) * 100 : 0

  // Generate or update alerts
  await generateOrUpdateCoachCompAlerts({
    teamId,
    associationId,
    associationTeamId,
    season,
    actual,
    cap: capInfo.effectiveCap,
    percentUsed,
    ageGroup,
    skillLevel,
  })
}
