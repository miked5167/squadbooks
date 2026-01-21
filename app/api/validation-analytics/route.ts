import { NextResponse } from 'next/server'
import { requireAuth, requireTeamAccess } from '@/lib/permissions/server-permissions'
import {
  getValidationOverview,
  getExceptionTrend,
  getOverrideStatistics,
} from '@/lib/services/validation-analytics'

/**
 * GET /api/validation-analytics
 *
 * Returns validation compliance metrics for a team:
 * - Exception counts by severity
 * - Compliance rate (validated / total)
 * - Average time to resolve exceptions
 * - Top violation types
 */
export async function GET(request: Request) {
  try {
    const user = await requireAuth()

    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId') || user.teamId

    if (!teamId) {
      return NextResponse.json({ error: 'Team ID required' }, { status: 400 })
    }

    // Verify team access
    await requireTeamAccess(teamId)

    // Parse date filters
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')

    const startDate = startDateParam ? new Date(startDateParam) : undefined
    const endDate = endDateParam ? new Date(endDateParam) : undefined

    // Get overview data
    const overview = await getValidationOverview({
      teamId,
      startDate,
      endDate,
    })

    // Get trend data if date range provided
    let trend = null
    if (startDate && endDate) {
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const interval = daysDiff > 60 ? 'month' : daysDiff > 14 ? 'week' : 'day'

      trend = await getExceptionTrend({
        teamId,
        startDate,
        endDate,
        interval,
      })
    }

    // Get override statistics
    const overrideStats = await getOverrideStatistics({
      teamId,
      startDate,
      endDate,
    })

    return NextResponse.json({
      overview,
      trend,
      overrideStats,
    })
  } catch (error) {
    console.error('GET /api/validation-analytics error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch validation analytics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
