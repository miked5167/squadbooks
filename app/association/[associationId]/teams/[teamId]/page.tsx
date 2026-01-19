import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTeamDetailData, type NormalizedAlert, type SnapshotHistory } from './actions'
import type { AlertSeverity } from '../../alerts/actions'
import { TransactionsSection } from './TransactionsSection'

interface PageProps {
  params: Promise<{
    associationId: string
    teamId: string
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
    <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 ${color}`}>
      <span className="text-sm font-semibold">{label}</span>
      {score !== null && <span className="text-lg font-bold">{score}/100</span>}
    </div>
  )
}

function BudgetCategoryCard({ category, allocated, spent, remaining, percentUsed }: any) {
  const percentage = Math.min(Math.max(percentUsed, 0), 100)

  let barColor = 'bg-green-500'
  if (percentage >= 90) {
    barColor = 'bg-red-500'
  } else if (percentage >= 75) {
    barColor = 'bg-yellow-500'
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="font-semibold text-gray-900">{category.heading}</h4>
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
      </div>

      <div className="mb-3 grid grid-cols-3 gap-3">
        <div>
          <p className="text-xs tracking-wide text-gray-500 uppercase">Allocated</p>
          <p className="text-lg font-bold text-gray-900">${allocated.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs tracking-wide text-gray-500 uppercase">Spent</p>
          <p className="text-lg font-bold text-gray-900">${spent.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs tracking-wide text-gray-500 uppercase">Remaining</p>
          <p className="text-lg font-bold text-gray-900">${remaining.toLocaleString()}</p>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">{percentage.toFixed(1)}% used</p>
    </div>
  )
}

function PendingTransactionCard({ transaction }: { transaction: any }) {
  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
      <div className="mb-2 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium"
              style={{
                backgroundColor: transaction.category.color + '20',
                color: transaction.category.color,
              }}
            >
              {transaction.category.heading}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(transaction.transactionDate).toLocaleDateString()}
            </span>
          </div>
          <p className="font-semibold text-gray-900">{transaction.vendor}</p>
          {transaction.description && (
            <p className="mt-1 text-sm text-gray-600">{transaction.description}</p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Submitted by: {transaction.creator.name || transaction.creator.email}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            ${Number(transaction.amount).toLocaleString()}
          </p>
          <span className="mt-1 inline-block rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
            PENDING
          </span>
        </div>
      </div>
    </div>
  )
}

function AlertCard({ alert, associationId }: { alert: NormalizedAlert; associationId: string }) {
  const severityStyles = {
    HIGH: 'border-red-200 bg-red-50',
    MEDIUM: 'border-yellow-200 bg-yellow-50',
    LOW: 'border-gray-200 bg-gray-50',
  }

  const severityBadges = {
    HIGH: 'bg-red-100 text-red-800',
    MEDIUM: 'bg-yellow-100 text-yellow-800',
    LOW: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className={`rounded-lg border-2 p-4 ${severityStyles[alert.severity]}`}>
      <div className="mb-2 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`inline-block rounded px-2 py-1 text-xs font-semibold ${severityBadges[alert.severity]}`}
            >
              {alert.severity}
            </span>
            <span className="text-xs text-gray-600">{alert.type.replace(/_/g, ' ')}</span>
          </div>
          <p className="text-sm font-medium text-gray-900">{alert.message}</p>
          <p className="mt-1 text-xs text-gray-500">
            {new Date(alert.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  )
}

function SnapshotHistoryRow({ snapshot }: { snapshot: SnapshotHistory }) {
  const healthColors = {
    healthy: 'text-green-600',
    needs_attention: 'text-yellow-600',
    at_risk: 'text-red-600',
  }

  const statusLabels = {
    healthy: 'Healthy',
    needs_attention: 'Needs Attention',
    at_risk: 'At Risk',
  }

  const label =
    statusLabels[snapshot.healthStatus as keyof typeof statusLabels] || snapshot.healthStatus

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-900">
        {new Date(snapshot.snapshotAt).toLocaleDateString()}{' '}
        {new Date(snapshot.snapshotAt).toLocaleTimeString()}
      </td>
      <td className="px-4 py-3">
        <span
          className={`text-sm font-medium ${healthColors[snapshot.healthStatus as keyof typeof healthColors] || 'text-gray-600'}`}
        >
          {label}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">{snapshot.healthScore ?? '-'}/100</td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {snapshot.percentUsed?.toFixed(1) ?? '-'}%
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        <div className="flex flex-col gap-1">
          {snapshot.pendingReviews !== null && snapshot.pendingReviews > 0 && (
            <span>{snapshot.pendingReviews} pending</span>
          )}
          {snapshot.missingReceipts !== null && snapshot.missingReceipts > 0 && (
            <span>{snapshot.missingReceipts} receipts</span>
          )}
          {!snapshot.pendingReviews && !snapshot.missingReceipts && '-'}
        </div>
      </td>
    </tr>
  )
}

export default async function TeamDetailPage({ params }: PageProps) {
  const { associationId, teamId } = await params
  const data = await getTeamDetailData(associationId, teamId)

  if (!data.associationTeam || !data.association) {
    notFound()
  }

  const {
    association,
    associationTeam,
    latestSnapshot,
    budgetByCategory,
    recentTransactions,
    pendingTransactions,
    alerts,
    snapshotHistory,
  } = data

  // Association users are viewing this page (team details is under association route)
  const isAssociationUser = true

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-4 flex items-center gap-2 text-sm">
            <Link
              href={`/association/${associationId}/overview`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {association.name}
            </Link>
            <span className="text-gray-400">→</span>
            <Link
              href={`/association/${associationId}/alerts`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              Alerts
            </Link>
            <span className="text-gray-400">→</span>
            <span className="text-gray-600">Team Detail</span>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{associationTeam.teamName}</h1>
              <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                {associationTeam.team && (
                  <>
                    {associationTeam.team.competitiveLevel && (
                      <span className="font-medium">
                        Level: {associationTeam.team.competitiveLevel}
                      </span>
                    )}
                    {associationTeam.division && <span>Division: {associationTeam.division}</span>}
                    <span>{associationTeam.team.season}</span>
                  </>
                )}
              </div>

              {associationTeam.treasurerName && (
                <div className="mt-3 text-sm">
                  <p className="text-gray-600">
                    <span className="font-medium">Treasurer:</span> {associationTeam.treasurerName}
                  </p>
                  {associationTeam.treasurerEmail && (
                    <p className="text-gray-500">{associationTeam.treasurerEmail}</p>
                  )}
                </div>
              )}
            </div>

            {latestSnapshot && (
              <HealthBadge
                status={latestSnapshot.healthStatus}
                score={latestSnapshot.healthScore}
              />
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* No Snapshot Warning */}
        {!latestSnapshot && (
          <div className="mb-8 rounded-lg border-2 border-yellow-300 bg-yellow-50 p-6">
            <div className="flex items-start">
              <svg
                className="mt-0.5 mr-3 h-6 w-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h3 className="mb-1 text-lg font-semibold text-yellow-900">
                  No Financial Snapshot Available
                </h3>
                <p className="text-sm text-yellow-800">
                  This team hasn&apos;t generated a financial snapshot yet. Financial data and
                  health metrics will appear once the first snapshot is created. Check back soon or
                  contact the team treasurer.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Budget Overview */}
        {latestSnapshot && (
          <div className="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-6">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Budget Overview</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <div>
                <p className="mb-1 text-sm tracking-wide text-gray-500 uppercase">Total Budget</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${latestSnapshot.budgetTotal?.toLocaleString() ?? '0'}
                </p>
              </div>
              <div>
                <p className="mb-1 text-sm tracking-wide text-gray-500 uppercase">Spent</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${latestSnapshot.spent?.toLocaleString() ?? '0'}
                </p>
              </div>
              <div>
                <p className="mb-1 text-sm tracking-wide text-gray-500 uppercase">Remaining</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${latestSnapshot.remaining?.toLocaleString() ?? '0'}
                </p>
              </div>
              <div>
                <p className="mb-1 text-sm tracking-wide text-gray-500 uppercase">Budget Used</p>
                <p className="text-3xl font-bold text-gray-900">
                  {latestSnapshot.percentUsed?.toFixed(1) ?? '0'}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Red Flags */}
        {latestSnapshot &&
          latestSnapshot.redFlags &&
          Array.isArray(latestSnapshot.redFlags) &&
          latestSnapshot.redFlags.length > 0 && (
            <div className="mb-8 rounded-lg border-2 border-red-200 bg-gray-50 p-6">
              <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-red-700">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Red Flags ({latestSnapshot.redFlags.length})
              </h2>
              <div className="space-y-3">
                {latestSnapshot.redFlags.map((flag: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <span
                      className={`inline-block rounded px-3 py-1 text-xs font-semibold ${
                        flag.severity === 'critical'
                          ? 'border border-red-200 bg-red-100 text-red-800'
                          : 'border border-yellow-200 bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {flag.severity}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{flag.code}</p>
                      <p className="mt-1 text-sm text-gray-600">{flag.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Pending Reviews */}
        {pendingTransactions.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-gray-900">
              Pending Reviews
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-yellow-100 text-sm font-bold text-yellow-800">
                {pendingTransactions.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {pendingTransactions.map(transaction => (
                <PendingTransactionCard key={transaction.id} transaction={transaction} />
              ))}
            </div>
          </div>
        )}

        {/* Budget by Category */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Budget by Category</h2>
          {budgetByCategory.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {budgetByCategory.map(budget => (
                <BudgetCategoryCard key={budget.category.id} {...budget} />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center text-gray-500">
              No budget categories defined
            </div>
          )}
        </div>

        {/* Team-Specific Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                Active Alerts
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-800">
                  {alerts.length}
                </span>
              </h2>
              <Link
                href={`/association/${associationId}/alerts`}
                className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                View All Alerts →
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {alerts.slice(0, 6).map(alert => (
                <AlertCard key={alert.id} alert={alert} associationId={associationId} />
              ))}
            </div>
          </div>
        )}

        {/* Team Transactions Section */}
        <TransactionsSection teamId={teamId} isAssociationUser={isAssociationUser} />

        {/* Snapshot History */}
        {snapshotHistory.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Snapshot History</h2>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Snapshot Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Health Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Health Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Budget Used
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Issues
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {snapshotHistory.map(snapshot => (
                    <SnapshotHistoryRow key={snapshot.id} snapshot={snapshot} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Last Updated */}
        {latestSnapshot && (
          <div className="text-center text-sm text-gray-400">
            Last updated: {new Date(latestSnapshot.snapshotAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}
