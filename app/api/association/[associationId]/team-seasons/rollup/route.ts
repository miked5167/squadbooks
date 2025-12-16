/**
 * Team Season Rollup API
 *
 * GET /api/association/[associationId]/team-seasons/rollup
 *
 * Provides association-level visibility into team season lifecycle states.
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getAssociationTeamSeasonRollup, getTeamSeasonStats } from '@/lib/db/team-season-rollup'
import type { TeamSeasonState } from '@prisma/client'

export async function GET(
  request: NextRequest,
  { params }: { params: { associationId: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { associationId } = params

    // TODO: Verify user has access to this association
    // For MVP, we'll allow any authenticated user

    // Get query params
    const searchParams = request.nextUrl.searchParams
    const state = searchParams.get('state') as TeamSeasonState | null
    const seasonLabel = searchParams.get('seasonLabel')
    const needsAttention = searchParams.get('needsAttention') === 'true' ? true : undefined
    const includeStats = searchParams.get('includeStats') === 'true'

    // Build filters
    const filters: any = {}
    if (state) filters.state = state
    if (seasonLabel) filters.seasonLabel = seasonLabel
    if (needsAttention !== undefined) filters.needsAttention = needsAttention

    // Get rollup data
    const rollup = await getAssociationTeamSeasonRollup(associationId, filters)

    // Get stats if requested
    let stats = null
    if (includeStats) {
      stats = await getTeamSeasonStats(associationId, seasonLabel || undefined)
    }

    return NextResponse.json({
      rollup,
      stats,
      filters: {
        state,
        seasonLabel,
        needsAttention,
      },
    })
  } catch (error) {
    console.error('Error fetching team season rollup:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team season rollup' },
      { status: 500 }
    )
  }
}
