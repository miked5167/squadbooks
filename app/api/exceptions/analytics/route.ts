import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'
import { getExceptionMetrics, getExceptionTrends } from '@/lib/services/exception-analytics'

/**
 * GET /api/exceptions/analytics
 *
 * Get exception analytics and metrics for the current team
 *
 * Query params:
 * - startDate: ISO date string (optional)
 * - endDate: ISO date string (optional)
 * - includeTrends: boolean (optional) - if true, includes weekly trends for last 12 weeks
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user and team
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { teamId: true, role: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Only treasurers can access analytics
    if (user.role !== 'TREASURER' && user.role !== 'ASSISTANT_TREASURER') {
      return NextResponse.json(
        { error: 'Only treasurers can access exception analytics' },
        { status: 403 }
      )
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const includeTrends = searchParams.get('includeTrends') === 'true'

    const startDate = startDateStr ? new Date(startDateStr) : undefined
    const endDate = endDateStr ? new Date(endDateStr) : undefined

    // Get metrics
    const metrics = await getExceptionMetrics(user.teamId, {
      startDate,
      endDate,
    })

    // Optionally get trends (last 12 weeks)
    let trends = null
    if (includeTrends) {
      const now = new Date()
      const twelveWeeksAgo = new Date(now)
      twelveWeeksAgo.setDate(now.getDate() - 84) // 12 weeks

      trends = await getExceptionTrends(user.teamId, {
        period: 'week',
        startDate: startDate || twelveWeeksAgo,
        endDate: endDate || now,
      })
    }

    return NextResponse.json({
      metrics,
      trends,
    })
  } catch (error) {
    console.error('Error fetching exception analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exception analytics' },
      { status: 500 }
    )
  }
}
