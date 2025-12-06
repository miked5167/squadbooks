import { auth } from '@/lib/auth/server-auth'
import { NextResponse, NextRequest } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { approveBudget } from '@/lib/db/pre-season-budget'
import { AssociationApprovalSchema } from '@/lib/validations/pre-season-budget'

/**
 * POST /api/pre-season-budget/association/[id]/approve
 * Approve a pre-season budget (association admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is an association admin
    const associationUser = await prisma.associationUser.findUnique({
      where: { clerkUserId: clerkId },
      select: {
        associationId: true,
        role: true,
      },
    })

    if (!associationUser || associationUser.role !== 'association_admin') {
      return NextResponse.json(
        { error: 'Forbidden: Association admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { notes } = AssociationApprovalSchema.parse(body)

    const updated = await approveBudget(params.id, clerkId, notes)

    return NextResponse.json({ budget: updated })
  } catch (error) {
    logger.error('Failed to approve budget', error as Error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to approve budget' },
      { status: 500 }
    )
  }
}
