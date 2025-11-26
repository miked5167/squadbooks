'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency, type BudgetSummary } from '@/lib/types/budget'
import { Clock, HelpCircle } from 'lucide-react'
import type { FilterStatus } from '@/components/budget/BudgetFilters'

interface BudgetHealthSummaryProps {
  summary: BudgetSummary
  onStatusClick?: (status: FilterStatus) => void
}

export function BudgetHealthSummary({ summary, onStatusClick }: BudgetHealthSummaryProps) {
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

  return (
    <Card className="border-0 shadow-card">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-navy">Budget Health Summary</h2>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-navy/40 hover:text-navy/60 transition-colors">
                    <HelpCircle className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-navy text-white max-w-xs">
                  <p className="font-semibold mb-1">Category Status Thresholds:</p>
                  <ul className="space-y-0.5 text-xs">
                    <li>• On Track: &lt; 80% of budget used</li>
                    <li>• Need Attention: 80-100% of budget used</li>
                    <li>• Over Budget: &gt; 100% of budget used</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-2 text-sm text-navy/60">
            <span className="font-medium hidden sm:inline">{season}</span>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Updated {timeAgo}</span>
              <span className="sm:hidden">{timeAgo}</span>
            </div>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          {/* On Track */}
          <button
            onClick={() => onStatusClick?.('under')}
            className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 hover:border-green-200 transition-all cursor-pointer text-left"
            disabled={!onStatusClick}
          >
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🟢</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-700 tabular-nums">
                {categoriesOnTrack}
              </div>
              <div className="text-xs font-medium text-green-600">On Track</div>
            </div>
          </button>

          {/* Warning */}
          <button
            onClick={() => onStatusClick?.('warning')}
            className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100 hover:bg-amber-100 hover:border-amber-200 transition-all cursor-pointer text-left"
            disabled={!onStatusClick}
          >
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🟡</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-700 tabular-nums">
                {categoriesWarning}
              </div>
              <div className="text-xs font-medium text-amber-600">Need Attention</div>
            </div>
          </button>

          {/* Over Budget - More prominent styling */}
          <button
            onClick={() => onStatusClick?.('over')}
            className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border-2 border-red-200 hover:bg-red-100 hover:border-red-300 transition-all cursor-pointer text-left shadow-sm hover:shadow-md"
            disabled={!onStatusClick}
          >
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 border border-red-200">
              <span className="text-xl">🔴</span>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-700 tabular-nums">
                {categoriesOverBudget}
              </div>
              <div className="text-xs font-semibold text-red-600">Over Budget</div>
            </div>
          </button>
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
