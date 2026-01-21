import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

/**
 * Standard audit actions for tracking system events
 */
export const AuditAction = {
  // Transaction actions
  CREATE_TRANSACTION: 'CREATE_TRANSACTION',
  UPDATE_TRANSACTION: 'UPDATE_TRANSACTION',
  DELETE_TRANSACTION: 'DELETE_TRANSACTION',

  // Approval actions
  CREATE_APPROVAL: 'CREATE_APPROVAL',
  APPROVE_TRANSACTION: 'APPROVE_TRANSACTION',
  REJECT_TRANSACTION: 'REJECT_TRANSACTION',

  // Budget actions
  CREATE_BUDGET_ALLOCATION: 'CREATE_BUDGET_ALLOCATION',
  UPDATE_BUDGET_ALLOCATION: 'UPDATE_BUDGET_ALLOCATION',
  DELETE_BUDGET_ALLOCATION: 'DELETE_BUDGET_ALLOCATION',

  // Category actions
  CREATE_CATEGORY: 'CREATE_CATEGORY',
  UPDATE_CATEGORY: 'UPDATE_CATEGORY',
  DELETE_CATEGORY: 'DELETE_CATEGORY',

  // User actions
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER_ROLE: 'UPDATE_USER_ROLE',
  DELETE_USER: 'DELETE_USER',
} as const

export type AuditActionType = typeof AuditAction[keyof typeof AuditAction]

/**
 * Entity types for audit logging
 */
export const EntityType = {
  TRANSACTION: 'Transaction',
  APPROVAL: 'Approval',
  BUDGET_ALLOCATION: 'BudgetAllocation',
  CATEGORY: 'Category',
  USER: 'User',
  TEAM: 'Team',
} as const

export type EntityTypeValue = typeof EntityType[keyof typeof EntityType]

export interface CreateAuditLogInput {
  teamId: string
  userId: string
  action: AuditActionType
  entityType: EntityTypeValue
  entityId: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Create an immutable audit log entry
 * This function should be called for all critical operations
 */
export async function createAuditLog(input: CreateAuditLogInput) {
  const {
    teamId,
    userId,
    action,
    entityType,
    entityId,
    oldValues,
    newValues,
    metadata,
    ipAddress,
    userAgent,
  } = input

  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        teamId,
        userId,
        action,
        entityType,
        entityId,
        oldValues: oldValues ? (oldValues as Prisma.JsonValue) : null,
        newValues: newValues ? (newValues as Prisma.JsonValue) : null,
        metadata: metadata ? (metadata as Prisma.JsonValue) : null,
        ipAddress,
        userAgent,
      },
    })

    return auditLog
  } catch (error) {
    // Log error but don't fail the operation if audit logging fails
    console.error('Failed to create audit log:', error)
    return null
  }
}

/**
 * Get audit logs for a specific entity
 */
export async function getAuditLogsForEntity(
  entityType: EntityTypeValue,
  entityId: string,
  teamId: string
) {
  const logs = await prisma.auditLog.findMany({
    where: {
      entityType,
      entityId,
      teamId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return logs
}

/**
 * Get audit logs for a specific user
 */
export async function getAuditLogsForUser(userId: string, teamId: string) {
  const logs = await prisma.auditLog.findMany({
    where: {
      userId,
      teamId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 100, // Limit to most recent 100
  })

  return logs
}

/**
 * Get audit logs for a team with optional filtering
 */
export async function getAuditLogsForTeam(
  teamId: string,
  options?: {
    action?: AuditActionType
    entityType?: EntityTypeValue
    startDate?: Date
    endDate?: Date
    limit?: number
  }
) {
  const where: Prisma.AuditLogWhereInput = {
    teamId,
  }

  if (options?.action) {
    where.action = options.action
  }

  if (options?.entityType) {
    where.entityType = options.entityType
  }

  if (options?.startDate || options?.endDate) {
    where.createdAt = {}
    if (options.startDate) {
      where.createdAt.gte = options.startDate
    }
    if (options.endDate) {
      where.createdAt.lte = options.endDate
    }
  }

  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: options?.limit || 100,
  })

  return logs
}

/**
 * Get audit log statistics for a team
 */
export async function getAuditLogStats(teamId: string, startDate?: Date, endDate?: Date) {
  const where: Prisma.AuditLogWhereInput = {
    teamId,
  }

  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) {
      where.createdAt.gte = startDate
    }
    if (endDate) {
      where.createdAt.lte = endDate
    }
  }

  const [totalLogs, actionCounts, entityCounts, userCounts] = await Promise.all([
    // Total count
    prisma.auditLog.count({ where }),

    // Count by action
    prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: {
        action: true,
      },
      orderBy: {
        _count: {
          action: 'desc',
        },
      },
    }),

    // Count by entity type
    prisma.auditLog.groupBy({
      by: ['entityType'],
      where,
      _count: {
        entityType: true,
      },
      orderBy: {
        _count: {
          entityType: 'desc',
        },
      },
    }),

    // Count by user
    prisma.auditLog.groupBy({
      by: ['userId'],
      where,
      _count: {
        userId: true,
      },
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
      take: 10,
    }),
  ])

  return {
    totalLogs,
    actionCounts: actionCounts.map(item => ({
      action: item.action,
      count: item._count.action,
    })),
    entityCounts: entityCounts.map(item => ({
      entityType: item.entityType,
      count: item._count.entityType,
    })),
    topUsers: userCounts.map(item => ({
      userId: item.userId,
      count: item._count.userId,
    })),
  }
}

/**
 * Helper to extract request metadata (IP and User Agent)
 * To be used in API routes
 */
export function extractRequestMetadata(request: Request): {
  ipAddress: string | undefined
  userAgent: string | undefined
} {
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    undefined

  const userAgent = request.headers.get('user-agent') || undefined

  return { ipAddress, userAgent }
}
