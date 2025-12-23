/**
 * Validation Analytics Service
 *
 * Provides analytics queries for validation-first transaction model:
 * - Exception counts by severity
 * - Compliance rate (validated / total)
 * - Average time to resolve exceptions
 * - Top violation types
 */

import { prisma } from '@/lib/prisma'

/**
 * Get exception counts by severity for a team
 */
export async function getExceptionCountsBySeverity(params: {
  teamId: string
  startDate?: Date
  endDate?: Date
}) {
  const where: any = {
    teamId: params.teamId,
    status: 'EXCEPTION',
    deletedAt: null,
  }

  if (params.startDate || params.endDate) {
    where.createdAt = {}
    if (params.startDate) where.createdAt.gte = params.startDate
    if (params.endDate) where.createdAt.lte = params.endDate
  }

  const exceptions = await prisma.transaction.groupBy({
    by: ['exception_severity'],
    where,
    _count: true,
  })

  return {
    critical: exceptions.find((e) => e.exception_severity === 'CRITICAL')?._count || 0,
    high: exceptions.find((e) => e.exception_severity === 'HIGH')?._count || 0,
    medium: exceptions.find((e) => e.exception_severity === 'MEDIUM')?._count || 0,
    low: exceptions.find((e) => e.exception_severity === 'LOW')?._count || 0,
    total:
      exceptions.reduce((sum, e) => sum + e._count, 0) ||
      (await prisma.transaction.count({ where })),
  }
}

/**
 * Get compliance rate for a team
 */
export async function getComplianceRate(params: {
  teamId: string
  startDate?: Date
  endDate?: Date
}) {
  const where: any = {
    teamId: params.teamId,
    deletedAt: null,
  }

  if (params.startDate || params.endDate) {
    where.createdAt = {}
    if (params.startDate) where.createdAt.gte = params.startDate
    if (params.endDate) where.createdAt.lte = params.endDate
  }

  const [totalCount, validatedCount, exceptionCount, resolvedCount] = await Promise.all([
    // Total transactions
    prisma.transaction.count({ where }),

    // Validated (passed validation)
    prisma.transaction.count({
      where: {
        ...where,
        status: 'VALIDATED',
      },
    }),

    // Current exceptions (not resolved)
    prisma.transaction.count({
      where: {
        ...where,
        status: 'EXCEPTION',
      },
    }),

    // Resolved exceptions
    prisma.transaction.count({
      where: {
        ...where,
        status: 'RESOLVED',
      },
    }),
  ])

  const compliantCount = validatedCount + resolvedCount
  const complianceRate = totalCount > 0 ? (compliantCount / totalCount) * 100 : 100

  return {
    totalTransactions: totalCount,
    validatedTransactions: validatedCount,
    exceptionsActive: exceptionCount,
    exceptionsResolved: resolvedCount,
    compliantTransactions: compliantCount,
    complianceRate: Math.round(complianceRate * 10) / 10, // Round to 1 decimal
  }
}

/**
 * Get average time to resolve exceptions
 */
