import { auth } from '@/lib/auth/server-auth'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import {
  createPreSeasonBudget,
  listUserBudgets,
} from '@/lib/db/pre-season-budget'
import {
  CreatePreSeasonBudgetSchema,
  PreSeasonBudgetStatusEnum,
} from '@/lib/validations/pre-season-budget'

/**
 * POST /api/pre-season-budget
 * Create a new pre-season budget (draft)
 */
export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = CreatePreSeasonBudgetSchema.parse(body)

    const budgetId = await createPreSeasonBudget(validatedData, clerkId)

    return NextResponse.json({ id: budgetId }, { status: 201 })
  } catch (error) {
    logger.error('Failed to create pre-season budget', error as Error)

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
      { error: 'Failed to create pre-season budget' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/pre-season-budget
 * List all budgets created by current user
 * Query params:
 * - status: Optional status filter
 */
export async function GET(request: Request) {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status')

    let status: z.infer<typeof PreSeasonBudgetStatusEnum> | undefined
    if (statusParam) {
      status = PreSeasonBudgetStatusEnum.parse(statusParam)
    }

    const budgets = await listUserBudgets(clerkId, status)

    return NextResponse.json({ budgets })
  } catch (error) {
    logger.error('Failed to list pre-season budgets', error as Error)

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
      { error: 'Failed to list pre-season budgets' },
      { status: 500 }
    )
  }
}
