import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import {
  requireAuth,
  requireExceptionResolvePermission,
  requireTeamAccess,
  handlePermissionError,
  PermissionError,
} from '@/lib/permissions/server-permissions'
import {
  logExceptionResolved,
  logOverrideApplied,
} from '@/lib/services/audit-logger'

/**
 * POST /api/exceptions/resolve
 * Manually resolve an exception by overriding validation or fixing the underlying issue
 *
 * Permission Rules:
 * - Treasurer: Can fix exceptions (CORRECT method) but CANNOT override
 * - Assistant Treasurer: Can fix and override (all methods) for any severity
 * - Association Admin: Can override high-severity exceptions
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { transactionId, resolution, reason, correctedData } = body

    if (!transactionId || !resolution || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields: transactionId, resolution, reason' },
        { status: 400 }
      )
    }

    // Validate resolution method
    if (!['OVERRIDE', 'CORRECT', 'REVALIDATE'].includes(resolution)) {
      return NextResponse.json(
        { error: 'Invalid resolution method. Must be OVERRIDE, CORRECT, or REVALIDATE' },
        { status: 400 }
      )
    }

    // Get the transaction to check severity and team
    const transaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        deletedAt: null,
      },
      select: {
        id: true,
        teamId: true,
        status: true,
        exceptionSeverity: true,
        exceptionReason: true,
        validationJson: true,
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Verify transaction is in EXCEPTION status
    if (transaction.status !== 'EXCEPTION') {
      return NextResponse.json(
        { error: 'Transaction is not in exception status' },
        { status: 400 }
      )
    }

    // Ensure user has access to this team
    await requireTeamAccess(transaction.teamId)

    // Check permissions based on severity and resolution method
    const severity = (transaction.exceptionSeverity || 'LOW') as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    const user = await requireExceptionResolvePermission(severity, resolution)

    // Handle different resolution types
    let updateData: any = {
      status: 'RESOLVED',
      updatedAt: new Date(),
    }

    if (resolution === 'CORRECT' && correctedData) {
      // Apply corrections and re-validate
      updateData = {
        ...updateData,
        ...correctedData,
      }
    }

    // Update transaction
    const updated = await prisma.$transaction(async (tx) => {
      const updatedTxn = await tx.transaction.update({
        where: { id: transactionId },
        data: updateData,
      })

      return updatedTxn
    })

    // Log exception resolution with new audit logger
    await logExceptionResolved({
      teamId: transaction.teamId,
      userId: user.id,
      userRole: user.role,
      transactionId,
      severity,
      resolutionMethod: resolution,
      reason,
      resolvedAt: new Date(),
    })

    // If override was applied, log separately for analytics
    if (resolution === 'OVERRIDE') {
      const violations = (transaction.validationJson as any)?.violations || []
      await logOverrideApplied({
        teamId: transaction.teamId,
        userId: user.id,
        userRole: user.role,
        transactionId,
        severity,
        reason,
        overriddenViolations: violations.map((v: any) => v.code),
      })
    }

    logger.info(
      `Exception resolved for transaction ${transactionId} by user ${user.id} (${user.role}) using ${resolution} method`
    )

    return NextResponse.json({
      success: true,
      transaction: updated,
    })
  } catch (error) {
    // Handle permission errors
    if (error instanceof PermissionError) {
      return handlePermissionError(error)
    }

    logger.error('POST /api/exceptions/resolve error', error as Error)
    return NextResponse.json(
      {
        error: 'Failed to resolve exception',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
