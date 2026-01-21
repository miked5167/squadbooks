'use client'

import { useState, useEffect, useMemo } from 'react'
import { notFound } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getOverviewData } from '../overview/actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

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
  const router = useRouter()
  const snapshot = team.latestSnapshot

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => router.push(`/association/${associationId}/teams/${team.id}`)}
    >
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
  )
}

type StatusFilter = 'all' | 'healthy' | 'needs_attention' | 'at_risk'
type SortField = 'teamName' | 'budgetTotal' | 'percentUsed' | 'healthScore'
type SortDir = 'asc' | 'desc'

export default function TeamsPage({ params }: PageProps) {
  const [associationId, setAssociationId] = useState<string | null>(null)
  const [association, setAssociation] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Search and filters
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortBy, setSortBy] = useState<SortField>('teamName')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setCurrentPage(1) // Reset to first page on search
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params
      setAssociationId(resolvedParams.associationId)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    async function loadData() {
      if (!associationId) return

      setLoading(true)
      const data = await getOverviewData(associationId)

      if (!data.association) {
        notFound()
      }

      setAssociation(data.association)
      setTeams(data.teams)
      setLoading(false)
    }
    loadData()
  }, [associationId])

  // Filter, sort, and paginate teams
  const filteredAndSortedTeams = useMemo(() => {
    let result = [...teams]

    // Apply search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase()
      result = result.filter(team =>
        team.teamName.toLowerCase().includes(searchLower) ||
        team.division?.toLowerCase().includes(searchLower) ||
        team.treasurerName?.toLowerCase().includes(searchLower)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(team => {
        const status = team.latestSnapshot?.healthStatus
        return status === statusFilter
      })
    }

    // Apply sorting
    result.sort((a, b) => {
      let aVal: any
      let bVal: any

      switch (sortBy) {
        case 'teamName':
          aVal = a.teamName.toLowerCase()
          bVal = b.teamName.toLowerCase()
          break
        case 'budgetTotal':
          aVal = a.latestSnapshot?.budgetTotal ?? 0
          bVal = b.latestSnapshot?.budgetTotal ?? 0
          break
        case 'percentUsed':
          aVal = a.latestSnapshot?.percentUsed ?? 0
          bVal = b.latestSnapshot?.percentUsed ?? 0
          break
        case 'healthScore':
          aVal = a.latestSnapshot?.healthScore ?? 0
          bVal = b.latestSnapshot?.healthScore ?? 0
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [teams, debouncedSearch, statusFilter, sortBy, sortDir])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedTeams.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTeams = filteredAndSortedTeams.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, sortBy, sortDir])

  // Status counts for filter badges
  const statusCounts = useMemo(() => {
    return {
      healthy: teams.filter(t => t.latestSnapshot?.healthStatus === 'healthy').length,
      needs_attention: teams.filter(t => t.latestSnapshot?.healthStatus === 'needs_attention').length,
      at_risk: teams.filter(t => t.latestSnapshot?.healthStatus === 'at_risk').length,
    }
  }, [teams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teams...</p>
        </div>
      </div>
    )
  }

  if (!association) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
              <p className="text-gray-600 mt-2">{association.name}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 uppercase tracking-wide">Total Teams</p>
              <p className="text-3xl font-bold text-gray-900">{teams.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                type="text"
                placeholder="Search teams by name, division, or treasurer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort Dropdown */}
            <select
              value={`${sortBy}-${sortDir}`}
              onChange={(e) => {
                const [field, dir] = e.target.value.split('-')
                setSortBy(field as SortField)
                setSortDir(dir as SortDir)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="teamName-asc">Name (A-Z)</option>
              <option value="teamName-desc">Name (Z-A)</option>
              <option value="healthScore-desc">Health Score (High-Low)</option>
              <option value="healthScore-asc">Health Score (Low-High)</option>
              <option value="budgetTotal-desc">Budget (High-Low)</option>
              <option value="budgetTotal-asc">Budget (Low-High)</option>
              <option value="percentUsed-desc">Budget Used (High-Low)</option>
              <option value="percentUsed-asc">Budget Used (Low-High)</option>
            </select>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Teams
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white">
                {teams.length}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('healthy')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === 'healthy'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Healthy
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-green-500 text-white">
                {statusCounts.healthy}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('needs_attention')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === 'needs_attention'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Needs Attention
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-500 text-white">
                {statusCounts.needs_attention}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter('at_risk')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                statusFilter === 'at_risk'
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              At Risk
              <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
                {statusCounts.at_risk}
              </span>
            </button>
          </div>

          {/* Results Count */}
          {(debouncedSearch || statusFilter !== 'all') && (
            <div className="text-sm text-gray-600">
              Showing {filteredAndSortedTeams.length} of {teams.length} teams
              {debouncedSearch && ` matching "${debouncedSearch}"`}
            </div>
          )}
        </div>

        {/* Teams Grid */}
        {paginatedTeams.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            {teams.length === 0 ? (
              <>
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams Connected</h3>
                <p className="text-gray-500">Teams using HuddleBooks will appear here once they connect to your association.</p>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('')
                    setStatusFilter('all')
                  }}
                >
                  Clear all filters
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {paginatedTeams.map(team => (
                <TeamCard key={team.id} team={team} associationId={association.id} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg">
                <div className="flex flex-1 justify-between sm:hidden">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(endIndex, filteredAndSortedTeams.length)}</span> of{' '}
                      <span className="font-medium">{filteredAndSortedTeams.length}</span> teams
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      ← Previous
                    </Button>
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next →
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
