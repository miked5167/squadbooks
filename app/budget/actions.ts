'use server'

/**
 * Budget Workflow Server Actions
 *
 * Implements all budget state transitions and business logic:
 * - Treasurer: Create, edit, submit, propose updates
 * - Coach: Approve, request changes
 * - Team: Present to parents
 * - Parents: Acknowledge budget
 */

import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth/server-auth'
import { revalidatePath } from 'next/cache'
import { BudgetStatus, UserRole } from '@prisma/client'
import {
  BudgetWorkflowResult,
  canTransition,
  SubmitForReviewInput,
  CoachReviewInput,
  PresentToParentsInput,
  ProposeUpdateInput,
  AcknowledgeBudgetInput,
} from '@/lib/types/budget-workflow'
import { checkThresholdAndLock } from '@/lib/budget-workflow/threshold'
import { transitionTeamSeason } from '@/lib/services/team-season-lifecycle'
import { checkAndLockBudget } from '@/lib/services/team-season-auto-transitions'
import { logger } from '@/lib/logger'

// ============================================
// HELPER: Get authenticated user with team info
// ============================================

async function getAuthenticatedUser() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error('Not authenticated')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      team: true,
    },
  })

  if (!user) {
    throw new Error('User not found')
  }

  return user
}

/**
 * Get or create team season for a team/season
 * Returns null if team is not connected to an association
 */
async function getOrCreateTeamSeason(teamId: string, season: string) {
  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        associationTeam: true,
      },
    })

    if (!team?.associationTeam?.associationId) {
      // Team not connected to association - lifecycle not applicable
      return null
    }

    // Check if team season exists
    let teamSeason = await prisma.teamSeason.findUnique({
      where: {
        teamId_seasonLabel: {
          teamId,
          seasonLabel: season,
        },
      },
    })

    if (teamSeason) {
      return teamSeason
    }

    // Create team season with policy snapshot
    const { createTeamSeasonWithSnapshot } = await import('@/lib/services/team-policy-snapshot')

    // Parse season dates from label (e.g., "2024-2025" → Sept 2024 - Aug 2025)
    const [startYear, endYear] = season.split('-').map(y => parseInt(y))
    const seasonStart = new Date(startYear, 8, 1) // Sept 1
    const seasonEnd = new Date(endYear, 7, 31) // Aug 31

    const teamSeasonId = await createTeamSeasonWithSnapshot(
      teamId,
      team.associationTeam.associationId,
      season,
      seasonStart,
      seasonEnd
    )

    teamSeason = await prisma.teamSeason.findUnique({
      where: { id: teamSeasonId },
    })

    return teamSeason
  } catch (error) {
    console.error('Error getting/creating team season:', error)
    return null
  }
}

// ============================================
// TREASURER ACTIONS
// ============================================

/**
 * Create a new budget for a team/season
 */
