'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, AlertOctagon, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Team {
  id: string
  teamName: string
  division: string | null
  healthStatus: string
  percentUsed: number | null
  redFlagCount: number
  lastSynced: Date | null
}

interface TeamsNeedingAttentionWidgetProps {
  teams: Team[]
  associationId?: string
}

export function TeamsNeedingAttentionWidget({
  teams,
  associationId,
}: TeamsNeedingAttentionWidgetProps) {
  // Count teams by status
  const criticalTeams = teams.filter(t => t.healthStatus === 'at_risk')
  const warningTeams = teams.filter(t => t.healthStatus === 'needs_attention')
  const totalTeams = teams.length

  // Calculate percentages for breakdown bar
  const criticalPercent = totalTeams > 0 ? (criticalTeams.length / totalTeams) * 100 : 0
  const warningPercent = totalTeams > 0 ? (warningTeams.length / totalTeams) * 100 : 0

  // Empty state: no teams need attention
  if (totalTeams === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Teams Needing Attention</CardTitle>
          <CardDescription>
            Teams with critical issues or warnings requiring immediate action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="mb-3 h-12 w-12 text-green-600" aria-hidden="true" />
            <h3 className="mb-1 text-lg font-semibold">All Teams Looking Good!</h3>
            <p className="text-muted-foreground text-sm">
              No teams require immediate attention at this time.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Teams Needing Attention</CardTitle>
        <CardDescription>
          Teams with critical issues or warnings requiring immediate action
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Visual Breakdown Bar */}
        <div className="space-y-3">
          {/* Stacked bar */}
          <div className="bg-muted flex h-2 w-full overflow-hidden rounded-full">
            {criticalTeams.length > 0 && (
              <div
                className="h-full bg-red-600 transition-all duration-300"
                style={{ width: `${criticalPercent}%` }}
                aria-label={`Critical teams: ${criticalTeams.length} (${criticalPercent.toFixed(1)}%)`}
              />
            )}
            {warningTeams.length > 0 && (
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${warningPercent}%` }}
                aria-label={`Warning teams: ${warningTeams.length} (${warningPercent.toFixed(1)}%)`}
              />
            )}
          </div>

          {/* Legend with counts */}
          <div className="flex items-center justify-between gap-4 text-sm">
            {criticalTeams.length > 0 && (
              <div className="flex items-center gap-1.5">
                <AlertOctagon className="h-3.5 w-3.5 text-red-600" aria-hidden="true" />
                <span className="text-muted-foreground">Critical:</span>
                <span className="font-semibold text-red-600">{criticalTeams.length}</span>
              </div>
            )}
            {warningTeams.length > 0 && (
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                <span className="text-muted-foreground">Warning:</span>
                <span className="font-semibold text-amber-600">{warningTeams.length}</span>
              </div>
            )}
          </div>
        </div>

        {/* Team List */}
        <div className="space-y-3">
          {teams.map(team => {
            const teamHref = associationId
              ? `/association/${associationId}/teams/${team.id}`
              : `/association/teams/${team.id}`

            return (
              <Link
                key={team.id}
                href={teamHref}
                className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="truncate font-medium">{team.teamName}</span>
                    {team.division && (
                      <span className="text-muted-foreground text-sm">• {team.division}</span>
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
                <div className="ml-4 text-right">
                  {team.percentUsed !== null && (
                    <div className="text-sm font-medium">{team.percentUsed.toFixed(0)}% used</div>
                  )}
                  {team.lastSynced && (
                    <div className="text-muted-foreground text-xs">
                      Updated {formatDistanceToNow(new Date(team.lastSynced), { addSuffix: true })}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// Health Status Badge Component (consistent with Plan 06-01)
function HealthBadge({ status }: { status: string }) {
  const config: Record<
    string,
    { label: string; variant: 'success' | 'warning' | 'destructive'; icon: any }
  > = {
    healthy: {
      label: 'Healthy',
      variant: 'success',
      icon: CheckCircle2,
    },
    needs_attention: {
      label: 'Needs Attention',
      variant: 'warning',
      icon: AlertTriangle,
    },
    at_risk: {
      label: 'At Risk',
      variant: 'destructive',
      icon: AlertOctagon,
    },
  }

  const item = config[status] || config.healthy
  const Icon = item.icon

  return (
    <Badge variant={item.variant} className="flex items-center gap-1.5 text-xs">
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="sr-only">Team health: </span>
      {item.label}
    </Badge>
  )
}
