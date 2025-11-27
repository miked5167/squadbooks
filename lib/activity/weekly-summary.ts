/**
 * Weekly/period activity summary generation
 * Provides aggregated statistics and insights for activity feed
 */

import { prisma } from '@/lib/prisma'
import { EventCategory } from './event-config'

export interface ActivitySummary {
  period: {
    start: Date
    end: Date
    label: string
  }
  totalEvents: number
  transactionsCreated: number
  transactionsApproved: number
  transactionsRejected: number
  budgetChanges: number
  settingsChanges: number
  usersAdded: number
  potentialIssuesCount: number
  topUsers: {
    userId: string
    userName: string
    actionCount: number
  }[]
  categoryBreakdown: {
    category: string
    count: number
  }[]
}

/**
 * Get activity summary for a team and date range
 */
export async function getActivitySummary(
  teamId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    label?: string
  }
): Promise<ActivitySummary> {
  // Default to last 7 days
  const now = new Date()
  const startDate = options?.startDate || new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const endDate = options?.endDate || now
  const label = options?.label || 'This Week'

  // Get all audit logs for the period
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      teamId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  })

  // Total events
  const totalEvents = auditLogs.length

  // Count specific action types
  const transactionsCreated = auditLogs.filter(log => log.action === 'CREATE_TRANSACTION').length
  const transactionsApproved = auditLogs.filter(log => log.action === 'APPROVE_TRANSACTION').length
  const transactionsRejected = auditLogs.filter(log => log.action === 'REJECT_TRANSACTION').length

  const budgetChanges = auditLogs.filter(log =>
    log.action.includes('BUDGET')
  ).length

  const settingsChanges = auditLogs.filter(log =>
    log.action.includes('SETTINGS')
  ).length

  const usersAdded = auditLogs.filter(log =>
    log.action === 'CREATE_USER' || log.action === 'INVITE_USER'
  ).length

  // Top users by activity
  const userActivityMap = new Map<string, { userId: string; userName: string; count: number }>()

  for (const log of auditLogs) {
    // Skip onboarding events for user activity stats
    if (log.action.startsWith('ONBOARDING_')) continue

    const existing = userActivityMap.get(log.userId)
    if (existing) {
      existing.count++
    } else {
      userActivityMap.set(log.userId, {
        userId: log.userId,
        userName: log.user.name,
        count: 1,
      })
    }
  }

  const topUsers = Array.from(userActivityMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(user => ({
      userId: user.userId,
      userName: user.userName,
      actionCount: user.count,
    }))

  // Category breakdown (simplified - map actions to categories)
  const categoryMap = new Map<string, number>()

  for (const log of auditLogs) {
    // Skip onboarding for category stats
    if (log.action.startsWith('ONBOARDING_')) continue

    let category = 'Other'

    if (log.action.includes('TRANSACTION')) {
      category = 'Transactions'
    } else if (log.action.includes('APPROVE') || log.action.includes('REJECT')) {
      category = 'Approvals'
    } else if (log.action.includes('BUDGET')) {
      category = 'Budget'
    } else if (log.action.includes('SETTINGS')) {
      category = 'Settings'
    } else if (log.action.includes('USER') || log.action.includes('ROLE')) {
      category = 'Users & Roles'
    } else if (log.action.includes('RECEIPT')) {
      category = 'Receipts'
    } else if (log.action.includes('CATEGORY')) {
      category = 'Categories'
    }

    categoryMap.set(category, (categoryMap.get(category) || 0) + 1)
  }

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)

  return {
    period: {
      start: startDate,
      end: endDate,
      label,
    },
    totalEvents,
    transactionsCreated,
    transactionsApproved,
    transactionsRejected,
    budgetChanges,
    settingsChanges,
    usersAdded,
    potentialIssuesCount: 0, // Will be filled by caller
    topUsers,
    categoryBreakdown,
  }
}

/**
 * Get predefined period ranges
 */
export function getPeriodRanges() {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  return {
    today: {
      start: today,
      end: now,
      label: 'Today',
    },
    last7Days: {
      start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      end: now,
      label: 'Last 7 Days',
    },
    last30Days: {
      start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
      end: now,
      label: 'Last 30 Days',
    },
    thisMonth: {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: now,
      label: 'This Month',
    },
    lastMonth: {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
      label: 'Last Month',
    },
  }
}
