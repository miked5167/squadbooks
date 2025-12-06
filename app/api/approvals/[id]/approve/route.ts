import { auth } from '@/lib/auth/server-auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { approveTransaction } from '@/lib/db/approvals'
import { requiresReceipt } from '@/lib/auth/permissions'
import { MANDATORY_RECEIPT_THRESHOLD } from '@/lib/constants/validation'
import { logger } from '@/lib/logger'

/**
 * POST /api/approvals/[id]/approve
 * Approve a pending transaction
 * Body: { comment?: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        teamId: true,
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const resolvedParams = await params
    const approvalId = resolvedParams.id

    // Parse request body
    const body = await request.json()
    const { comment } = body

    // Fetch the approval with transaction details to validate receipt requirement
    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        transaction: {
          select: {
            id: true,
            amount: true,
            type: true,
            receiptUrl: true,
          },
        },
      },
    })

    if (!approval) {
      return NextResponse.json({ error: 'Approval not found' }, { status: 404 })
    }

    // Validate receipt requirement
    const amount = Number(approval.transaction.amount)
    const hasReceipt = !!approval.transaction.receiptUrl

    if (requiresReceipt(amount, approval.transaction.type, hasReceipt)) {
      return NextResponse.json(
        {
          error: `Receipt required for expenses $${MANDATORY_RECEIPT_THRESHOLD.toFixed(2)} and above. Please attach a receipt before approving.`,
        },
        { status: 400 }
      )
    }

    // Approve the transaction
    const approvedApproval = await approveTransaction(
      approvalId,
      user.id,
      user.teamId,
      comment
    )

    return NextResponse.json({
      message: 'Transaction approved successfully',
      approval: approvedApproval,
    })
  } catch (error) {
    logger.error('Failed to approve transaction', error as Error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to approve transaction' },
      { status: 500 }
    )
  }
}
