import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getAssociationFinancials } from './actions'
import { AssociationNav } from '@/app/components/AssociationNav'

interface PageProps {
  params: Promise<{
    associationId: string
  }>
}

function SummaryCard({
  label,
  amount,
  subtext,
  colorClass = 'text-gray-900'
}: {
  label: string
  amount: number
  subtext?: string
  colorClass?: string
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <p className={`text-3xl font-bold ${colorClass}`}>
        ${amount.toLocaleString()}
      </p>
      {subtext && (
        <p className="text-sm text-gray-600 mt-2">{subtext}</p>
      )}
    </div>
  )
}

function BudgetUsageBar({ percentUsed }: { percentUsed: number }) {
  const percentage = Math.min(Math.max(percentUsed, 0), 100)

  let barColor = 'bg-green-500'
  let statusText = 'On Track'
  let statusColor = 'text-green-600'

  if (percentage >= 90) {
    barColor = 'bg-red-500'
    statusText = 'Critical'
    statusColor = 'text-red-600'
  } else if (percentage >= 70) {
    barColor = 'bg-yellow-500'
    statusText = 'Warning'
    statusColor = 'text-yellow-600'
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Budget Usage</h3>
        <span className={`text-sm font-semibold ${statusColor}`}>{statusText}</span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Overall Progress</span>
          <span className="text-lg font-bold text-gray-900">{percentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-300`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
        {percentage < 70 && 'Budget is in healthy range'}
        {percentage >= 70 && percentage < 90 && 'Approaching budget limit - monitor spending'}
        {percentage >= 90 && 'Budget usage is critical - immediate attention required'}
      </div>
    </div>
  )
}

function CategoryBar({ name, totalSpent, percentOfTotal }: {
  name: string
  totalSpent: number
  percentOfTotal: number
}) {
  const width = Math.min(Math.max(percentOfTotal, 0), 100)

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{name}</span>
        <div className="text-right">
          <span className="text-sm font-bold text-gray-900">${totalSpent.toLocaleString()}</span>
          <span className="text-xs text-gray-500 ml-2">({percentOfTotal.toFixed(1)}%)</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  )
}

function TeamFinancialRow({
  team,
  associationId
}: {
  team: any
  associationId: string
}) {
  const percentUsed = team.budgetUsedPercent

  let percentColor = 'text-green-600'
  let statusBadgeColor = 'bg-green-100 text-green-800'

  if (percentUsed >= 90) {
    percentColor = 'text-red-600'
    statusBadgeColor = 'bg-red-100 text-red-800'
  } else if (percentUsed >= 70) {
    percentColor = 'text-yellow-600'
    statusBadgeColor = 'bg-yellow-100 text-yellow-800'
  }

  const remaining = team.budget - team.spent

  return (
    <Link href={`/association/${associationId}/teams/${team.id}`}>
      <tr className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
        <td className="px-4 py-4">
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">{team.name}</span>
            <div className="flex gap-2 mt-1">
              {team.level && (
                <span className="text-xs text-gray-500">{team.level}</span>
              )}
              {team.division && (
                <span className="text-xs text-gray-500">Division: {team.division}</span>
              )}
            </div>
          </div>
        </td>
        <td className="px-4 py-4 text-right">
          <span className="text-sm font-medium text-gray-900">
            ${team.budget.toLocaleString()}
          </span>
        </td>
        <td className="px-4 py-4 text-right">
          <span className="text-sm font-medium text-gray-900">
            ${team.spent.toLocaleString()}
          </span>
        </td>
        <td className="px-4 py-4 text-right">
          <span className="text-sm font-medium text-gray-900">
            ${remaining.toLocaleString()}
          </span>
        </td>
        <td className="px-4 py-4 text-right">
          <span className={`text-sm font-bold ${percentColor}`}>
            {percentUsed.toFixed(1)}%
          </span>
        </td>
        <td className="px-4 py-4 text-center">
          {team.healthScore !== null ? (
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold text-gray-900">{team.healthScore}/100</span>
              {team.healthStatus && (
                <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mt-1 ${statusBadgeColor}`}>
                  {team.healthStatus.toUpperCase()}
                </span>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-400">N/A</span>
          )}
        </td>
        <td className="px-4 py-4 text-center">
          {team.pendingApprovals > 0 ? (
            <span className="inline-flex items-center justify-center w-7 h-7 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
              {team.pendingApprovals}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
        <td className="px-4 py-4 text-center">
          {team.missingReceipts > 0 ? (
            <span className="inline-flex items-center justify-center w-7 h-7 bg-red-100 text-red-800 rounded-full text-xs font-bold">
              {team.missingReceipts}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </td>
      </tr>
    </Link>
  )
}

export default async function AssociationFinancialsPage({ params }: PageProps) {
  const { associationId } = await params
  const data = await getAssociationFinancials(associationId)

  if (!data.association) {
    notFound()
  }

  const { association, summary, categories, teams } = data

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            <span className="text-gray-600">Financials</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Financial Overview</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                {association.abbreviation && (
                  <span className="font-medium">{association.abbreviation}</span>
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

      {/* Navigation */}
      <AssociationNav associationId={association.id} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SummaryCard
            label="Total Budget"
            amount={summary.totalBudget}
            colorClass="text-gray-900"
          />
          <SummaryCard
            label="Total Spent"
            amount={summary.totalSpent}
            subtext={`${summary.budgetUsedPercent.toFixed(1)}% of budget used`}
            colorClass="text-blue-600"
          />
          <SummaryCard
            label="Remaining Budget"
            amount={summary.remainingBudget}
            colorClass={summary.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}
          />
          <SummaryCard
            label="Pending Amount"
            amount={summary.pendingAmount}
            subtext={summary.pendingAmount > 0 ? 'Awaiting approval' : 'No pending items'}
            colorClass="text-yellow-600"
          />
        </div>

        {/* Budget Usage Section */}
        <div className="mb-8">
          <BudgetUsageBar percentUsed={summary.budgetUsedPercent} />
        </div>

        {/* Spend by Category */}
        <div className="mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Spend by Category</h2>
            {categories.length > 0 ? (
              <div>
                {categories.map(category => (
                  <CategoryBar
                    key={category.name}
                    name={category.name}
                    totalSpent={category.totalSpent}
                    percentOfTotal={category.percentOfTotal}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No spending data available</p>
                <p className="text-xs mt-1">Transactions will appear here once approved</p>
              </div>
            )}
          </div>
        </div>

        {/* Team Financial Table */}
        <div className="mb-8">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Team Budget Summary</h2>
              <p className="text-sm text-gray-600 mt-1">
                Click on a team to view detailed financial information
              </p>
            </div>

            {teams.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Budget
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Spent
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remaining
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        % Used
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Health
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pending
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Receipts
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teams.map(team => (
                      <TeamFinancialRow
                        key={team.id}
                        team={team}
                        associationId={associationId}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams Connected</h3>
                <p className="text-gray-500">Teams using Squadbooks will appear here once they connect to your association.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
