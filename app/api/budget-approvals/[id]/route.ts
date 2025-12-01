import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const approval = await prisma.budgetApproval.findUnique({
      where: { id },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            level: true,
            season: true,
          },
        },
        acknowledgments: {
          select: {
            id: true,
            userId: true,
            familyName: true,
            acknowledged: true,
            acknowledgedAt: true,
          },
        },
      },
    })

    if (!approval) {
      return NextResponse.json(
        { error: 'Approval not found' },
        { status: 404 }
      )
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true, teamId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has permission to view
    const userAcknowledgment = approval.acknowledgments.find(
      a => a.userId === user.id
    )

    const canView =
      userAcknowledgment ||
      user.role === 'TREASURER' ||
      user.role === 'ASSISTANT_TREASURER' ||
      user.role === 'PRESIDENT'

    if (!canView || user.teamId !== approval.teamId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json(approval)
  } catch (error) {
    console.error('Error fetching approval:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
