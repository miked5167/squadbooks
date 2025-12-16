/**
 * Budget Threshold Logic
 *
 * Handles approval threshold checking and automatic budget locking
 * when parent acknowledgement thresholds are met.
 */

import { prisma } from '@/lib/prisma'
import { BudgetStatus, ThresholdMode } from '@prisma/client'
import type { ApprovalProgress } from '@/lib/types/budget-workflow'

/**
 * Check if budget approval threshold is met for the presented version
 * and automatically lock the budget if threshold is reached.
 *
 * This function is called after each parent acknowledgement.
 */
export async function checkThresholdAndLock(budgetId: string): Promise<{
  thresholdMet: boolean
  locked: boolean
  progress: ApprovalProgress
}> {
  // 1. Get budget with presented version and threshold config
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: {
      thresholdConfig: true,
      versions: {
        where: {
          versionNumber: { not: null },
        },
        include: {
          approvals: true,
        },
      },
    },
  })

  if (!budget) {
    throw new Error('Budget not found')
  }

  if (budget.status !== BudgetStatus.PRESENTED) {
    throw new Error('Budget is not in PRESENTED state')
  }

  if (!budget.presentedVersionNumber) {
    throw new Error('No version is currently presented to parents')
  }

  if (!budget.thresholdConfig) {
    throw new Error('Budget has no threshold configuration')
  }

  // 2. Get the presented version with approvals
  const presentedVersion = budget.versions.find(
    v => v.versionNumber === budget.presentedVersionNumber
  )

  if (!presentedVersion) {
    throw new Error('Presented version not found')
  }

  const config = budget.thresholdConfig
  const approvedCount = presentedVersion.approvals.length
  const eligibleCount = config.eligibleFamilyCount

  // 3. Calculate progress
  const percentApproved = eligibleCount > 0
    ? (approvedCount / eligibleCount) * 100
    : 0

  let thresholdMet = false
  let thresholdValue = 0

  if (config.mode === ThresholdMode.COUNT) {
    thresholdValue = config.countThreshold || 0
    thresholdMet = approvedCount >= thresholdValue
  } else {
    thresholdValue = Number(config.percentThreshold) || 0
    thresholdMet = percentApproved >= thresholdValue
  }

  const progress: ApprovalProgress = {
    approvedCount,
    eligibleCount,
    percentApproved,
    thresholdMet,
    thresholdMode: config.mode,
    thresholdValue,
  }

  // 4. If threshold not met, return early
  if (!thresholdMet) {
    return {
      thresholdMet: false,
      locked: false,
      progress,
    }
  }

  // 5. Threshold met! Lock the budget
  // Transition: PRESENTED → APPROVED → LOCKED
  await prisma.budget.update({
    where: { id: budgetId },
    data: {
      status: BudgetStatus.LOCKED,
      lockedAt: new Date(),
      lockedBy: 'SYSTEM', // System triggered the lock
    },
  })

  return {
    thresholdMet: true,
    locked: true,
    progress,
  }
}

/**
 * Get current approval progress for a budget's presented version
 */
export async function getApprovalProgress(budgetId: string): Promise<ApprovalProgress | null> {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: {
      thresholdConfig: true,
      versions: {
        include: {
          approvals: true,
        },
      },
    },
  })

  if (!budget || !budget.presentedVersionNumber || !budget.thresholdConfig) {
    return null
  }

  const presentedVersion = budget.versions.find(
    v => v.versionNumber === budget.presentedVersionNumber
  )

  if (!presentedVersion) {
    return null
  }

  const config = budget.thresholdConfig
  const approvedCount = presentedVersion.approvals.length
  const eligibleCount = config.eligibleFamilyCount
  const percentApproved = eligibleCount > 0
    ? (approvedCount / eligibleCount) * 100
    : 0

  let thresholdMet = false
  let thresholdValue = 0

  if (config.mode === ThresholdMode.COUNT) {
    thresholdValue = config.countThreshold || 0
    thresholdMet = approvedCount >= thresholdValue
  } else {
    thresholdValue = Number(config.percentThreshold) || 0
    thresholdMet = percentApproved >= thresholdValue
  }

  return {
    approvedCount,
    eligibleCount,
    percentApproved,
    thresholdMet,
    thresholdMode: config.mode,
    thresholdValue,
  }
}

/**
 * Update eligible family count when roster changes
 * Recomputes percentage progress but does NOT unlock if already locked
 */
export async function updateEligibleFamilyCount(teamId: string, season: string): Promise<void> {
  // Count active families with active players
  const activeFamiliesCount = await prisma.family.count({
    where: {
      teamId,
      players: {
        some: {
          status: 'ACTIVE',
        },
      },
    },
  })

  // Find budget for this team/season
  const budget = await prisma.budget.findUnique({
    where: {
      teamId_season: {
        teamId,
        season,
      },
    },
    include: {
      thresholdConfig: true,
    },
  })

  if (!budget || !budget.thresholdConfig) {
    return
  }

  // Update eligible count
  await prisma.budgetThresholdConfig.update({
    where: { id: budget.thresholdConfig.id },
    data: {
      eligibleFamilyCount: activeFamiliesCount,
    },
  })

  // DO NOT unlock if already locked
  // This just updates the denominator for percentage calculations
}
