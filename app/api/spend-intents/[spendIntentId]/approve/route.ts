import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/spend-intents/[spendIntentId]/approve
 * Approve a spend intent (requires signing authority)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ spendIntentId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { spendIntentId } = await params
    const body = await request.json()
    const { note } = body

    // Fetch spend intent
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
              },
            },
          },
        },
        team: true,
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
      include: {
        signingAuthorities: {
          where: {
            isActive: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found or does not belong to this team' },
        { status: 403 }
      )
    }

    // Verify user is a signing authority
    const activeSigningAuthority = user.signingAuthorities.find(sa => sa.isActive)
    const isSigningAuthority = activeSigningAuthority || user.isSigningAuthority

    if (!isSigningAuthority) {
      return NextResponse.json(
        { error: 'Only signing authorities can approve spend intents' },
        { status: 403 }
      )
    }

    // Check if spend intent requires approval
    if (!spendIntent.requiresManualApproval) {
      return NextResponse.json(
        { error: 'This spend intent does not require manual approval' },
        { status: 400 }
      )
    }

    // Check if already approved by this user
    const existingApproval = spendIntent.approvals.find(
      approval => approval.approverUserId === user.id
    )

    if (existingApproval) {
      return NextResponse.json(
        { error: 'You have already approved this spend intent' },
        { status: 400 }
      )
    }

    // Check for self-dealing: prevent payee from approving their own payment
    if (spendIntent.payeeUserId && spendIntent.payeeUserId === user.id) {
      return NextResponse.json(
        { error: 'You cannot approve a payment to yourself' },
        { status: 403 }
      )
    }

    // Snapshot isIndependentParentRep from TeamSigningAuthority record
    // This is the ONLY source of truth for independent parent rep status
    const isIndependentParentRep = activeSigningAuthority?.isIndependentParentRep ?? false

    // Create approval
    const approval = await prisma.spendIntentApproval.create({
      data: {
        spendIntentId,
        approverUserId: user.id,
        isIndependentParentRep,
        note: note || null,
      },
      include: {
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Fetch all approvals for this spend intent
    const allApprovals = await prisma.spendIntentApproval.findMany({
      where: { spendIntentId },
    })

    // Calculate approval counts
    const approvalsCount = allApprovals.length
    const independentParentRepApprovalsCount = allApprovals.filter(
      a => a.isIndependentParentRep
    ).length

    // Check if authorization threshold is met
    // Required: at least 2 approvals AND at least 1 independent parent rep
    const isAuthorized = approvalsCount >= 2 && independentParentRepApprovalsCount >= 1

    // Update spend intent if authorized
    let updatedSpendIntent
    if (isAuthorized && spendIntent.status === 'AUTHORIZATION_PENDING') {
      updatedSpendIntent = await prisma.spendIntent.update({
        where: { id: spendIntentId },
        data: {
          status: 'AUTHORIZED',
          authorizedAt: new Date(),
        },
        include: {
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  name: true,
                  email: true,
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
    } else {
      updatedSpendIntent = await prisma.spendIntent.findUnique({
        where: { id: spendIntentId },
        include: {
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  name: true,
                  email: true,
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
    }

    // Calculate remaining requirements
    const requiredApprovalsCount = 2
    const requiredIndependentParentRepCount = 1

    const approvalsRemaining = Math.max(0, requiredApprovalsCount - approvalsCount)
    const independentParentRepRemaining = Math.max(
      0,
      requiredIndependentParentRepCount - independentParentRepApprovalsCount
    )

    return NextResponse.json({
      spendIntent: updatedSpendIntent,
      approval,
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
    })
  } catch (error) {
    console.error('Error approving spend intent:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
