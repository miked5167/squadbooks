/**
 * CategoryRow Component
 * Displays individual budget category with progress bar and status
 */

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Edit, Clock } from 'lucide-react'
import { StatusBadge } from './StatusBadge'
import { getBudgetStatus, getProgressBarColor, formatCurrency } from '@/lib/utils/budgetStatus'

interface CategoryRowProps {
  category: {
    categoryId: string
    categoryName: string
    categoryColor: string
    allocated: number
    spent: number
    pending: number
    remaining: number
    percentage: number
    projectedPercentage: number
  }
  onEdit: (category: { id: string; name: string; allocated: number }) => void
  onClick?: () => void
}

export function CategoryRow({ category, onEdit, onClick }: CategoryRowProps) {
  const status = getBudgetStatus(category.allocated, category.spent)
  const difference = category.remaining
  const progressColor = getProgressBarColor(category.percentage)

  return (
    <div
      className="pl-6 pr-6 py-4 border-b border-gray-100 last:border-0 hover:bg-gray-100 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: category.categoryColor }}
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-navy text-sm sm:text-base truncate">
              {category.categoryName}
            </h4>
            <p className="text-sm text-navy/60 mt-0.5">
              {formatCurrency(category.spent)} of {formatCurrency(category.allocated)} spent
            </p>
            {category.pending > 0 && (
              <div className="flex items-center gap-1 text-xs text-golden mt-1">
                <Clock className="w-3 h-3" />
                <span>{formatCurrency(category.pending)} pending</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <StatusBadge
            status={status}
            difference={difference}
            className="hidden sm:flex"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit({
                id: category.categoryId,
                name: category.categoryName,
                allocated: category.allocated,
              })
            }}
            className="h-9 w-9 p-0"
            aria-label={`Edit budget for ${category.categoryName}`}
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div
            className={`${progressColor} h-2.5 rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(category.percentage, 100)}%` }}
            role="progressbar"
            aria-valuenow={category.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${category.percentage.toFixed(0)}% of budget used`}
          />
        </div>
      </div>

      {/* Status Info - Mobile Only */}
      <div className="sm:hidden mb-2">
        <StatusBadge status={status} difference={difference} className="w-full justify-center" />
      </div>

      {/* Bottom Row: Remaining & Percentage */}
      <div className="flex justify-between text-sm">
        <span className="font-medium text-navy/70">
          {formatCurrency(category.remaining)} remaining
        </span>
        <span className="text-navy/60">
          {category.percentage.toFixed(0)}% used
        </span>
      </div>

      {/* Projected with Pending */}
      {category.pending > 0 && category.projectedPercentage !== category.percentage && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-navy/60">Projected (with pending):</span>
            <span className={`font-medium ${
              category.projectedPercentage >= 90 ? 'text-red-600' :
              category.projectedPercentage >= 70 ? 'text-amber-600' :
              'text-green-600'
            }`}>
              {category.projectedPercentage.toFixed(0)}% projected
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
