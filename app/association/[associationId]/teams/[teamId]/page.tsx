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
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
  }

  const color = statusColors[status as keyof typeof statusColors] || statusColors.healthy

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${color}`}>
      <span className="font-semibold uppercase text-sm">{status}</span>
      {score !== null && (
        <span className="text-lg font-bold">{score}/100</span>
      )}
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
    <div className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{category.heading}</h4>
        <span
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: category.color }}
        />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Allocated</p>
          <p className="text-lg font-bold text-gray-900">${allocated.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Spent</p>
          <p className="text-lg font-bold text-gray-900">${spent.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Remaining</p>
          <p className="text-lg font-bold text-gray-900">${remaining.toLocaleString()}</p>
        </div>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{percentage.toFixed(1)}% used</p>
    </div>
  )
}

function PendingTransactionCard({ transaction }: { transaction: any }) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
              style={{ backgroundColor: transaction.category.color + '20', color: transaction.category.color }}
            >
              {transaction.category.heading}
            </span>
            <span className="text-xs text-gray-500">
              {new Date(transaction.transactionDate).toLocaleDateString()}
            </span>
          </div>
          <p className="font-semibold text-gray-900">{transaction.vendor}</p>
          {transaction.description && (
            <p className="text-sm text-gray-600 mt-1">{transaction.description}</p>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Submitted by: {transaction.creator.name || transaction.creator.email}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            ${Number(transaction.amount).toLocaleString()}
          </p>
          <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium mt-1">
            Pending
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
    <div className={`border-2 rounded-lg p-4 ${severityStyles[alert.severity]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${severityBadges[alert.severity]}`}>
              {alert.severity}
            </span>
            <span className="text-xs text-gray-600">{alert.type.replace(/_/g, ' ')}</span>
          </div>
          <p className="text-sm text-gray-900 font-medium">{alert.message}</p>
          <p className="text-xs text-gray-500 mt-1">
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
    warning: 'text-yellow-600',
    critical: 'text-red-600',
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-900">
        {new Date(snapshot.snapshotAt).toLocaleDateString()} {new Date(snapshot.snapshotAt).toLocaleTimeString()}
      </td>
      <td className="px-4 py-3">
        <span className={`text-sm font-medium ${healthColors[snapshot.healthStatus as keyof typeof healthColors] || 'text-gray-600'}`}>
          {snapshot.healthStatus.toUpperCase()}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {snapshot.healthScore ?? '-'}/100
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {snapshot.percentUsed?.toFixed(1) ?? '-'}%
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">
        <div className="flex flex-col gap-1">
          {snapshot.pendingApprovals !== null && snapshot.pendingApprovals > 0 && (
            <span>{snapshot.pendingApprovals} pending</span>
          )}
          {snapshot.missingReceipts !== null && snapshot.missingReceipts > 0 && (
            <span>{snapshot.missingReceipts} receipts</span>
          )}
          {snapshot.overspendAmount !== null && snapshot.overspendAmount > 0 && (
            <span className="text-red-600">Overspend: ${Number(snapshot.overspendAmount).toLocaleString()}</span>
          )}
          {(!snapshot.pendingApprovals && !snapshot.missingReceipts && !snapshot.overspendAmount) && '-'}
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

  const { association, associationTeam, latestSnapshot, budgetByCategory, allTransactions, recentTransactions, pendingTransactions, alerts, snapshotHistory } = data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                {associationTeam.team && (
                  <>
                    <span className="font-medium">{associationTeam.team.level}</span>
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
              <HealthBadge status={latestSnapshot.healthStatus} score={latestSnapshot.healthScore} />
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* No Snapshot Warning */}
        {!latestSnapshot && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-8">
            <div className="flex items-start">
              <svg className="h-6 w-6 text-yellow-600 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-yellow-900 mb-1">
                  No Financial Snapshot Available
                </h3>
                <p className="text-sm text-yellow-800">
                  This team hasn't generated a financial snapshot yet. Financial data and health metrics will appear once the first snapshot is created. Check back soon or contact the team treasurer.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Budget Overview */}
        {latestSnapshot && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Budget Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Total Budget</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${latestSnapshot.budgetTotal?.toLocaleString() ?? '0'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Spent</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${latestSnapshot.spent?.toLocaleString() ?? '0'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Remaining</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${latestSnapshot.remaining?.toLocaleString() ?? '0'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide mb-1">Budget Used</p>
                <p className="text-3xl font-bold text-gray-900">
                  {latestSnapshot.percentUsed?.toFixed(1) ?? '0'}%
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Red Flags */}
        {latestSnapshot && latestSnapshot.redFlags && Array.isArray(latestSnapshot.redFlags) && latestSnapshot.redFlags.length > 0 && (
          <div className="bg-white border-2 border-red-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Red Flags ({latestSnapshot.redFlags.length})
            </h2>
            <div className="space-y-3">
              {latestSnapshot.redFlags.map((flag: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 bg-gray-50">
                  <span className={`inline-block px-3 py-1 rounded text-xs font-semibold ${
                    flag.severity === 'critical'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    {flag.severity}
                  </span>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-gray-900">{flag.code}</p>
                    <p className="text-sm text-gray-600 mt-1">{flag.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Approvals */}
        {pendingTransactions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              Pending Approvals
              <span className="inline-flex items-center justify-center w-7 h-7 bg-yellow-100 text-yellow-800 rounded-full text-sm font-bold">
                {pendingTransactions.length}
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingTransactions.map(transaction => (
                <PendingTransactionCard key={transaction.id} transaction={transaction} />
              ))}
            </div>
          </div>
        )}

        {/* Budget by Category */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Budget by Category</h2>
          {budgetByCategory.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {budgetByCategory.map(budget => (
                <BudgetCategoryCard key={budget.category.id} {...budget} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-8 text-center text-gray-500">
              No budget categories defined
            </div>
          )}
        </div>

        {/* Team-Specific Alerts */}
        {alerts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Active Alerts
                <span className="inline-flex items-center justify-center w-7 h-7 bg-red-100 text-red-800 rounded-full text-sm font-bold">
                  {alerts.length}
                </span>
              </h2>
              <Link
                href={`/association/${associationId}/alerts`}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                View All Alerts →
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {alerts.slice(0, 6).map(alert => (
                <AlertCard key={alert.id} alert={alert} associationId={associationId} />
              ))}
            </div>
          </div>
        )}

        {/* All Transactions (with filtering and pagination) */}
        <TransactionsSection transactions={allTransactions} />

        {/* Snapshot History */}
        {snapshotHistory.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Snapshot History</h2>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Snapshot Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Health Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Health Score
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Budget Used
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issues
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
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
