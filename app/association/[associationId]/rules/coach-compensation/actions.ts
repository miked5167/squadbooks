'use server'

/**
 * Server Actions for Coach Compensation Policy Management
 *
 * Handles:
 * - Policy CRUD operations
 * - Cap limits matrix management
 * - Exception request workflow
 * - Policy status queries
 */

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { requireAuth, requirePermission } from '@/lib/permissions/server-permissions'
import { Permission } from '@/lib/permissions/permissions'
import { logger } from '@/lib/logger'
import * as coachComp from '@/lib/services/coach-compensation'
import type { Prisma } from '@prisma/client'

// ============================================================================
// TYPES
// ============================================================================

export type PolicySettingsInput = {
  enabled: boolean
  enforcementMode: coachComp.EnforcementMode
  categoryIds: string[]
  approachingThreshold: number
  effectiveDate: Date
}

export type CapLimitInput = {
  id?: string
  season: string | null
  ageGroup: string
  skillLevel: string
  capAmountCents: number
}

export type ExceptionRequestInput = {
  teamId: string
  reason: string
  requestedDeltaCents: number
}

export type ExceptionApprovalInput = {
  exceptionId: string
  approved: boolean
  approvedDeltaCents?: number
  notes?: string
}

// ============================================================================
// POLICY MANAGEMENT
// ============================================================================

/**
 * Get coach compensation policy for an association
 */
export async function getCoachCompPolicy(associationId: string) {
  try {
    await requireAuth()

    const policy = await coachComp.getCoachCompPolicy(associationId)

    return {
      success: true,
      data: policy,
    }
  } catch (error) {
    logger.error('Error fetching coach comp policy', error as Error)
    return {
      success: false,
      error: 'Failed to fetch policy',
    }
  }
}

/**
 * Create or update policy settings
 */
export async function updatePolicySettings(
  associationId: string,
  settings: PolicySettingsInput
) {
  try {
    const user = await requireAuth()
    await requirePermission(Permission.MANAGE_ASSOCIATION_RULES)

    // Check if policy exists
    let rule = await prisma.associationRule.findFirst({
      where: {
        associationId,
        ruleType: 'COACH_COMPENSATION_LIMIT',
      },
    })

    const config: coachComp.CoachCompPolicyConfig = {
      enforcementMode: settings.enforcementMode,
      categoryIds: settings.categoryIds,
      approachingThreshold: settings.approachingThreshold,
      effectiveDate: settings.effectiveDate,
    }

    if (rule) {
      // Update existing rule
      rule = await prisma.associationRule.update({
        where: { id: rule.id },
        data: {
          isActive: settings.enabled,
          config: config as any,
          updatedAt: new Date(),
        },
      })

      logger.info('Coach compensation policy updated', {
        ruleId: rule.id,
        associationId,
        userId: user.id,
      })
    } else {
      // Create new rule
      rule = await prisma.associationRule.create({
        data: {
          associationId,
          ruleType: 'COACH_COMPENSATION_LIMIT',
          name: 'Coach Compensation Limits',
          description: 'Association-wide caps on coach compensation by age group and skill level',
          isActive: settings.enabled,
          config: config as any,
          createdBy: user.id,
        },
      })

      logger.info('Coach compensation policy created', {
        ruleId: rule.id,
        associationId,
        userId: user.id,
      })
    }

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        associationId,
        actorUserId: user.id,
        action: rule ? 'UPDATE_COACH_COMP_POLICY' : 'CREATE_COACH_COMP_POLICY',
        entityType: 'AssociationRule',
        entityId: rule.id,
        metadata: {
          enabled: settings.enabled,
          enforcementMode: settings.enforcementMode,
          categoryCount: settings.categoryIds.length,
        },
      },
    })

    revalidatePath(`/association/${associationId}/rules/coach-compensation`)

    return {
      success: true,
      data: rule,
    }
  } catch (error) {
    logger.error('Error updating policy settings', error as Error)
    return {
      success: false,
      error: 'Failed to update policy settings',
    }
  }
}

// ============================================================================
// CAP LIMITS MANAGEMENT
// ============================================================================

/**
 * Bulk upsert cap limits (create or update)
 */
