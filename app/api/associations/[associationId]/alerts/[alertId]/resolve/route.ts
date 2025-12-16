/**
 * Alert Resolution API Route
 *
 * POST /api/associations/[associationId]/alerts/[alertId]/resolve
 * Resolves an active alert
 *
 * Body:
 * - notes: string (optional) - Resolution notes
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

    // Fetch alert
    const alert = await prisma.alert.findUnique({
      where: {
        id: alertId,
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
            message: 'You do not have access to this alert',
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

    // Resolve alert
    await prisma.alert.update({
      where: {
        id: alertId,
      },
      data: {
        status: 'resolved',
        resolvedAt: new Date(),
        resolvedBy: associationUser.id,
        notes: notes || alert.notes,
      },
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
