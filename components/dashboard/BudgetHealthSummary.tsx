'use client'

import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency, type BudgetSummary } from '@/lib/types/budget'
import { Clock } from 'lucide-react'

interface BudgetHealthSummaryProps {
  summary: BudgetSummary
}

export function BudgetHealthSummary({ summary }: BudgetHealthSummaryProps) {
  const {
    totalBudget,
    totalSpent,
    percentUsed,
    categoriesOnTrack,
    categoriesWarning,
    categoriesOverBudget,
    projectedSurplusDeficit,
    season,
    lastUpdated,
  } = summary

  // Format time ago
  const timeAgo = getTimeAgo(lastUpdated)

  // Format projected surplus/deficit
  const projectedText =
    projectedSurplusDeficit >= 0
      ? `${formatCurrency(projectedSurplusDeficit)} surplus`
      : `${formatCurrency(Math.abs(projectedSurplusDeficit))} deficit`

  const projectedColor = projectedSurplusDeficit >= 0 ? 'text-green-600' : 'text-red-600'

  return (
    <Card className="border-0 shadow-card">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-navy">Budget Health Summary</h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-navy/60">
              <span className="font-medium">{season}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Updated {timeAgo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Budget Overview */}
        <div className="mb-6 p-4 bg-gradient-to-r from-navy/5 to-navy/10 rounded-lg">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-3xl font-bold text-navy tabular-nums">
              {formatCurrency(totalBudget)}
            </span>
            <span className="text-sm text-navy/60">total</span>
            <span className="text-navy/40">|</span>
            <span className="text-2xl font-semibold text-navy tabular-nums">
              {formatCurrency(totalSpent)}
            </span>
            <span className="text-sm text-navy/60">spent</span>
            <span
              className={`text-lg font-medium tabular-nums ${
                percentUsed > 90 ? 'text-red-600' : percentUsed > 75 ? 'text-amber-600' : 'text-green-600'
              }`}
            >
              ({percentUsed.toFixed(0)}%)
            </span>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* On Track */}
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🟢</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-700 tabular-nums">
                {categoriesOnTrack}
              </div>
              <div className="text-xs font-medium text-green-600">On Track</div>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🟡</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-700 tabular-nums">
                {categoriesWarning}
              </div>
              <div className="text-xs font-medium text-amber-600">Need Attention</div>
            </div>
          </div>

          {/* Over Budget */}
          <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-100">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🔴</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-700 tabular-nums">
                {categoriesOverBudget}
              </div>
              <div className="text-xs font-medium text-red-600">Over Budget</div>
            </div>
          </div>
        </div>

        {/* Projected Surplus/Deficit */}
        <div className="pt-4 border-t border-navy/10">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-navy/70">Projected Season End:</span>
            <span className={`text-base font-semibold tabular-nums ${projectedColor}`}>
              {projectedText}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Format a date to a relative time string (e.g., "2 hours ago")
 */
function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
