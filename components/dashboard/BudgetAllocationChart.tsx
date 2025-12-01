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
        <div className="hidden md:block space-y-4">
          {/* Flex-based segmented bar */}
          <div className="relative">
            <div className="flex h-16 bg-navy/5 rounded-full overflow-hidden shadow-inner">
              {groups.map((group, index) => {
                const isFirstSegment = index === 0
                const isLastSegment = index === groups.length - 1
                const isHovered = hoveredIndex === index

                return (
                  <div
                    key={group.heading}
                    className="relative transition-all duration-200 ease-out cursor-pointer group"
                    style={{
                      flexBasis: `${group.percentOfTotal}%`,
                      flexGrow: 0,
                      flexShrink: 0,
                      minWidth: '40px',
                      backgroundColor: group.color,
                      opacity: isHovered ? 0.9 : 1,
                      transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                      zIndex: isHovered ? 10 : 1,
                      // Preserve rounded corners on outer edges
                      borderTopLeftRadius: isFirstSegment ? '9999px' : '0',
                      borderBottomLeftRadius: isFirstSegment ? '9999px' : '0',
                      borderTopRightRadius: isLastSegment ? '9999px' : '0',
                      borderBottomRightRadius: isLastSegment ? '9999px' : '0',
                    }}
                    onClick={() => handleSegmentClick(group.heading)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onTouchStart={() => setHoveredIndex(index)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${group.heading}: ${formatCurrency(group.allocated)}, ${group.percentOfTotal.toFixed(1)}% of total budget. Click to view details.`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleSegmentClick(group.heading)
                      }
                    }}
                  >
                    {/* No labels inside segments - clean look */}
                  </div>
                )
              })}
            </div>

            {/* Tooltip - appears above the bar */}
            {hoveredIndex !== null && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-20 pointer-events-none">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div
                    className="bg-white text-navy rounded-lg p-3 shadow-xl border-2"
                    style={{ borderColor: groups[hoveredIndex].color }}
                  >
                    <div className="font-semibold text-sm mb-1 whitespace-nowrap">
                      {groups[hoveredIndex].heading}
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-lg tabular-nums">
                        {formatCurrency(groups[hoveredIndex].allocated)}
                      </span>
                      <span className="text-sm text-navy/60">
                        ({groups[hoveredIndex].percentOfTotal.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  {/* Tooltip arrow */}
                  <div
                    className="w-3 h-3 bg-white border-r-2 border-b-2 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1.5"
                    style={{ borderColor: groups[hoveredIndex].color }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Category chips - Desktop legend with amounts & percentages */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
            {groups.map((group, index) => {
              const isHovered = hoveredIndex === index

              return (
                <div
                  key={group.heading}
                  className="flex items-start gap-3 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer"
                  style={{
                    backgroundColor: isHovered ? `${group.color}10` : 'transparent',
                    borderColor: isHovered ? group.color : 'transparent',
                  }}
                  onClick={() => handleSegmentClick(group.heading)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  role="button"
                  tabIndex={0}
                  aria-label={`${group.heading}: ${formatCurrency(group.allocated)}, ${group.percentOfTotal.toFixed(1)}% of budget`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleSegmentClick(group.heading)
                    }
                  }}
                >
                  {/* Colored dot indicator */}
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                    style={{ backgroundColor: group.color }}
                  />

                  <div className="flex-1 min-w-0">
                    {/* Category name */}
                    <div className="text-sm font-semibold text-navy truncate mb-1">
                      {group.heading}
                    </div>

                    {/* Amount and percentage */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-base font-bold text-navy tabular-nums">
                        {formatCurrency(group.allocated)}
                      </span>
                      <span className="text-sm text-navy/60 font-medium">
                        {group.percentOfTotal.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
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
      </CardContent>
    </Card>
  )
}
