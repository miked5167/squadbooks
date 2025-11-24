/**
 * Daily Snapshots Edge Function
 *
 * Runs daily at 3 AM UTC to pull financial data from HuddleBooks for all active teams,
 * calculate health status, store snapshots, and evaluate alerts.
 *
 * Triggered by GitHub Actions cron job.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ============================================
// TYPES
// ============================================

type HealthStatus = 'healthy' | 'needs_attention' | 'at_risk'

type RedFlag = {
  code: string
  message: string
  severity: 'warning' | 'critical'
}

type TeamSummary = {
  teamId: string
  teamName: string
  division: string | null
  season: string
  budgetTotal: number
  budgetAllocated: number
  spent: number
  pending: number
  remaining: number
  percentUsed: number
  treasurer: {
    name: string
    email: string
    lastLogin: Date | null
  }
  pendingApprovals: number
  missingReceipts: number
  totalTransactions: number
  lastActivityAt: Date | null
  bankConnected: boolean
  bankReconciledThrough: Date | null
  snapshotAt: Date
}

type SnapshotResult = {
  teamId: string
  teamName: string
  success: boolean
  error?: string
}

type JobSummary = {
  success: boolean
  totalTeams: number
  successfulSnapshots: number
  failedSnapshots: number
  results: SnapshotResult[]
  duration: number
  errors: string[]
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24
  const diff = Math.abs(date1.getTime() - date2.getTime())
  return Math.floor(diff / msPerDay)
}

/**
 * Get days since a given date
 */
function daysSince(date: Date | null): number | null {
  if (!date) return null
  return daysBetween(new Date(), date)
}

/**
 * Calculate health status based on team summary and config
 */
function calculateHealthStatus(
  summary: TeamSummary,
  config: any
): { status: HealthStatus; flags: RedFlag[] } {
  const flags: RedFlag[] = []
  let criticalCount = 0
  let warningCount = 0

  // Budget utilization check
  const percentUsed = summary.percentUsed
  if (percentUsed >= Number(config.budgetCriticalPct)) {
    criticalCount++
    flags.push({
      code: 'BUDGET_CRITICAL',
      message: `Budget ${percentUsed.toFixed(1)}% used`,
      severity: 'critical',
    })
  } else if (percentUsed >= Number(config.budgetWarningPct)) {
    warningCount++
    flags.push({
      code: 'BUDGET_WARNING',
      message: `Budget ${percentUsed.toFixed(1)}% used`,
      severity: 'warning',
    })
  }

  // Bank reconciliation check
  const daysSinceReconciled = summary.bankReconciledThrough
    ? daysSince(summary.bankReconciledThrough)
    : null

  if (!summary.bankConnected) {
    warningCount++
    flags.push({
      code: 'BANK_NOT_CONNECTED',
      message: 'Bank account not connected',
      severity: 'warning',
    })
  } else if (daysSinceReconciled !== null) {
    if (daysSinceReconciled > config.bankCriticalDays) {
      criticalCount++
      flags.push({
        code: 'BANK_RECONCILIATION_CRITICAL',
        message: `Bank not reconciled in ${daysSinceReconciled} days`,
        severity: 'critical',
      })
    } else if (daysSinceReconciled > config.bankWarningDays) {
      warningCount++
      flags.push({
        code: 'BANK_RECONCILIATION_WARNING',
        message: `Bank not reconciled in ${daysSinceReconciled} days`,
        severity: 'warning',
      })
    }
  }

  // Pending approvals check
  const pendingApprovals = summary.pendingApprovals
  if (pendingApprovals >= config.approvalsCriticalCount) {
    criticalCount++
    flags.push({
      code: 'PENDING_APPROVALS_CRITICAL',
      message: `${pendingApprovals} pending approvals`,
      severity: 'critical',
    })
  } else if (pendingApprovals >= config.approvalsWarningCount) {
    warningCount++
    flags.push({
      code: 'PENDING_APPROVALS_WARNING',
      message: `${pendingApprovals} pending approvals`,
      severity: 'warning',
    })
  }

  // Inactivity check
  const daysSinceActivity = summary.lastActivityAt
    ? daysSince(summary.lastActivityAt)
    : null

  if (daysSinceActivity !== null && daysSinceActivity > config.inactivityWarningDays) {
    warningCount++
    flags.push({
      code: 'INACTIVITY_WARNING',
      message: `No activity in ${daysSinceActivity} days`,
      severity: 'warning',
    })
  }

  // Missing receipts check
  if (summary.missingReceipts > 0) {
    warningCount++
    flags.push({
      code: 'MISSING_RECEIPTS',
      message: `${summary.missingReceipts} transactions missing receipts`,
      severity: 'warning',
    })
  }

  // Determine overall health status
  let status: HealthStatus
  if (criticalCount > 0) {
    status = 'at_risk'
  } else if (warningCount > 0) {
    status = 'needs_attention'
  } else {
    status = 'healthy'
  }

  return { status, flags }
}

