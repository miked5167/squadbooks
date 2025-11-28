'use client'

import { useState, useEffect } from 'react'
import { notFound } from 'next/navigation'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getOverviewData } from '../overview/actions'

interface PageProps {
  params: Promise<{
    associationId: string
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
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${color}`}>
      <span className="font-semibold uppercase text-xs">{status}</span>
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
          {team.division && (
            <p className="text-sm text-gray-600">Division: {team.division}</p>
          )}
          {team.team && (
            <p className="text-sm text-gray-500">Level: {team.team.level}</p>
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
            {snapshot.pendingApprovals !== null && snapshot.pendingApprovals > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">
                  {snapshot.pendingApprovals}
                </span>
                <span className="text-gray-600">Pending Approval{snapshot.pendingApprovals !== 1 ? 's' : ''}</span>
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

export default function TeamsPage({ params }: PageProps) {
  const [associationId, setAssociationId] = useState<string | null>(null)
  const [association, setAssociation] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
        {/* Teams Grid */}
        {teams.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Teams Connected</h3>
            <p className="text-gray-500">Teams using HuddleBooks will appear here once they connect to your association.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {teams.map(team => (
              <TeamCard key={team.id} team={team} associationId={association.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
