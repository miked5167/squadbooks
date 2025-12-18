import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getOverviewData } from './actions'
import { EmptyState } from '@/app/components/EmptyState'
import { isDemoMode } from '@/app/lib/demoMode'

interface PageProps {
  params: Promise<{
    associationId: string
  }>
}

function HealthBadge({ status, score }: { status: string; score: number | null }) {
  const statusColors = {
    healthy: 'bg-green-100 text-green-800 border-green-200',
    needs_attention: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    at_risk: 'bg-red-100 text-red-800 border-red-200',
  }

  const statusLabels = {
    healthy: 'Healthy',
    needs_attention: 'Needs Attention',
    at_risk: 'At Risk',
  }

  const color = statusColors[status as keyof typeof statusColors] || statusColors.healthy
  const label = statusLabels[status as keyof typeof statusLabels] || status

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${color}`}>
      <span className="font-semibold uppercase text-xs">{label}</span>
      {score !== null && (
        <span className="text-sm font-medium">{score}/100</span>
      )}
    </div>
  )
}

function BudgetProgressBar({ percentUsed }: { percentUsed: number | null }) {
  if (percentUsed === null) return null

  const percentage = Math.min(Math.max(percentUsed, 0), 100)

  let barColor = 'bg-green-500'
  if (percentage >= 90) {
    barColor = 'bg-red-500'
  } else if (percentage >= 75) {
    barColor = 'bg-yellow-500'
  }

  return (
    <div className="w-full">
      <div className="flex justify-between mb-1 text-sm">
        <span className="font-medium">Budget Used</span>
        <span className="font-semibold">{percentage.toFixed(1)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function TeamCard({ team, associationId }: { team: any; associationId: string }) {
  const snapshot = team.latestSnapshot

  return (
    <Link href={`/association/${associationId}/teams/${team.id}`}>
      <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer">
        {/* Team Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{team.teamName}</h3>
            {team.team?.competitiveLevel && (
              <p className="text-sm text-gray-500">Level: {team.team.competitiveLevel}</p>
            )}
            {team.division && (
              <p className="text-sm text-gray-600">Division: {team.division}</p>
            )}
          </div>
          {snapshot && (
            <HealthBadge status={snapshot.healthStatus} score={snapshot.healthScore} />
          )}
        </div>

        {/* Treasurer Info */}
        {team.treasurerName && (
          <div className="mb-4 pb-4 border-b border-gray-100">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Treasurer:</span> {team.treasurerName}
            </p>
            {team.treasurerEmail && (
              <p className="text-sm text-gray-500">{team.treasurerEmail}</p>
            )}
          </div>
        )}

        {/* Financial Snapshot */}
        {snapshot ? (
          <div className="space-y-4">
            {/* Budget Info */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Budget</p>
                <p className="text-lg font-bold text-gray-900">
                  ${snapshot.budgetTotal?.toLocaleString() ?? '0'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Spent</p>
                <p className="text-lg font-bold text-gray-900">
                  ${snapshot.spent?.toLocaleString() ?? '0'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Remaining</p>
                <p className="text-lg font-bold text-gray-900">
                  ${snapshot.remaining?.toLocaleString() ?? '0'}
                </p>
              </div>
            </div>

            {/* Budget Progress */}
            <BudgetProgressBar percentUsed={snapshot.percentUsed} />

            {/* Alerts */}
            <div className="flex gap-4 pt-3 border-t border-gray-100">
              {snapshot.pendingReviews !== null && snapshot.pendingReviews > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                    {snapshot.pendingReviews}
                  </span>
                  <span className="text-gray-600">Pending Review{snapshot.pendingReviews !== 1 ? 's' : ''}</span>
                </div>
              )}
              {snapshot.missingReceipts !== null && snapshot.missingReceipts > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-800 rounded-full text-xs font-bold">
                    {snapshot.missingReceipts}
                  </span>
                  <span className="text-gray-600">Missing Receipt{snapshot.missingReceipts !== 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            {/* Last Updated */}
            <p className="text-xs text-gray-400 pt-2">
              Last updated: {new Date(snapshot.snapshotAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No financial data available</p>
            <p className="text-xs mt-1">Waiting for first snapshot</p>
          </div>
        )}

        {/* Connection Status */}
        {team.connectedAt && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Connected: {new Date(team.connectedAt).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>
    </Link>
  )
}

export default async function AssociationOverviewPage({ params }: PageProps) {
  const { associationId } = await params
  const data = await getOverviewData(associationId)

  if (!data.association) {
    notFound()
  }

  const { association, teams, recentAlerts } = data

  // Get teams needing attention (not healthy)
  const teamsNeedingAttention = teams
    .filter(t => t.latestSnapshot && t.latestSnapshot.healthStatus !== 'healthy')
    .sort((a, b) => {
      // Sort by health score (lower is worse) then by percent used (higher is worse)
      const scoreA = a.latestSnapshot?.healthScore ?? 100
      const scoreB = b.latestSnapshot?.healthScore ?? 100
      if (scoreA !== scoreB) return scoreA - scoreB

      const pctA = a.latestSnapshot?.percentUsed ?? 0
      const pctB = b.latestSnapshot?.percentUsed ?? 0
      return pctB - pctA
    })
    .slice(0, 5) // Show top 5

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {association.name}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                {association.abbreviation && (
                  <span className="font-medium">{association.abbreviation}</span>
                )}
                {association.provinceState && (
                  <span>{association.provinceState}</span>
                )}
                {association.season && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                    {association.season}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Demo Mode Banner */}
        {isDemoMode() && (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
            Demo mode — data is for demonstration only.
          </div>
        )}
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Total Teams</p>
            <p className="text-3xl font-bold text-gray-900">{teams.length}</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Healthy</p>
            <p className="text-3xl font-bold text-green-600">
              {teams.filter(t => t.latestSnapshot?.healthStatus === 'healthy').length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">Needs Attention</p>
            <p className="text-3xl font-bold text-yellow-600">
              {teams.filter(t => t.latestSnapshot?.healthStatus === 'needs_attention').length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">At Risk</p>
            <p className="text-3xl font-bold text-red-600">
              {teams.filter(t => t.latestSnapshot?.healthStatus === 'at_risk').length}
            </p>
          </div>
        </div>

        {/* Teams Needing Attention */}
        <div className="mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Teams Needing Attention</h2>
            <p className="text-sm text-gray-600 mb-6">Teams with critical issues or warnings requiring immediate action</p>

            {teamsNeedingAttention.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <svg className="h-12 w-12 text-green-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">All Teams Looking Good!</h3>
                <p className="text-sm text-gray-600">No teams require immediate attention at this time.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamsNeedingAttention.map(team => (
                  <Link
                    key={team.id}
                    href={`/association/${associationId}/teams/${team.id}`}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-gray-900 truncate">{team.teamName}</span>
                        {team.division && (
                          <span className="text-sm text-gray-500">• {team.division}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {team.latestSnapshot && (
                          <HealthBadge
                            status={team.latestSnapshot.healthStatus}
                            score={team.latestSnapshot.healthScore}
                          />
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      {team.latestSnapshot?.percentUsed !== null && (
                        <div className="text-sm font-medium text-gray-900">
                          {team.latestSnapshot.percentUsed.toFixed(0)}% used
                        </div>
                      )}
                      {team.lastSyncedAt && (
                        <div className="text-xs text-gray-500">
                          Updated {new Date(team.lastSyncedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Recent Alerts</h2>
                <p className="text-sm text-gray-600">Latest alerts from the past week</p>
              </div>
              <Link
                href={`/association/${associationId}/alerts`}
                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                View All
              </Link>
            </div>

            {recentAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <svg className="h-10 w-10 text-green-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-gray-600">No recent alerts</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentAlerts.map(alert => (
                  <div
                    key={alert.id}
                    className="flex items-start justify-between p-3 rounded-lg border border-gray-200"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                          alert.severity === 'critical'
                            ? 'bg-red-100 text-red-800'
                            : alert.severity === 'warning'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {alert.severity}
                        </span>
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {alert.teamName || 'Association'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">{alert.title}</p>
                    </div>
                    <div className="text-xs text-gray-500 ml-4 whitespace-nowrap">
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Teams Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Connected Teams</h2>

          {teams.length === 0 ? (
            <EmptyState
              title="No teams connected yet"
              description="Once teams start using HuddleBooks, they'll appear here with live budgets and health scores."
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {teams.map(team => (
                <TeamCard key={team.id} team={team} associationId={association.id} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