/**
 * Evaluate and manage alerts for a team
 */
async function evaluateAlerts(
  supabase: any,
  team: any,
  healthStatus: HealthStatus,
  flags: RedFlag[]
): Promise<void> {
  try {
    // For each flag, check if there's an existing active alert
    for (const flag of flags) {
      const alertType = flag.code.toLowerCase()

      // Check for existing active alert
      const { data: existingAlert } = await supabase
        .from('alerts')
        .select('id, last_triggered_at')
        .eq('association_team_id', team.id)
        .eq('alert_type', alertType)
        .eq('status', 'active')
        .single()

      if (existingAlert) {
        // Update last_triggered_at
        await supabase
          .from('alerts')
          .update({ last_triggered_at: new Date().toISOString() })
          .eq('id', existingAlert.id)
      } else {
        // Create new alert
        await supabase.from('alerts').insert({
          association_id: team.association_id,
          association_team_id: team.id,
          alert_type: alertType,
          severity: flag.severity,
          title: flag.message,
          description: `Team ${team.team_name} has triggered a ${flag.severity} alert`,
          status: 'active',
        })
      }
    }

    // Resolve alerts that are no longer triggered
    const flagCodes = flags.map((f) => f.code.toLowerCase())
    const { data: activeAlerts } = await supabase
      .from('alerts')
      .select('id, alert_type')
      .eq('association_team_id', team.id)
      .eq('status', 'active')

    if (activeAlerts) {
      for (const alert of activeAlerts) {
        if (!flagCodes.includes(alert.alert_type)) {
          // Alert condition cleared, mark as resolved
          await supabase
            .from('alerts')
            .update({
              status: 'resolved',
              resolved_at: new Date().toISOString(),
              notes: 'Condition cleared automatically by daily snapshot',
            })
            .eq('id', alert.id)
        }
      }
    }
  } catch (error) {
    console.error(`Failed to evaluate alerts for team ${team.team_name}:`, error)
    // Don't throw, just log
  }
}

/**
 * Fetch team data from HuddleBooks API
 */
