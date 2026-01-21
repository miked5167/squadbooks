'use client'

import { useState, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { formatDistanceToNow } from 'date-fns'
import { ArrowUpDown, CheckCircle, Clock, AlertCircle } from 'lucide-react'

export interface BudgetApprovalRow {
  teamId: string
  teamName: string
  teamLevel: string
  approvalType: 'BUDGET_VERSION' | 'ACKNOWLEDGMENT'
  description: string
  totalFamilies: number
  acknowledgedCount: number
  progressPercentage: number
  status: string
  expiresAt: string | null
  createdAt: string
}

interface BudgetApprovalStatusTableProps {
  approvals: BudgetApprovalRow[]
}

type SortField = 'teamName' | 'progress' | 'createdAt' | 'expiresAt'
type SortDirection = 'asc' | 'desc'

export function BudgetApprovalStatusTable({ approvals }: BudgetApprovalStatusTableProps) {
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedApprovals = useMemo(() => {
    return [...approvals].sort((a, b) => {
      let compareValue = 0

      switch (sortField) {
        case 'teamName':
          compareValue = a.teamName.localeCompare(b.teamName)
          break
        case 'progress':
          compareValue = a.progressPercentage - b.progressPercentage
          break
        case 'createdAt':
          compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'expiresAt':
          const aExpires = a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity
          const bExpires = b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity
          compareValue = aExpires - bExpires
          break
      }

      return sortDirection === 'asc' ? compareValue : -compareValue
    })
  }, [approvals, sortField, sortDirection])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3" />
            Completed
          </span>
        )
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            <AlertCircle className="w-3 h-3" />
            Expired
          </span>
        )
      default:
        return (
          <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        )
    }
  }

  const getApprovalTypeBadge = (type: string) => {
    switch (type) {
      case 'BUDGET_VERSION':
        return (
          <Badge variant="default" className="text-xs bg-blue-500">
            Budget Presentation
          </Badge>
        )
      case 'ACKNOWLEDGMENT':
        return (
          <Badge variant="secondary" className="text-xs">
            Acknowledgment
          </Badge>
        )
      default:
        return <Badge variant="outline" className="text-xs">{type}</Badge>
    }
  }

  const getTimeRemaining = (expiresAt: string | null) => {
    if (!expiresAt) return null

    const expiry = new Date(expiresAt)
    const now = new Date()

    if (expiry < now) {
      return <span className="text-red-600 font-medium text-xs">Expired</span>
    }

    const timeRemaining = formatDistanceToNow(expiry, { addSuffix: true })
    const hoursRemaining = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursRemaining < 24) {
      return <span className="text-red-600 font-medium text-xs">Expires {timeRemaining}</span>
    } else if (hoursRemaining < 72) {
      return <span className="text-amber-600 font-medium text-xs">Expires {timeRemaining}</span>
    }

    return <span className="text-gray-600 text-xs">Expires {timeRemaining}</span>
  }

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-gray-900 transition-colors"
    >
      {children}
      <ArrowUpDown className={`w-3 h-3 ${sortField === field ? 'text-blue-600' : 'text-gray-400'}`} />
    </button>
  )

  if (approvals.length === 0) {
    return (
      <div className="text-center py-12 text-gray-600">
        <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
        <p className="text-lg font-medium">No Pending Budget Approvals</p>
        <p className="text-sm mt-1">All teams have completed their budget approval processes.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              <SortButton field="teamName">Team</SortButton>
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Type
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
              Description
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              <SortButton field="progress">Progress</SortButton>
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              Status
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              <SortButton field="expiresAt">Deadline</SortButton>
            </th>
            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
              <SortButton field="createdAt">Created</SortButton>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedApprovals.map((approval, index) => (
            <tr key={index} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm">
                <div className="font-medium text-gray-900">{approval.teamName}</div>
                {approval.teamLevel && (
                  <div className="text-xs text-gray-500">{approval.teamLevel}</div>
                )}
              </td>
              <td className="px-4 py-3 text-sm">
                {getApprovalTypeBadge(approval.approvalType)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                {approval.description}
              </td>
              <td className="px-4 py-3 text-sm">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-full max-w-[120px]">
                    <Progress value={approval.progressPercentage} className="h-2" />
                  </div>
                  <span className="text-xs text-gray-600">
                    {approval.acknowledgedCount} of {approval.totalFamilies} ({approval.progressPercentage}%)
                  </span>
                </div>
              </td>
              <td className="px-4 py-3 text-center">
                {getStatusBadge(approval.status)}
              </td>
              <td className="px-4 py-3 text-center text-sm">
                {approval.expiresAt ? (
                  getTimeRemaining(approval.expiresAt)
                ) : (
                  <span className="text-gray-400 text-xs">No deadline</span>
                )}
              </td>
              <td className="px-4 py-3 text-center text-sm text-gray-600">
                {new Date(approval.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
