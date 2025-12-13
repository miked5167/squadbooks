/**
 * Team Season Lifecycle Service
 *
 * Handles state transitions for team seasons with strict guards and audit logging.
 * DO NOT overbuild workflow engine infrastructure - this is a straightforward
 * enum + transition guards approach.
 */

import { prisma } from '@/lib/prisma'
import { TeamSeasonState, TeamSeasonAction } from '@prisma/client'
import type {
  TransitionResult,
  ActorType,
  PermissionContext,
  GuardResult,
  TeamSeasonWithRelations,
} from '@/lib/types/team-season'

// ============================================
// ALLOWED TRANSITIONS MAP
// ============================================

const ALLOWED_TRANSITIONS: Record<TeamSeasonState, Partial<Record<TeamSeasonAction, TeamSeasonState>>> = {
  // SETUP can only start budget
  SETUP: {
    START_BUDGET: 'BUDGET_DRAFT',
  },

  // BUDGET_DRAFT can submit for review
  BUDGET_DRAFT: {
    SUBMIT_BUDGET_FOR_REVIEW: 'BUDGET_REVIEW',
  },

  // BUDGET_REVIEW can be approved or sent back
  BUDGET_REVIEW: {
    APPROVE_BUDGET: 'TEAM_APPROVED',
    REQUEST_BUDGET_CHANGES: 'BUDGET_DRAFT',
  },

  // TEAM_APPROVED can be presented to parents
  TEAM_APPROVED: {
    PRESENT_BUDGET: 'PRESENTED',
  },

  // PRESENTED can be locked (automatic) or propose update
  PRESENTED: {
    LOCK_BUDGET: 'LOCKED',
    PROPOSE_BUDGET_UPDATE: 'BUDGET_REVIEW',
  },

  // LOCKED can start season or propose update
  LOCKED: {
    START_SEASON: 'ACTIVE',
    PROPOSE_BUDGET_UPDATE: 'BUDGET_REVIEW',
  },

  // ACTIVE can propose update or initiate closeout
  ACTIVE: {
    PROPOSE_BUDGET_UPDATE: 'BUDGET_REVIEW',
    INITIATE_CLOSEOUT: 'CLOSEOUT',
  },

  // CLOSEOUT can only be archived
  CLOSEOUT: {
    FINALIZE_ARCHIVE: 'ARCHIVED',
  },

  // ARCHIVED is terminal - no outgoing transitions
  ARCHIVED: {},
}

// ============================================
// PERMISSION CHECKS
// ============================================

/**
 * Check if user has permission to perform action
 */
function hasPermission(
  action: TeamSeasonAction,
  context: PermissionContext
): GuardResult {
  const { userRole } = context

  // Map actions to required roles
  const actionPermissions: Record<TeamSeasonAction, string[]> = {
    START_BUDGET: ['TREASURER', 'ASSISTANT_TREASURER'],
    SUBMIT_BUDGET_FOR_REVIEW: ['TREASURER', 'ASSISTANT_TREASURER'],
    REQUEST_BUDGET_CHANGES: ['PRESIDENT', 'BOARD_MEMBER'],
    APPROVE_BUDGET: ['PRESIDENT', 'BOARD_MEMBER'],
    PRESENT_BUDGET: ['PRESIDENT', 'BOARD_MEMBER'],
    PROPOSE_BUDGET_UPDATE: ['TREASURER', 'ASSISTANT_TREASURER'],
    LOCK_BUDGET: ['SYSTEM'], // System only
    START_SEASON: ['TREASURER', 'ASSISTANT_TREASURER', 'PRESIDENT', 'BOARD_MEMBER'],
    INITIATE_CLOSEOUT: ['TREASURER', 'ASSISTANT_TREASURER'],
    FINALIZE_ARCHIVE: ['TREASURER', 'ASSISTANT_TREASURER', 'PRESIDENT', 'BOARD_MEMBER'],
  }

  const allowedRoles = actionPermissions[action]
  if (!allowedRoles) {
    return { allowed: false, reason: `Unknown action: ${action}` }
  }

  // Special case: SYSTEM actions
  if (allowedRoles.includes('SYSTEM')) {
    return {
      allowed: false,
      reason: `Action ${action} can only be performed by the system`,
    }
  }

  if (!allowedRoles.includes(userRole)) {
    return {
      allowed: false,
      reason: `Role ${userRole} is not permitted to perform ${action}`,
    }
  }

  return { allowed: true }
}

// ============================================
// TRANSITION GUARDS
// ============================================

/**
 * Check if transition requires specific data (e.g., presentedVersionId)
 */
