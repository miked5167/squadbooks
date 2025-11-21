'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency, getHealthStatus, getHealthColor, type BudgetCategory } from '@/lib/types/budget'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface BudgetCategoryRowProps {
  category: BudgetCategory
  onClick?: () => void
}

export function BudgetCategoryRow({ category, onClick }: BudgetCategoryRowProps) {
  const [isHovered, setIsHovered] = useState(false)

  const {
    id,
    name,
    allocated,
    spent,
    remaining,
    percentUsed,
    trend,
    lastExpenseDate,
    transactionCount,
  } = category

  const healthStatus = getHealthStatus(percentUsed)
  const healthColor = getHealthColor(healthStatus)

  // Determine trend icon and color
  const getTrendIcon = () => {
    if (trend === undefined || trend === 0) {
      return <Minus className="w-3 h-3" />
    }
    return trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
  }

  const getTrendColor = () => {
    if (trend === undefined || trend === 0) return 'text-navy/40'
    return trend > 0 ? 'text-red-600' : 'text-green-600'
  }

  const trendText = trend !== undefined && trend !== 0
    ? `${trend > 0 ? '↑' : '↓'} ${Math.abs(trend).toFixed(0)}% vs last month`
    : 'No change vs last month'

  return (
    <div
      className={`group relative transition-all duration-200 ease-in-out ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
      }}
      aria-label={`${name}: ${formatCurrency(spent)} spent of ${formatCurrency(allocated)} allocated, ${percentUsed.toFixed(0)}% used`}
    >
      {/* Hover overlay */}
      {onClick && (
        <div
          className={`absolute inset-0 bg-navy/5 rounded-lg transition-opacity duration-200 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      <div className="relative p-4">
        {/* Category name and amounts */}
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-sm font-semibold text-navy group-hover:text-navy/80 transition-colors">
            {name}
          </h4>
          <div className="text-right ml-4">
            <div className="text-sm font-bold text-navy tabular-nums">
              {formatCurrency(spent)} <span className="text-navy/40">/</span> {formatCurrency(allocated)}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative mb-2">
          {/* Background track */}
          <div className="h-8 bg-navy/10 rounded-full overflow-hidden">
            {/* Progress fill */}
            <div
              className="h-full transition-all duration-300 ease-out relative"
              style={{
                width: `${Math.min(percentUsed, 100)}%`,
                backgroundColor: healthColor,
              }}
            >
              {/* Percentage overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white drop-shadow-sm tabular-nums">
                  {percentUsed.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          {/* Over budget indicator */}
          {percentUsed > 100 && (
            <div className="absolute top-0 right-0 h-8 flex items-center pr-2">
              <span className="text-xs font-bold text-red-600 drop-shadow-sm">
                Over by {formatCurrency(Math.abs(remaining))}
              </span>
            </div>
          )}
        </div>

        {/* Remaining amount and trend */}
        <div className="flex items-center justify-between text-xs">
          <div className={`font-medium ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {remaining >= 0 ? formatCurrency(remaining) : `${formatCurrency(Math.abs(remaining))}`} {remaining >= 0 ? 'remaining' : 'over'}
          </div>
          <div className={`flex items-center gap-1 font-medium ${getTrendColor()}`}>
            {getTrendIcon()}
            <span>{trendText}</span>
          </div>
        </div>

        {/* Tooltip on hover */}
        {isHovered && onClick && (
          <div className="absolute left-0 right-0 top-full mt-2 z-10 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="bg-navy text-white text-xs rounded-lg p-3 shadow-lg mx-4">
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-navy/80">Allocated:</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(allocated)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-navy/80">Spent:</span>
                  <span className="font-semibold tabular-nums">{formatCurrency(spent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-navy/80">Remaining:</span>
                  <span className={`font-semibold tabular-nums ${remaining >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {formatCurrency(Math.abs(remaining))}
                  </span>
                </div>
                {lastExpenseDate && (
                  <div className="flex justify-between pt-1.5 border-t border-white/20">
                    <span className="text-navy/80">Last expense:</span>
                    <span className="font-medium">
                      {new Date(lastExpenseDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-navy/80">Transactions:</span>
                  <span className="font-medium tabular-nums">{transactionCount}</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-white/20 text-center text-golden font-medium">
                Click to view transactions →
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Focus indicator */}
      {onClick && (
        <div className="absolute inset-0 rounded-lg border-2 border-transparent group-focus-visible:border-navy pointer-events-none" />
      )}
    </div>
  )
}
