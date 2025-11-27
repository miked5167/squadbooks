/**
 * API route for fetching filtered and paginated audit logs
 * GET /api/activity/logs
 */

import { auth } from '@/lib/auth/server-auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user and team
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, teamId: true },
    })

    if (!user || !user.teamId) {
      return NextResponse.json({ error: 'User not found or not in a team' }, { status: 404 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams

    const page = parseInt(searchParams.get('page') || '1')
    const pageSize = parseInt(searchParams.get('pageSize') || '25')
    const search = searchParams.get('search') || undefined
    const userIdFilter = searchParams.get('userId') || undefined
    const actionsFilter = searchParams.get('actions') || undefined // Comma-separated
    const categoriesFilter = searchParams.get('categories') || undefined // Comma-separated
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const hideOnboarding = searchParams.get('hideOnboarding') === 'true'

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {
      teamId: user.teamId,
    }

    // Filter by user
    if (userIdFilter) {
      where.userId = userIdFilter
    }

    // Filter by actions (comma-separated list)
    if (actionsFilter) {
      const actions = actionsFilter.split(',').filter(Boolean)
      if (actions.length > 0) {
        where.action = { in: actions }
      }
    }

    // Filter by categories (map to actions)
    if (categoriesFilter) {
      const categories = categoriesFilter.split(',').filter(Boolean)
      const actionPatterns: string[] = []

      for (const category of categories) {
        switch (category) {
          case 'TRANSACTIONS':
            actionPatterns.push('CREATE_TRANSACTION', 'UPDATE_TRANSACTION', 'DELETE_TRANSACTION')
            break
          case 'APPROVALS':
            actionPatterns.push('CREATE_APPROVAL', 'APPROVE_TRANSACTION', 'REJECT_TRANSACTION')
            break
          case 'BUDGET':
            actionPatterns.push('CREATE_BUDGET_ALLOCATION', 'UPDATE_BUDGET_ALLOCATION', 'DELETE_BUDGET_ALLOCATION')
            break
          case 'SETTINGS':
            actionPatterns.push('UPDATE_TEAM_SETTINGS', 'UPDATE_APPROVAL_SETTINGS', 'UPDATE_NOTIFICATION_SETTINGS')
            break
          case 'USERS_ROLES':
            actionPatterns.push('CREATE_USER', 'UPDATE_USER_ROLE', 'DELETE_USER', 'INVITE_USER')
            break
          case 'RECEIPTS':
            actionPatterns.push('UPLOAD_RECEIPT', 'DELETE_RECEIPT')
            break
          case 'CATEGORIES':
            actionPatterns.push('CREATE_CATEGORY', 'UPDATE_CATEGORY', 'DELETE_CATEGORY')
            break
          case 'ONBOARDING':
            // Will use startsWith filter below
            break
        }
      }

      if (actionPatterns.length > 0) {
        where.action = { in: actionPatterns }
      } else if (categories.includes('ONBOARDING')) {
        where.action = { startsWith: 'ONBOARDING_' }
      }
    }

    // Hide onboarding events by default (except ONBOARDING_START and ONBOARDING_COMPLETE)
    if (hideOnboarding) {
      where.action = {
        ...where.action,
        not: {
          startsWith: 'ONBOARDING_',
        },
      }
      // But allow ONBOARDING_START and ONBOARDING_COMPLETE
      // This is a bit tricky with Prisma, so we'll filter in memory later
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate)
      }
    }

    // Search filter (vendor, amount, category, entity ID, user name)
    if (search) {
      const searchLower = search.toLowerCase()

      // For search, we need to use OR conditions
      // We'll search in metadata JSON fields and entityId
      where.OR = [
        // Search in entity ID
        {
          entityId: {
            contains: search,
          },
        },
      ]

      // Note: Searching in JSON fields is database-specific
      // For simplicity, we'll fetch and filter in memory for now
      // In production, you might want to use database-specific JSON search
    }

    // Calculate offset
    const skip = (page - 1) * pageSize

    // Fetch logs with pagination
    const [logs, totalCount] = await Promise.all([
      prisma.auditLog.findMany({
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
        skip,
        take: pageSize,
      }),
      prisma.auditLog.count({ where }),
    ])

    // Filter onboarding events in memory if needed
    let filteredLogs = logs
    if (hideOnboarding) {
      filteredLogs = logs.filter(log => {
        if (log.action === 'ONBOARDING_START' || log.action === 'ONBOARDING_COMPLETE') {
          return true // Keep these
        }
        return !log.action.startsWith('ONBOARDING_')
      })
    }

    // Search filter in memory (for metadata fields)
    if (search) {
      const searchLower = search.toLowerCase()
      filteredLogs = filteredLogs.filter(log => {
        // Search in user name
        if (log.user.name.toLowerCase().includes(searchLower)) {
          return true
        }

        // Search in metadata
        const metadata = log.metadata as Record<string, any> | null
        if (metadata) {
          const metadataString = JSON.stringify(metadata).toLowerCase()
          if (metadataString.includes(searchLower)) {
            return true
          }
        }

        // Search in newValues
        const newValues = log.newValues as Record<string, any> | null
        if (newValues) {
          const newValuesString = JSON.stringify(newValues).toLowerCase()
          if (newValuesString.includes(searchLower)) {
            return true
          }
        }

        return false
      })
    }

    return NextResponse.json({
      logs: filteredLogs,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