async function fetchTeamData(accessToken: string, teamId: string): Promise<TeamSummary> {
  const baseUrl = Deno.env.get('HUDDLEBOOKS_API_BASE_URL') || 'https://api.huddlebooks.app/api/v1'

  // Fetch team data, budget, and metrics in parallel
  const [teamRes, budgetRes, metricsRes] = await Promise.all([
    fetch(`${baseUrl}/teams/${teamId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    fetch(`${baseUrl}/teams/${teamId}/budget`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    fetch(`${baseUrl}/teams/${teamId}/metrics`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  ])

  if (!teamRes.ok) throw new Error(`Team API error: ${teamRes.status}`)
  if (!budgetRes.ok) throw new Error(`Budget API error: ${budgetRes.status}`)
  if (!metricsRes.ok) throw new Error(`Metrics API error: ${metricsRes.status}`)

  const teamData = await teamRes.json()
  const budgetData = await budgetRes.json()
  const metrics = await metricsRes.json()

  return {
    teamId: teamData.id,
    teamName: teamData.name,
    division: teamData.division || null,
    season: teamData.season || new Date().getFullYear().toString(),
    budgetTotal: Number(budgetData.totalBudget || 0),
    budgetAllocated: Number(budgetData.totalAllocated || 0),
    spent: Number(budgetData.totalSpent || 0),
    pending: Number(budgetData.totalPending || 0),
    remaining: Number(budgetData.totalRemaining || 0),
    percentUsed: Number(budgetData.overallPercentage || 0),
    treasurer: {
      name: teamData.treasurer?.name || 'Unknown',
      email: teamData.treasurer?.email || '',
      lastLogin: teamData.treasurer?.lastLogin ? new Date(teamData.treasurer.lastLogin) : null,
    },
    pendingApprovals: metrics.pendingApprovals || 0,
    missingReceipts: metrics.missingReceipts || 0,
    totalTransactions: metrics.totalTransactions || 0,
    lastActivityAt: metrics.lastActivityAt ? new Date(metrics.lastActivityAt) : null,
    bankConnected: teamData.bankConnected || false,
    bankReconciledThrough: teamData.bankReconciledThrough
      ? new Date(teamData.bankReconciledThrough)
      : null,
    snapshotAt: new Date(),
  }
}

/**
 * Process a single team snapshot
 */
async function processTeam(
  supabase: any,
  team: any,
  config: any
): Promise<SnapshotResult> {
  try {
    console.log(`Processing team: ${team.team_name} (${team.team_id})`)

    // 1. Fetch data from HuddleBooks API
    const summary = await fetchTeamData(team.api_access_token, team.team_id)

    // 2. Calculate health status
    const { status, flags } = calculateHealthStatus(summary, config)

    // 3. Insert snapshot
    const { error: snapshotError } = await supabase
      .from('team_financial_snapshots')
      .insert({
        association_team_id: team.id,
        snapshot_at: summary.snapshotAt.toISOString(),
        health_status: status,
        budget_total: summary.budgetTotal,
        spent: summary.spent,
        remaining: summary.remaining,
        percent_used: summary.percentUsed,
        pending_approvals: summary.pendingApprovals,
        missing_receipts: summary.missingReceipts,
        bank_reconciled_through: summary.bankReconciledThrough?.toISOString().split('T')[0],
        bank_connected: summary.bankConnected,
        last_activity_at: summary.lastActivityAt?.toISOString(),
        red_flags: flags,
      })

    if (snapshotError) throw snapshotError

    // 4. Update last_synced_at
    const { error: updateError } = await supabase
      .from('association_teams')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', team.id)

    if (updateError) throw updateError

    // 5. Evaluate alerts
    await evaluateAlerts(supabase, team, status, flags)

    return {
      teamId: team.team_id,
      teamName: team.team_name,
      success: true,
    }
  } catch (error) {
    console.error(`Failed to process team ${team.team_name}:`, error)
    return {
      teamId: team.team_id,
      teamName: team.team_name,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req: Request) => {
  const startTime = Date.now()

  try {
    // Verify authorization
    const authHeader = req.headers.get('authorization')
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!authHeader || !serviceKey || authHeader !== `Bearer ${serviceKey}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabase = createClient(supabaseUrl, serviceKey)

    // Fetch all active association teams
    const { data: teams, error: teamsError } = await supabase
      .from('association_teams')
      .select('*')
      .eq('is_active', true)

    if (teamsError) throw teamsError

    if (!teams || teams.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No active teams to process',
          totalTeams: 0,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Get default config (or fetch per association if needed)
    const defaultConfig = {
      budgetWarningPct: 80.0,
      budgetCriticalPct: 95.0,
      bankWarningDays: 30,
      bankCriticalDays: 60,
      approvalsWarningCount: 5,
      approvalsCriticalCount: 10,
      inactivityWarningDays: 21,
    }

    // Process each team with rate limiting
    const results: SnapshotResult[] = []
    const errors: string[] = []

    for (let i = 0; i < teams.length; i++) {
      const team = teams[i]
      const result = await processTeam(supabase, team, defaultConfig)

      results.push(result)

      if (!result.success && result.error) {
        errors.push(`${team.team_name}: ${result.error}`)
      }

      // Rate limiting: 500ms delay between teams
      if (i < teams.length - 1) {
        await sleep(500)
      }
    }

    // Calculate summary
    const successfulSnapshots = results.filter((r) => r.success).length
    const failedSnapshots = results.filter((r) => !r.success).length
    const duration = Date.now() - startTime

    const summary: JobSummary = {
      success: failedSnapshots === 0,
      totalTeams: teams.length,
      successfulSnapshots,
      failedSnapshots,
      results,
      duration,
      errors,
    }

    console.log('Daily snapshot job completed:', summary)

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Daily snapshot job failed:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})
