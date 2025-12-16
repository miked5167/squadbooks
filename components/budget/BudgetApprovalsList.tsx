'use client'

import { useState, useMemo } from 'react'
import { BudgetApprovalCard } from './BudgetApprovalCard'
import type { FilterState } from './BudgetApprovalFilters';
import { BudgetApprovalFilters } from './BudgetApprovalFilters'

interface Acknowledgment {
  id: string
  familyName: string
  acknowledged: boolean
  acknowledgedAt: Date | null
}

interface BudgetApproval {
  id: string
  season: string
  budgetTotal: number
  approvalType: string
  description: string | null
  status: string
  createdAt: Date
  completedAt: Date | null
  expiresAt: Date | null
  team: {
    name: string
    level: string
  }
  creator: {
    name: string
  }
  acknowledgments: Acknowledgment[]
}

interface BudgetApprovalsListProps {
  approvals: BudgetApproval[]
}

export function BudgetApprovalsList({ approvals }: BudgetApprovalsListProps) {
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    type: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const filteredAndSortedApprovals = useMemo(() => {
    let filtered = [...approvals]

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((approval) => approval.status === filters.status)
    }

    // Apply type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter((approval) => approval.approvalType === filters.type)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0

      switch (filters.sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'expiresAt':
          const aExpires = a.expiresAt ? new Date(a.expiresAt).getTime() : 0
          const bExpires = b.expiresAt ? new Date(b.expiresAt).getTime() : 0
          comparison = aExpires - bExpires
          break
        case 'budgetTotal':
          comparison = Number(a.budgetTotal) - Number(b.budgetTotal)
          break
        case 'progress':
          const aProgress =
            a.acknowledgments.length > 0
              ? a.acknowledgments.filter((ack) => ack.acknowledged).length /
                a.acknowledgments.length
              : 0
          const bProgress =
            b.acknowledgments.length > 0
              ? b.acknowledgments.filter((ack) => ack.acknowledged).length /
                b.acknowledgments.length
              : 0
          comparison = aProgress - bProgress
          break
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [approvals, filters])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <BudgetApprovalFilters onFilterChange={setFilters} />

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-navy/70">
          Showing {filteredAndSortedApprovals.length} of {approvals.length} approval
          {approvals.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Approvals List */}
      {filteredAndSortedApprovals.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg font-medium text-navy/70">No approvals match your filters</p>
          <p className="text-sm text-navy/50 mt-2">Try adjusting your filter criteria</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredAndSortedApprovals.map((approval) => (
            <BudgetApprovalCard key={approval.id} approval={approval} />
          ))}
        </div>
      )}
    </div>
  )
}