export async function createBudget(
  teamId: string,
  season: string,
  allocations: Array<{ categoryId: string; allocated: number; notes?: string }>
): Promise<BudgetWorkflowResult<{ budgetId: string }>> {
  try {
    const user = await getAuthenticatedUser()

    // Check authorization
    if (!['TREASURER', 'ASSISTANT_TREASURER'].includes(user.role)) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Only treasurers can create budgets',
        },
      }
    }

    if (user.teamId !== teamId) {
      return {
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Cannot create budget for another team',
        },
      }
    }

    // Check if budget already exists for this team/season
    const existing = await prisma.budget.findUnique({
      where: { teamId_season: { teamId, season } },
    })

    if (existing) {
      return {
        success: false,
        error: {
          code: 'INVALID_ALLOCATIONS',
          message: 'Budget already exists for this season',
        },
      }
    }

    // Calculate total budget
    const totalBudget = allocations.reduce((sum, a) => sum + a.allocated, 0)

    // Get active families count for threshold config
    const activeFamiliesCount = await prisma.family.count({
      where: {
        teamId,
        players: { some: { status: 'ACTIVE' } },
      },
    })

    // Get team's association and governance rules
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { associationTeam: true },
    })

    const associationId = team?.associationTeam?.associationId

    // Fetch parent threshold config from governance rules (or use defaults)
    let thresholdMode: 'COUNT' | 'PERCENT' = 'PERCENT'
    let thresholdValue: number = 80 // Default 80%
    if (associationId) {
      const { getParentThresholdConfig } = await import('@/lib/db/governance')
      const thresholdConfig = await getParentThresholdConfig(associationId)
      thresholdMode = thresholdConfig.mode
      thresholdValue = thresholdConfig.mode === 'PERCENT'
        ? (thresholdConfig.percentThreshold ?? 80)
        : (thresholdConfig.countThreshold ?? Math.ceil(activeFamiliesCount * 0.8))
    }

    // Create budget, version, and allocations in a transaction
    const budget = await prisma.$transaction(async (tx) => {
      // Create Budget
      const newBudget = await tx.budget.create({
        data: {
          teamId,
          season,
          status: BudgetStatus.DRAFT,
          currentVersionNumber: 1,
          createdBy: user.id,
        },
      })

      // Create BudgetVersion v1
      const version = await tx.budgetVersion.create({
        data: {
          budgetId: newBudget.id,
          versionNumber: 1,
          totalBudget,
          createdBy: user.id,
        },
      })

      // Create BudgetAllocations
      await tx.budgetAllocation.createMany({
        data: allocations.map(a => ({
          budgetVersionId: version.id,
          categoryId: a.categoryId,
          allocated: a.allocated,
          notes: a.notes,
        })),
      })

      // Create ThresholdConfig using governance rules (snapshotted)
      await tx.budgetThresholdConfig.create({
        data: {
          budgetId: newBudget.id,
          mode: thresholdMode,
          percentThreshold: thresholdMode === 'PERCENT' ? thresholdValue : null,
          countThreshold: thresholdMode === 'COUNT' ? thresholdValue : null,
          eligibleFamilyCount: activeFamiliesCount,
        },
      })

      return newBudget
    })

    revalidatePath('/budget')
    revalidatePath(`/budget/${budget.id}`)

    return {
      success: true,
      data: { budgetId: budget.id },
    }
  } catch (error) {
    console.error('Error creating budget:', error)
    return {
      success: false,
      error: {
        code: 'INVALID_ALLOCATIONS',
        message: error instanceof Error ? error.message : 'Failed to create budget',
      },
    }
  }
}

/**
 * Update budget allocations (only in DRAFT status)
 */
export async function updateBudgetDraft(
  budgetId: string,
  allocations: Array<{ categoryId: string; allocated: number; notes?: string }>
): Promise<BudgetWorkflowResult> {
  try {
    const user = await getAuthenticatedUser()

    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        versions: {
          where: { versionNumber: 1 },
          include: { allocations: true },
        },
      },
    })

    if (!budget) {
      return {
        success: false,
        error: { code: 'BUDGET_NOT_FOUND', message: 'Budget not found' },
      }
    }

    // Authorization
    if (!['TREASURER', 'ASSISTANT_TREASURER'].includes(user.role) || user.teamId !== budget.teamId) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
      }
    }

    // Can only edit in DRAFT
    if (budget.status !== BudgetStatus.DRAFT) {
      return {
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: 'Can only edit budget in DRAFT status',
        },
      }
    }

    const version = budget.versions[0]
    if (!version) {
      return {
        success: false,
        error: { code: 'VERSION_NOT_FOUND', message: 'Budget version not found' },
      }
    }

    // Calculate new total
    const totalBudget = allocations.reduce((sum, a) => sum + a.allocated, 0)

    // Update in transaction
    await prisma.$transaction(async (tx) => {
      // Delete old allocations
      await tx.budgetAllocation.deleteMany({
        where: { budgetVersionId: version.id },
      })

      // Create new allocations
      await tx.budgetAllocation.createMany({
        data: allocations.map(a => ({
          budgetVersionId: version.id,
          categoryId: a.categoryId,
          allocated: a.allocated,
          notes: a.notes,
        })),
      })

      // Update version total
      await tx.budgetVersion.update({
        where: { id: version.id },
        data: { totalBudget },
      })

      // Update budget timestamp
      await tx.budget.update({
        where: { id: budgetId },
        data: { updatedAt: new Date() },
      })
    })

    revalidatePath(`/budget/${budgetId}`)

    return { success: true }
  } catch (error) {
    console.error('Error updating budget:', error)
    return {
      success: false,
      error: {
        code: 'INVALID_ALLOCATIONS',
        message: error instanceof Error ? error.message : 'Failed to update budget',
      },
    }
  }
}

