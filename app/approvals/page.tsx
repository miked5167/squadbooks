'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { CheckCircle, Loader2 } from 'lucide-react'
import { ApprovalFiltersToolbar } from '@/components/approvals/ApprovalFiltersToolbar'
import { ApprovalTable } from '@/components/approvals/ApprovalTable'
import { ApprovalDetailsDrawer } from '@/components/approvals/ApprovalDetailsDrawer'
import { ApprovalMobileList } from '@/components/approvals/ApprovalMobileCard'
import { BulkActionDialog } from '@/components/approvals/BulkActionDialog'
import {
  usePendingApprovals,
  useApproveApproval,
  useRejectApproval,
  useBulkApprove,
  useBulkReject,
} from '@/lib/hooks/use-approvals'
import {
  ApprovalFilters,
  ApprovalSort,
  PendingApprovalWithRisk,
} from '@/lib/types/approvals'
import { sortByRiskLevel } from '@/lib/utils/approval-risk'

export default function ApprovalsPage() {
  const searchParams = useSearchParams()

  // Data fetching
  const { approvals, loading, refetch } = usePendingApprovals()
  const { approve, loading: approving } = useApproveApproval()
  const { reject, loading: rejecting } = useRejectApproval()
  const { bulkApprove, loading: bulkApproving } = useBulkApprove()
  const { bulkReject, loading: bulkRejecting } = useBulkReject()

  // UI state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeApproval, setActiveApproval] = useState<PendingApprovalWithRisk | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [bulkAction, setBulkAction] = useState<'approve' | 'reject' | null>(null)

  // Filters and sorting
  const [filters, setFilters] = useState<ApprovalFilters>({
    search: '',
    categories: [],
    riskLevels: [],
    groupBy: 'NONE',
  })

  const [sort, setSort] = useState<ApprovalSort>({
    field: 'submittedAt',
    direction: 'desc',
  })

  // Filter and sort approvals
  const filteredAndSortedApprovals = useMemo(() => {
    let result = [...approvals]

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      result = result.filter(
        (approval) =>
          approval.transaction.vendor.toLowerCase().includes(searchLower) ||
          approval.transaction.description?.toLowerCase().includes(searchLower) ||
          approval.transaction.creator.name.toLowerCase().includes(searchLower)
      )
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      result = result.filter((approval) =>
        filters.categories.includes(approval.transaction.category.heading)
      )
    }

    // Apply risk level filter
    if (filters.riskLevels.length > 0) {
      result = result.filter((approval) => filters.riskLevels.includes(approval.riskLevel))
    }

    // Apply amount range filter
    if (filters.minAmount !== undefined) {
      result = result.filter(
        (approval) => Number(approval.transaction.amount) >= filters.minAmount!
      )
    }
    if (filters.maxAmount !== undefined) {
      result = result.filter(
        (approval) => Number(approval.transaction.amount) <= filters.maxAmount!
      )
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0

      switch (sort.field) {
        case 'amount':
          comparison = Number(a.transaction.amount) - Number(b.transaction.amount)
          break
        case 'vendor':
          comparison = a.transaction.vendor.localeCompare(b.transaction.vendor)
          break
        case 'submittedAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'transactionDate':
          comparison =
            new Date(a.transaction.transactionDate).getTime() -
            new Date(b.transaction.transactionDate).getTime()
          break
      }

      return sort.direction === 'asc' ? comparison : -comparison
    })

    return result
  }, [approvals, filters, sort])

  // Group approvals if needed
  const groupedApprovals = useMemo(() => {
    if (filters.groupBy === 'NONE') {
      return [{ group: null, approvals: filteredAndSortedApprovals }]
    }

    const groups: Record<string, PendingApprovalWithRisk[]> = {}

    filteredAndSortedApprovals.forEach((approval) => {
      let groupKey: string

      switch (filters.groupBy) {
        case 'CATEGORY':
          groupKey = approval.transaction.category.heading
          break
        case 'VENDOR':
          groupKey = approval.transaction.vendor
          break
        case 'RISK':
          groupKey = `${approval.riskLevel} Risk`
          break
        default:
          groupKey = 'Other'
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(approval)
    })

    // Sort groups by risk level if grouping by risk
    const groupKeys = Object.keys(groups)
    if (filters.groupBy === 'RISK') {
      groupKeys.sort((a, b) => {
        const riskOrder = { 'HIGH Risk': 0, 'MEDIUM Risk': 1, 'LOW Risk': 2 }
        return (
          (riskOrder[a as keyof typeof riskOrder] || 999) -
          (riskOrder[b as keyof typeof riskOrder] || 999)
        )
      })
    } else {
      groupKeys.sort()
    }

    return groupKeys.map((key) => ({ group: key, approvals: groups[key] }))
  }, [filteredAndSortedApprovals, filters.groupBy])

  // Calculate totals
  const totalAmount = useMemo(() => {
    return filteredAndSortedApprovals.reduce(
      (sum, approval) => sum + Number(approval.transaction.amount),
      0
    )
  }, [filteredAndSortedApprovals])

  const selectedApprovals = useMemo(() => {
    return filteredAndSortedApprovals.filter((a) => selectedIds.has(a.id))
  }, [filteredAndSortedApprovals, selectedIds])

  const selectedTotalAmount = useMemo(() => {
    return selectedApprovals.reduce((sum, a) => sum + Number(a.transaction.amount), 0)
  }, [selectedApprovals])

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    return approvals.map((a) => a.transaction.category)
  }, [approvals])

  // Handlers
  const handleApprove = async (approvalId: string, comment?: string) => {
    const success = await approve(approvalId, comment)
    if (success) {
      await refetch()
      setSelectedIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(approvalId)
        return newSet
      })
    }
  }

  const handleReject = async (approvalId: string, comment: string) => {
    const success = await reject(approvalId, comment)
    if (success) {
      await refetch()
      setSelectedIds((prev) => {
        const newSet = new Set(prev)
        newSet.delete(approvalId)
        return newSet
      })
    }
  }

  const handleBulkApprove = async (comment?: string) => {
    const result = await bulkApprove(Array.from(selectedIds), comment)
    if (result.succeeded.length > 0) {
      await refetch()
      setSelectedIds(new Set())
      setBulkAction(null)
    }
  }

  const handleBulkReject = async (comment: string) => {
    const result = await bulkReject(Array.from(selectedIds), comment)
    if (result.succeeded.length > 0) {
      await refetch()
      setSelectedIds(new Set())
      setBulkAction(null)
    }
  }

  const handleRowClick = (approval: PendingApprovalWithRisk) => {
    setActiveApproval(approval)
    setIsDrawerOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <AppSidebar />
        <main className="ml-64 px-8 py-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <AppSidebar />

      <main className="ml-64 px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display-2 text-navy mb-2">Pending Approvals</h1>
          <p className="text-lg text-navy/70">
            Review and approve or reject expense transactions over your team's threshold
          </p>
        </div>

        {/* Empty State */}
        {approvals.length === 0 ? (
          <Card className="border-0 shadow-card">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-navy mb-2">No pending approvals 🎉</h3>
                <p className="text-navy/60">
                  All team expenses above the threshold have been reviewed
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Filters Toolbar */}
            <ApprovalFiltersToolbar
              filters={filters}
              onFiltersChange={setFilters}
              totalPending={filteredAndSortedApprovals.length}
              totalAmount={totalAmount}
              selectedCount={selectedIds.size}
              onApproveSelected={() => setBulkAction('approve')}
              onRejectSelected={() => setBulkAction('reject')}
              bulkLoading={bulkApproving || bulkRejecting}
              categories={categories}
            />

            {/* Desktop Table View */}
            <div className="hidden md:block">
              {groupedApprovals.map(({ group, approvals: groupApprovals }, index) => (
                <div key={group || index} className="space-y-3 mb-6">
                  {group && (
                    <h3 className="text-lg font-semibold text-navy px-2">{group}</h3>
                  )}
                  <ApprovalTable
                    approvals={groupApprovals}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    sort={sort}
                    onSortChange={setSort}
                    onRowClick={handleRowClick}
                  />
                </div>
              ))}
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden">
              {groupedApprovals.map(({ group, approvals: groupApprovals }, index) => (
                <div key={group || index} className="space-y-3 mb-6">
                  {group && (
                    <h3 className="text-lg font-semibold text-navy px-2">{group}</h3>
                  )}
                  <ApprovalMobileList
                    approvals={groupApprovals}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    onViewDetails={handleRowClick}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Details Drawer */}
      <ApprovalDetailsDrawer
        approval={activeApproval}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onApprove={handleApprove}
        onReject={handleReject}
        processing={approving || rejecting}
      />

      {/* Bulk Action Dialog */}
      {bulkAction && (
        <BulkActionDialog
          open={!!bulkAction}
          onOpenChange={(open) => !open && setBulkAction(null)}
          action={bulkAction}
          count={selectedIds.size}
          totalAmount={selectedTotalAmount}
          onConfirm={bulkAction === 'approve' ? handleBulkApprove : handleBulkReject}
          loading={bulkApproving || bulkRejecting}
        />
      )}
    </div>
  )
}
