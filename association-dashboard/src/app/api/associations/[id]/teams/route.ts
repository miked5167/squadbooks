/**
 * Association Teams List API Route
 *
 * GET /api/associations/[id]/teams
 * Returns paginated team list with latest snapshots
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - pageSize: number (default: 50, max: 100)
 * - status: 'healthy' | 'needs_attention' | 'at_risk' | 'all' (default: 'all')
 * - search: string (searches team name)
 * - sortBy: 'teamName' | 'division' | 'healthStatus' | 'percentUsed' | 'spent' | 'lastActivity' (default: 'teamName')
 * - sortDir: 'asc' | 'desc' (default: 'asc')
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Use Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Query parameter validation schema
const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
  status: z.enum(['healthy', 'needs_attention', 'at_risk', 'all']).default('all'),
  search: z.string().nullish(),
  sortBy: z
    .enum(['teamName', 'division', 'healthStatus', 'percentUsed', 'spent', 'lastActivity'])
    .default('teamName'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
})

// Team item type
interface TeamItem {
  id: string
  teamName: string
  division: string | null
  season: string | null
  healthStatus: string | null
  budgetTotal: number | null
  spent: number | null
  remaining: number | null
  percentUsed: number | null
  lastActivity: string | null
  redFlagCount: number
  lastSynced: string | null
}

// Response type
interface TeamsListResponse {
  data: {
    teams: TeamItem[]
    pagination: {
      page: number
      pageSize: number
      totalCount: number
      totalPages: number
    }
  } | null
  error: {
    code: string
    message: string
  } | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<TeamsListResponse>> {
  console.log('=== TEAMS API ROUTE HIT ===')

  try {
    // Authenticate request
    const { userId } = await auth()
    console.log('Clerk userId:', userId)
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

    // Await params (Next.js 15+)
    const resolvedParams = await params
    const associationId = resolvedParams.id
    console.log('Association ID:', associationId)
    if (!associationId) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INVALID_ASSOCIATION_ID',
            message: 'Association ID is required',
          },
        },
        { status: 400 }
      )
    }

    // Check user authorization
    const { data: associationUser } = await supabase
      .from('association_users')
      .select('*')
      .eq('clerk_user_id', userId)
      .eq('association_id', associationId)
      .single()

    if (!associationUser) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have access to this association',
          },
        },
        { status: 403 }
      )
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = querySchema.safeParse({
      page: searchParams.get('page'),
      pageSize: searchParams.get('pageSize'),
      status: searchParams.get('status'),
      search: searchParams.get('search'),
      sortBy: searchParams.get('sortBy'),
      sortDir: searchParams.get('sortDir'),
    })

    if (!queryParams.success) {
      console.error('Query params validation error:', queryParams.error)
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'INVALID_QUERY_PARAMS',
            message: queryParams.error.errors?.[0]?.message || 'Invalid query parameters',
          },
        },
        { status: 400 }
      )
    }

    const { page, pageSize, status, search, sortBy, sortDir } = queryParams.data

    console.log('Query params:', { page, pageSize, status, search, sortBy, sortDir })

    // Build teams query
    let teamsQuery = supabase
      .from('association_teams')
      .select('id, team_name, division, season, last_synced_at, is_active')
      .eq('association_id', associationId)

    // Apply search filter
    if (search) {
      teamsQuery = teamsQuery.ilike('team_name', `%${search}%`)
    }

    // Fetch teams
    const { data: teams, error: teamsError } = await teamsQuery

    if (teamsError) {
      console.error('Error fetching teams:', teamsError)
      throw new Error('Failed to fetch teams')
    }

    console.log(`Found ${teams?.length || 0} teams`)

    // Get latest snapshot for each team
    const teamIds = teams?.map(t => t.id) || []
    const { data: allSnapshots } = await supabase
      .from('team_financial_snapshots')
      .select('*')
      .in('association_team_id', teamIds)
      .order('snapshot_at', { ascending: false })

    // Group by team and get latest
    const latestByTeam = new Map()
    allSnapshots?.forEach(snapshot => {
      if (!latestByTeam.has(snapshot.association_team_id)) {
        latestByTeam.set(snapshot.association_team_id, snapshot)
      }
    })

    // Combine team data with snapshots
    let teamsWithSnapshots: TeamItem[] = (teams || []).map((team) => {
      const snapshot = latestByTeam.get(team.id)
      return {
        id: team.id,
        teamName: team.team_name,
        division: team.division,
        season: team.season,
        healthStatus: snapshot?.health_status || null,
        budgetTotal: snapshot?.budget_total ? Number(snapshot.budget_total) : null,
        spent: snapshot?.spent ? Number(snapshot.spent) : null,
        remaining: snapshot?.remaining ? Number(snapshot.remaining) : null,
        percentUsed: snapshot?.percent_used ? Number(snapshot.percent_used) : null,
        lastActivity: snapshot?.last_activity_at ? new Date(snapshot.last_activity_at).toISOString() : null,
        redFlagCount: snapshot?.red_flags && Array.isArray(snapshot.red_flags)
          ? snapshot.red_flags.length
          : 0,
        lastSynced: team.last_synced_at ? new Date(team.last_synced_at).toISOString() : null,
      }
    })

    // Filter by health status
    if (status !== 'all') {
      teamsWithSnapshots = teamsWithSnapshots.filter(
        (t) => t.healthStatus === status
      )
    }

    // Sort teams
    teamsWithSnapshots.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'teamName':
          comparison = a.teamName.localeCompare(b.teamName)
          break
        case 'division':
          comparison = (a.division || '').localeCompare(b.division || '')
          break
        case 'healthStatus':
          // Custom order: at_risk > needs_attention > healthy > null
          const statusOrder: Record<string, number> = {
            at_risk: 0,
            needs_attention: 1,
            healthy: 2,
          }
          const aOrder = statusOrder[a.healthStatus || ''] ?? 3
          const bOrder = statusOrder[b.healthStatus || ''] ?? 3
          comparison = aOrder - bOrder
          break
        case 'percentUsed':
          comparison = (a.percentUsed || 0) - (b.percentUsed || 0)
          break
        case 'spent':
          comparison = (a.spent || 0) - (b.spent || 0)
          break
        case 'lastActivity':
          const aTime = a.lastActivity ? new Date(a.lastActivity).getTime() : 0
          const bTime = b.lastActivity ? new Date(b.lastActivity).getTime() : 0
          comparison = aTime - bTime
          break
      }

      return sortDir === 'asc' ? comparison : -comparison
    })

    // Calculate pagination
    const totalCount = teamsWithSnapshots.length
    const totalPages = Math.ceil(totalCount / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedTeams = teamsWithSnapshots.slice(startIndex, endIndex)

    // Return response
    return NextResponse.json({
      data: {
        teams: paginatedTeams,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages,
        },
      },
      error: null,
    })
  } catch (error) {
    console.error('Error fetching teams list:', error)
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch teams list',
        },
      },
      { status: 500 }
    )
  }
}
