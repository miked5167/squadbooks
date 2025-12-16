import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const CreateApprovalSchema = z.object({
  teamId: z.string(),
  budgetTotal: z.number().positive(),
  approvalType: z.enum(['INITIAL', 'REVISION', 'REPORT']),
  description: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = CreateApprovalSchema.parse(body)

    // Get user and check role
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, role: true, teamId: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only TREASURER and PRESIDENT can create budget approvals
    if (user.role !== 'TREASURER' && user.role !== 'PRESIDENT' && user.role !== 'ASSISTANT_TREASURER') {
      return NextResponse.json(
        { error: 'Only treasurers and presidents can create budget approvals' },
        { status: 403 }
      )
    }

    if (user.teamId !== validatedData.teamId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all parents for this team
    const parents = await prisma.user.findMany({
      where: {
        teamId: validatedData.teamId,
        role: 'PARENT',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    })

    if (parents.length === 0) {
      return NextResponse.json(
        { error: 'No parents found for this team' },
        { status: 400 }
      )
    }

    // Create approval request
    const approval = await prisma.budgetApproval.create({
      data: {
        teamId: validatedData.teamId,
        season: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        budgetTotal: validatedData.budgetTotal,
        approvalType: validatedData.approvalType,
        description: validatedData.description,
        requiredCount: parents.length, // All parents must acknowledge
        createdBy: user.id,
        expiresAt: validatedData.expiresAt
          ? new Date(validatedData.expiresAt)
          : null,
      },
    })

    // Create acknowledgment records for each parent
    await prisma.acknowledgment.createMany({
      data: parents.map(parent => ({
        budgetApprovalId: approval.id,
        userId: parent.id,
        familyName: parent.name,
        email: parent.email,
      })),
    })

    // Get team name for email
    const team = await prisma.team.findUnique({
      where: { id: validatedData.teamId },
      select: { name: true },
    })

    // Send email notifications to all parents
    const { sendBudgetApprovalRequestEmail } = await import('@/lib/email')

    const emailPromises = parents.map(parent =>
      sendBudgetApprovalRequestEmail({
        parentName: parent.name || 'Parent',
        parentEmail: parent.email,
        teamName: team?.name || 'Your Team',
        budgetTotal: validatedData.budgetTotal,
        approvalType: validatedData.approvalType,
        description: validatedData.description,
        deadline: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
        approvalId: approval.id,
      })
    )

    // Send all emails in parallel, but don't fail the request if emails fail
    try {
      await Promise.allSettled(emailPromises)
      logger.info('Budget approval emails sent', {
        approvalId: approval.id,
        parentCount: parents.length,
        teamId: validatedData.teamId,
      })
    } catch (error) {
      logger.error('Failed to send budget approval emails', error as Error, {
        approvalId: approval.id,
        parentCount: parents.length,
      })
      // Continue - approval was created successfully even if emails failed
    }

    return NextResponse.json(approval, { status: 201 })
  } catch (error) {
    logger.error('Error creating budget approval', error as Error, {
      teamId: body?.teamId,
    })
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET - List approvals for a team
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const teamId = searchParams.get('teamId')

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId is required' },
        { status: 400 }
      )
    }

    const approvals = await prisma.budgetApproval.findMany({
      where: { teamId },
      include: {
        acknowledgments: {
          select: {
            id: true,
            familyName: true,
            acknowledged: true,
            acknowledgedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(approvals)
  } catch (error) {
    logger.error('Error fetching budget approvals', error as Error, {
      teamId,
    })
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
