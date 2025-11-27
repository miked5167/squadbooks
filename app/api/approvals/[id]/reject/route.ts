import { auth } from '@/lib/auth/server-auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { rejectTransaction } from '@/lib/db/approvals'

/**
 * POST /api/approvals/[id]/reject
 * Reject a pending transaction
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

    // Reject the transaction
    const approval = await rejectTransaction(
      approvalId,
      user.id,
      user.teamId,
      comment
    )

    return NextResponse.json({
      message: 'Transaction rejected successfully',
      approval,
    })
  } catch (error) {
    console.error('Failed to reject transaction:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to reject transaction' },
      { status: 500 }
    )
  }
}
