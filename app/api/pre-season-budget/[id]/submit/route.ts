import { auth } from '@/lib/auth/server-auth'
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { submitForApproval } from '@/lib/db/pre-season-budget'

/**
 * POST /api/pre-season-budget/[id]/submit
 * Submit budget for association approval
 * Changes status from DRAFT/REJECTED to SUBMITTED
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

    const updated = await submitForApproval(params.id, clerkId)

    return NextResponse.json({ budget: updated })
  } catch (error) {
    logger.error('Failed to submit budget for approval', error as Error)

    if (error instanceof Error) {
      if (error.message.includes('Forbidden')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      if (error.message.includes('allocations')) {
        return NextResponse.json({ error: error.message }, { status: 422 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to submit budget for approval' },
      { status: 500 }
    )
  }
}
