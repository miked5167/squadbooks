/**
 * Association Overview Page
 *
 * Displays dashboard overview with:
 * - KPI cards (totals, health distribution, budget summary)
 * - Health distribution chart
 * - Teams needing attention
 * - Recent alerts
 * - Data as of timestamp
 */

import { auth } from '@/lib/auth/server-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  TrendingUp,
  Users,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

// Fetch overview data directly from database
async function getOverviewData(associationId: string) {
  // Get all teams for the association
  const teams = await prisma.associationTeam.findMany({
    where: {
      associationId,
    },
    select: {
      id: true,
      teamName: true,
      division: true,
      isActive: true,
      lastSyncedAt: true,
    },
  })

  // Get latest snapshots for each team
  const teamIds = teams.map(t => t.id)
  const snapshots = await prisma.teamFinancialSnapshot.findMany({
    where: {
      associationTeamId: {
        in: teamIds,
      },
    },
    orderBy: {
      snapshotAt: 'desc',
    },
  })

  // Group snapshots by team and get latest
  const latestByTeam = new Map()
  snapshots.forEach(snapshot => {
    if (!latestByTeam.has(snapshot.associationTeamId)) {
      latestByTeam.set(snapshot.associationTeamId, snapshot)
    }
  })

  // Calculate totals and status counts
  const totalTeams = teams.length
  const activeTeams = teams.filter(t => t.isActive).length

  let healthy = 0
  let needsAttention = 0
  let atRisk = 0
  let totalBudget = 0
  let totalSpent = 0
  let percentUsedSum = 0
  let percentUsedCount = 0
  const teamsWithData = []

  teams.forEach(team => {
    const snapshot = latestByTeam.get(team.id)
    if (snapshot) {
      // Count by health status
      if (snapshot.healthStatus === 'healthy') healthy++
      else if (snapshot.healthStatus === 'needs_attention') needsAttention++
      else if (snapshot.healthStatus === 'at_risk') atRisk++

      // Sum budget totals
      if (snapshot.budgetTotal) {
        totalBudget += Number(snapshot.budgetTotal)
      }
      if (snapshot.spent) {
        totalSpent += Number(snapshot.spent)
      }
      if (snapshot.percentUsed) {
        percentUsedSum += Number(snapshot.percentUsed)
        percentUsedCount++
      }

      // Collect teams needing attention
      if (snapshot.healthStatus === 'needs_attention' || snapshot.healthStatus === 'at_risk') {
        teamsWithData.push({
          id: team.id,
          teamName: team.teamName,
          division: team.division,
          healthStatus: snapshot.healthStatus,
          percentUsed: snapshot.percentUsed ? Number(snapshot.percentUsed) : null,
          redFlagCount: Array.isArray(snapshot.redFlags) ? snapshot.redFlags.length : 0,
          lastSynced: team.lastSyncedAt,
        })
      }
    }
  })

  // Sort teams needing attention by severity and percent used
  const topAttentionTeams = teamsWithData
    .sort((a, b) => {
      // First by health status severity
      const severityOrder = { at_risk: 0, needs_attention: 1 }
      const aSeverity = severityOrder[a.healthStatus as keyof typeof severityOrder] ?? 2
      const bSeverity = severityOrder[b.healthStatus as keyof typeof severityOrder] ?? 2
      if (aSeverity !== bSeverity) return aSeverity - bSeverity
      // Then by percent used descending
      return (b.percentUsed || 0) - (a.percentUsed || 0)
    })
    .slice(0, 5)

  // Get recent alerts (last 7 days)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recentAlerts = await prisma.alert.findMany({
    where: {
      associationId,
      status: 'active',
      createdAt: {
        gte: sevenDaysAgo,
      },
    },
    include: {
      team: {
        select: {
          teamName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 5,
  })

  const alertsFormatted = recentAlerts.map(alert => ({
    id: alert.id,
    teamName: alert.team.teamName,
    title: alert.title,
    severity: alert.severity,
    createdAt: alert.createdAt,
  }))

  return {
    totals: {
      totalTeams,
      activeTeams,
    },
    statusCounts: {
      healthy,
      needsAttention,
      atRisk,
    },
    budgetTotals: {
      totalBudget,
      totalSpent,
      averagePercentUsed: percentUsedCount > 0 ? percentUsedSum / percentUsedCount : 0,
    },
    topAttentionTeams,
    recentAlerts: alertsFormatted,
    dataAsOf: new Date().toISOString(),
  }
}

export default async function OverviewPage() {
  // Get authenticated user
  const { userId } = await auth()
  if (!userId) {
    redirect('/sign-in')
  }

  // Get user's association
  const associationUser = await prisma.associationUser.findUnique({
    where: {
      clerkUserId: userId,
    },
    include: {
      association: true,
    },
  })

  if (!associationUser || !associationUser.association) {
    redirect('/sign-in')
  }

  const association = associationUser.association

  // Fetch overview data
  const data = await getOverviewData(association.id)

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  const {
    totals,
    statusCounts,
    budgetTotals,
    topAttentionTeams,
    recentAlerts,
    dataAsOf,
  } = data

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">
            Association dashboard for {association.name}
          </p>
        </div>
        {dataAsOf && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Data as of {formatDistanceToNow(new Date(dataAsOf), { addSuffix: true })}
            </span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Teams */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.totalTeams}</div>
            <p className="text-xs text-muted-foreground">
              {totals.activeTeams} active
            </p>
          </CardContent>
        </Card>

        {/* Healthy Teams */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Healthy</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statusCounts.healthy}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((statusCounts.healthy / totals.totalTeams) * 100)}% of teams
            </p>
          </CardContent>
        </Card>

        {/* At Risk Teams */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statusCounts.atRisk}
            </div>
            <p className="text-xs text-muted-foreground">
              {statusCounts.needsAttention} need attention
            </p>
          </CardContent>
        </Card>

        {/* Budget Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${budgetTotals.totalBudget.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              ${budgetTotals.totalSpent.toLocaleString()} spent (
              {budgetTotals.averagePercentUsed.toFixed(0)}% avg)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Teams Needing Attention */}
      <Card>
        <CardHeader>
          <CardTitle>Teams Needing Attention</CardTitle>
          <CardDescription>
            Teams with critical issues or warnings requiring immediate action
          </CardDescription>
        </CardHeader>
        <CardContent>
          {topAttentionTeams.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mb-3" />
              <h3 className="text-lg font-semibold mb-1">All Teams Looking Good!</h3>
              <p className="text-sm text-muted-foreground">
                No teams require immediate attention at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {topAttentionTeams.map((team) => (
                <Link
                  key={team.id}
                  href={`/association/teams/${team.id}`}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium truncate">{team.teamName}</span>
                      {team.division && (
                        <span className="text-sm text-muted-foreground">
                          • {team.division}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <HealthBadge status={team.healthStatus} />
                      {team.redFlagCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {team.redFlagCount} flag{team.redFlagCount !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    {team.percentUsed !== null && (
                      <div className="text-sm font-medium">
                        {team.percentUsed.toFixed(0)}% used
                      </div>
                    )}
                    {team.lastSynced && (
                      <div className="text-xs text-muted-foreground">
                        Updated {formatDistanceToNow(new Date(team.lastSynced), { addSuffix: true })}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Latest alerts from the past week</CardDescription>
            </div>
            <Link href="/association/alerts">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                View All
              </Badge>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {recentAlerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-10 w-10 text-green-600 mb-2" />
              <p className="text-sm text-muted-foreground">
                No recent alerts
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between p-3 rounded-lg border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <SeverityBadge severity={alert.severity} />
                      <span className="text-sm font-medium truncate">
                        {alert.teamName}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {alert.title}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground ml-4 whitespace-nowrap">
                    {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Health Status Badge Component
function HealthBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    healthy: {
      label: 'Healthy',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    needs_attention: {
      label: 'Needs Attention',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    at_risk: {
      label: 'At Risk',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
  }

  const variant = variants[status] || variants.healthy

  return (
    <Badge variant="outline" className={`text-xs ${variant.className}`}>
      {variant.label}
    </Badge>
  )
}

// Severity Badge Component
function SeverityBadge({ severity }: { severity: string }) {
  const isWarning = severity === 'warning'
  const isCritical = severity === 'critical'

  return (
    <Badge
      variant={isCritical ? 'destructive' : 'outline'}
      className={
        isWarning
          ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
          : ''
      }
    >
      {severity}
    </Badge>
  )
}
