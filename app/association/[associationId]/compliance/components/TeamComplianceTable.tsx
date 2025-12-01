'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, AlertTriangle, XCircle, Search, Filter } from 'lucide-react'

interface TeamData {
  id: string
  name: string
  division: string | null
  complianceStatus: {
    complianceScore: number
    status: string
    activeViolations: number
    warningCount: number
    errorCount: number
    criticalCount: number
  } | null
  activeViolations: number
}

interface TeamComplianceTableProps {
  teams: TeamData[]
  associationId: string
}

export function TeamComplianceTable({ teams, associationId }: TeamComplianceTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.division?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = filterStatus === 'all' ||
                         team.complianceStatus?.status === filterStatus ||
                         (!team.complianceStatus && filterStatus === 'COMPLIANT')

    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (status: string | null | undefined, score: number) => {
    if (!status) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Compliant ({score}/100)
        </span>
      )
    }

    switch (status) {
      case 'COMPLIANT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Compliant ({score}/100)
          </span>
        )
      case 'AT_RISK':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle className="w-3.5 h-3.5" />
            At Risk ({score}/100)
          </span>
        )
      case 'NON_COMPLIANT':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3.5 h-3.5" />
            Non-Compliant ({score}/100)
          </span>
        )
      default:
        return null
    }
  }

  if (teams.length === 0) {
    return (
      <div className="p-12 text-center">
        <CheckCircle2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Teams Found</h3>
        <p className="text-gray-600">
          No teams are currently registered with this association.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="COMPLIANT">Compliant</option>
            <option value="AT_RISK">At Risk</option>
            <option value="NON_COMPLIANT">Non-Compliant</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Team
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Compliance Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Violations
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Breakdown
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTeams.map((team) => {
              const status = team.complianceStatus
              const score = status?.complianceScore || 100

              return (
                <tr key={team.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/association/${associationId}/teams/${team.id}`}
                      className="font-medium text-orange-600 hover:text-orange-700 hover:underline"
                    >
                      {team.name}
                    </Link>
                    {team.division && (
                      <p className="text-sm text-gray-500 mt-1">{team.division}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(status?.status, score)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-900">
                      {team.activeViolations} active
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3 text-sm">
                      {status && (
                        <>
                          {status.criticalCount > 0 && (
                            <span className="text-red-600">
                              {status.criticalCount} critical
                            </span>
                          )}
                          {status.errorCount > 0 && (
                            <span className="text-orange-600">
                              {status.errorCount} error{status.errorCount !== 1 ? 's' : ''}
                            </span>
                          )}
                          {status.warningCount > 0 && (
                            <span className="text-yellow-600">
                              {status.warningCount} warning{status.warningCount !== 1 ? 's' : ''}
                            </span>
                          )}
                          {status.activeViolations === 0 && (
                            <span className="text-green-600">No violations</span>
                          )}
                        </>
                      )}
                      {!status && (
                        <span className="text-green-600">No violations</span>
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
        <div className="p-8 text-center text-gray-500">
          No teams match your search criteria
        </div>
      )}
    </div>
  )
}
