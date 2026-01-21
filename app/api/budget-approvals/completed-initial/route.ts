import { auth } from '@/lib/auth/server-auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/budget-approvals/completed-initial
 * Get the completed initial budget approval for the current team
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user and their team
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        teamId: true,
        team: {
          select: {
            season: true,
          },
        },
      },
    })

    if (!user?.teamId) {
      return NextResponse.json({ error: 'User not found or not assigned to a team' }, { status: 404 })
    }

    // Get the most recent completed INITIAL budget approval
    const completedApproval = await prisma.budgetApproval.findFirst({
      where: {
        teamId: user.teamId,
        season: user.team?.season,
        approvalType: 'INITIAL',
        status: 'COMPLETED',
      },
      select: {
        id: true,
        approvalType: true,
        budgetTotal: true,
        acknowledgedCount: true,
        requiredCount: true,
        completedAt: true,
        description: true,
      },
      orderBy: {
        completedAt: 'desc',
      },
    })

    if (!completedApproval) {
      return NextResponse.json(null)
    }

    return NextResponse.json(completedApproval)
  } catch (error) {
    console.error('Failed to fetch completed budget approval:', error)
    return NextResponse.json(
      { error: 'Failed to fetch completed budget approval' },
      { status: 500 }
    )
  }
}
