'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, type BudgetHeadingGroup } from '@/lib/types/budget'

interface BudgetAllocationChartProps {
  groups: BudgetHeadingGroup[]
  totalBudget: number
  onSegmentClick?: (heading: string) => void
}

export function BudgetAllocationChart({ groups, totalBudget, onSegmentClick }: BudgetAllocationChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const handleSegmentClick = (heading: string) => {
    if (onSegmentClick) {
      onSegmentClick(heading)
    }
  }

  return (
    <Card className="border-0 shadow-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-navy">
          Budget Allocation by Category
        </CardTitle>
        <p className="text-sm text-navy/60 mt-1">
          <span className="font-medium">Total Budget:</span>{' '}
          <span className="font-bold tabular-nums text-navy">{formatCurrency(totalBudget)}</span>
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Horizontal stacked bar - Desktop */}
        <div className="hidden md:block relative pb-24">
          <div className="relative h-16 bg-navy/5 rounded-full overflow-hidden shadow-inner">
            {groups.map((group, index) => {
              const leftOffset = groups
                .slice(0, index)
                .reduce((sum, g) => sum + g.percentOfTotal, 0)

              return (
                <div
                  key={group.heading}
                  className="absolute top-0 h-full transition-all duration-300 ease-out cursor-pointer hover:opacity-90 hover:scale-105"
                  style={{
                    left: `${leftOffset}%`,
                    width: `${group.percentOfTotal}%`,
                    backgroundColor: group.color,
                  }}
                  onClick={() => handleSegmentClick(group.heading)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${group.heading}: ${formatCurrency(group.allocated)}, ${group.percentOfTotal.toFixed(0)}% of total budget. Click to jump to category.`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleSegmentClick(group.heading)
                    }
                  }}
                >
                  {/* Dollar amount label (only show if segment is wide enough) */}
                  {group.percentOfTotal >= 5 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white drop-shadow-sm tabular-nums">
                        {formatCurrency(group.allocated)}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Tooltip - Positioned absolutely to prevent layout shift */}
          <div className="absolute top-full left-0 right-0 h-24 pointer-events-none">
            {hoveredIndex !== null && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-1 duration-200 pointer-events-auto">
                <div
                  className="inline-block bg-navy text-white rounded-lg p-3 shadow-lg cursor-pointer"
                  style={{ backgroundColor: groups[hoveredIndex].color }}
                  onClick={() => handleSegmentClick(groups[hoveredIndex].heading)}
                >
                  <div className="font-semibold text-sm mb-1">{groups[hoveredIndex].heading}</div>
                  <div className="text-xs space-y-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-lg tabular-nums">
                        {formatCurrency(groups[hoveredIndex].allocated)}
                      </span>
                      <span className="opacity-90">
                        ({groups[hoveredIndex].percentOfTotal.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="opacity-90">
                      Spent: {formatCurrency(groups[hoveredIndex].spent)}
                    </div>
                    <div className="opacity-75 italic mt-1">Click to jump to category</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Vertical stacked list - Mobile */}
        <div className="md:hidden space-y-2">
          {groups.map((group) => (
            <div
              key={group.heading}
              className="flex items-center gap-3 p-3 rounded-lg bg-cream border border-navy/10"
            >
              <div
                className="w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: group.color }}
              >
                <span className="text-lg font-bold text-white tabular-nums">
                  {group.percentOfTotal.toFixed(0)}%
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-navy truncate">{group.heading}</div>
                <div className="text-xs text-navy/60">
                  {formatCurrency(group.allocated)} allocated
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-navy tabular-nums">
                  {formatCurrency(group.spent)}
                </div>
                <div className="text-xs text-navy/60">spent</div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend - Desktop */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {groups.map((group, index) => (
            <div
              key={group.heading}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-cream/50 transition-colors cursor-pointer"
              onClick={() => handleSegmentClick(group.heading)}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleSegmentClick(group.heading)
                }
              }}
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: group.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-navy truncate">{group.heading}</div>
                <div className="text-xs text-navy/60 tabular-nums">
                  {group.percentOfTotal.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
