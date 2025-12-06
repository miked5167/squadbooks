import { NextResponse, NextRequest } from 'next/server'
import { logger } from '@/lib/logger'
import { getPublicBudget } from '@/lib/db/pre-season-budget'

/**
 * GET /api/pre-season-budget/public/[slug]
 * Get a public budget by slug (no authentication required)
 * This is for prospective parents to view approved budgets
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const budget = await getPublicBudget(params.slug)

    // Return only public-safe information
    return NextResponse.json({
      budget: {
        id: budget.id,
        proposedTeamName: budget.proposedTeamName,
        proposedSeason: budget.proposedSeason,
        teamType: budget.teamType,
        ageDivision: budget.ageDivision,
        competitiveLevel: budget.competitiveLevel,
        totalBudget: budget.totalBudget,
        projectedPlayers: budget.projectedPlayers,
        perPlayerCost: budget.perPlayerCost,
        allocations: budget.allocations,
        interestCount: budget._count.parentInterests,
        viewCount: budget.viewCount,
      },
    })
  } catch (error) {
    logger.error('Failed to get public budget', error as Error)

    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('not publicly available')) {
        return NextResponse.json({ error: error.message }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to get public budget' },
      { status: 500 }
    )
  }
}
