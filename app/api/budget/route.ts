import { auth } from '@/lib/auth/server-auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBudgetOverview } from '@/lib/db/budget'
import { logger } from '@/lib/logger'

/**
 * GET /api/budget
 * Fetch budget overview with real-time spending calculations
 * Query params:
 * - season: Optional season filter (defaults to team's current season)
 */
export async function GET(request: Request) {
  try {
    const { userId: clerkId } = await auth()

    if (!clerkId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId },
      select: {
        id: true,
        teamId: true,
        role: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const season = searchParams.get('season') || undefined

    // Get budget overview
    const budgetOverview = await getBudgetOverview(user.teamId, season)

    // Include teamId in response for budget approval integration
    return NextResponse.json({
      ...budgetOverview,
      teamId: user.teamId,
    })
  } catch (error) {
    logger.error('Failed to fetch budget', error as Error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch budget' },
      { status: 500 }
    )
  }
}
