'use client'

import { AlertTriangle, Eye, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import type { PendingApprovalWithRisk } from '@/lib/types/approvals'
import { getRiskBadgeClass } from '@/lib/utils/approval-risk'
import { cn } from '@/lib/utils'

interface ApprovalMobileCardProps {
  approval: PendingApprovalWithRisk
  selected: boolean
  onSelect: (id: string) => void
  onViewDetails: (approval: PendingApprovalWithRisk) => void
}

export function ApprovalMobileCard({
  approval,
  selected,
  onSelect,
  onViewDetails,
}: ApprovalMobileCardProps) {
  const amount = Number(approval.transaction.amount)
  const isHighRisk = approval.riskLevel === 'HIGH'

  return (
    <Card
      className={cn(
        'border-0 shadow-card transition-all',
        selected && 'ring-2 ring-meadow',
        isHighRisk && 'bg-red-50/30'
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              checked={selected}
              onCheckedChange={() => onSelect(approval.id)}
              aria-label={`Select ${approval.transaction.vendor}`}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-navy truncate">{approval.transaction.vendor}</h3>
                {isHighRisk && <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />}
              </div>
              <p className="text-2xl font-bold text-navy">
                ${amount.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Category and Risk */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            style={{
              backgroundColor: `${approval.transaction.category.color}20`,
              color: approval.transaction.category.color,
              borderColor: `${approval.transaction.category.color}40`,
            }}
          >
            {approval.transaction.category.name}
          </Badge>
          <Badge variant="outline" className={getRiskBadgeClass(approval.riskLevel)}>
            {approval.riskLevel} Risk
          </Badge>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-navy/60 block text-xs">Created By</span>
            <span className="text-navy font-medium">{approval.transaction.creator.name}</span>
          </div>
          <div>
            <span className="text-navy/60 block text-xs">Transaction Date</span>
            <span className="text-navy font-medium">
              {new Date(approval.transaction.transactionDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>
        </div>

        {/* Submitted Date */}
        <div className="flex items-center gap-2 text-xs text-navy/60">
          <Calendar className="w-3 h-3" />
          <span>
            Submitted{' '}
            {new Date(approval.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Description */}
        {approval.transaction.description && (
          <p className="text-sm text-navy/70 line-clamp-2">{approval.transaction.description}</p>
        )}

        {/* View Details Button */}
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 border-navy/20 text-navy hover:bg-navy/5"
          onClick={() => onViewDetails(approval)}
        >
          <Eye className="w-4 h-4" />
          View Details
        </Button>
      </CardContent>
    </Card>
  )
}

interface ApprovalMobileListProps {
  approvals: PendingApprovalWithRisk[]
  selectedIds: Set<string>
  onSelectionChange: (selectedIds: Set<string>) => void
  onViewDetails: (approval: PendingApprovalWithRisk) => void
}

export function ApprovalMobileList({
  approvals,
  selectedIds,
  onSelectionChange,
  onViewDetails,
}: ApprovalMobileListProps) {
  const toggleRow = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    onSelectionChange(newSet)
  }

  if (approvals.length === 0) {
    return (
      <Card className="border-0 shadow-card">
        <CardContent className="py-12 text-center text-navy/60">
          No pending approvals found
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {approvals.map((approval) => (
        <ApprovalMobileCard
          key={approval.id}
          approval={approval}
          selected={selectedIds.has(approval.id)}
          onSelect={toggleRow}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  )
}
