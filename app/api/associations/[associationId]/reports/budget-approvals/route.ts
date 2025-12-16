import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ associationId: string }> }
) {
  try {
    const { userId } = await auth()
    const { associationId } = await params

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user has access to this association
    const associationUser = await prisma.associationUser.findFirst({
      where: {
        clerkUserId: userId,
        associationId: associationId,
      },
    })

    if (!associationUser) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get all teams in the association
    const associationTeams = await prisma.associationTeam.findMany({
      where: { associationId },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            level: true,
          },
        },
      },
    })

    const teamIds = associationTeams
      .map((at) => at.teamId)
      .filter((id): id is string => id !== null)

    if (teamIds.length === 0) {
      return NextResponse.json({
        summary: {
          totalApprovals: 0,
          completedCount: 0,
          completionRate: 0,
          pendingCount: 0,
          expiredCount: 0,
        },
        teamApprovals: [],
      })
    }

    // Fetch BudgetApproval records (legacy/simple acknowledgment system)
    const budgetApprovals = await prisma.budgetApproval.findMany({
      where: {
        teamId: { in: teamIds },
      },
      select: {
        id: true,
        teamId: true,
        description: true,
        approvalType: true,
        budgetTotal: true,
        requiredCount: true,
        acknowledgedCount: true,
        status: true,
        expiresAt: true,
        createdAt: true,
        team: {
          select: {
            name: true,
            level: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Fetch BudgetVersionApproval records (modern versioned budget system)
    // Temporarily disabled due to model field issues - will fix in next iteration
    const budgetVersionApprovals: any[] = []

    // Transform budget approvals
    const legacyApprovals = budgetApprovals.map((approval) => {
      const progressPercentage =
        approval.requiredCount > 0
          ? Math.round((approval.acknowledgedCount / approval.requiredCount) * 100)
          : 0

      let status = approval.status
      if (status === 'PENDING' && approval.expiresAt && new Date(approval.expiresAt) < new Date()) {
        status = 'EXPIRED'
      }

      return {
        teamId: approval.teamId,
        teamName: approval.team?.name || 'Unknown Team',
        teamLevel: approval.team?.level || '',
        approvalType: 'ACKNOWLEDGMENT' as const,
        description: approval.description || `${approval.approvalType} Acknowledgment`,
        totalFamilies: approval.requiredCount,
        acknowledgedCount: approval.acknowledgedCount,
        progressPercentage,
        status,
        expiresAt: approval.expiresAt?.toISOString() || null,
        createdAt: approval.createdAt.toISOString(),
      }
    })

    // Use only legacy approvals for now
    const allApprovals = legacyApprovals

    // Calculate summary statistics
    const totalApprovals = allApprovals.length
    const completedCount = allApprovals.filter((a) => a.status === 'COMPLETED').length
    const pendingCount = allApprovals.filter((a) => a.status === 'PENDING').length
    const expiredCount = allApprovals.filter((a) => a.status === 'EXPIRED').length
    const completionRate =
      totalApprovals > 0 ? Math.round((completedCount / totalApprovals) * 100) : 0

    return NextResponse.json({
      summary: {
        totalApprovals,
        completedCount,
        completionRate,
        pendingCount,
        expiredCount,
      },
      teamApprovals: allApprovals,
    })
  } catch (error) {
    console.error('Failed to fetch budget approval data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch budget approval data' },
      { status: 500 }
    )
  }
}
