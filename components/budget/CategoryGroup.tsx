/**
 * CategoryGroup Component
 * Collapsible accordion section grouping budget categories by heading
 */

'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { CategoryRow } from './CategoryRow'
import { StatusBadge } from './StatusBadge'
import { formatCurrency, type CategoryGroup as CategoryGroupType } from '@/lib/utils/budgetStatus'

interface CategoryGroupProps {
  group: CategoryGroupType
  onEdit: (category: { id: string; name: string; allocated: number }) => void
  onCategoryClick?: (categoryId: string) => void
  defaultExpanded?: boolean
}

export function CategoryGroup({ group, onEdit, onCategoryClick, defaultExpanded }: CategoryGroupProps) {
  const [isExpanded, setIsExpanded] = useState(
    defaultExpanded !== undefined ? defaultExpanded : group.isExpanded ?? false
  )

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    }
  }

  return (
    <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Heading Row - Always Visible */}
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className="w-full px-4 sm:px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-colors flex items-center justify-between gap-4 text-left focus:outline-none focus:ring-2 focus:ring-navy focus:ring-offset-2"
        aria-expanded={isExpanded}
        aria-controls={`category-group-${group.heading}`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: group.color }}
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-bold text-navy truncate">
              {group.heading}
            </h3>
            <p className="text-sm text-navy/60 mt-0.5">
              {formatCurrency(group.totalSpent)} / {formatCurrency(group.totalAllocated)}
              <span className="hidden sm:inline"> ({group.percentUsed.toFixed(0)}% used)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Status Badge - Hidden on small mobile */}
          <div className="hidden xs:block">
            <StatusBadge
              status={group.status}
              difference={group.totalRemaining}
              className="text-xs sm:text-sm"
            />
          </div>

          {/* Expand/Collapse Icon */}
          <div className="text-navy/60">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" aria-hidden="true" />
            ) : (
              <ChevronDown className="w-5 h-5" aria-hidden="true" />
            )}
          </div>
        </div>
      </button>

      {/* Category List - Collapsible */}
      <div
        id={`category-group-${group.heading}`}
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
        role="region"
        aria-labelledby={`category-group-${group.heading}-heading`}
      >
        <div className="border-t border-gray-200">
          {group.categories.map((category) => (
            <CategoryRow
              key={category.categoryId}
              category={category}
              onEdit={onEdit}
              onClick={onCategoryClick ? () => onCategoryClick(category.categoryId) : undefined}
            />
          ))}
        </div>
      </div>

      {/* Collapsed Summary - Shows when collapsed */}
      {!isExpanded && (
        <div className="px-4 sm:px-6 py-3 border-t border-gray-200 bg-white">
          <div className="flex items-center justify-between text-sm text-navy/60">
            <span>{group.categories.length} categories</span>
            <span className="font-medium">
              {formatCurrency(group.totalRemaining)} remaining
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
