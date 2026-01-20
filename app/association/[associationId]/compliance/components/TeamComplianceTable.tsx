'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, AlertTriangle, XCircle, Search, Filter } from 'lucide-react'

interface TeamData {
  id: string
  name: string
  division: string | null
  healthStatus: string | null
  healthScore: number | null
  activeViolations: number
}

interface TeamComplianceTableProps {
  teams: TeamData[]
  associationId: string
}

export function TeamComplianceTable({ teams, associationId }: TeamComplianceTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredTeams = teams.filter(team => {
    const matchesSearch =
      team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.division?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      filterStatus === 'all' ||
      team.healthStatus === filterStatus ||
      (!team.healthStatus && filterStatus === 'healthy')

    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (status: string | null | undefined, score: number | null) => {
    const displayScore = score !== null ? score : 100

    if (!status) {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Healthy ({displayScore}/100)
        </span>
      )
    }

    switch (status) {
      case 'healthy':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Healthy ({displayScore}/100)
          </span>
        )
      case 'needs_attention':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
            <AlertTriangle className="h-3.5 w-3.5" />
            Needs Attention ({displayScore}/100)
          </span>
        )
      case 'at_risk':
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
            <XCircle className="h-3.5 w-3.5" />
            At Risk ({displayScore}/100)
          </span>
        )
      default:
        return null
    }
  }

  if (teams.length === 0) {
    return (
      <div className="p-12 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-gray-300" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900">No Teams Found</h3>
        <p className="text-gray-600">No teams are currently registered with this association.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-4 border-b border-gray-200 p-4">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Status</option>
            <option value="healthy">Healthy</option>
            <option value="needs_attention">Needs Attention</option>
            <option value="at_risk">At Risk</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Team
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Compliance Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Violations
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                Breakdown
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredTeams.map(team => {
              return (
                <tr
                  key={team.id}
                  onClick={() => router.push(`/association/${associationId}/teams/${team.id}`)}
                  className="cursor-pointer transition-colors hover:bg-gray-50"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-orange-600">{team.name}</div>
                    {team.division && <p className="mt-1 text-sm text-gray-500">{team.division}</p>}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(team.healthStatus, team.healthScore)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">{team.activeViolations} active</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 text-sm">
                      {team.activeViolations === 0 ? (
                        <span className="text-green-600">No violations</span>
                      ) : (
                        <span className="text-gray-600">
                          {team.activeViolations} violation{team.activeViolations !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filteredTeams.length === 0 && (
        <div className="p-8 text-center text-gray-500">No teams match your search criteria</div>
      )}
    </div>
  )
}
