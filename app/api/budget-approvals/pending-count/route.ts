import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        teamId: true,
      },
    })

    if (!user) {
      return NextResponse.json({
        count: 0,
        totalAmount: 0,
      })
    }

    // Get pending approvals for the user's team
    const pendingApprovals = await prisma.budgetApproval.findMany({
      where: {
        teamId: user.teamId,
        status: 'PENDING',
      },
      select: {
        id: true,
        budgetTotal: true,
        description: true,
        approvalType: true,
        requiredCount: true,
        acknowledgedCount: true,
        expiresAt: true,
        createdAt: true,
        acknowledgments: {
          where: {
            acknowledged: false,
          },
          select: {
            familyName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    const totalAmount = pendingApprovals.reduce((sum, approval) => {
      return sum + Number(approval.budgetTotal)
    }, 0)

    return NextResponse.json({
      count: pendingApprovals.length,
      totalAmount: totalAmount,
      approvals: pendingApprovals.map(approval => ({
        id: approval.id,
        description: approval.description,
        approvalType: approval.approvalType,
        amount: Number(approval.budgetTotal),
        acknowledgedCount: approval.acknowledgedCount,
        requiredCount: approval.requiredCount,
        progressPercentage: approval.requiredCount > 0
          ? Math.round((approval.acknowledgedCount / approval.requiredCount) * 100)
          : 0,
        expiresAt: approval.expiresAt?.toISOString() || null,
        pendingFamilies: approval.acknowledgments.map(a => a.familyName),
      })),
    })
  } catch (error) {
    console.error('Failed to fetch pending approvals count:', error)
    return NextResponse.json(
      { error: 'Failed to fetch pending approvals count' },
      { status: 500 }
    )
  }
}
