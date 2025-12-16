import { auth } from '@/lib/auth/server-auth'
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { activateBudget } from '@/lib/db/pre-season-budget'
import { TeamActivationSchema } from '@/lib/validations/pre-season-budget'

/**
 * POST /api/pre-season-budget/[id]/activate
 * Activate a pre-season budget and create the team
 * This creates the Team record, copies allocations, creates Family records,
 * and sends invitation emails to parents
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

    const body = await request.json()
    const { minimumInterestsRequired } = TeamActivationSchema.parse(body)

    const result = await activateBudget(params.id, clerkId, minimumInterestsRequired)

    return NextResponse.json({
      success: true,
      teamId: result.teamId,
      message: 'Team created successfully from pre-season budget',
    })
  } catch (error) {
    logger.error('Failed to activate budget', error as Error)

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
      if (error.message.includes('Minimum')) {
        return NextResponse.json({ error: error.message }, { status: 422 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to activate budget' },
      { status: 500 }
    )
  }
}
