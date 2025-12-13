/**
 * Team Season Rollup Queries
 *
 * Provides association-level visibility into team season lifecycle states
 * and progress metrics.
 */

import { prisma } from '@/lib/prisma'
import { TeamSeasonState } from '@prisma/client'

/**
 * Team season summary for association rollup
 */
export interface TeamSeasonRollup {
  teamSeasonId: string
  teamId: string
  teamName: string
  division: string | null
  seasonLabel: string

  // Lifecycle state
  state: TeamSeasonState
  stateUpdatedAt: Date
  lastActivityAt: Date | null

  // Progress indicators
  approvalsProgress: {
    approvedCount: number
    eligibleCount: number
    percentApproved: number
  } | null

  // Flags
  needsAttention: boolean
  needsAttentionReasons: string[]
}

/**
 * Get team season rollup for an association
 *
 * @param associationId - ID of the association
 * @param filters - Optional filters for state, date range, etc.
 * @returns Array of team season rollups
 */
export async function getAssociationTeamSeasonRollup(
  associationId: string,
  filters?: {
    state?: TeamSeasonState
    seasonLabel?: string
    needsAttention?: boolean
  }
): Promise<TeamSeasonRollup[]> {
  try {
    // Build where clause
    const where: any = {
      associationId,
    }

    if (filters?.state) {
      where.state = filters.state
    }

    if (filters?.seasonLabel) {
      where.seasonLabel = filters.seasonLabel
    }

    // Get team seasons with related data
    const teamSeasons = await prisma.teamSeason.findMany({
      where,
      include: {
        team: {
          select: {
            id: true,
            name: true,
            associationTeam: {
              select: {
                division: true,
              },
            },
          },
        },
      },
      orderBy: [
        { seasonLabel: 'desc' },
        { state: 'asc' },
        { team: { name: 'asc' } },
      ],
    })

    // Transform to rollup format
    const rollups: TeamSeasonRollup[] = teamSeasons.map((ts) => {
      // Calculate approval progress
      let approvalsProgress = null
      if (ts.state === 'PRESENTED' && ts.presentedVersionId) {
        const approvedCount = ts.approvalsCountForPresentedVersion || 0
        const eligibleCount = ts.eligibleFamiliesCount || 0
        const percentApproved = eligibleCount > 0 ? (approvedCount / eligibleCount) * 100 : 0

        approvalsProgress = {
          approvedCount,
          eligibleCount,
          percentApproved,
        }
      }

      // Calculate needs attention flags
      const needsAttentionReasons: string[] = []

      // Check for stalled approvals (in PRESENTED for > 14 days)
      if (ts.state === 'PRESENTED') {
        const daysSincePresented = Math.floor(
          (Date.now() - ts.stateUpdatedAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSincePresented > 14) {
          needsAttentionReasons.push('Approvals pending > 14 days')
        }
      }

      // Check for inactive teams (no activity in > 30 days while ACTIVE)
      if (ts.state === 'ACTIVE' && ts.lastActivityAt) {
        const daysSinceActivity = Math.floor(
          (Date.now() - ts.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceActivity > 30) {
          needsAttentionReasons.push('No activity > 30 days')
        }
      }

      // Check for budget in review for too long
      if (ts.state === 'BUDGET_REVIEW') {
        const daysSinceReview = Math.floor(
          (Date.now() - ts.stateUpdatedAt.getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysSinceReview > 7) {
          needsAttentionReasons.push('Budget in review > 7 days')
        }
      }

      return {
        teamSeasonId: ts.id,
        teamId: ts.teamId,
        teamName: ts.team.name,
        division: ts.team.associationTeam?.division || null,
        seasonLabel: ts.seasonLabel,
        state: ts.state,
        stateUpdatedAt: ts.stateUpdatedAt,
        lastActivityAt: ts.lastActivityAt,
        approvalsProgress,
        needsAttention: needsAttentionReasons.length > 0,
        needsAttentionReasons,
      }
    })

    // Apply needsAttention filter if specified
    if (filters?.needsAttention !== undefined) {
      return rollups.filter((r) => r.needsAttention === filters.needsAttention)
    }

    return rollups
  } catch (error) {
    console.error('Error fetching team season rollup:', error)
    throw error
  }
}

/**
 * Get statistics for association team seasons
 *
 * @param associationId - ID of the association
 * @param seasonLabel - Optional season label filter
 * @returns Statistics summary
 */
export async function getTeamSeasonStats(
  associationId: string,
  seasonLabel?: string
) {
  const where: any = { associationId }
  if (seasonLabel) {
    where.seasonLabel = seasonLabel
  }

  const teamSeasons = await prisma.teamSeason.findMany({
    where,
    select: {
      state: true,
    },
  })

  // Group by state
  const stateCounts: Record<TeamSeasonState, number> = {
    SETUP: 0,
    BUDGET_DRAFT: 0,
    BUDGET_REVIEW: 0,
    TEAM_APPROVED: 0,
    PRESENTED: 0,
    LOCKED: 0,
    ACTIVE: 0,
    CLOSEOUT: 0,
    ARCHIVED: 0,
  }

  teamSeasons.forEach((ts) => {
    stateCounts[ts.state]++
  })

  return {
    total: teamSeasons.length,
    byState: stateCounts,
  }
}
