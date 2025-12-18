/**
 * Exception Analytics Service
 *
 * Provides metrics and analytics for transaction exceptions
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export interface ExceptionMetrics {
  // Overall stats
  totalExceptions: number
  resolvedExceptions: number
  pendingExceptions: number
  resolutionRate: number // percentage

  // By severity
  bySeverity: {
    CRITICAL: number
    HIGH: number
    MEDIUM: number
    LOW: number
  }

  // Resolution stats
  averageResolutionTimeHours: number | null
  resolutionMethods: {
    OVERRIDE: number
    CORRECT: number
    REVALIDATE: number
  }

  // Common violations
  topViolations: Array<{
    code: string
    count: number
    message: string
  }>
}

export interface ExceptionTrend {
  period: string // e.g., "2024-12-01" or "2024-W50"
  total: number
  resolved: number
  pending: number
}

/**
 * Get exception metrics for a team
 */
export async function getExceptionMetrics(
  teamId: string,
  options?: {
    startDate?: Date
    endDate?: Date
  }
): Promise<ExceptionMetrics> {
  try {
    const { startDate, endDate } = options || {}

    // Build base where clause
    const baseWhere = {
      teamId,
      deletedAt: null,
      ...(startDate ? { createdAt: { gte: startDate } } : {}),
      ...(endDate ? { createdAt: { lte: endDate } } : {}),
    }

    // Get all exceptions (current and resolved)
    const [exceptions, resolved] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          ...baseWhere,
          OR: [{ status: 'EXCEPTION' }, { status: 'RESOLVED' }],
        },
        select: {
          id: true,
          status: true,
          exceptionSeverity: true,
          validationJson: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.auditLog.findMany({
        where: {
          teamId,
          action: 'RESOLVE_EXCEPTION',
          entityType: 'Transaction',
          ...(startDate ? { createdAt: { gte: startDate } } : {}),
          ...(endDate ? { createdAt: { lte: endDate } } : {}),
        },
        select: {
          entityId: true,
          newValues: true,
          createdAt: true,
        },
      }),
    ])

    const totalExceptions = exceptions.length
    const resolvedExceptions = exceptions.filter((e) => e.status === 'RESOLVED').length
    const pendingExceptions = totalExceptions - resolvedExceptions
    const resolutionRate =
      totalExceptions > 0 ? (resolvedExceptions / totalExceptions) * 100 : 0

    // Count by severity
    const bySeverity = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
    }

    exceptions.forEach((e) => {
      const severity = (e.exceptionSeverity || 'LOW') as keyof typeof bySeverity
      if (severity in bySeverity) {
        bySeverity[severity]++
      }
    })

    // Calculate resolution methods
    const resolutionMethods = {
      OVERRIDE: 0,
      CORRECT: 0,
      REVALIDATE: 0,
    }

    resolved.forEach((audit) => {
      const resolution = (audit.newValues as any)?.resolution
      if (resolution && resolution in resolutionMethods) {
        resolutionMethods[resolution as keyof typeof resolutionMethods]++
      }
    })

    // Calculate average resolution time
    let totalResolutionTimeMs = 0
    let resolutionCount = 0

    for (const audit of resolved) {
      const exception = exceptions.find((e) => e.id === audit.entityId)
      if (exception) {
        const createdAt = new Date(exception.createdAt).getTime()
        const resolvedAt = new Date(audit.createdAt).getTime()
        totalResolutionTimeMs += resolvedAt - createdAt
        resolutionCount++
      }
    }

    const averageResolutionTimeHours =
      resolutionCount > 0
        ? totalResolutionTimeMs / resolutionCount / (1000 * 60 * 60)
        : null

    // Count violation types
    const violationCounts = new Map<string, { count: number; message: string }>()

    exceptions.forEach((e) => {
      const validation = e.validationJson as any
      if (validation?.violations) {
        validation.violations.forEach((v: any) => {
          const existing = violationCounts.get(v.code) || { count: 0, message: v.message }
          violationCounts.set(v.code, {
            count: existing.count + 1,
            message: v.message,
          })
        })
      }
    })

    // Get top 5 violations
    const topViolations = Array.from(violationCounts.entries())
      .map(([code, data]) => ({
        code,
        count: data.count,
        message: data.message,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      totalExceptions,
      resolvedExceptions,
      pendingExceptions,
      resolutionRate,
      bySeverity,
      averageResolutionTimeHours,
      resolutionMethods,
      topViolations,
    }
  } catch (error) {
    logger.error('Error getting exception metrics:', error)
    throw error
  }
}

