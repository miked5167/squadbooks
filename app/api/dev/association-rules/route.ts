import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * DELETE /api/dev/association-rules
 * Delete all association rules for demo purposes
 * Protected by DEV_MODE check - only works in development
 */
export async function DELETE(request: NextRequest) {
  try {
    // Check if dev mode is enabled
    if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
      return NextResponse.json(
        { error: 'Dev mode not enabled' },
        { status: 403 }
      )
    }

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const associationId = searchParams.get('associationId')

    if (!associationId) {
      return NextResponse.json(
        { error: 'associationId query parameter required' },
        { status: 400 }
      )
    }

    // Verify user has access to this association
    const associationUser = await prisma.associationUser.findFirst({
      where: {
        clerkUserId: userId,
        associationId,
      },
    })

    if (!associationUser) {
      return NextResponse.json(
        { error: 'Not authorized for this association' },
        { status: 403 }
      )
    }

    // Delete all rules for this association
    const result = await prisma.associationRule.deleteMany({
      where: {
        associationId,
      },
    })

    logger.info(
      `[DEV MODE] Deleted ${result.count} association rules for ${associationId} by user ${userId}`
    )

    return NextResponse.json(
      {
        success: true,
        deletedCount: result.count,
        message: `All association rules cleared (${result.count} rules deleted)`,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('DELETE /api/dev/association-rules error', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
