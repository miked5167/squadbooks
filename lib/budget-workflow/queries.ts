/**
 * Budget Workflow Query Helpers
 *
 * Reusable functions for fetching budget data with proper includes
 */

import { prisma } from '@/lib/prisma'
import { BudgetWithVersion, BudgetVersionWithAllocations, BudgetAllocationDetail } from '@/lib/types/budget-workflow'

/**
 * Get budget with current and presented versions
 */
export async function getBudgetWithVersions(budgetId: string): Promise<BudgetWithVersion | null> {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: {
      thresholdConfig: true,
      versions: {
        include: {
          allocations: {
            include: {
              systemCategory: {
                include: {
                  displayCategory: true,
                },
              },
            },
          },
          approvals: {
            include: {
              family: true,
            },
          },
        },
        orderBy: {
          versionNumber: 'desc',
        },
      },
    },
  })

  if (!budget) return null

  // Find current and presented versions
  const currentVersion = budget.versions.find(v => v.versionNumber === budget.currentVersionNumber)
  const presentedVersion = budget.presentedVersionNumber
    ? budget.versions.find(v => v.versionNumber === budget.presentedVersionNumber)
    : undefined

  return {
    ...budget,
    currentVersion: currentVersion ? formatBudgetVersion(currentVersion) : undefined,
    presentedVersion: presentedVersion ? formatBudgetVersion(presentedVersion) : undefined,
  } as BudgetWithVersion
}

/**
 * Get a specific budget version with allocations
 */
export async function getBudgetVersion(
  budgetId: string,
  versionNumber: number
): Promise<BudgetVersionWithAllocations | null> {
  const version = await prisma.budgetVersion.findUnique({
    where: {
      budgetId_versionNumber: {
        budgetId,
        versionNumber,
      },
    },
    include: {
      allocations: {
        include: {
          systemCategory: {
            include: {
              displayCategory: true,
            },
          },
        },
      },
      approvals: {
        include: {
          family: true,
        },
      },
    },
  })

  if (!version) return null

  return formatBudgetVersion(version)
}

/**
 * Get all budgets for a team
 */
export async function getTeamBudgets(teamId: string) {
  return prisma.budget.findMany({
    where: { teamId },
    include: {
      thresholdConfig: true,
      versions: {
        where: {
          versionNumber: 1, // Just get v1 for list view
        },
        include: {
          allocations: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
}

/**
 * Check if user can edit a budget
 */
export async function canEditBudget(budgetId: string, userId: string): Promise<boolean> {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: {
      team: {
        include: {
          users: {
            where: { id: userId },
          },
        },
      },
    },
  })

  if (!budget) return false

  const user = budget.team.users[0]
  if (!user) return false

  // Only treasurers can edit
  if (!['TREASURER', 'ASSISTANT_TREASURER'].includes(user.role)) {
    return false
  }

  // Can only edit in DRAFT or PRESENTED (via propose update)
  return budget.status === 'DRAFT' || budget.status === 'PRESENTED'
}

/**
 * Check if user can approve a budget (coach)
 */
export async function canApproveBudget(budgetId: string, userId: string): Promise<boolean> {
  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: {
      team: {
        include: {
          users: {
            where: { id: userId },
          },
        },
      },
    },
  })

  if (!budget) return false

  const user = budget.team.users[0]
  if (!user) return false

  // Only coach/board can approve
  if (!['PRESIDENT', 'BOARD_MEMBER'].includes(user.role)) {
    return false
  }

  // Can only approve in REVIEW state
  return budget.status === 'REVIEW'
}

/**
 * Get family's approval for a budget version (for parents)
 */
export async function getFamilyApproval(budgetVersionId: string, familyId: string) {
  return prisma.budgetVersionApproval.findUnique({
    where: {
      budgetVersionId_familyId: {
        budgetVersionId,
        familyId,
      },
    },
  })
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatBudgetVersion(version: any): BudgetVersionWithAllocations {
  return {
    id: version.id,
    budgetId: version.budgetId,
    versionNumber: version.versionNumber,
    totalBudget: Number(version.totalBudget),
    changeSummary: version.changeSummary,
    createdBy: version.createdBy,
    createdAt: version.createdAt,
    coachApprovedAt: version.coachApprovedAt,
    coachApprovedBy: version.coachApprovedBy,
    coachNotes: version.coachNotes,
    allocations: version.allocations.map((a: any): BudgetAllocationDetail => ({
      id: a.id,
      budgetVersionId: a.budgetVersionId,
      categoryId: a.systemCategoryId,
      categoryName: a.systemCategory?.name || 'Unknown',
      categoryHeading: a.systemCategory?.displayCategory?.name || 'Other',
      allocated: Number(a.allocated),
      notes: a.notes,
    })),
    approvals: version.approvals?.map((a: any) => ({
      id: a.id,
      budgetVersionId: a.budgetVersionId,
      familyId: a.familyId,
      familyName: a.family.familyName,
      acknowledgedAt: a.acknowledgedAt,
      acknowledgedBy: a.acknowledgedBy,
      acknowledgedByName: '', // Would need to join user
      comment: a.comment,
      hasQuestions: a.hasQuestions,
    })),
  }
}