/**
 * Submit budget for coach review (DRAFT → REVIEW)
 */
export async function submitForReview(input: SubmitForReviewInput): Promise<BudgetWorkflowResult> {
  try {
    const user = await getAuthenticatedUser()

    const budget = await prisma.budget.findUnique({
      where: { id: input.budgetId },
    })

    if (!budget) {
      return {
        success: false,
        error: { code: 'BUDGET_NOT_FOUND', message: 'Budget not found' },
      }
    }

    // Authorization
    if (!['TREASURER', 'ASSISTANT_TREASURER'].includes(user.role) || user.teamId !== budget.teamId) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Only treasurers can submit for review' },
      }
    }

    // Check transition
    if (!canTransition(budget.status, BudgetStatus.REVIEW)) {
      return {
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Cannot transition from ${budget.status} to REVIEW`,
        },
      }
    }

    // Validate budget against coach compensation policy
    const { validateBudget } = await import('@/lib/services/coach-compensation')
    const team = await prisma.team.findUnique({
      where: { id: budget.teamId },
      select: {
        associationTeam: {
          select: {
            associationId: true,
            association: {
              select: {
                season: true,
              },
            },
          },
        },
      },
    })

    if (team?.associationTeam?.[0]) {
      const associationId = team.associationTeam[0].associationId
      const season = team.associationTeam[0].association.season

      const budgetValidation = await validateBudget({
        budgetId: input.budgetId,
        teamId: budget.teamId,
        season,
        associationId,
      })

      // BLOCK or REQUIRE_EXCEPTION: prevent submission
      if (!budgetValidation.allowed) {
        if (budgetValidation.severity === 'critical' || budgetValidation.severity === 'error') {
          return {
            success: false,
            error: {
              code: 'BUDGET_VALIDATION_FAILED',
              message: budgetValidation.message || 'Budget validation failed',
            },
          }
        }
      }

      // Log warnings even if allowed
      if (budgetValidation.severity === 'warn' && budgetValidation.message) {
        logger.warn('Budget submission warning', {
          budgetId: input.budgetId,
          teamId: budget.teamId,
          message: budgetValidation.message,
        })
      }
    }

    // Update status
    await prisma.budget.update({
      where: { id: input.budgetId },
      data: { status: BudgetStatus.REVIEW },
    })

    // LIFECYCLE INTEGRATION: Transition team season state
    const teamSeason = await getOrCreateTeamSeason(budget.teamId, budget.season)
    if (teamSeason) {
      await transitionTeamSeason(
        teamSeason.id,
        'SUBMIT_BUDGET_FOR_REVIEW',
        user.id,
        {
          budgetId: budget.id,
          versionNumber: budget.currentVersionNumber,
        }
      )
    }

    revalidatePath(`/budget/${input.budgetId}`)

    return { success: true }
  } catch (error) {
    console.error('Error submitting for review:', error)
    return {
      success: false,
      error: {
        code: 'INVALID_STATUS_TRANSITION',
        message: error instanceof Error ? error.message : 'Failed to submit',
      },
    }
  }
}

/**
 * Propose an update to a PRESENTED budget
 * Creates a new version with edited allocations
 */
export async function proposeUpdate(input: ProposeUpdateInput): Promise<BudgetWorkflowResult<{ versionNumber: number }>> {
  try {
    const user = await getAuthenticatedUser()

    const budget = await prisma.budget.findUnique({
      where: { id: input.budgetId },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    })

    if (!budget) {
      return {
        success: false,
        error: { code: 'BUDGET_NOT_FOUND', message: 'Budget not found' },
      }
    }

    // Authorization
    if (!['TREASURER', 'ASSISTANT_TREASURER'].includes(user.role) || user.teamId !== budget.teamId) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
      }
    }

    // Can only propose updates when PRESENTED
    if (budget.status !== BudgetStatus.PRESENTED) {
      return {
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: 'Can only propose updates when budget is PRESENTED',
        },
      }
    }

    // Check for locked status
    if (budget.status === BudgetStatus.LOCKED) {
      return {
        success: false,
        error: { code: 'BUDGET_LOCKED', message: 'Cannot edit locked budget' },
      }
    }

    // Validate change summary
    if (!input.changeSummary || input.changeSummary.trim().length === 0) {
      return {
        success: false,
        error: {
          code: 'MISSING_CHANGE_SUMMARY',
          message: 'Change summary is required when proposing updates',
        },
      }
    }

    const newVersionNumber = budget.currentVersionNumber + 1
    const totalBudget = input.allocations.reduce((sum, a) => sum + a.allocated, 0)

    // Create new version and allocations
    const newVersion = await prisma.$transaction(async (tx) => {
      // Create new BudgetVersion
      const version = await tx.budgetVersion.create({
        data: {
          budgetId: budget.id,
          versionNumber: newVersionNumber,
          totalBudget,
          changeSummary: input.changeSummary,
          createdBy: user.id,
        },
      })

      // Create allocations for new version
      await tx.budgetAllocation.createMany({
        data: input.allocations.map(a => ({
          budgetVersionId: version.id,
          categoryId: a.categoryId,
          allocated: a.allocated,
          notes: a.notes,
        })),
      })

      // Update budget: increment version, update presented version, stay in PRESENTED status
      await tx.budget.update({
        where: { id: budget.id },
        data: {
          currentVersionNumber: newVersionNumber,
          presentedVersionNumber: newVersionNumber,
          // Status remains PRESENTED - parents now need to approve new version
        },
      })

      return version
    })

    // LIFECYCLE INTEGRATION: Propose update (creates versioning loop)
    const teamSeason = await getOrCreateTeamSeason(budget.teamId, budget.season)
    if (teamSeason && ['PRESENTED', 'LOCKED', 'ACTIVE'].includes(teamSeason.state)) {
      await transitionTeamSeason(
        teamSeason.id,
        'PROPOSE_BUDGET_UPDATE',
        user.id,
        {
          budgetId: budget.id,
          changeSummary: input.changeSummary,
          newVersionNumber,
          previousVersionNumber: budget.currentVersionNumber,
        }
      )
    }

    revalidatePath(`/budget/${input.budgetId}`)

    return {
      success: true,
      data: { versionNumber: newVersion.versionNumber },
    }
  } catch (error) {
    console.error('Error proposing update:', error)
    return {
      success: false,
      error: {
        code: 'INVALID_ALLOCATIONS',
        message: error instanceof Error ? error.message : 'Failed to propose update',
      },
    }
  }
}

// ============================================
// COACH ACTIONS
// ============================================

/**
 * Coach approves budget (REVIEW → TEAM_APPROVED)
 */
export async function approveBudget(input: CoachReviewInput): Promise<BudgetWorkflowResult> {
  try {
    const user = await getAuthenticatedUser()

    const budget = await prisma.budget.findUnique({
      where: { id: input.budgetId },
      include: {
        versions: {
          where: { versionNumber: input.versionNumber },
        },
      },
    })

    if (!budget) {
      return {
        success: false,
        error: { code: 'BUDGET_NOT_FOUND', message: 'Budget not found' },
      }
    }

    const version = budget.versions[0]
    if (!version) {
      return {
        success: false,
        error: { code: 'VERSION_NOT_FOUND', message: 'Version not found' },
      }
    }

    // Authorization - coach or board member
    if (!['PRESIDENT', 'BOARD_MEMBER'].includes(user.role) || user.teamId !== budget.teamId) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Only coaches can approve budgets' },
      }
    }

    // Check if approved
    if (!input.approved) {
      // Request changes: REVIEW → DRAFT
      if (!canTransition(budget.status, BudgetStatus.DRAFT)) {
        return {
          success: false,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: 'Cannot request changes in current state',
          },
        }
      }

      await prisma.$transaction(async (tx) => {
        // Update version with coach notes
        await tx.budgetVersion.update({
          where: { id: version.id },
          data: {
            coachNotes: input.notes || 'Changes requested',
          },
        })

        // Move to DRAFT
        await tx.budget.update({
          where: { id: budget.id },
          data: { status: BudgetStatus.DRAFT },
        })
      })

      // LIFECYCLE INTEGRATION: Request changes
      const teamSeason = await getOrCreateTeamSeason(budget.teamId, budget.season)
      if (teamSeason) {
        await transitionTeamSeason(
          teamSeason.id,
          'REQUEST_BUDGET_CHANGES',
          user.id,
          {
            budgetId: budget.id,
            versionNumber: input.versionNumber,
            coachNotes: input.notes,
          }
        )
      }

      revalidatePath(`/budget/${input.budgetId}`)

      return { success: true }
    }

    // Determine next status based on association governance rules
    const team = await prisma.team.findUnique({
      where: { id: budget.teamId },
      include: {
        associationTeam: true,
      },
    })

    const associationId = team?.associationTeam?.associationId

    // Check if association approval is required
    let nextStatus = BudgetStatus.TEAM_APPROVED
    if (associationId) {
      const { requiresAssociationApproval } = await import('@/lib/db/governance')
      const needsAssociationApproval = await requiresAssociationApproval(associationId)
      if (needsAssociationApproval) {
        nextStatus = BudgetStatus.ASSOCIATION_REVIEW
      }
    }

    // Approve: REVIEW → ASSOCIATION_REVIEW or TEAM_APPROVED
    if (!canTransition(budget.status, nextStatus)) {
      return {
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Cannot approve from ${budget.status} state`,
        },
      }
    }

    await prisma.$transaction(async (tx) => {
      // Record coach approval on version
      await tx.budgetVersion.update({
        where: { id: version.id },
        data: {
          coachApprovedAt: new Date(),
          coachApprovedBy: user.id,
          coachNotes: input.notes,
        },
      })

      // Move to next status (ASSOCIATION_REVIEW or TEAM_APPROVED)
      await tx.budget.update({
        where: { id: budget.id },
        data: { status: nextStatus },
      })
    })

    // LIFECYCLE INTEGRATION: Approve budget
    const teamSeason = await getOrCreateTeamSeason(budget.teamId, budget.season)
    if (teamSeason) {
      // Only transition to TEAM_APPROVED state if no association review needed
      const targetState = nextStatus === BudgetStatus.TEAM_APPROVED ? 'TEAM_APPROVED' : 'BUDGET_REVIEW'
      await transitionTeamSeason(
        teamSeason.id,
        'APPROVE_BUDGET',
        user.id,
        {
          budgetId: budget.id,
          versionNumber: input.versionNumber,
          coachNotes: input.notes,
          requiresAssociationReview: nextStatus === BudgetStatus.ASSOCIATION_REVIEW,
        }
      )
    }

    revalidatePath(`/budget/${input.budgetId}`)

    return { success: true }
  } catch (error) {
    console.error('Error approving budget:', error)
    return {
      success: false,
      error: {
        code: 'INVALID_STATUS_TRANSITION',
        message: error instanceof Error ? error.message : 'Failed to approve',
      },
    }
  }
}

