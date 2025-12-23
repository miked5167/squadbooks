/**
 * Alert Resolution API Route
 *
 * POST /api/associations/[associationId]/alerts/[alertId]/resolve
 * Resolves an active alert - TEAM USERS ONLY (Treasurer/Assistant Treasurer)
 *
 * Body:
 * - notes: string (optional) - Resolution notes
 *
 * IMPORTANT: Association users CANNOT resolve alerts. They can only acknowledge them.
 * Alert resolution is a team-level action restricted to treasurers and assistant treasurers.
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logger } from '@/lib/logger'

// Request body schema
const bodySchema = z.object({
  notes: z.string().optional(),
})

// Response type
interface ResolveAlertResponse {
  data: {
    success: boolean
  } | null
  error: {
    code: string
    message: string
  } | null
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ associationId: string; alertId: string }> }
): Promise<NextResponse<ResolveAlertResponse>> {
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

    const resolvedParams = await params
    const { associationId, alertId } = resolvedParams

    if (!alertId) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INVALID_ALERT_ID',
            message: 'Alert ID is required',
          },
        },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const bodyParams = bodySchema.safeParse(body)

    if (!bodyParams.success) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INVALID_REQUEST_BODY',
            message: bodyParams.error.errors[0].message,
          },
        },
        { status: 400 }
      )
    }

    const { notes } = bodyParams.data

    // Fetch alert with team information
    const alert = await prisma.alert.findUnique({
      where: {
        id: alertId,
      },
      include: {
        team: {
          include: {
            team: true,
          },
        },
      },
    })

    if (!alert) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'ALERT_NOT_FOUND',
            message: 'Alert not found',
          },
        },
        { status: 404 }
      )
    }

    // Verify alert belongs to this association
    if (alert.associationId !== associationId) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Alert does not belong to this association',
          },
        },
        { status: 403 }
      )
    }

    // Check if user is an association user (NOT allowed to resolve)
    const associationUser = await prisma.associationUser.findFirst({
      where: {
        clerkUserId: userId,
        associationId: associationId,
      },
    })

    if (associationUser) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Association users cannot resolve alerts. Alert resolution is a team-level action restricted to treasurers and assistant treasurers. Use the acknowledge feature instead.',
          },
        },
        { status: 403 }
      )
    }

    // Check if user is a team user with proper role (TREASURER or ASSISTANT_TREASURER)
    if (!alert.team.team) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'TEAM_NOT_FOUND',
            message: 'Team not found for this alert',
          },
        },
        { status: 404 }
      )
    }

    const teamUser = await prisma.user.findFirst({
      where: {
        clerkId: userId,
        teamId: alert.team.team.id,
        isActive: true,
        role: {
          in: ['TREASURER', 'ASSISTANT_TREASURER'],
        },
      },
    })

    if (!teamUser) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'Only treasurers and assistant treasurers can resolve alerts',
          },
        },
        { status: 403 }
      )
    }

    // Check if already resolved
    if (alert.status === 'resolved') {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'ALREADY_RESOLVED',
            message: 'Alert has already been resolved',
          },
        },
        { status: 400 }
      )
    }

    // Resolve alert with team user ID
    await prisma.alert.update({
      where: {
        id: alertId,
      },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedByTeamUserId: teamUser.id,
        notes: notes || alert.notes,
      },
    })

    logger.info('Alert resolved by team user', {
      alertId,
      teamUserId: teamUser.id,
      teamUserRole: teamUser.role,
      teamId: alert.team.team.id,
    })

    return NextResponse.json({
      data: {
        success: true,
      },
      error: null,
    })
  } catch (error) {
    logger.error('Error resolving alert', error as Error)
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to resolve alert',
        },
      },
      { status: 500 }
    )
  }
}
