import { NextResponse, NextRequest } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { submitParentInterest } from '@/lib/db/pre-season-budget'
import { ParentInterestSchema } from '@/lib/validations/pre-season-budget'

/**
 * POST /api/pre-season-budget/public/[slug]/interest
 * Submit parent interest/acknowledgment (no authentication required)
 * This is for prospective parents to express interest in joining the team
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const body = await request.json()
    const validatedData = ParentInterestSchema.parse(body)

    // Get IP address and user agent for audit trail
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const interest = await submitParentInterest(
      params.slug,
      validatedData,
      ipAddress,
      userAgent
    )

    return NextResponse.json({ success: true, interestId: interest.id }, { status: 201 })
  } catch (error) {
    logger.error('Failed to submit parent interest', error as Error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      // Handle unique constraint violation (duplicate email)
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'You have already expressed interest in this budget' },
          { status: 409 }
        )
      }
      if (error.message.includes('not found') || error.message.includes('not approved')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to submit interest' },
      { status: 500 }
    )
  }
}
