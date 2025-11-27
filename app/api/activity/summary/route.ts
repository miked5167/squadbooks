/**
 * API route for fetching activity summary and statistics
 * GET /api/activity/summary
 */

import { auth } from '@/lib/auth/server-auth'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getActivitySummary } from '@/lib/activity/weekly-summary'
import { detectPotentialIssues } from '@/lib/activity/potential-issues'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user and team
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true, teamId: true },
    })

    if (!user || !user.teamId) {
      return NextResponse.json({ error: 'User not found or not in a team' }, { status: 404 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || 'week' // 'day', 'week', 'month'

    // Calculate date range based on period
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    let startDate: Date
    let label: string

    switch (period) {
      case 'day':
      case 'today':
        startDate = today
        label = "Today's Activity"
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        label = "This Month's Activity"
        break
      case 'week':
      default:
        startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
        label = "This Week's Activity"
        break
    }

    // Fetch summary and issues in parallel
    const [summary, issues] = await Promise.all([
      getActivitySummary(user.teamId, { startDate, endDate: now, label }),
      detectPotentialIssues(user.teamId),
    ])

    // Add potential issues count to summary
    summary.potentialIssuesCount = issues.length

    return NextResponse.json({
      summary,
      issues: issues.slice(0, 10), // Return top 10 issues
    })
  } catch (error) {
    console.error('Error fetching activity summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity summary' },
      { status: 500 }
    )
  }
}