// ============================================
// TEAM ACTIONS
// ============================================

/**
 * Present budget to parents (TEAM_APPROVED → PRESENTED)
 */
export async function presentToParents(input: PresentToParentsInput): Promise<BudgetWorkflowResult> {
  try {
    const user = await getAuthenticatedUser()

    const budget = await prisma.budget.findUnique({
      where: { id: input.budgetId },
      include: {
        versions: {
          where: { versionNumber: input.versionNumber },
        },
      },
    })

    if (!budget) {
      return {
        success: false,
        error: { code: 'BUDGET_NOT_FOUND', message: 'Budget not found' },
      }
    }

    const version = budget.versions[0]
    if (!version) {
      return {
        success: false,
        error: { code: 'VERSION_NOT_FOUND', message: 'Version not found' },
      }
    }

    // Authorization - treasurer or coach
    if (!['TREASURER', 'ASSISTANT_TREASURER', 'PRESIDENT', 'BOARD_MEMBER'].includes(user.role) || user.teamId !== budget.teamId) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
      }
    }

    // Check transition
    if (!canTransition(budget.status, BudgetStatus.PRESENTED)) {
      return {
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: 'Budget must be TEAM_APPROVED before presenting to parents',
        },
      }
    }

    // Verify coach approved this version
    if (!version.coachApprovedAt) {
      return {
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: 'This version has not been approved by coach',
        },
      }
    }

    // Move to PRESENTED
    await prisma.budget.update({
      where: { id: budget.id },
      data: {
        status: BudgetStatus.PRESENTED,
        presentedVersionNumber: input.versionNumber,
      },
    })

    // LIFECYCLE INTEGRATION: Present to parents
    const teamSeason = await getOrCreateTeamSeason(budget.teamId, budget.season)
    if (teamSeason) {
      await transitionTeamSeason(
        teamSeason.id,
        'PRESENT_BUDGET',
        user.id,
        {
          budgetId: budget.id,
          presentedVersionId: version.id,
          versionNumber: input.versionNumber,
        }
      )
    }

    // PARENT VOTING: Create budget approval request for parents
    // Get all active parents for this team
    const parents = await prisma.user.findMany({
      where: {
        teamId: budget.teamId,
        role: 'PARENT',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    if (parents.length > 0) {
      // Get team name for emails
      const team = await prisma.team.findUnique({
        where: { id: budget.teamId },
        select: { name: true },
      })

      // Create budget approval record
      const budgetApproval = await prisma.budgetApproval.create({
        data: {
          teamId: budget.teamId,
          season: budget.season,
          budgetTotal: version.totalBudget,
          approvalType: 'INITIAL',
          description: `Budget for ${budget.season} season - Version ${input.versionNumber}`,
          requiredCount: parents.length, // All parents must acknowledge
          createdBy: user.id,
          // Optional: Set deadline (e.g., 14 days from now)
          // expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      })

      // Create acknowledgment records for each parent
      await prisma.acknowledgment.createMany({
        data: parents.map((parent) => ({
          budgetApprovalId: budgetApproval.id,
          userId: parent.id,
          familyName: parent.name || 'Parent',
          email: parent.email,
        })),
      })

      // Send email notifications to all parents
      const { sendBudgetApprovalRequestEmail } = await import('@/lib/email')

      const emailPromises = parents.map((parent) =>
        sendBudgetApprovalRequestEmail({
          parentName: parent.name || 'Parent',
          parentEmail: parent.email,
          teamName: team?.name || 'Your Team',
          budgetTotal: Number(version.totalBudget),
          approvalType: 'INITIAL',
          description: `Budget for ${budget.season} season - Version ${input.versionNumber}`,
          approvalId: budgetApproval.id,
        })
      )

      // Send all emails in parallel, but don't fail the request if emails fail
      try {
        await Promise.allSettled(emailPromises)
        console.log(`Budget approval emails sent to ${parents.length} parents`, {
          budgetApprovalId: budgetApproval.id,
          teamId: budget.teamId,
        })
      } catch (error) {
        console.error('Failed to send budget approval emails', error)
        // Continue - approval was created successfully even if emails failed
      }
    }

    revalidatePath(`/budget/${input.budgetId}`)

    return { success: true }
  } catch (error) {
    console.error('Error presenting to parents:', error)
    return {
      success: false,
      error: {
        code: 'INVALID_STATUS_TRANSITION',
        message: error instanceof Error ? error.message : 'Failed to present',
      },
    }
  }
}

// ============================================
// PARENT ACTIONS
// ============================================

/**
 * Parent acknowledges and approves a budget version
 * Automatically checks threshold and locks if met
 */
export async function acknowledgeBudget(input: AcknowledgeBudgetInput): Promise<BudgetWorkflowResult<{ locked: boolean; progress: any }>> {
  try {
    const user = await getAuthenticatedUser()

    // Get budget version
    const version = await prisma.budgetVersion.findUnique({
      where: { id: input.budgetVersionId },
      include: {
        budget: true,
        approvals: {
          where: { familyId: input.familyId },
        },
      },
    })

    if (!version) {
      return {
        success: false,
        error: { code: 'VERSION_NOT_FOUND', message: 'Budget version not found' },
      }
    }

    const budget = version.budget

    // Check if budget is PRESENTED
    if (budget.status !== BudgetStatus.PRESENTED) {
      return {
        success: false,
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: 'Budget is not available for parent approval',
        },
      }
    }

    // Check if this is the presented version
    if (budget.presentedVersionNumber !== version.versionNumber) {
      return {
        success: false,
        error: {
          code: 'VERSION_MISMATCH',
          message: 'This is not the currently presented version',
        },
      }
    }

    // Check if family already acknowledged this version (idempotent)
    if (version.approvals.length > 0) {
      // Already acknowledged, get current progress
      const { progress } = await checkThresholdAndLock(budget.id)
      return {
        success: true,
        data: {
          locked: budget.status === BudgetStatus.LOCKED,
          progress,
        },
      }
    }

    // Verify user belongs to this family
    const family = await prisma.family.findUnique({
      where: { id: input.familyId },
      include: {
        players: {
          where: { status: 'ACTIVE' },
        },
      },
    })

    if (!family || family.teamId !== user.teamId) {
      return {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
      }
    }

    // Create acknowledgement
    await prisma.budgetVersionApproval.create({
      data: {
        budgetVersionId: input.budgetVersionId,
        familyId: input.familyId,
        acknowledgedBy: user.id,
        comment: input.comment,
        hasQuestions: input.hasQuestions || false,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    })

    // Check threshold and potentially lock (legacy budget system)
    const { locked, progress } = await checkThresholdAndLock(budget.id)

    // LIFECYCLE INTEGRATION: Check and auto-lock team season
    const teamSeason = await getOrCreateTeamSeason(budget.teamId, budget.season)
    if (teamSeason) {
      await checkAndLockBudget(teamSeason.id, input.budgetVersionId)
    }

    revalidatePath(`/budget/${budget.id}`)
    revalidatePath(`/budget/${budget.id}/view`)

    return {
      success: true,
      data: {
        locked,
        progress,
      },
    }
  } catch (error) {
    console.error('Error acknowledging budget:', error)
    return {
      success: false,
      error: {
        code: 'INVALID_STATUS_TRANSITION',
        message: error instanceof Error ? error.message : 'Failed to acknowledge',
      },
    }
  }
}
