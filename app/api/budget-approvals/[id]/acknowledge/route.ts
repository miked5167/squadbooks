import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: approvalId } = await params

    // Get the user
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Find the acknowledgment for this user
    const acknowledgment = await prisma.acknowledgment.findUnique({
      where: {
        budgetApprovalId_userId: {
          budgetApprovalId: approvalId,
          userId: user.id,
        },
      },
    })

    if (!acknowledgment) {
      return NextResponse.json(
        { error: 'Acknowledgment not found' },
        { status: 404 }
      )
    }

    if (acknowledgment.acknowledged) {
      return NextResponse.json(
        { error: 'Already acknowledged' },
        { status: 400 }
      )
    }

    // Record acknowledgment (IMMUTABLE - cannot be undone)
    const updated = await prisma.acknowledgment.update({
      where: { id: acknowledgment.id },
      data: {
        acknowledged: true,
        acknowledgedAt: new Date(),
        ipAddress: req.headers.get('x-forwarded-for') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
      },
    })

    // Update approval count
    const approval = await prisma.budgetApproval.findUnique({
      where: { id: approvalId },
      include: {
        acknowledgments: true,
      },
    })

    if (approval) {
      const acknowledgedCount = approval.acknowledgments.filter(
        a => a.acknowledged
      ).length

      // Check if threshold met
      const isComplete = acknowledgedCount >= approval.requiredCount

      await prisma.budgetApproval.update({
        where: { id: approvalId },
        data: {
          acknowledgedCount,
          status: isComplete ? 'COMPLETED' : 'PENDING',
          completedAt: isComplete ? new Date() : null,
        },
      })

      // TODO: Send email to treasurer if just completed
      if (isComplete) {
        console.log('Budget approval completed! Would send email to treasurer.')
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error acknowledging budget:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
