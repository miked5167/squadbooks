/**
 * Team Policy Snapshot Service
 *
 * Creates immutable policy snapshots when a team season is created.
 * These snapshots preserve the association's policy settings for the duration of the season.
 */

import { prisma } from '@/lib/prisma'

/**
 * Create a policy snapshot from the association's current settings
 *
 * @param associationId - ID of the association
 * @returns ID of the created snapshot
 */
export async function createPolicySnapshot(associationId: string): Promise<string> {
  try {
    // Get association config and rules
    const association = await prisma.association.findUnique({
      where: { id: associationId },
      include: {
        config: true,
        rules: {
          where: { isActive: true },
        },
      },
    })

    if (!association) {
      throw new Error('Association not found')
    }

    // Get a representative team's settings (if any) for dual approval thresholds
    // In MVP, we can use a default or the first team's settings
    const sampleTeam = await prisma.team.findFirst({
      where: {
        associationTeam: {
          associationId,
        },
      },
      include: {
        teamSettings: true,
      },
    })

    // Create snapshot
    const snapshot = await prisma.teamPolicySnapshot.create({
      data: {
        associationId,

        // Budget thresholds from DashboardConfig
        budgetWarningPct: association.config?.budgetWarningPct,
        budgetCriticalPct: association.config?.budgetCriticalPct,

        // Parent reapproval triggers
        requireParentReapprovalOnBudgetChange:
          association.config?.requireParentReapprovalOnBudgetChange ?? true,
        parentReapprovalTotalBudgetChangeAmount:
          association.config?.parentReapprovalTotalBudgetChangeAmount,
        parentReapprovalTotalBudgetChangePercent:
          association.config?.parentReapprovalTotalBudgetChangePercent,
        parentReapprovalCategoryChangeAmount:
          association.config?.parentReapprovalCategoryChangeAmount,
        parentReapprovalCategoryChangePercent:
          association.config?.parentReapprovalCategoryChangePercent,

        // Transaction approval thresholds from team settings (use sample or default)
        dualApprovalThreshold: sampleTeam?.teamSettings?.dualApprovalThreshold,

        // Association rules snapshot (JSON)
        rulesSnapshot: association.rules.map((rule) => ({
          id: rule.id,
          ruleType: rule.ruleType,
          name: rule.name,
          config: rule.config,
          approvalTiers: rule.approvalTiers,
          requiredExpenses: rule.requiredExpenses,
          signingAuthorityComposition: rule.signingAuthorityComposition,
          teamTypeFilter: rule.teamTypeFilter,
          ageDivisionFilter: rule.ageDivisionFilter,
          competitiveLevelFilter: rule.competitiveLevelFilter,
        })),
      },
    })

    return snapshot.id
  } catch (error) {
    console.error('Error creating policy snapshot:', error)
    throw error
  }
}

/**
 * Create a team season with policy snapshot
 *
 * @param teamId - ID of the team
 * @param associationId - ID of the association
 * @param seasonLabel - Season label (e.g., "2024-2025")
 * @param seasonStart - Season start date
 * @param seasonEnd - Season end date
 * @returns ID of the created team season
 */
export async function createTeamSeasonWithSnapshot(
  teamId: string,
  associationId: string,
  seasonLabel: string,
  seasonStart: Date,
  seasonEnd: Date
): Promise<string> {
  try {
    // Create policy snapshot
    const snapshotId = await createPolicySnapshot(associationId)

    // Create team season
    const teamSeason = await prisma.teamSeason.create({
      data: {
        teamId,
        associationId,
        seasonLabel,
        seasonStart,
        seasonEnd,
        policySnapshotId: snapshotId,
        state: 'SETUP',
      },
    })

    // Create initial state change log
    await prisma.teamSeasonStateChange.create({
      data: {
        teamSeasonId: teamSeason.id,
        fromState: null,
        toState: 'SETUP',
        action: 'START_BUDGET', // Will actually happen later, but we log the initial state
        actorUserId: null,
        actorType: 'SYSTEM',
        metadata: {
          initial: true,
          snapshotId,
        },
      },
    })

    return teamSeason.id
  } catch (error) {
    console.error('Error creating team season with snapshot:', error)
    throw error
  }
}

/**
 * Get policy snapshot for a team season
 *
 * @param teamSeasonId - ID of the team season
 * @returns Policy snapshot or null
 */
export async function getTeamSeasonPolicy(teamSeasonId: string) {
  const teamSeason = await prisma.teamSeason.findUnique({
    where: { id: teamSeasonId },
    include: {
      policySnapshot: true,
    },
  })

  return teamSeason?.policySnapshot || null
}
