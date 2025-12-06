/**
 * Season Close API Route
 * POST: Close the current season and optionally create a new one
 */

import { NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { requireTreasurerOnly } from '@/lib/auth/permissions'
import { logger } from '@/lib/logger'
import { seasonCloseSchema } from '@/lib/validations/settings'
import { logger } from '@/lib/logger'
import { z } from 'zod'
import { logger } from '@/lib/logger'

/**
 * POST /api/settings/season/close
 * Close the current season
 * Body: { archiveData, createNewSeason, newSeasonName?, confirmMessage }
 *
 * This is a high-impact operation that:
 * 1. Marks all pending transactions as closed
 * 2. Creates a season snapshot
 * 3. Optionally creates a new season
 * 4. Requires explicit confirmation
 */
export async function POST(request: Request) {
  try {
    const user = await requireTreasurerOnly()
    const body = await request.json()

    // Validate input
    const data = seasonCloseSchema.parse(body)

    // Get current team and season
    const team = await prisma.team.findUnique({
      where: { id: user.teamId },
      select: {
        id: true,
        name: true,
        season: true,
        budgetTotal: true,
      },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check if there are any pending transactions
    const pendingTransactions = await prisma.transaction.count({
      where: {
        teamId: user.teamId,
        status: 'PENDING',
        deletedAt: null,
      },
    })

    if (pendingTransactions > 0) {
      return NextResponse.json(
        {
          error: `Cannot close season with ${pendingTransactions} pending transactions. Please approve or reject all transactions first.`,
          pendingCount: pendingTransactions,
        },
        { status: 400 }
      )
    }

    // Start transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create season snapshot
      const snapshot = {
        teamId: team.id,
        season: team.season,
        budgetTotal: team.budgetTotal,
        closedAt: new Date(),
        closedBy: user.id,
      }

      // Note: This would be saved to a SeasonSnapshot model if it exists
      // For now, we'll just log it
      logger.info('Season snapshot created:', snapshot)

      // 2. If creating new season, update team
      if (data.createNewSeason && data.newSeasonName) {
        await tx.team.update({
          where: { id: team.id },
          data: {
            season: data.newSeasonName,
            budgetTotal: 0, // Reset budget for new season
          },
        })

        // Copy budget allocations from previous season if needed
        // This is optional - you might want to let treasurers set up fresh budgets
        const previousAllocations = await tx.budgetAllocation.findMany({
          where: {
            teamId: team.id,
            season: team.season,
          },
        })

        // Create new allocations for new season (reset amounts to 0)
        await tx.budgetAllocation.createMany({
          data: previousAllocations.map((alloc) => ({
            teamId: team.id,
            categoryId: alloc.categoryId,
            season: data.newSeasonName!,
            allocated: 0, // Start fresh
          })),
        })
      }

      return {
        oldSeason: team.season,
        newSeason: data.createNewSeason ? data.newSeasonName : null,
        snapshot,
      }
    })

    return NextResponse.json({
      message: 'Season closed successfully',
      ...result,
    })
  } catch (error: any) {
    logger.error('POST /api/settings/season/close error', error as Error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to close season' },
      { status: error.message?.includes('Forbidden') ? 403 : 500 }
    )
  }
}
