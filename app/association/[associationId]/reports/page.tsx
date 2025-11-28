'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getReportsData,
  getSeasonFinancialCsv,
  getTransactionDetailCsv,
  getAlertsCsv,
  type ReportsResponse,
  type SeasonFinancialRow,
  type TransactionDetailRow,
  type AlertReportRow,
} from './actions'

export default function ReportsPage({
  params,
}: {
  params: Promise<{ associationId: string }>
}) {
  const { associationId } = use(params)
  const [data, setData] = useState<ReportsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // View toggles
  const [showSeasonFinancial, setShowSeasonFinancial] = useState(false)
  const [showTransactions, setShowTransactions] = useState(false)
  const [showAlerts, setShowAlerts] = useState(false)

  // Transaction filters
  const [selectedTeam, setSelectedTeam] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getReportsData(associationId)
        setData(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load reports')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [associationId])

  const downloadCsv = async (
    filename: string,
    csvGetter: () => Promise<string>
  ) => {
    try {
      const csv = await csvGetter()
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download CSV:', err)
      alert('Failed to download CSV')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Loading reports...</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="text-red-600">
          {error || 'Association not found'}
        </div>
      </div>
    )
  }

  // Filter transactions
  const filteredTransactions = data.transactions.filter((t) => {
    if (selectedTeam !== 'all' && t.teamId !== selectedTeam) return false
    if (selectedStatus !== 'all' && t.status !== selectedStatus) return false
    return true
  })

  // Get unique teams for filter
  const uniqueTeams = Array.from(
    new Set(data.transactions.map((t) => ({ id: t.teamId, name: t.teamName })))
  ).reduce((acc, team) => {
    if (!acc.find((t) => t.id === team.id)) {
      acc.push(team)
    }
    return acc
  }, [] as { id: string; name: string }[])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="mb-4 text-sm text-gray-600">
          <Link
            href={`/association/${associationId}`}
            className="hover:text-blue-600"
          >
            Overview
          </Link>
          {' → '}
          <Link
            href={`/association/${associationId}/financials`}
            className="hover:text-blue-600"
          >
            Financials
          </Link>
          {' → '}
          <span className="text-gray-900 font-medium">Reports</span>
        </div>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Reports & Exports
          </h1>
          <p className="text-gray-600 mt-2">
            {data.association.name} — {data.association.season || 'All Seasons'}
          </p>
        </div>

        {/* Report Sections */}
        <div className="space-y-6">
          {/* 1. Season Financial Summary */}
          <SeasonFinancialCard
            data={data.seasonFinancial}
            show={showSeasonFinancial}
            onToggle={() => setShowSeasonFinancial(!showSeasonFinancial)}
            onDownload={() =>
              downloadCsv('association-season-summary.csv', () =>
                getSeasonFinancialCsv(associationId)
              )
            }
          />

          {/* 2. Transaction Detail Report */}
          <TransactionDetailCard
            data={filteredTransactions}
            allData={data.transactions}
            show={showTransactions}
            onToggle={() => setShowTransactions(!showTransactions)}
            onDownload={() =>
              downloadCsv('transactions-detail.csv', () =>
                getTransactionDetailCsv(associationId)
              )
            }
            teams={uniqueTeams}
            selectedTeam={selectedTeam}
            onTeamChange={setSelectedTeam}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
          />

          {/* 3. Alerts & Issues Report */}
          <AlertsReportCard
            data={data.alerts}
            show={showAlerts}
            onToggle={() => setShowAlerts(!showAlerts)}
            onDownload={() =>
              downloadCsv('alerts-report.csv', () =>
                getAlertsCsv(associationId)
              )
            }
          />
        </div>
      </div>
    </div>
  )
}

/**
 * Season Financial Summary Card
 */