export async function getAverageResolutionTime(params: {
  teamId: string
  startDate?: Date
  endDate?: Date
}) {
  const where: any = {
    teamId: params.teamId,
    status: 'RESOLVED',
    deletedAt: null,
  }

  if (params.startDate || params.endDate) {
    where.createdAt = {}
    if (params.startDate) where.createdAt.gte = params.startDate
    if (params.endDate) where.createdAt.lte = params.endDate
  }

  // Get resolved transactions with their audit logs
  const resolvedTransactions = await prisma.transaction.findMany({
    where,
    select: {
      id: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (resolvedTransactions.length === 0) {
    return {
      averageHours: 0,
      averageDays: 0,
      count: 0,
      median: 0,
    }
  }

  // Calculate resolution times (from creation to resolution)
  const resolutionTimes = resolvedTransactions.map((txn) => {
    const createdTime = txn.createdAt.getTime()
    const resolvedTime = txn.updatedAt.getTime()
    return resolvedTime - createdTime
  })

  const totalTime = resolutionTimes.reduce((sum, time) => sum + time, 0)
  const averageMs = totalTime / resolutionTimes.length
  const averageHours = averageMs / (1000 * 60 * 60)
  const averageDays = averageHours / 24

  // Calculate median
  const sortedTimes = [...resolutionTimes].sort((a, b) => a - b)
  const median =
    sortedTimes.length % 2 === 0
      ? (sortedTimes[sortedTimes.length / 2 - 1] + sortedTimes[sortedTimes.length / 2]) / 2
      : sortedTimes[Math.floor(sortedTimes.length / 2)]
  const medianHours = median / (1000 * 60 * 60)

  return {
    averageHours: Math.round(averageHours * 10) / 10,
    averageDays: Math.round(averageDays * 10) / 10,
    medianHours: Math.round(medianHours * 10) / 10,
    count: resolvedTransactions.length,
  }
}

/**
 * Get top violation types
 */
export async function getTopViolationTypes(params: {
  teamId: string
  startDate?: Date
  endDate?: Date
  limit?: number
}) {
  const where: any = {
    teamId: params.teamId,
    status: {
      in: ['EXCEPTION', 'RESOLVED'],
    },
    deletedAt: null,
  }

  if (params.startDate || params.endDate) {
    where.createdAt = {}
    if (params.startDate) where.createdAt.gte = params.startDate
    if (params.endDate) where.createdAt.lte = params.endDate
  }

  const transactions = await prisma.transaction.findMany({
    where,
    select: {
      validation_json: true,
    },
  })

  // Count violation codes
  const violationCounts: Record<string, { count: number; severity: string; message: string }> = {}

  transactions.forEach((txn) => {
    const validation = txn.validation_json as any
    if (validation?.violations) {
      validation.violations.forEach((violation: any) => {
        const code = violation.code || 'UNKNOWN'
        if (!violationCounts[code]) {
          violationCounts[code] = {
            count: 0,
            severity: violation.severity || 'MEDIUM',
            message: violation.message || code,
          }
        }
        violationCounts[code].count++
      })
    }
  })

  // Sort by count and limit
  const sortedViolations = Object.entries(violationCounts)
    .map(([code, data]) => ({
      code,
      count: data.count,
      severity: data.severity,
      message: data.message,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, params.limit || 10)

  return sortedViolations
}

/**
 * Get validation overview for a team
 */
export async function getValidationOverview(params: {
  teamId: string
  startDate?: Date
  endDate?: Date
}) {
  const [complianceData, exceptionCounts, resolutionTime, topViolations] = await Promise.all([
    getComplianceRate(params),
    getExceptionCountsBySeverity(params),
    getAverageResolutionTime(params),
    getTopViolationTypes({ ...params, limit: 5 }),
  ])

  return {
    compliance: complianceData,
    exceptionsBySeverity: exceptionCounts,
    resolutionTime,
    topViolations,
  }
}

/**
 * Get exception trend data for charts
 */
export async function getExceptionTrend(params: {
  teamId: string
  startDate: Date
  endDate: Date
  interval: 'day' | 'week' | 'month'
}) {
  // Get all exceptions created in the date range
  const exceptions = await prisma.transaction.findMany({
    where: {
      teamId: params.teamId,
      status: {
        in: ['EXCEPTION', 'RESOLVED'],
      },
      createdAt: {
        gte: params.startDate,
        lte: params.endDate,
      },
      deletedAt: null,
    },
    select: {
      createdAt: true,
      status: true,
      exception_severity: true,
    },
  })

  // Group by interval
  const trendData: Record<
    string,
    { date: string; created: number; resolved: number; active: number }
  > = {}

  exceptions.forEach((exception) => {
    const date = formatDateByInterval(exception.createdAt, params.interval)
    if (!trendData[date]) {
      trendData[date] = { date, created: 0, resolved: 0, active: 0 }
    }

    trendData[date].created++
    if (exception.status === 'RESOLVED') {
      trendData[date].resolved++
    } else {
      trendData[date].active++
    }
  })

  return Object.values(trendData).sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Helper to format date by interval
 */
function formatDateByInterval(date: Date, interval: 'day' | 'week' | 'month'): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  switch (interval) {
    case 'day':
      return `${year}-${month}-${day}`
    case 'week':
      // Get ISO week number
      const weekNum = getWeekNumber(date)
      return `${year}-W${String(weekNum).padStart(2, '0')}`
    case 'month':
      return `${year}-${month}`
    default:
      return `${year}-${month}-${day}`
  }
}

/**
 * Helper to get ISO week number
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

/**
 * Get override statistics
 */
export async function getOverrideStatistics(params: {
  teamId: string
  startDate?: Date
  endDate?: Date
}) {
  const where: any = {
    teamId: params.teamId,
    action: 'TRANSACTION_OVERRIDE_APPLIED',
  }

  if (params.startDate || params.endDate) {
    where.createdAt = {}
    if (params.startDate) where.createdAt.gte = params.startDate
    if (params.endDate) where.createdAt.lte = params.endDate
  }

  const overrides = await prisma.auditLog.findMany({
    where,
    include: {
      user: {
        select: {
          name: true,
          role: true,
        },
      },
    },
  })

  // Group by severity
  const bySeverity: Record<string, number> = {}
  // Group by role
  const byRole: Record<string, number> = {}

  overrides.forEach((override) => {
    const metadata = override.metadata as any
    const severity = metadata?.severity || 'UNKNOWN'
    const role = metadata?.overriddenByRole || override.user.role

    bySeverity[severity] = (bySeverity[severity] || 0) + 1
    byRole[role] = (byRole[role] || 0) + 1
  })

  return {
    total: overrides.length,
    bySeverity,
    byRole,
  }
}