export async function upsertCapLimits(
  associationId: string,
  limits: CapLimitInput[]
) {
  try {
    const user = await requireAuth()
    await requirePermission(Permission.MANAGE_ASSOCIATION_RULES)

    // Get or create policy
    let rule = await prisma.associationRule.findFirst({
      where: {
        associationId,
        ruleType: 'COACH_COMPENSATION_LIMIT',
      },
    })

    if (!rule) {
      // Create default policy if doesn't exist
      rule = await prisma.associationRule.create({
        data: {
          associationId,
          ruleType: 'COACH_COMPENSATION_LIMIT',
          name: 'Coach Compensation Limits',
          description: 'Association-wide caps on coach compensation by age group and skill level',
          isActive: false,
          config: {
            enforcementMode: 'WARN_ONLY',
            categoryIds: [],
            approachingThreshold: 0.90,
            effectiveDate: new Date(),
          } as any,
          createdBy: user.id,
        },
      })
    }

    // Upsert each limit
    const results = await Promise.all(
      limits.map(async (limit) => {
        if (limit.id) {
          // Update existing
          return prisma.coachCompensationLimit.update({
            where: { id: limit.id },
            data: {
              season: limit.season,
              ageGroup: limit.ageGroup,
              skillLevel: limit.skillLevel,
              capAmountCents: limit.capAmountCents,
            },
          })
        } else {
          // Create new (upsert to handle duplicates)
          return prisma.coachCompensationLimit.upsert({
            where: {
              unique_cap_limit: {
                ruleId: rule.id,
                season: limit.season || null,
                ageGroup: limit.ageGroup,
                skillLevel: limit.skillLevel,
              },
            },
            create: {
              ruleId: rule.id,
              season: limit.season,
              ageGroup: limit.ageGroup,
              skillLevel: limit.skillLevel,
              capAmountCents: limit.capAmountCents,
            },
            update: {
              capAmountCents: limit.capAmountCents,
            },
          })
        }
      })
    )

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        associationId,
        actorUserId: user.id,
        action: 'UPDATE_COACH_COMP_LIMITS',
        entityType: 'CoachCompensationLimit',
        entityId: rule.id,
        metadata: {
          limitCount: limits.length,
          limits: limits.map(l => ({
            ageGroup: l.ageGroup,
            skillLevel: l.skillLevel,
            cap: l.capAmountCents,
          })),
        },
      },
    })

    logger.info('Coach compensation limits updated', {
      ruleId: rule.id,
      limitCount: results.length,
      userId: user.id,
    })

    revalidatePath(`/association/${associationId}/rules/coach-compensation`)

    return {
      success: true,
      data: results,
    }
  } catch (error) {
    logger.error('Error upserting cap limits', error as Error)
    return {
      success: false,
      error: 'Failed to save cap limits',
    }
  }
}

/**
 * Delete a specific cap limit
 */
export async function deleteCapLimit(
  associationId: string,
  limitId: string
) {
  try {
    const user = await requireAuth()
    await requirePermission(Permission.MANAGE_ASSOCIATION_RULES)

    await prisma.coachCompensationLimit.delete({
      where: { id: limitId },
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        associationId,
        actorUserId: user.id,
        action: 'DELETE_COACH_COMP_LIMIT',
        entityType: 'CoachCompensationLimit',
        entityId: limitId,
        metadata: {},
      },
    })

    logger.info('Coach compensation limit deleted', {
      limitId,
      userId: user.id,
    })

    revalidatePath(`/association/${associationId}/rules/coach-compensation`)

    return {
      success: true,
    }
  } catch (error) {
    logger.error('Error deleting cap limit', error as Error)
    return {
      success: false,
      error: 'Failed to delete cap limit',
    }
  }
}

// ============================================================================
// EXCEPTION WORKFLOW
// ============================================================================

/**
 * Get pending exception requests for an association
 */
