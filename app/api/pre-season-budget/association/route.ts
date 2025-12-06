import { auth } from '@/lib/auth/server-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { listAssociationBudgets } from '@/lib/db/pre-season-budget'
import { PreSeasonBudgetStatusEnum } from '@/lib/validations/pre-season-budget'

/**
 * GET /api/pre-season-budget/association
 * List all budgets for an association (for association admins)
 * Query params:
 * - status: Optional status filter (defaults to SUBMITTED)
 * - associationId: Required - which association to list budgets for
 */
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')

    let status: z.infer<typeof PreSeasonBudgetStatusEnum> | undefined
    if (statusParam) {
      status = PreSeasonBudgetStatusEnum.parse(statusParam)
    }

    const budgets = await listAssociationBudgets(associationUser.associationId, status)

    return NextResponse.json({ budgets })
  } catch (error) {
    logger.error('Failed to list association budgets', error as Error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid status parameter', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to list association budgets' },
      { status: 500 }
    )
  }
}