function SeasonFinancialCard({
  data,
  show,
  onToggle,
  onDownload,
}: {
  data: SeasonFinancialRow[]
  show: boolean
  onToggle: () => void
  onDownload: () => void
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Season Financial Summary
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Budget and spending overview by team for this season.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggle}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            {show ? 'Hide Report' : 'View Report'}
          </button>
          <button
            onClick={onDownload}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
          >
            Download CSV
          </button>
        </div>
      </div>

      {show && (
        <>
          {data.length === 0 ? (
            <div className="text-gray-600 text-center py-8">
              No data yet for this report
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Team
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Budget
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Spent
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Pending
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Remaining
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      % Used
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Health
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Issues
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((row) => (
                    <tr key={row.teamId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {row.teamName}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        ${row.budget.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        ${row.totalSpent.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-yellow-600">
                        ${row.pendingAmount.toFixed(2)}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-medium ${
                          row.remainingBudget < 0
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        ${row.remainingBudget.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        {row.budgetUsedPercent.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.healthStatus ? (
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              row.healthStatus === 'HEALTHY'
                                ? 'bg-green-100 text-green-800'
                                : row.healthStatus === 'WARNING'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {row.healthStatus}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900">
                        <div className="flex flex-col gap-1 items-center">
                          {row.pendingApprovals > 0 && (
                            <span className="text-xs text-yellow-600">
                              {row.pendingApprovals} pending
                            </span>
                          )}
                          {row.missingReceipts > 0 && (
                            <span className="text-xs text-red-600">
                              {row.missingReceipts} no receipt
                            </span>
                          )}
                          {row.pendingApprovals === 0 &&
                            row.missingReceipts === 0 && (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Transaction Detail Report Card
 */
function TransactionDetailCard({
  data,
  allData,
  show,
  onToggle,
  onDownload,
  teams,
  selectedTeam,
  onTeamChange,
  selectedStatus,
  onStatusChange,
}: {
  data: TransactionDetailRow[]
  allData: TransactionDetailRow[]
  show: boolean
  onToggle: () => void
  onDownload: () => void
  teams: { id: string; name: string }[]
  selectedTeam: string
  onTeamChange: (team: string) => void
  selectedStatus: string
  onStatusChange: (status: string) => void
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Transaction Detail Report
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Line-item transaction details for all teams.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggle}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            {show ? 'Hide Report' : 'View Report'}
          </button>
          <button
            onClick={onDownload}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
          >
            Download CSV
          </button>
        </div>
      </div>

      {show && (
        <>
          {/* Filters */}
          <div className="mb-4 flex gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Team
              </label>
              <select
                value={selectedTeam}
                onChange={(e) => onTeamChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Teams</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => onStatusChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="APPROVED">APPROVED</option>
                <option value="PENDING">PENDING</option>
              </select>
            </div>
          </div>

          {allData.length === 0 ? (
            <div className="text-gray-600 text-center py-8">
              No data yet for this report
            </div>
          ) : data.length === 0 ? (
            <div className="text-gray-600 text-center py-8">
              No transactions match the current filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Team
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Receipt
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(row.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {row.teamName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {row.category || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900">
                        ${row.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            row.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.missingReceipt ? (
                          <span className="text-red-600 text-xs font-medium">
                            Missing
                          </span>
                        ) : (
                          <span className="text-green-600 text-xs">✓</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                        {row.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}

/**
 * Alerts & Issues Report Card
 */
function AlertsReportCard({
  data,
  show,
  onToggle,
  onDownload,
}: {
  data: AlertReportRow[]
  show: boolean
  onToggle: () => void
  onDownload: () => void
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Alerts & Issues Report
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Open alerts and issues across all teams.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onToggle}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            {show ? 'Hide Report' : 'View Report'}
          </button>
          <button
            onClick={onDownload}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
          >
            Download CSV
          </button>
        </div>
      </div>

      {show && (
        <>
          {data.length === 0 ? (
            <div className="text-gray-600 text-center py-8">
              No data yet for this report
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Team
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                      Severity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Message
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {row.teamName}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {row.type}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            row.severity === 'HIGH'
                              ? 'bg-red-100 text-red-800'
                              : row.severity === 'MEDIUM'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {row.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {row.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
