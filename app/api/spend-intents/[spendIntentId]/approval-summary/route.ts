import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/spend-intents/[spendIntentId]/approval-summary
 * Get approval summary for a spend intent
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ spendIntentId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { spendIntentId } = await params

    // Fetch spend intent with approvals
    const spendIntent = await prisma.spendIntent.findUnique({
      where: { id: spendIntentId },
      include: {
        approvals: {
          include: {
            approver: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
                userType: true,
              },
            },
          },
        },
        team: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    if (!spendIntent) {
      return NextResponse.json({ error: 'Spend intent not found' }, { status: 404 })
    }

    // Verify user belongs to team
    const user = await prisma.user.findFirst({
      where: {
        clerkId: userId,
        teamId: spendIntent.teamId,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found or does not belong to this team' },
        { status: 403 }
      )
    }

    // Calculate approval counts
    const approvalsCount = spendIntent.approvals.length
    const independentParentRepApprovalsCount = spendIntent.approvals.filter(
      a => a.isIndependentParentRep
    ).length

    // Determine required counts based on authorization type
    let requiredApprovalsCount = 0
    let requiredIndependentParentRepCount = 0

    if (spendIntent.requiresManualApproval) {
      requiredApprovalsCount = 2
      requiredIndependentParentRepCount = 1
    }

    // Calculate remaining requirements
    const approvalsRemaining = Math.max(0, requiredApprovalsCount - approvalsCount)
    const independentParentRepRemaining = Math.max(
      0,
      requiredIndependentParentRepCount - independentParentRepApprovalsCount
    )

    // Determine if authorized
    const isAuthorized =
      !spendIntent.requiresManualApproval ||
      (approvalsCount >= requiredApprovalsCount &&
        independentParentRepApprovalsCount >= requiredIndependentParentRepCount)

    return NextResponse.json({
      spendIntent: {
        id: spendIntent.id,
        status: spendIntent.status,
        authorizationType: spendIntent.authorizationType,
        requiresManualApproval: spendIntent.requiresManualApproval,
        amountCents: spendIntent.amountCents,
        currency: spendIntent.currency,
        paymentMethod: spendIntent.paymentMethod,
        authorizedAt: spendIntent.authorizedAt,
        createdAt: spendIntent.createdAt,
        team: spendIntent.team,
        creator: spendIntent.creator,
      },
      approvalSummary: {
        approvalsCount,
        independentParentRepApprovalsCount,
        requiredApprovalsCount,
        requiredIndependentParentRepCount,
        missing: {
          approvalsRemaining,
          independentParentRepRemaining,
        },
        isAuthorized,
      },
      approvals: spendIntent.approvals.map(approval => ({
        id: approval.id,
        approver: approval.approver,
        isIndependentParentRep: approval.isIndependentParentRep,
        note: approval.note,
        approvedAt: approval.approvedAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching approval summary:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
