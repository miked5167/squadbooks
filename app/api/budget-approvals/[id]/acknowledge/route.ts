import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

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

      // Send completion email to treasurer if just completed
      if (isComplete) {
        try {
          // Get treasurer and team details
          const treasurerAndTeam = await prisma.budgetApproval.findUnique({
            where: { id: approvalId },
            include: {
              creator: {
                select: {
                  name: true,
                  email: true,
                },
              },
              team: {
                select: {
                  name: true,
                },
              },
            },
          })

          if (treasurerAndTeam?.creator && treasurerAndTeam?.team) {
            const { sendBudgetApprovalCompletionEmail } = await import('@/lib/email')

            await sendBudgetApprovalCompletionEmail({
              treasurerName: treasurerAndTeam.creator.name || 'Treasurer',
              treasurerEmail: treasurerAndTeam.creator.email,
              teamName: treasurerAndTeam.team.name,
              budgetTotal: treasurerAndTeam.budgetTotal,
              approvalType: treasurerAndTeam.approvalType,
              acknowledgedCount,
              requiredCount: approval.requiredCount,
            })

            logger.info('Budget approval completed email sent', {
              approvalId,
              treasurerEmail: treasurerAndTeam.creator.email,
              acknowledgedCount,
            })
          }
        } catch (error) {
          logger.error('Failed to send budget completion email', error as Error, {
            approvalId,
          })
          // Don't fail the acknowledgment if email fails
        }
      }
    }

    return NextResponse.json(updated)
  } catch (error) {
    logger.error('Error acknowledging budget', error as Error, {
      approvalId: (await params).id,
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
