'use client'

import { useState } from 'react'
import { ArrowUpDown, Eye, AlertTriangle } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { PendingApprovalWithRisk, ApprovalSort } from '@/lib/types/approvals'
import { getRiskBadgeClass } from '@/lib/utils/approval-risk'
import { cn } from '@/lib/utils'

interface ApprovalTableProps {
  approvals: PendingApprovalWithRisk[]
  selectedIds: Set<string>
  onSelectionChange: (selectedIds: Set<string>) => void
  sort: ApprovalSort
  onSortChange: (sort: ApprovalSort) => void
  onRowClick: (approval: PendingApprovalWithRisk) => void
}

export function ApprovalTable({
  approvals,
  selectedIds,
  onSelectionChange,
  sort,
  onSortChange,
  onRowClick,
}: ApprovalTableProps) {
  const allSelected = approvals.length > 0 && approvals.every((a) => selectedIds.has(a.id))
  const someSelected = approvals.some((a) => selectedIds.has(a.id)) && !allSelected

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(approvals.map((a) => a.id)))
    }
  }

  const toggleRow = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    onSelectionChange(newSet)
  }

  const handleSort = (field: ApprovalSort['field']) => {
    if (sort.field === field) {
      onSortChange({ field, direction: sort.direction === 'asc' ? 'desc' : 'asc' })
    } else {
      onSortChange({ field, direction: 'desc' })
    }
  }

  const SortableHeader = ({
    field,
    children,
  }: {
    field: ApprovalSort['field']
    children: React.ReactNode
  }) => (
    <Button
      variant="ghost"
      onClick={() => handleSort(field)}
      className="h-auto p-0 hover:bg-transparent font-semibold"
    >
      {children}
      <ArrowUpDown
        className={cn(
          'ml-2 h-4 w-4',
          sort.field === field ? 'text-navy' : 'text-navy/40'
        )}
      />
    </Button>
  )

  return (
    <div className="rounded-md border border-navy/10 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-navy/5 hover:bg-navy/5">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleAll}
                aria-label="Select all"
                className="border-navy/40"
                ref={(el) => {
                  if (el) {
                    el.indeterminate = someSelected
                  }
                }}
              />
            </TableHead>
            <TableHead>
              <SortableHeader field="vendor">Vendor</SortableHeader>
            </TableHead>
            <TableHead className="text-right">
              <SortableHeader field="amount">Amount</SortableHeader>
            </TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>
              <SortableHeader field="submittedAt">Submitted</SortableHeader>
            </TableHead>
            <TableHead>
              <SortableHeader field="transactionDate">Transaction Date</SortableHeader>
            </TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {approvals.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-24 text-center text-navy/60">
                No pending approvals found
              </TableCell>
            </TableRow>
          ) : (
            approvals.map((approval) => {
              const isSelected = selectedIds.has(approval.id)
              const amount = Number(approval.transaction.amount)
              const isHighRisk = approval.riskLevel === 'HIGH'

              return (
                <TableRow
                  key={approval.id}
                  className={cn(
                    'cursor-pointer transition-colors',
                    isSelected && 'bg-meadow/5',
                    isHighRisk && 'bg-red-50/50'
                  )}
                  onClick={(e) => {
                    // Don't trigger row click if clicking checkbox
                    if ((e.target as HTMLElement).closest('button[role="checkbox"]')) {
                      return
                    }
                    onRowClick(approval)
                  }}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleRow(approval.id)}
                      aria-label={`Select ${approval.transaction.vendor}`}
                      className="border-navy/40"
                    />
                  </TableCell>
                  <TableCell className="font-medium text-navy">
                    {approval.transaction.vendor}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {isHighRisk && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <div className="space-y-1">
                                <p className="font-semibold">High Risk Transaction</p>
                                {approval.riskReasons.map((reason, idx) => (
                                  <p key={idx} className="text-xs">
                                    • {reason}
                                  </p>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      <span className="font-semibold text-navy">
                        ${amount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="text-navy/60">{approval.transaction.category.heading}</span>
                      <span className="text-navy/40 mx-1">›</span>
                      <span className="text-navy">{approval.transaction.category.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-navy/70">
                    <div>
                      <div className="font-medium text-navy text-sm">
                        {approval.transaction.creator.name}
                      </div>
                      <div className="text-xs text-navy/60 capitalize">
                        {approval.transaction.creator.role.toLowerCase().replace('_', ' ')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-navy/70 text-sm">
                    {new Date(approval.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-navy/70 text-sm">
                    {new Date(approval.transaction.transactionDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Badge variant="outline" className={getRiskBadgeClass(approval.riskLevel)}>
                            {approval.riskLevel}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          {approval.riskReasons.length > 0 ? (
                            <div className="space-y-1">
                              {approval.riskReasons.map((reason, idx) => (
                                <p key={idx} className="text-xs">
                                  • {reason}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs">Standard transaction</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-golden/10 text-golden border-golden/30">
                      {approval.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRowClick(approval)}
                      className="gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
