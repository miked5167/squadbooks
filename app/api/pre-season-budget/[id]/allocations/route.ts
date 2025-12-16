import { auth } from '@/lib/auth/server-auth'
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { updateAllocations } from '@/lib/db/pre-season-budget'
import { UpdateAllocationsSchema } from '@/lib/validations/pre-season-budget'

/**
 * PUT /api/pre-season-budget/[id]/allocations
 * Update category allocations for a pre-season budget
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
    const validatedData = UpdateAllocationsSchema.parse(body)

    const result = await updateAllocations(params.id, clerkId, validatedData)

    return NextResponse.json(result)
  } catch (error) {
    logger.error('Failed to update allocations', error as Error)

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
      if (error.message.includes('Total allocations')) {
        return NextResponse.json({ error: error.message }, { status: 422 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to update allocations' },
      { status: 500 }
    )
  }
}
