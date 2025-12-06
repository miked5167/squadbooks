/**
 * Season Reopen API Route
 * POST: Reopen a closed season (emergency use only)
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { requireTreasurerOnly } from '@/lib/auth/permissions'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const reopenSchema = z.object({
  seasonName: z.string().min(1, 'Season name is required'),
  confirmMessage: z
    .string()
    .refine(
      (val) => val === 'I understand this will revert to the previous season',
      'You must confirm by typing the exact message'
    ),
})

/**
 * POST /api/settings/season/reopen
 * Reopen a previously closed season
 * Body: { seasonName, confirmMessage }
 *
 * This is an emergency operation that:
 * 1. Reverts to a previous season
 * 2. Should only be used if season was closed by mistake
 * 3. Requires explicit confirmation
 */
export async function POST(request: Request) {
  try {
    const user = await requireTreasurerOnly()
    const body = await request.json()

    // Validate input
    const data = reopenSchema.parse(body)

    // Get current team
    const team = await prisma.team.findUnique({
      where: { id: user.teamId },
      select: {
        id: true,
        name: true,
        season: true,
      },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Verify the season to reopen has data
    const seasonData = await prisma.budgetAllocation.count({
      where: {
        teamId: team.id,
        season: data.seasonName,
      },
    })

    if (seasonData === 0) {
      return NextResponse.json(
        { error: 'Cannot reopen season - no data found for this season' },
        { status: 400 }
      )
    }

    // Update team to reopen the season
    await prisma.team.update({
      where: { id: team.id },
      data: {
        season: data.seasonName,
      },
    })

    return NextResponse.json({
      message: 'Season reopened successfully',
      previousSeason: team.season,
      reopenedSeason: data.seasonName,
    })
  } catch (error: any) {
    logger.error('POST /api/settings/season/reopen error', error as Error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to reopen season' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}
