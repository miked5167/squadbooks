/**
 * Automatic Team Season Lifecycle Transitions
 *
 * Handles automatic state transitions based on system events:
 * - PRESENTED → LOCKED when parent approval threshold is met
 * - LOCKED → ACTIVE when first transaction is created
 */

import { prisma } from '@/lib/prisma'
import { transitionTeamSeason } from './team-season-lifecycle'
import { TeamSeasonState } from '@prisma/client'

/**
 * Check and automatically lock budget if approval threshold is met
 *
 * Call this after each parent budget approval.
 *
 * @param teamSeasonId - ID of the team season
 * @param budgetVersionId - ID of the budget version that was approved
 * @returns true if budget was locked, false otherwise
 */
export async function checkAndLockBudget(
  teamSeasonId: string,
  budgetVersionId: string
): Promise<boolean> {
  try {
    // Get team season with budget data
    const teamSeason = await prisma.teamSeason.findUnique({
      where: { id: teamSeasonId },
      include: {
        team: {
          include: {
            budgets: {
              where: { season: { not: null } }, // Will be matched by season label
              include: {
                thresholdConfig: true,
                versions: {
                  where: { id: budgetVersionId },
                  include: {
                    approvals: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!teamSeason) {
      console.error('Team season not found')
      return false
    }

    // Only auto-lock if in PRESENTED state
    if (teamSeason.state !== 'PRESENTED') {
      return false
    }

    // Get the budget for this season
    const budget = teamSeason.team?.budgets.find(
      (b) => b.season === teamSeason.seasonLabel
    )

    if (!budget || !budget.thresholdConfig) {
      return false
    }

    const version = budget.versions[0]
    if (!version) {
      return false
    }

    // Check if this is the presented version
    if (teamSeason.presentedVersionId !== budgetVersionId) {
      return false
    }

    // Calculate approval progress
    const approvedCount = version.approvals.length
    const eligibleCount = teamSeason.eligibleFamiliesCount || budget.thresholdConfig.eligibleFamilyCount

    let thresholdMet = false

    if (budget.thresholdConfig.mode === 'COUNT') {
      const threshold = budget.thresholdConfig.countThreshold || 0
      thresholdMet = approvedCount >= threshold
    } else {
      const threshold = Number(budget.thresholdConfig.percentThreshold) || 0
      const percentApproved = eligibleCount > 0 ? (approvedCount / eligibleCount) * 100 : 0
      thresholdMet = percentApproved >= threshold
    }

    if (!thresholdMet) {
      return false
    }

    // Threshold met! Transition to LOCKED
    const result = await transitionTeamSeason(
      teamSeasonId,
      'LOCK_BUDGET',
      null, // System action
      {
        lockedVersionId: budgetVersionId,
        approvedCount,
        eligibleCount,
        autoLocked: true,
      }
    )

    return result.success
  } catch (error) {
    console.error('Error in checkAndLockBudget:', error)
    return false
  }
}

/**
 * Automatically activate team season when first transaction is created
 *
 * Call this after creating a transaction for a team in LOCKED state.
 *
 * @param teamId - ID of the team
 * @param seasonLabel - Season label (e.g., "2024-2025")
 * @returns true if season was activated, false otherwise
 */
export async function autoActivateOnFirstTransaction(
  teamId: string,
  seasonLabel: string
): Promise<boolean> {
  try {
    // Get team season for this team + season
    const teamSeason = await prisma.teamSeason.findUnique({
      where: {
        teamId_seasonLabel: {
          teamId,
          seasonLabel,
        },
      },
    })

    if (!teamSeason) {
      // No team season exists yet - this is expected for legacy teams
      return false
    }

    // Only auto-activate if in LOCKED state
    if (teamSeason.state !== 'LOCKED') {
      return false
    }

    // Check if this is truly the first transaction
    const transactionCount = await prisma.transaction.count({
      where: {
        teamId,
        transactionDate: {
          gte: teamSeason.seasonStart,
          lte: teamSeason.seasonEnd,
        },
      },
    })

    // If more than 1 transaction exists, don't auto-activate
    // (this function should be called after transaction creation)
    if (transactionCount > 1) {
      return false
    }

    // Auto-activate the season
    const result = await transitionTeamSeason(
      teamSeason.id,
      'START_SEASON',
      null, // System action
      {
        autoActivated: true,
        firstTransactionCreated: true,
      }
    )

    return result.success
  } catch (error) {
    console.error('Error in autoActivateOnFirstTransaction:', error)
    return false
  }
}

/**
 * Update team season rollup helpers after activity
 *
 * Call this periodically or after significant events to keep rollup data fresh.
 *
 * @param teamSeasonId - ID of the team season
 */
export async function updateTeamSeasonRollupData(teamSeasonId: string): Promise<void> {
  try {
    const teamSeason = await prisma.teamSeason.findUnique({
      where: { id: teamSeasonId },
      include: {
        team: {
          include: {
            families: {
              where: {
                players: {
                  some: {
                    status: 'ACTIVE',
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!teamSeason) {
      return
    }

    // Count eligible families (families with active players)
    const eligibleFamiliesCount = teamSeason.team?.families.length || 0

    // Get approvals count for presented version
    let approvalsCount = 0
    if (teamSeason.presentedVersionId) {
      approvalsCount = await prisma.budgetVersionApproval.count({
        where: {
          budgetVersionId: teamSeason.presentedVersionId,
        },
      })
    }

    // Get latest activity (latest transaction or state change)
    const latestTransaction = await prisma.transaction.findFirst({
      where: {
        teamId: teamSeason.teamId,
        transactionDate: {
          gte: teamSeason.seasonStart,
          lte: teamSeason.seasonEnd,
        },
      },
      orderBy: {
        transactionDate: 'desc',
      },
    })

    const latestStateChange = await prisma.teamSeasonStateChange.findFirst({
      where: {
        teamSeasonId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const lastActivityAt =
      latestTransaction?.transactionDate > (latestStateChange?.createdAt || new Date(0))
        ? latestTransaction.transactionDate
        : latestStateChange?.createdAt

    // Update rollup data
    await prisma.teamSeason.update({
      where: { id: teamSeasonId },
      data: {
        eligibleFamiliesCount,
        approvalsCountForPresentedVersion: approvalsCount,
        lastActivityAt,
      },
    })
  } catch (error) {
    console.error('Error updating team season rollup data:', error)
  }
}
