/**
 * StatusBadge Component
 * Displays budget status with clear, explicit labels and icons
 */

import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, AlertCircle, MinusCircle } from 'lucide-react'
import { type BudgetStatus, getStatusBgClass, getStatusLabel } from '@/lib/utils/budgetStatus'

interface StatusBadgeProps {
  status: BudgetStatus
  difference: number // Amount under or over budget
  className?: string
}

export function StatusBadge({ status, difference, className = '' }: StatusBadgeProps) {
  const label = getStatusLabel(status, difference)
  const bgClass = getStatusBgClass(status)

  // Select icon based on status
  const Icon = {
    under: CheckCircle,
    'on-track': MinusCircle,
    warning: AlertTriangle,
    over: AlertCircle,
  }[status]

  return (
    <Badge
      variant="outline"
      className={`${bgClass} flex items-center gap-1.5 px-3 py-1.5 font-medium ${className}`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </Badge>
  )
}