async function validateTransitionData(
  teamSeasonId: string,
  action: TeamSeasonAction,
  metadata?: Record<string, any>
): Promise<GuardResult> {
  const teamSeason = await prisma.teamSeason.findUnique({
    where: { id: teamSeasonId },
    include: {
      team: {
        include: {
          budgets: {
            where: { season: { equals: prisma.raw('team_season.season_label') } },
            include: {
              versions: {
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
    return { allowed: false, reason: 'Team season not found' }
  }

  // Validate action-specific requirements
  switch (action) {
    case 'PRESENT_BUDGET':
      if (!teamSeason.team?.budgets[0]?.presentedVersionNumber) {
        return {
          allowed: false,
          reason: 'No budget version has been marked for presentation',
        }
      }
      break

    case 'LOCK_BUDGET':
      if (!teamSeason.presentedVersionId) {
        return {
          allowed: false,
          reason: 'No presented version ID set',
        }
      }
      // Check if threshold is met (this is validated in automatic transition)
      break

    case 'PROPOSE_BUDGET_UPDATE':
      if (!metadata?.changeSummary) {
        return {
          allowed: false,
          reason: 'Budget update requires a change summary',
        }
      }
      break
  }

  return { allowed: true }
}

// ============================================
// MAIN TRANSITION FUNCTION
// ============================================

/**
 * Transition a team season to a new state
 *
 * @param teamSeasonId - ID of the team season
 * @param action - The action to perform
 * @param actorUserId - User performing the action (null for system actions)
 * @param metadata - Additional context for the transition
 * @returns Result of the transition
 */
export async function transitionTeamSeason(
  teamSeasonId: string,
  action: TeamSeasonAction,
  actorUserId: string | null,
  metadata?: Record<string, any>
): Promise<TransitionResult> {
  try {
    // 1. Get current team season
    const teamSeason = await prisma.teamSeason.findUnique({
      where: { id: teamSeasonId },
    })

    if (!teamSeason) {
      return {
        success: false,
        newState: 'SETUP' as TeamSeasonState,
        error: 'Team season not found',
      }
    }

    const currentState = teamSeason.state

    // 2. Check if transition is allowed
    const nextState = ALLOWED_TRANSITIONS[currentState]?.[action]
    if (!nextState) {
      return {
        success: false,
        newState: currentState,
        error: `Transition ${action} is not allowed from state ${currentState}`,
      }
    }

    // 3. Check permissions (skip for system actions)
    if (actorUserId && action !== 'LOCK_BUDGET') {
      // Get user's role
      const user = await prisma.user.findUnique({
        where: { id: actorUserId },
        select: { role: true, teamId: true },
      })

      if (!user) {
        return {
          success: false,
          newState: currentState,
          error: 'User not found',
        }
      }

      const permissionCheck = hasPermission(action, {
        userId: actorUserId,
        userRole: user.role,
        teamId: teamSeason.teamId,
        associationId: teamSeason.associationId,
      })

      if (!permissionCheck.allowed) {
        return {
          success: false,
          newState: currentState,
          error: permissionCheck.reason,
        }
      }
    }

    // 4. Validate transition-specific data
    const dataValidation = await validateTransitionData(teamSeasonId, action, metadata)
    if (!dataValidation.allowed) {
      return {
        success: false,
        newState: currentState,
        error: dataValidation.reason,
      }
    }

    // 5. Perform the transition in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update timestamps based on action
      const updates: any = {
        state: nextState,
        stateUpdatedAt: new Date(),
        lastActivityAt: new Date(),
      }

      if (action === 'START_SEASON') {
        updates.activeAt = new Date()
      } else if (action === 'INITIATE_CLOSEOUT') {
        updates.closedAt = new Date()
      } else if (action === 'FINALIZE_ARCHIVE') {
        updates.archivedAt = new Date()
      } else if (action === 'LOCK_BUDGET' && metadata?.lockedVersionId) {
        updates.lockedVersionId = metadata.lockedVersionId
      } else if (action === 'PRESENT_BUDGET' && metadata?.presentedVersionId) {
        updates.presentedVersionId = metadata.presentedVersionId
      }

      // Update team season
      await tx.teamSeason.update({
        where: { id: teamSeasonId },
        data: updates,
      })

      // Create audit log entry
      await tx.teamSeasonStateChange.create({
        data: {
          teamSeasonId,
          fromState: currentState,
          toState: nextState,
          action,
          actorUserId,
          actorType: actorUserId ? 'USER' : 'SYSTEM',
          metadata: metadata || {},
        },
      })

      return { nextState, updates }
    })

    return {
      success: true,
      newState: result.nextState,
      metadata: result.updates,
    }
  } catch (error) {
    console.error('Error transitioning team season:', error)
    return {
      success: false,
      newState: 'SETUP' as TeamSeasonState,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get available actions for a team season based on current state and user role
 */
export async function getAvailableActions(
  teamSeasonId: string,
  userId: string
): Promise<TeamSeasonAction[]> {
  const teamSeason = await prisma.teamSeason.findUnique({
    where: { id: teamSeasonId },
  })

  if (!teamSeason) {
    return []
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, teamId: true },
  })

  if (!user) {
    return []
  }

  const currentState = teamSeason.state
  const possibleActions = Object.keys(ALLOWED_TRANSITIONS[currentState] || {}) as TeamSeasonAction[]

  // Filter by permissions
  return possibleActions.filter((action) => {
    const permCheck = hasPermission(action, {
      userId,
      userRole: user.role,
      teamId: teamSeason.teamId,
      associationId: teamSeason.associationId,
    })
    return permCheck.allowed
  })
}

/**
 * Check if a team season is in a modifiable state
 */
export function isModifiable(state: TeamSeasonState): boolean {
  return !['ARCHIVED'].includes(state)
}

/**
 * Check if transactions are allowed in current state
 */
export function areTransactionsAllowed(state: TeamSeasonState): boolean {
  return ['LOCKED', 'ACTIVE', 'CLOSEOUT'].includes(state)
}
