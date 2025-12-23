/**
 * Alert Acknowledgment API Route
 *
 * POST /api/associations/[associationId]/alerts/[alertId]/acknowledge
 * Acknowledges an active alert - ASSOCIATION USERS ONLY
 *
 * IMPORTANT: Acknowledgment is a non-mutating observation action.
 * Only association-level users can acknowledge alerts as part of their oversight duties.
 * Team users should resolve alerts instead.
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

// Response type
interface AcknowledgeAlertResponse {
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
): Promise<NextResponse<AcknowledgeAlertResponse>> {
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

    // Fetch alert with association information
    const alert = await prisma.alert.findUnique({
      where: {
        id: alertId,
      },
      include: {
        association: true,
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

    // Check if user is an association user (REQUIRED for acknowledgment)
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
            message: 'Only association users can acknowledge alerts. Team users should resolve alerts instead.',
          },
        },
        { status: 403 }
      )
    }

    // Check if already acknowledged
    if (alert.associationAcknowledgedAt) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'ALREADY_ACKNOWLEDGED',
            message: 'Alert has already been acknowledged',
          },
        },
        { status: 400 }
      )
    }

    // Acknowledge alert with association user ID
    await prisma.alert.update({
      where: {
        id: alertId,
      },
      data: {
        associationAcknowledgedAt: new Date(),
        associationAcknowledgedBy: associationUser.id,
      },
    })

    logger.info('Alert acknowledged by association user', {
      alertId,
      associationUserId: associationUser.id,
      associationId,
    })

    return NextResponse.json({
      data: {
        success: true,
      },
      error: null,
    })
  } catch (error) {
    logger.error('Error acknowledging alert', error as Error)
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to acknowledge alert',
        },
      },
      { status: 500 }
    )
  }
}
