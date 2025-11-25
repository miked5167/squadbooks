/**
 * Association Overview API Route (Using Supabase)
 *
 * GET /api/associations/[id]/overview
 * Returns dashboard overview data including:
 * - Total teams count
 * - Health status distribution
 * - Budget totals (total, spent, remaining)
 * - Top teams needing attention
 * - Recent alerts
 * - Data as of timestamp
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'

// Use Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Response type
interface OverviewResponse {
  data: {
    totals: {
      totalTeams: number
      activeTeams: number
    }
    statusCounts: {
      healthy: number
      needsAttention: number
      atRisk: number
    }
    budgetTotals: {
      totalBudget: number
      totalSpent: number
      totalRemaining: number
      averagePercentUsed: number
    }
    topAttentionTeams: Array<{
      id: string
      teamName: string
      division: string | null
      healthStatus: string
      percentUsed: number | null
      redFlagCount: number
      lastSynced: string | null
    }>
    recentAlerts: Array<{
      id: string
      teamName: string
      severity: string
      title: string
      createdAt: string
    }>
    dataAsOf: string | null
  } | null
  error: {
    code: string
    message: string
  } | null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<OverviewResponse>> {
  console.log('=== OVERVIEW API ROUTE HIT ===')

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

    // Fetch all teams for this association
    const { data: teams } = await supabase
      .from('association_teams')
      .select('id, team_name, division, is_active, last_synced_at')
      .eq('association_id', associationId)

    const totalTeams = teams?.length || 0
    const activeTeams = teams?.filter(t => t.is_active).length || 0

    // Get latest snapshot for each team
    const { data: allSnapshots } = await supabase
      .from('team_financial_snapshots')
      .select('*')
      .in('association_team_id', teams?.map(t => t.id) || [])
      .order('snapshot_at', { ascending: false })

    // Group by team and get latest
    const latestByTeam = new Map()
    allSnapshots?.forEach(snapshot => {
      if (!latestByTeam.has(snapshot.association_team_id)) {
        latestByTeam.set(snapshot.association_team_id, snapshot)
      }
    })

    const snapshots = Array.from(latestByTeam.values())

    // Calculate status counts
    const statusCounts = {
      healthy: snapshots.filter(s => s.health_status === 'healthy').length,
      needsAttention: snapshots.filter(s => s.health_status === 'needs_attention').length,
      atRisk: snapshots.filter(s => s.health_status === 'at_risk').length,
    }

    // Calculate budget totals
    const budgetTotals = snapshots.reduce(
      (acc, snapshot) => {
        acc.totalBudget += Number(snapshot.budget_total || 0)
        acc.totalSpent += Number(snapshot.spent || 0)
        acc.totalRemaining += Number(snapshot.remaining || 0)
        return acc
      },
      { totalBudget: 0, totalSpent: 0, totalRemaining: 0 }
    )

    // Calculate average percent used
    const validPercentages = snapshots
      .map(s => Number(s.percent_used || 0))
      .filter(p => p > 0)
    const averagePercentUsed =
      validPercentages.length > 0
        ? validPercentages.reduce((a, b) => a + b, 0) / validPercentages.length
        : 0

    // Get top teams needing attention
    const teamsWithSnapshots = snapshots.map(snapshot => {
      const team = teams?.find(t => t.id === snapshot.association_team_id)
      return {
        ...team,
        ...snapshot,
      }
    })

    const topAttentionTeams = teamsWithSnapshots
      .filter(t => t.health_status !== 'healthy')
      .sort((a, b) => {
        if (a.health_status === 'at_risk' && b.health_status !== 'at_risk') return -1
        if (a.health_status !== 'at_risk' && b.health_status === 'at_risk') return 1
        return Number(b.percent_used || 0) - Number(a.percent_used || 0)
      })
      .slice(0, 10)
      .map(t => ({
        id: t.id,
        teamName: t.team_name,
        division: t.division,
        healthStatus: t.health_status,
        percentUsed: t.percent_used ? Number(t.percent_used) : null,
        redFlagCount: Array.isArray(t.red_flags) ? t.red_flags.length : 0,
        lastSynced: t.last_synced_at,
      }))

    // Get recent alerts
    const { data: alerts } = await supabase
      .from('alerts')
      .select(`
        id,
        title,
        severity,
        created_at,
        association_teams!inner (
          team_name
        )
      `)
      .eq('association_id', associationId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5)

    const recentAlerts = (alerts || []).map(alert => ({
      id: alert.id,
      teamName: (alert.association_teams as any).team_name,
      severity: alert.severity,
      title: alert.title,
      createdAt: alert.created_at,
    }))

    // Get most recent snapshot timestamp
    const dataAsOf =
      snapshots.length > 0
        ? snapshots.reduce((latest, s) =>
            new Date(s.snapshot_at) > new Date(latest) ? s.snapshot_at : latest,
            snapshots[0].snapshot_at
          )
        : null

    // Return response
    return NextResponse.json({
      data: {
        totals: {
          totalTeams,
          activeTeams,
        },
        statusCounts,
        budgetTotals: {
          ...budgetTotals,
          averagePercentUsed: Math.round(averagePercentUsed * 100) / 100,
        },
        topAttentionTeams,
        recentAlerts,
        dataAsOf,
      },
      error: null,
    })
  } catch (error) {
    console.error('Error fetching association overview:', error)
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to fetch association overview',
        },
      },
      { status: 500 }
    )
  }
}
