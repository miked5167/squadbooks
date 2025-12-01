'use client'

import { useState } from 'react'
import { AlertTriangle, AlertCircle, Info, Search, Filter, Check, X } from 'lucide-react'
import { resolveViolation } from '../actions'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Violation {
  id: string
  violationType: string
  severity: string
  description: string
  violationData: any
  resolved: boolean
  resolvedAt: Date | null
  resolvedBy: string | null
  resolutionNotes: string | null
  createdAt: Date
  team: {
    id: string
    name: string
  }
  rule: {
    id: string
    name: string
    ruleType: string
  }
}

interface ViolationLogTableProps {
  violations: Violation[]
  associationId: string
}

export function ViolationLogTable({ violations, associationId }: ViolationLogTableProps) {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('active')
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolutionNotes, setResolutionNotes] = useState('')

  const filteredViolations = violations.filter(v => {
    const matchesSearch =
      v.team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.rule.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesSeverity = filterSeverity === 'all' || v.severity === filterSeverity
    const matchesStatus =
      (filterStatus === 'active' && !v.resolved) ||
      (filterStatus === 'resolved' && v.resolved) ||
      filterStatus === 'all'

    return matchesSearch && matchesSeverity && matchesStatus
  })

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <AlertTriangle className="w-3.5 h-3.5" />
            Critical
          </span>
        )
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <AlertCircle className="w-3.5 h-3.5" />
            Error
          </span>
        )
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Info className="w-3.5 h-3.5" />
            Warning
          </span>
        )
      default:
        return null
    }
  }

  const handleResolve = async (violationId: string) => {
    if (!resolutionNotes.trim()) {
      alert('Please add resolution notes before resolving')
      return
    }

    const result = await resolveViolation(violationId, 'Association Admin', resolutionNotes)

    if (result.success) {
      setResolvingId(null)
      setResolutionNotes('')
      router.refresh()
    } else {
      alert('Failed to resolve violation')
    }
  }

  if (violations.length === 0) {
    return (
      <div className="p-12 text-center">
        <AlertTriangle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Violations Recorded</h3>
        <p className="text-gray-600">
          All teams are currently in compliance with association rules.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div className="p-4 border-b border-gray-200 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search violations..."
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
            <option value="active">Active</option>
            <option value="resolved">Resolved</option>
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="all">All Severity</option>
            <option value="CRITICAL">Critical</option>
            <option value="ERROR">Error</option>
            <option value="WARNING">Warning</option>
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
                Rule
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Severity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredViolations.map((violation) => (
              <tr key={violation.id} className={violation.resolved ? 'bg-gray-50' : 'hover:bg-orange-50'}>
                <td className="px-6 py-4">
                  <Link
                    href={`/association/${associationId}/teams/${violation.team.id}`}
                    className="font-medium text-orange-600 hover:text-orange-700 hover:underline"
                  >
                    {violation.team.name}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{violation.rule.name}</p>
                  <p className="text-xs text-gray-500">{violation.violationType}</p>
                </td>
                <td className="px-6 py-4">
                  {getSeverityBadge(violation.severity)}
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">{violation.description}</p>
                  {violation.resolved && violation.resolutionNotes && (
                    <p className="text-xs text-gray-500 mt-1">
                      <strong>Resolution:</strong> {violation.resolutionNotes}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">
                    {new Date(violation.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(violation.createdAt).toLocaleTimeString()}
                  </p>
                </td>
                <td className="px-6 py-4 text-right">
                  {violation.resolved ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <Check className="w-3.5 h-3.5" />
                      Resolved
                    </span>
                  ) : resolvingId === violation.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Add resolution notes..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        rows={2}
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setResolvingId(null)
                            setResolutionNotes('')
                          }}
                          className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResolve(violation.id)}
                          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setResolvingId(violation.id)}
                      className="px-3 py-1.5 text-sm text-orange-600 hover:bg-orange-50 rounded-lg transition-colors font-medium"
                    >
                      Resolve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredViolations.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No violations match your filters
        </div>
      )}
    </div>
  )
}
