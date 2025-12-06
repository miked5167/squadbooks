import { auth } from '@/lib/auth/server-auth'
import { NextResponse, NextRequest } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import {
  getPreSeasonBudget,
  updateBudgetDetails,
  deleteBudget,
} from '@/lib/db/pre-season-budget'
import { UpdatePreSeasonBudgetSchema } from '@/lib/validations/pre-season-budget'

/**
 * GET /api/pre-season-budget/[id]
 * Get a single pre-season budget with all details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const budget = await getPreSeasonBudget(params.id, clerkId)

    return NextResponse.json({ budget })
  } catch (error) {
    logger.error('Failed to get pre-season budget', error as Error)

    if (error instanceof Error) {
      if (error.message.includes('Forbidden') || error.message.includes('not found')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to get pre-season budget' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/pre-season-budget/[id]
 * Update budget details (team info, budget total, etc.)
 * Only allowed in DRAFT or REJECTED status
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = UpdatePreSeasonBudgetSchema.parse(body)

    const updated = await updateBudgetDetails(params.id, clerkId, validatedData)

    return NextResponse.json({ budget: updated })
  } catch (error) {
    logger.error('Failed to update pre-season budget', error as Error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to update pre-season budget' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/pre-season-budget/[id]
 * Cancel/delete a budget (only in DRAFT status)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await deleteBudget(params.id, clerkId)

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    logger.error('Failed to delete pre-season budget', error as Error)

    if (error instanceof Error) {
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to delete pre-season budget' },
      { status: 500 }
    )
  }
}
