/**
 * Filters toolbar for exceptions inbox
 */

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import type { TransactionWithValidation } from '@/lib/types/exceptions'

interface ExceptionFiltersToolbarProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  categoryFilter: string[]
  onCategoryFilterChange: (categories: string[]) => void
  severityFilter: string[]
  onSeverityFilterChange: (severities: string[]) => void
  showSeverityFilter: boolean
  totalCount: number
  transactions: TransactionWithValidation[]
}

export function ExceptionFiltersToolbar({
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  severityFilter,
  onSeverityFilterChange,
  showSeverityFilter,
  totalCount,
  transactions,
}: ExceptionFiltersToolbarProps) {
  // Get unique categories
  const categories = Array.from(
    new Set(transactions.map((t) => t.category?.name).filter(Boolean))
  ) as string[]

  // Get severity counts
  const severityCounts = {
    CRITICAL: transactions.filter((t) => t.exceptionSeverity === 'CRITICAL').length,
    HIGH: transactions.filter((t) => t.exceptionSeverity === 'HIGH').length,
    MEDIUM: transactions.filter((t) => t.exceptionSeverity === 'MEDIUM').length,
    LOW: transactions.filter((t) => t.exceptionSeverity === 'LOW').length,
  }

  const toggleSeverity = (severity: string) => {
    if (severityFilter.includes(severity)) {
      onSeverityFilterChange(severityFilter.filter((s) => s !== severity))
    } else {
      onSeverityFilterChange([...severityFilter, severity])
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Total */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy/40" />
          <Input
            type="text"
            placeholder="Search by vendor, description..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="text-sm text-navy/70">
          Showing <span className="font-semibold text-navy">{totalCount}</span> transaction(s)
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Category Filter */}
        {categories.length > 0 && (
          <Select
            value={categoryFilter[0] || 'all'}
            onValueChange={(value) => {
              if (value === 'all') {
                onCategoryFilterChange([])
              } else {
                onCategoryFilterChange([value])
              }
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Severity Filter (Exceptions only) */}
        {showSeverityFilter && (
          <div className="flex gap-2">
            <span className="text-sm text-navy/70 self-center">Severity:</span>
            {severityCounts.CRITICAL > 0 && (
              <Badge
                variant={severityFilter.includes('CRITICAL') ? 'default' : 'outline'}
                className={`cursor-pointer ${
                  severityFilter.includes('CRITICAL')
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'hover:bg-red-50'
                }`}
                onClick={() => toggleSeverity('CRITICAL')}
              >
                Critical ({severityCounts.CRITICAL})
              </Badge>
            )}
            {severityCounts.HIGH > 0 && (
              <Badge
                variant={severityFilter.includes('HIGH') ? 'default' : 'outline'}
                className={`cursor-pointer ${
                  severityFilter.includes('HIGH')
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'hover:bg-orange-50'
                }`}
                onClick={() => toggleSeverity('HIGH')}
              >
                High ({severityCounts.HIGH})
              </Badge>
            )}
            {severityCounts.MEDIUM > 0 && (
              <Badge
                variant={severityFilter.includes('MEDIUM') ? 'default' : 'outline'}
                className={`cursor-pointer ${
                  severityFilter.includes('MEDIUM')
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'hover:bg-yellow-50'
                }`}
                onClick={() => toggleSeverity('MEDIUM')}
              >
                Medium ({severityCounts.MEDIUM})
              </Badge>
            )}
            {severityCounts.LOW > 0 && (
              <Badge
                variant={severityFilter.includes('LOW') ? 'default' : 'outline'}
                className={`cursor-pointer ${
                  severityFilter.includes('LOW')
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'hover:bg-blue-50'
                }`}
                onClick={() => toggleSeverity('LOW')}
              >
                Low ({severityCounts.LOW})
              </Badge>
            )}
          </div>
        )}

        {/* Active Filters Count */}
        {(categoryFilter.length > 0 || severityFilter.length > 0) && (
          <button
            onClick={() => {
              onCategoryFilterChange([])
              onSeverityFilterChange([])
            }}
            className="text-sm text-navy/70 hover:text-navy underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  )
}