export async function getPendingExceptions(associationId: string) {
  try {
    await requireAuth()

    const rule = await prisma.associationRule.findFirst({
      where: {
        associationId,
        ruleType: 'COACH_COMPENSATION_LIMIT',
      },
    })

    if (!rule) {
      return {
        success: true,
        data: [],
      }
    }

    const exceptions = await prisma.teamRuleOverride.findMany({
      where: {
        ruleId: rule.id,
        isActive: true,
      },
      include: {
        team: {
          include: {
            associationTeam: {
              select: {
                teamName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      success: true,
      data: exceptions.map(ex => ({
        id: ex.id,
        teamId: ex.teamId,
        teamName: ex.team.associationTeam?.[0]?.teamName || ex.team.name,
        reason: ex.overrideReason,
        config: ex.overrideConfig,
        status: ex.approvedBy ? 'APPROVED' : 'PENDING',
        approvedBy: ex.approvedBy,
        approvedAt: ex.approvedAt,
        createdAt: ex.createdAt,
      })),
    }
  } catch (error) {
    logger.error('Error fetching pending exceptions', error as Error)
    return {
      success: false,
      error: 'Failed to fetch exceptions',
    }
  }
}

/**
 * Request an exception (team action)
 */
export async function requestException(
  associationId: string,
  input: ExceptionRequestInput
) {
  try {
    const user = await requireAuth()

    const rule = await prisma.associationRule.findFirst({
      where: {
        associationId,
        ruleType: 'COACH_COMPENSATION_LIMIT',
      },
    })

    if (!rule) {
      return {
        success: false,
        error: 'No coach compensation policy found',
      }
    }

    // Check if exception already exists
    const existing = await prisma.teamRuleOverride.findFirst({
      where: {
        teamId: input.teamId,
        ruleId: rule.id,
        isActive: true,
      },
    })

    if (existing) {
      return {
        success: false,
        error: 'An exception request already exists for this team',
      }
    }

    const exception = await prisma.teamRuleOverride.create({
      data: {
        teamId: input.teamId,
        ruleId: rule.id,
        overrideReason: input.reason,
        overrideConfig: {
          requestedDeltaCents: input.requestedDeltaCents,
          status: 'PENDING',
        } as any,
      },
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        associationId,
        actorUserId: user.id,
        action: 'REQUEST_COACH_COMP_EXCEPTION',
        entityType: 'TeamRuleOverride',
        entityId: exception.id,
        metadata: {
          teamId: input.teamId,
          requestedDeltaCents: input.requestedDeltaCents,
        },
      },
    })

    logger.info('Coach compensation exception requested', {
      exceptionId: exception.id,
      teamId: input.teamId,
      userId: user.id,
    })

    revalidatePath(`/association/${associationId}/rules/coach-compensation`)

    return {
      success: true,
      data: exception,
    }
  } catch (error) {
    logger.error('Error requesting exception', error as Error)
    return {
      success: false,
      error: 'Failed to request exception',
    }
  }
}

/**
 * Approve or deny an exception (association admin action)
 */
export async function approveException(
  associationId: string,
  input: ExceptionApprovalInput
) {
  try {
    const user = await requireAuth()
    await requirePermission(Permission.MANAGE_ASSOCIATION_RULES)

    const exception = await prisma.teamRuleOverride.findUnique({
      where: { id: input.exceptionId },
    })

    if (!exception) {
      return {
        success: false,
        error: 'Exception not found',
      }
    }

    const config = exception.overrideConfig as any

    const updatedConfig = {
      ...config,
      status: input.approved ? 'APPROVED' : 'DENIED',
      approvedDeltaCents: input.approved ? (input.approvedDeltaCents ?? config.requestedDeltaCents) : 0,
      reviewNotes: input.notes,
    }

    const updated = await prisma.teamRuleOverride.update({
      where: { id: input.exceptionId },
      data: {
        approvedBy: user.id,
        approvedAt: new Date(),
        overrideConfig: updatedConfig as any,
      },
    })

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        associationId,
        actorUserId: user.id,
        action: input.approved ? 'APPROVE_COACH_COMP_EXCEPTION' : 'DENY_COACH_COMP_EXCEPTION',
        entityType: 'TeamRuleOverride',
        entityId: input.exceptionId,
        metadata: {
          teamId: exception.teamId,
          approvedDeltaCents: updatedConfig.approvedDeltaCents,
          notes: input.notes,
        },
      },
    })

    logger.info(`Coach compensation exception ${input.approved ? 'approved' : 'denied'}`, {
      exceptionId: input.exceptionId,
      userId: user.id,
    })

    // Trigger coach compensation alerts after exception approval/denial (non-blocking)
    Promise.resolve().then(async () => {
      try {
        const { triggerCoachCompAlertsForTeam } = await import('@/lib/services/coach-compensation')
        const team = await prisma.team.findUnique({
          where: { id: exception.teamId },
          select: {
            associationTeam: {
              select: {
                associationId: true,
                association: { select: { season: true } },
              },
            },
          },
        })

        if (team?.associationTeam?.[0]) {
          const season = team.associationTeam[0].association.season

          await triggerCoachCompAlertsForTeam({
            teamId: exception.teamId,
            season,
            associationId,
          })
        }
      } catch (error) {
        logger.error('Failed to trigger coach comp alerts after exception approval:', error)
        // Don't fail exception approval if alert triggering fails
      }
    })

    revalidatePath(`/association/${associationId}/rules/coach-compensation`)

    return {
      success: true,
      data: updated,
    }
  } catch (error) {
    logger.error('Error approving/denying exception', error as Error)
    return {
      success: false,
      error: 'Failed to process exception approval',
    }
  }
}

// ============================================================================
// STATUS QUERIES
// ============================================================================

/**
 * Get cap status for a specific team
 */
export async function getTeamCapStatus(params: {
  teamId: string
  associationId: string
}) {
  try {
    await requireAuth()

    // Get team's association details
    const team = await prisma.team.findUnique({
      where: { id: params.teamId },
      select: {
        associationTeam: {
          select: {
            association: {
              select: {
                season: true,
              },
            },
          },
        },
      },
    })

    const season = team?.associationTeam?.[0]?.association.season || null

    const status = await coachComp.getTeamCapStatus({
      teamId: params.teamId,
      season,
      associationId: params.associationId,
    })

    return {
      success: true,
      data: status,
    }
  } catch (error) {
    logger.error('Error fetching team cap status', error as Error)
    return {
      success: false,
      error: 'Failed to fetch team status',
    }
  }
}

/**
 * Get all system categories (for category selection)
 */
export async function getSystemCategories() {
  try {
    await requireAuth()

    const categories = await prisma.systemCategory.findMany({
      where: {
        type: 'EXPENSE',
      },
      orderBy: {
        name: 'asc',
      },
      select: {
        id: true,
        name: true,
        description: true,
      },
    })

    return {
      success: true,
      data: categories,
    }
  } catch (error) {
    logger.error('Error fetching system categories', error as Error)
    return {
      success: false,
      error: 'Failed to fetch categories',
    }
  }
}
