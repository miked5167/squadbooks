/**
 * Association Alerts API Route
 *
 * GET /api/associations/[id]/alerts
 * Returns active alerts with filtering
 *
 * Query Parameters:
 * - severity: 'warning' | 'critical' | 'all' (default: 'all')
 * - type: alert type string (optional)
 * - teamId: filter by specific team (optional)
 * - page: number (default: 1)
 * - pageSize: number (default: 50, max: 100)
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { z } from 'zod'

// Query parameter validation schema
const querySchema = z.object({
  severity: z.enum(['warning', 'critical', 'all']).default('all'),
  type: z.string().nullish(),
  teamId: z.string().nullish(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
})

// Alert item type
interface AlertItem {
  id: string
  teamId: string
  teamName: string
  alertType: string
  severity: string
  title: string
  description: string | null
  createdAt: Date
  lastTriggeredAt: Date
  status: string
}

// Response type
interface AlertsResponse {
  data: {
    alerts: AlertItem[]
    pagination: {
      page: number
      pageSize: number
      totalCount: number
      totalPages: number
    }
  } | null
  error: {
    code: string
    message: string
  } | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<AlertsResponse>> {
  try {
    // Authenticate request
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    // Await params (Next.js 15+)
    const resolvedParams = await params
    const associationId = resolvedParams.id
    if (!associationId) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INVALID_ASSOCIATION_ID',
            message: 'Association ID is required',
          },
        },
        { status: 400 }
      )
    }

    // Check user authorization
    const associationUser = await prisma.associationUser.findFirst({
      where: {
        clerkUserId: userId,
        associationId: associationId,
      },
    })

    if (!associationUser) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this association',
          },
        },
        { status: 403 }
      )
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = querySchema.safeParse({
      severity: searchParams.get('severity'),
      type: searchParams.get('type'),
      teamId: searchParams.get('teamId'),
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
    })

    if (!queryParams.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INVALID_QUERY_PARAMS',
            message: queryParams.error.errors?.[0]?.message || 'Invalid query parameters',
          },
        },
        { status: 400 }
      )
    }

    const { severity, type, teamId, page, pageSize } = queryParams.data

    // Build where clause
    const whereClause: any = {
      associationId: associationId,
      status: 'active',
    }

    // Filter by severity
    if (severity !== 'all') {
      whereClause.severity = severity
    }

    // Filter by type
    if (type) {
      whereClause.alertType = type
    }

    // Filter by team
    if (teamId) {
      whereClause.associationTeamId = teamId
    }

    // Get total count
    const totalCount = await prisma.alert.count({
      where: whereClause,
    })

    // Fetch alerts with pagination
    const alerts = await prisma.alert.findMany({
      where: whereClause,
      include: {
        team: {
          select: {
            id: true,
            teamName: true,
          },
        },
      },
      orderBy: [
        { severity: 'desc' }, // critical first
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    })

    // Calculate pagination
    const totalPages = Math.ceil(totalCount / pageSize)

    // Map to response format
    const alertItems: AlertItem[] = alerts.map((alert) => ({
      id: alert.id,
      teamId: alert.team.id,
      teamName: alert.team.teamName,
      alertType: alert.alertType,
      severity: alert.severity,
      title: alert.title,
      description: alert.description,
      createdAt: alert.createdAt,
      lastTriggeredAt: alert.lastTriggeredAt,
      status: alert.status,
    }))

    return NextResponse.json({
      data: {
        alerts: alertItems,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
        },
      },
      error: null,
    })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch alerts',
        },
      },
      { status: 500 }
    )
  }
}
