import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { CreateTransactionSchema, TransactionFilterSchema } from '@/lib/validations/transaction'
import {
  createTransaction,
  getTransactions,
  getTransactionsWithCursor,
  decodeCursor,
} from '@/lib/db/transactions'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { areTransactionsAllowed } from '@/lib/services/team-season-lifecycle'
import { autoActivateOnFirstTransaction } from '@/lib/services/team-season-auto-transitions'
import { createTeamSeasonWithSnapshot } from '@/lib/services/team-policy-snapshot'
import {
  getCurrentUser,
  getAccessibleTeams,
  isAssociationUser,
} from '@/lib/permissions/server-permissions'

/**
 * GET /api/transactions
 * Get list of transactions with cursor-based pagination and server-side filtering
 * Query params:
 * - cursor: base64-encoded cursor for pagination
 * - limit: number of items (default 20, max 50)
 * - type: INCOME or EXPENSE
 * - status: IMPORTED, VALIDATED, EXCEPTION, RESOLVED, LOCKED, DRAFT, PENDING, APPROVED, or REJECTED
 * - categoryId: UUID of category
 * - search: search term for vendor/description
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const cursorParam = searchParams.get('cursor')
    const limitParam = searchParams.get('limit')
    const typeParam = searchParams.get('type')
    const statusParam = searchParams.get('status')
    const categoryIdParam = searchParams.get('categoryId')
    const searchParam = searchParams.get('search')
    const teamIdsParam = searchParams.get('teamIds') // Optional: specific team IDs filter
    const dateFromParam = searchParams.get('dateFrom')
    const dateToParam = searchParams.get('dateTo')
    const missingReceiptsParam = searchParams.get('missingReceipts')
    const sortByParam = searchParams.get('sortBy')
    const sortDirParam = searchParams.get('sortDir')

    // Decode cursor if provided
    let cursor: { transactionDate: Date; id: string } | undefined
    if (cursorParam) {
      const decoded = decodeCursor(cursorParam)
      if (!decoded) {
        return NextResponse.json({ error: 'Invalid cursor' }, { status: 400 })
      }
      cursor = decoded
    }

    // Parse limit
    const limit = limitParam ? parseInt(limitParam, 10) : 20
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json({ error: 'Invalid limit' }, { status: 400 })
    }

    // Build filters
    const filters: {
      type?: 'INCOME' | 'EXPENSE'
      status?:
        | 'IMPORTED'
        | 'VALIDATED'
        | 'EXCEPTION'
        | 'RESOLVED'
        | 'LOCKED'
        | 'DRAFT'
        | 'PENDING'
        | 'APPROVED'
        | 'REJECTED'
      categoryId?: string
      search?: string
      dateFrom?: string
      dateTo?: string
      missingReceipts?: boolean
    } = {}

    if (typeParam && (typeParam === 'INCOME' || typeParam === 'EXPENSE')) {
      filters.type = typeParam
    }

    const validStatuses = [
      'IMPORTED',
      'VALIDATED',
      'EXCEPTION',
      'RESOLVED',
      'LOCKED',
      'DRAFT',
      'PENDING',
      'APPROVED',
      'REJECTED',
    ]
    if (statusParam && validStatuses.includes(statusParam)) {
      filters.status = statusParam as typeof filters.status
    }

    if (categoryIdParam) {
      filters.categoryId = categoryIdParam
    }

    if (searchParam && searchParam.trim()) {
      filters.search = searchParam.trim()
    }

    if (dateFromParam) {
      filters.dateFrom = dateFromParam
    }

    if (dateToParam) {
      filters.dateTo = dateToParam
    }

    if (missingReceiptsParam === 'true') {
      filters.missingReceipts = true
    }

    // Parse and validate sort parameters
    const validSortFields = ['date', 'amount', 'category', 'vendor']
    const validSortDirs = ['asc', 'desc']

    let sortBy: 'date' | 'amount' | 'category' | 'vendor' = 'date'
    let sortDir: 'asc' | 'desc' = 'desc'

    if (sortByParam && validSortFields.includes(sortByParam)) {
      sortBy = sortByParam as typeof sortBy
    } else if (sortByParam) {
      logger.warn('Invalid sortBy parameter', { sortBy: sortByParam })
    }

    if (sortDirParam && validSortDirs.includes(sortDirParam)) {
      sortDir = sortDirParam as typeof sortDir
    } else if (sortDirParam) {
      logger.warn('Invalid sortDir parameter', { sortDir: sortDirParam })
    }

    // Determine which teams to query
    let teamIds: string[] | undefined
    let teamId: string | undefined

    if (isAssociationUser(user)) {
      // Association users can query multiple teams
      const accessibleTeams = await getAccessibleTeams()

      // If specific team IDs are provided via query param, filter to those
      if (teamIdsParam) {
        const requestedTeamIds = teamIdsParam.split(',')
        const accessibleTeamIds = accessibleTeams.map(t => t.id)

        // Only include teams the user has access to
        teamIds = requestedTeamIds.filter(id => accessibleTeamIds.includes(id))

        if (teamIds.length === 0) {
          return NextResponse.json(
            { error: 'No accessible teams in requested list' },
            { status: 403 }
          )
        }
      } else {
        // Query all accessible teams
        teamIds = accessibleTeams.map(t => t.id)
      }

      if (teamIds.length === 0) {
        return NextResponse.json(
          {
            items: [],
            hasMore: false,
            nextCursor: null,
          },
          { status: 200 }
        )
      }
    } else {
      // Team users can only query their own team
      if (!user.teamId) {
        return NextResponse.json({ error: 'User not assigned to a team' }, { status: 400 })
      }
      teamId = user.teamId
    }

    // Get transactions with cursor pagination
    const result = await getTransactionsWithCursor({
      teamId,
      teamIds,
      limit,
      cursor,
      filters,
      sortBy,
      sortDir,
    })

    // Map snake_case database fields to camelCase for frontend
    const mappedResult = {
      ...result,
      items: result.items.map((item: any) => ({
        ...item,
        validation: item.validation_json,
        exceptionSeverity: item.exception_severity,
        exceptionReason: item.exception_reason,
        resolvedAt: item.resolved_at,
        resolvedBy: item.resolved_by,
        overrideJustification: item.override_justification,
        resolutionNotes: item.resolution_notes,
      })),
    }

    return NextResponse.json(mappedResult, { status: 200 })
  } catch (error) {
    logger.error('GET /api/transactions error', error as Error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/transactions
 * Create a new transaction
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Defense-in-depth: Explicitly reject association users (read-only access)
    if (isAssociationUser(user)) {
      return NextResponse.json(
        { error: 'Association users have read-only access to team data' },
        { status: 403 }
      )
    }

    // Check role - only TREASURER can create transactions
    if (user.role !== 'TREASURER') {
      return NextResponse.json(
        { error: 'Only treasurers can create transactions' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = CreateTransactionSchema.parse(body)

    // Verify category belongs to team
    const category = await prisma.category.findFirst({
      where: {
        id: validatedData.categoryId,
        teamId: user.teamId,
      },
    })

    if (!category) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
    }

    // Get team and current season
    const team = await prisma.team.findUnique({
      where: { id: user.teamId },
      select: {
        id: true,
        season: true,
        seasonStartDate: true,
        seasonEndDate: true,
        associationTeam: {
          select: {
            associationId: true,
          },
        },
      },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Check lifecycle state - only allow transactions in LOCKED, ACTIVE, or CLOSEOUT states
    if (team.season && team.associationTeam?.associationId) {
      // Get or create team season
      let teamSeason = await prisma.teamSeason.findUnique({
        where: {
          teamId_seasonLabel: {
            teamId: user.teamId,
            seasonLabel: team.season,
          },
        },
      })

      // Create team season if it doesn't exist
      if (!teamSeason && team.seasonStartDate && team.seasonEndDate) {
        const teamSeasonId = await createTeamSeasonWithSnapshot(
          user.teamId,
          team.associationTeam.associationId,
          team.season,
          team.seasonStartDate,
          team.seasonEndDate
        )

        teamSeason = await prisma.teamSeason.findUnique({
          where: { id: teamSeasonId },
        })
      }

      // Check if transactions are allowed in current state
      if (teamSeason && !areTransactionsAllowed(teamSeason.state)) {
        const stateMessages: Record<string, string> = {
          SETUP: 'Team season is in setup. Complete team setup before creating transactions.',
          BUDGET_DRAFT:
            'Budget is still in draft. Submit budget for review before creating transactions.',
          BUDGET_REVIEW:
            'Budget is under review. Wait for budget approval before creating transactions.',
          TEAM_APPROVED:
            'Budget is approved but not yet presented to parents. Present budget to parents before creating transactions.',
          PRESENTED:
            'Waiting for parent approvals. Transactions will be allowed once budget is locked.',
          ARCHIVED: 'Season is archived. Transactions cannot be created for archived seasons.',
        }

        const message =
          stateMessages[teamSeason.state] ||
          `Transactions are not allowed in current season state: ${teamSeason.state}`

        return NextResponse.json(
          {
            error: 'Transaction not allowed',
            message,
            currentState: teamSeason.state,
          },
          { status: 403 }
        )
      }
    }

    // Create transaction
    const result = await createTransaction(validatedData, user.teamId, user.id)

    // Auto-activate season on first transaction (LOCKED → ACTIVE)
    if (team.season && team.associationTeam?.associationId) {
      try {
        await autoActivateOnFirstTransaction(user.teamId, team.season)
      } catch (error) {
        // Log error but don't fail transaction creation
        logger.warn('Failed to auto-activate season on first transaction', {
          teamId: user.teamId,
          season: team.season,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    // Build helpful message based on validation results
    let message = 'Transaction created successfully.'
    const violations = result.transaction.validation?.violations || []
    const hasErrors = violations.some(
      (v: any) => v.severity === 'ERROR' || v.severity === 'CRITICAL'
    )

    // DEBUG: Log validation data
    console.log('[DEBUG] Transaction validation:', {
      hasValidation: !!result.transaction.validation,
      violations: violations,
      violationsCount: violations.length,
      hasErrors,
    })

    if (hasErrors) {
      // Extract specific error messages
      const errorMessages = violations
        .filter((v: any) => v.severity === 'ERROR' || v.severity === 'CRITICAL')
        .map((v: any) => v.message)

      message = 'Transaction created with issues that need attention: ' + errorMessages.join('; ')
    } else if (result.approvalRequired) {
      message = 'Transaction created. Approval required from president.'
    }

    return NextResponse.json(
      {
        ...result,
        message,
        violations: violations.length > 0 ? violations : undefined,
        hasValidationErrors: hasErrors,
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('POST /api/transactions error', error as Error)
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
