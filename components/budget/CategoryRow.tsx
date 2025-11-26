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
      className="pl-6 pr-6 py-4 border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0 ring-2 ring-offset-1"
            style={{ backgroundColor: category.categoryColor, ringColor: category.categoryColor + '40' }}
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h4 className="font-semibold text-navy text-sm sm:text-base">
                {category.categoryName}
              </h4>
              <span className="text-sm text-navy/60 tabular-nums">
                ${category.spent.toLocaleString()} / ${category.allocated.toLocaleString()}
              </span>
              <span className="text-xs font-medium text-navy/50">
                ({category.percentage.toFixed(0)}% used)
              </span>
            </div>
            {category.pending > 0 && (
              <div className="flex items-center gap-1 text-xs text-golden mt-1">
                <Clock className="w-3 h-3" />
                <span>{formatCurrency(category.pending)} pending</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
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
            className="h-9 w-9 p-0 hover:bg-navy/10"
            aria-label={`Edit budget for ${category.categoryName}`}
          >
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress Bar - Using category color */}
      <div className="mb-2">
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200">
          <div
            className="h-3 rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(category.percentage, 100)}%`,
              backgroundColor: category.categoryColor,
              opacity: category.percentage > 90 ? 0.9 : category.percentage > 70 ? 0.85 : 0.8,
            }}
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

      {/* Bottom Row: Remaining */}
      <div className="flex justify-between items-center text-sm">
        <span className={`font-semibold ${category.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatCurrency(category.remaining)} remaining
        </span>
        <StatusBadge status={status} difference={difference} className="hidden sm:flex text-xs" />
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
