import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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

    // TODO: Send emails to all parents using Resend
    // For now, just log that we would send emails
    console.log(`Would send budget approval emails to ${parents.length} parents`)

    return NextResponse.json(approval, { status: 201 })
  } catch (error) {
    console.error('Error creating budget approval:', error)
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
    console.error('Error fetching budget approvals:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