/**
 * Get exception trends over time
 *
 * @param period - 'day' | 'week' | 'month'
 */
export async function getExceptionTrends(
  teamId: string,
  options: {
    period: 'day' | 'week' | 'month'
    startDate: Date
    endDate: Date
  }
): Promise<ExceptionTrend[]> {
  try {
    const { period, startDate, endDate } = options

    // Get all exceptions in date range
    const exceptions = await prisma.transaction.findMany({
      where: {
        teamId,
        deletedAt: null,
        OR: [{ status: 'EXCEPTION' }, { status: 'RESOLVED' }],
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    })

    // Get resolution audit logs
    const resolutions = await prisma.auditLog.findMany({
      where: {
        teamId,
        action: 'RESOLVE_EXCEPTION',
        entityType: 'Transaction',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        entityId: true,
        createdAt: true,
      },
    })

    // Build resolution map
    const resolutionMap = new Map<string, Date>()
    resolutions.forEach((r) => {
      resolutionMap.set(r.entityId, r.createdAt)
    })

    // Group by period
    const trendMap = new Map<string, { total: number; resolved: number }>()

    exceptions.forEach((e) => {
      const periodKey = formatPeriodKey(e.createdAt, period)
      const existing = trendMap.get(periodKey) || { total: 0, resolved: 0 }
      existing.total++

      // Check if resolved in this period
      if (e.status === 'RESOLVED') {
        existing.resolved++
      }

      trendMap.set(periodKey, existing)
    })

    // Convert to array and sort
    const trends = Array.from(trendMap.entries())
      .map(([period, data]) => ({
        period,
        total: data.total,
        resolved: data.resolved,
        pending: data.total - data.resolved,
      }))
      .sort((a, b) => a.period.localeCompare(b.period))

    return trends
  } catch (error) {
    logger.error('Error getting exception trends:', error)
    throw error
  }
}

/**
 * Format date into period key
 */
function formatPeriodKey(date: Date, period: 'day' | 'week' | 'month'): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  switch (period) {
    case 'day':
      return `${year}-${month}-${day}`
    case 'week': {
      // ISO week number
      const weekNumber = getISOWeek(date)
      return `${year}-W${String(weekNumber).padStart(2, '0')}`
    }
    case 'month':
      return `${year}-${month}`
  }
}

/**
 * Get ISO week number
 */
function getISOWeek(date: Date): number {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const weekNumber = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return weekNumber
}

/**
 * Get exception summary for digest emails
 */
export async function getExceptionDigestSummary(teamId: string): Promise<{
  critical: number
  high: number
  medium: number
  low: number
  total: number
}> {
  try {
    const exceptions = await prisma.transaction.findMany({
      where: {
        teamId,
        status: 'EXCEPTION',
        deletedAt: null,
      },
      select: {
        exceptionSeverity: true,
      },
    })

    const summary = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      total: exceptions.length,
    }

    exceptions.forEach((e) => {
      const severity = (e.exceptionSeverity || 'LOW').toLowerCase()
      if (severity in summary) {
        summary[severity as keyof typeof summary]++
      }
    })

    return summary
  } catch (error) {
    logger.error('Error getting exception digest summary:', error)
    throw error
  }
}
