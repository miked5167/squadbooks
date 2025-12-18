/**
 * Audit Logging Service for Validation-First Transaction Model
 *
 * Logs all transaction lifecycle events for compliance tracking and analytics.
 */

import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

/**
 * Audit event types for validation-first model
 */
export enum AuditAction {
  // Transaction lifecycle
  TRANSACTION_IMPORTED = 'TRANSACTION_IMPORTED',
  TRANSACTION_VALIDATED = 'TRANSACTION_VALIDATED',
  TRANSACTION_EXCEPTION_CREATED = 'TRANSACTION_EXCEPTION_CREATED',
  TRANSACTION_EXCEPTION_RESOLVED = 'TRANSACTION_EXCEPTION_RESOLVED',
  TRANSACTION_OVERRIDE_APPLIED = 'TRANSACTION_OVERRIDE_APPLIED',
  TRANSACTION_EDITED = 'TRANSACTION_EDITED',

  // Budget events
  BUDGET_CHANGED = 'BUDGET_CHANGED',

  // Legacy events
  RESOLVE_EXCEPTION = 'RESOLVE_EXCEPTION',
  CREATE_TRANSACTION = 'CREATE_TRANSACTION',
}

interface AuditLogData {
  teamId: string
  userId: string
  action: AuditAction | string
  entityType: string
  entityId: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(data: AuditLogData) {
  try {
    return await prisma.auditLog.create({
      data: {
        teamId: data.teamId,
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        oldValues: data.oldValues || null,
        newValues: data.newValues || null,
        metadata: data.metadata || null,
        ipAddress: data.ipAddress || null,
        userAgent: data.userAgent || null,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw - audit logging failures shouldn't break the app
    return null
  }
}

/**
 * Log transaction import event
 */
export async function logTransactionImported(params: {
  teamId: string
  userId: string
  transactionId: string
  source: string
  vendor: string
  amount: number
  transactionDate: Date
}) {
  return createAuditLog({
    teamId: params.teamId,
    userId: params.userId,
    action: AuditAction.TRANSACTION_IMPORTED,
    entityType: 'Transaction',
    entityId: params.transactionId,
    metadata: {
      source: params.source,
      vendor: params.vendor,
      amount: params.amount,
      transactionDate: params.transactionDate.toISOString(),
    },
  })
}

/**
 * Log transaction validation event
 */
export async function logTransactionValidated(params: {
  teamId: string
  userId: string
  transactionId: string
  validationScore: number
  violations: any[]
  status: 'VALIDATED' | 'EXCEPTION'
}) {
  return createAuditLog({
    teamId: params.teamId,
    userId: params.userId,
    action: AuditAction.TRANSACTION_VALIDATED,
    entityType: 'Transaction',
    entityId: params.transactionId,
    metadata: {
      validationScore: params.validationScore,
      violationCount: params.violations.length,
      status: params.status,
    },
  })
}

/**
 * Log exception creation event
 */
export async function logExceptionCreated(params: {
  teamId: string
  userId: string
  transactionId: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  violations: Array<{ code: string; severity: string; message: string }>
  reason: string
}) {
  return createAuditLog({
    teamId: params.teamId,
    userId: params.userId,
    action: AuditAction.TRANSACTION_EXCEPTION_CREATED,
    entityType: 'Transaction',
    entityId: params.transactionId,
    metadata: {
      severity: params.severity,
      violationCodes: params.violations.map((v) => v.code),
      violationCount: params.violations.length,
      reason: params.reason,
    },
  })
}

/**
 * Log exception resolution event
 */
export async function logExceptionResolved(params: {
  teamId: string
  userId: string
  userRole: string
  transactionId: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  resolutionMethod: 'OVERRIDE' | 'CORRECT' | 'REVALIDATE'
  reason: string
  resolvedAt: Date
}) {
  return createAuditLog({
    teamId: params.teamId,
    userId: params.userId,
    action: AuditAction.TRANSACTION_EXCEPTION_RESOLVED,
    entityType: 'Transaction',
    entityId: params.transactionId,
    metadata: {
      severity: params.severity,
      resolutionMethod: params.resolutionMethod,
      reason: params.reason,
      resolvedBy: params.userId,
      resolvedByRole: params.userRole,
      resolvedAt: params.resolvedAt.toISOString(),
    },
  })
}

/**
 * Log override application event
 */
export async function logOverrideApplied(params: {
  teamId: string
  userId: string
  userRole: string
  transactionId: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  reason: string
  overriddenViolations: string[]
}) {
  return createAuditLog({
    teamId: params.teamId,
    userId: params.userId,
    action: AuditAction.TRANSACTION_OVERRIDE_APPLIED,
    entityType: 'Transaction',
    entityId: params.transactionId,
    metadata: {
      severity: params.severity,
      reason: params.reason,
      overriddenBy: params.userId,
      overriddenByRole: params.userRole,
      violationCodes: params.overriddenViolations,
    },
  })
}

/**
 * Log transaction edit event
 */
export async function logTransactionEdited(params: {
  teamId: string
  userId: string
  transactionId: string
  changedFields: {
    field: 'category' | 'amount' | 'vendor' | 'receipt' | 'description'
    oldValue: any
    newValue: any
  }[]
}) {
  const oldValues: Record<string, any> = {}
  const newValues: Record<string, any> = {}

  params.changedFields.forEach((change) => {
    oldValues[change.field] = change.oldValue
    newValues[change.field] = change.newValue
  })

  return createAuditLog({
    teamId: params.teamId,
    userId: params.userId,
    action: AuditAction.TRANSACTION_EDITED,
    entityType: 'Transaction',
    entityId: params.transactionId,
    oldValues,
    newValues,
    metadata: {
      changedFields: params.changedFields.map((c) => c.field),
    },
  })
}

/**
 * Log budget change event
 */
export async function logBudgetChanged(params: {
  teamId: string
  userId: string
  budgetId: string
  categoryId?: string
  changeType: 'ALLOCATION' | 'TOTAL' | 'CATEGORY_ADD' | 'CATEGORY_REMOVE'
  oldValue: number
  newValue: number
  approvalRequired: boolean
  reason?: string
}) {
  return createAuditLog({
    teamId: params.teamId,
    userId: params.userId,
    action: AuditAction.BUDGET_CHANGED,
    entityType: 'Budget',
    entityId: params.budgetId,
    oldValues: {
      value: params.oldValue,
    },
    newValues: {
      value: params.newValue,
    },
    metadata: {
      changeType: params.changeType,
      categoryId: params.categoryId,
      approvalRequired: params.approvalRequired,
      reason: params.reason,
    },
  })
}

/**
 * Get audit logs for a specific transaction
 */
export async function getTransactionAuditLogs(transactionId: string) {
  return prisma.auditLog.findMany({
    where: {
      entityType: 'Transaction',
      entityId: transactionId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })
}

/**
 * Get exception resolution time for analytics
 */
export async function getExceptionResolutionTimes(teamId: string, startDate: Date, endDate: Date) {
  // Get exception created and resolved events
  const logs = await prisma.auditLog.findMany({
    where: {
      teamId,
      action: {
        in: [AuditAction.TRANSACTION_EXCEPTION_CREATED, AuditAction.TRANSACTION_EXCEPTION_RESOLVED],
      },
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  // Group by transaction and calculate resolution times
  const resolutionTimes: Record<string, { created: Date; resolved: Date | null }> = {}

  logs.forEach((log) => {
    if (log.action === AuditAction.TRANSACTION_EXCEPTION_CREATED) {
      resolutionTimes[log.entityId] = {
        created: log.createdAt,
        resolved: null,
      }
    } else if (log.action === AuditAction.TRANSACTION_EXCEPTION_RESOLVED) {
      if (resolutionTimes[log.entityId]) {
        resolutionTimes[log.entityId].resolved = log.createdAt
      }
    }
  })

  // Calculate average resolution time
  const resolvedExceptions = Object.values(resolutionTimes).filter((rt) => rt.resolved !== null)

  if (resolvedExceptions.length === 0) {
    return {
      averageTimeMs: 0,
      averageTimeHours: 0,
      count: 0,
    }
  }

  const totalMs = resolvedExceptions.reduce((sum, rt) => {
    if (rt.resolved) {
      return sum + (rt.resolved.getTime() - rt.created.getTime())
    }
    return sum
  }, 0)

  const averageMs = totalMs / resolvedExceptions.length
  const averageHours = averageMs / (1000 * 60 * 60)

  return {
    averageTimeMs: averageMs,
    averageTimeHours: averageHours,
    count: resolvedExceptions.length,
  }
}
