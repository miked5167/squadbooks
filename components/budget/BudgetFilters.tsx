/**
 * BudgetFilters Component
 * Search and filter controls for budget categories
 */

'use client'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, X, Filter } from 'lucide-react'
import { type BudgetStatus } from '@/lib/utils/budgetStatus'

export type FilterStatus = 'all' | BudgetStatus

interface BudgetFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filterStatus: FilterStatus
  onFilterChange: (status: FilterStatus) => void
  resultCount: number
  totalCount: number
  showSpendingOnly?: boolean
  onShowSpendingOnlyChange?: (value: boolean) => void
}

export function BudgetFilters({
  searchQuery,
  onSearchChange,
  filterStatus,
  onFilterChange,
  resultCount,
  totalCount,
  showSpendingOnly = false,
  onShowSpendingOnlyChange,
}: BudgetFiltersProps) {
  const hasActiveFilters = searchQuery !== '' || filterStatus !== 'all' || showSpendingOnly

  const handleClearAll = () => {
    onSearchChange('')
    onFilterChange('all')
    if (onShowSpendingOnlyChange) {
      onShowSpendingOnlyChange(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
        <Input
          type="text"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
          aria-label="Search budget categories"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5 text-sm text-navy/60">
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filter:</span>
        </div>

        <Button
          variant={filterStatus === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('all')}
          className={filterStatus === 'all' ? 'bg-navy hover:bg-navy-medium text-white' : ''}
        >
          All
        </Button>

        <Button
          variant={filterStatus === 'under' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('under')}
          className={filterStatus === 'under' ? 'bg-green-600 hover:bg-green-700 text-white' : ''}
        >
          Under Budget
        </Button>

        <Button
          variant={filterStatus === 'warning' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('warning')}
          className={filterStatus === 'warning' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}
        >
          At Risk
        </Button>

        <Button
          variant={filterStatus === 'over' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onFilterChange('over')}
          className={filterStatus === 'over' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
        >
          Over Budget
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-navy/60 hover:text-navy ml-auto"
          >
            <X className="w-3 h-3 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Show Spending Only Checkbox */}
      {onShowSpendingOnlyChange && (
        <div className="flex items-center gap-2 pl-6">
          <Checkbox
            id="show-spending-only"
            checked={showSpendingOnly}
            onCheckedChange={(checked) => onShowSpendingOnlyChange(checked as boolean)}
            className="border-navy/30"
          />
          <label
            htmlFor="show-spending-only"
            className="text-sm text-navy/70 cursor-pointer select-none"
          >
            Show categories with spending only
          </label>
        </div>
      )}

      {/* Results Count */}
      {hasActiveFilters && (
        <div className="text-sm text-navy/60">
          Showing {resultCount} of {totalCount} categories
        </div>
      )}
    </div>
  )
}
