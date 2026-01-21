/**
 * Budget Status Badge Component
 *
 * Displays the current status of a budget with appropriate styling
 */

import { Badge } from '@/components/ui/badge'
import { BudgetStatus } from '@prisma/client'
import { getBudgetStatusBadge } from '@/lib/types/budget-workflow'
import { Clock, CheckCircle2, Lock, Eye, FileCheck, AlertCircle } from 'lucide-react'

interface BudgetStatusBadgeProps {
  status: BudgetStatus
  showDescription?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const statusIcons = {
  [BudgetStatus.DRAFT]: Clock,
  [BudgetStatus.REVIEW]: AlertCircle,
  [BudgetStatus.TEAM_APPROVED]: CheckCircle2,
  [BudgetStatus.PRESENTED]: Eye,
  [BudgetStatus.APPROVED]: FileCheck,
  [BudgetStatus.LOCKED]: Lock,
}

export function BudgetStatusBadge({
  status,
  showDescription = false,
  size = 'md'
}: BudgetStatusBadgeProps) {
  const badge = getBudgetStatusBadge(status)
  const Icon = statusIcons[status]

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  return (
    <div className="flex flex-col gap-1">
      <Badge
        variant={badge.variant}
        className={`flex items-center gap-1.5 w-fit ${sizeClasses[size]}`}
      >
        <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
        {badge.label}
      </Badge>
      {showDescription && (
        <p className="text-xs text-muted-foreground">{badge.description}</p>
      )}
    </div>
  )
}
