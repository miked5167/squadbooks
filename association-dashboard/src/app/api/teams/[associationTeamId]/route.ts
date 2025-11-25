/**
 * Team Detail API Route
 *
 * GET /api/teams/[associationTeamId]
 * Returns team detail from latest snapshot including:
 * - Team information (name, division, treasurer)
 * - Budget summary (total, spent, remaining, % used)
 * - Category breakdown from HuddleBooks budget
 * - Red flags and health status
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db/prisma'
import { HuddleBooksClient } from '@/lib/huddlebooks/client'

// Response types
interface RedFlag {
  code: string
  message: string
  severity: 'warning' | 'critical'
}

interface CategoryBreakdown {
  categoryName: string
  budgeted: number
  spent: number
  remaining: number
  percentUsed: number
  status: 'on_track' | 'warning' | 'over'
}

interface TeamDetailResponse {
  data: {
    teamInfo: {
      id: string
      teamName: string
      division: string | null
      season: string | null
      treasurerName: string | null
      treasurerEmail: string | null
      healthStatus: string | null
      lastSynced: Date | null
    }
    budgetSummary: {
      budgetTotal: number | null
      spent: number | null
      remaining: number | null
      percentUsed: number | null
    }
    categoryBreakdown: CategoryBreakdown[]
    redFlags: RedFlag[]
    operationalMetrics: {
      pendingApprovals: number | null
      missingReceipts: number | null
      bankReconciled: boolean | null
      bankReconciledThrough: Date | null
      lastActivity: Date | null
    }
  } | null
  error: {
    code: string
    message: string
  } | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { associationTeamId: string } }
): Promise<NextResponse<TeamDetailResponse>> {
  try {
    // Authenticate request
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    const associationTeamId = params.associationTeamId
    if (!associationTeamId) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INVALID_TEAM_ID',
            message: 'Team ID is required',
          },
        },
        { status: 400 }
      )
    }

    // Fetch team with association
    const team = await prisma.associationTeam.findUnique({
      where: {
        id: associationTeamId,
      },
      include: {
        association: true,
      },
    })

    if (!team) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'TEAM_NOT_FOUND',
            message: 'Team not found',
          },
        },
        { status: 404 }
      )
    }

    // Check user authorization
    const associationUser = await prisma.associationUser.findFirst({
      where: {
        clerkUserId: userId,
        associationId: team.associationId,
      },
    })

    if (!associationUser) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this team',
          },
        },
        { status: 403 }
      )
    }

    // Get latest snapshot for this team
    const latestSnapshot = await prisma.teamFinancialSnapshot.findFirst({
      where: {
        associationTeamId: associationTeamId,
      },
      orderBy: {
        snapshotAt: 'desc',
      },
    })

    // Get category breakdown from HuddleBooks API (if team has access token)
    let categoryBreakdown: CategoryBreakdown[] = []
    if (team.apiAccessToken) {
      try {
        const client = new HuddleBooksClient(team.apiAccessToken)
        const budget = await client.getTeamBudget(team.teamId)

        categoryBreakdown = budget.categories.map((cat) => {
          const percentUsed = cat.budgeted > 0 ? (cat.spent / cat.budgeted) * 100 : 0
          let status: 'on_track' | 'warning' | 'over' = 'on_track'
          if (percentUsed >= 100) status = 'over'
          else if (percentUsed >= 80) status = 'warning'

          return {
            categoryName: cat.name,
            budgeted: cat.budgeted,
            spent: cat.spent,
            remaining: cat.budgeted - cat.spent,
            percentUsed,
            status,
          }
        })
      } catch (error) {
        console.error('Error fetching budget breakdown:', error)
        // Continue without category breakdown if API call fails
      }
    }

    // Parse red flags from snapshot
    const redFlags: RedFlag[] = latestSnapshot?.redFlags
      ? Array.isArray(latestSnapshot.redFlags)
        ? (latestSnapshot.redFlags as RedFlag[])
        : []
      : []

    // Return team detail
    return NextResponse.json({
      data: {
        teamInfo: {
          id: team.id,
          teamName: team.teamName,
          division: team.division,
          season: team.season,
          treasurerName: team.treasurerName,
          treasurerEmail: team.treasurerEmail,
          healthStatus: latestSnapshot?.healthStatus || null,
          lastSynced: team.lastSyncedAt,
        },
        budgetSummary: {
          budgetTotal: latestSnapshot?.budgetTotal
            ? Number(latestSnapshot.budgetTotal)
            : null,
          spent: latestSnapshot?.spent ? Number(latestSnapshot.spent) : null,
          remaining: latestSnapshot?.remaining
            ? Number(latestSnapshot.remaining)
            : null,
          percentUsed: latestSnapshot?.percentUsed
            ? Number(latestSnapshot.percentUsed)
            : null,
        },
        categoryBreakdown,
        redFlags,
        operationalMetrics: {
          pendingApprovals: latestSnapshot?.pendingApprovals || null,
          missingReceipts: latestSnapshot?.missingReceipts || null,
          bankConnected: latestSnapshot?.bankConnected || null,
          bankReconciledThrough: latestSnapshot?.bankReconciledThrough || null,
          lastActivity: latestSnapshot?.lastActivityAt || null,
        },
      },
      error: null,
    })
  } catch (error) {
    console.error('Error fetching team detail:', error)
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch team detail',
        },
      },
      { status: 500 }
    )
  }
}
