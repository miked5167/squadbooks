'use client'

import { Search, Filter, CheckCircle, XCircle } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ApprovalFilters, RiskLevel } from '@/lib/types/approvals'

interface ApprovalFiltersToolbarProps {
  filters: ApprovalFilters
  onFiltersChange: (filters: ApprovalFilters) => void
  totalPending: number
  totalAmount: number
  selectedCount: number
  onApproveSelected: () => void
  onRejectSelected: () => void
  bulkLoading: boolean
  categories: Array<{ id: string; name: string; heading: string }>
}

export function ApprovalFiltersToolbar({
  filters,
  onFiltersChange,
  totalPending,
  totalAmount,
  selectedCount,
  onApproveSelected,
  onRejectSelected,
  bulkLoading,
  categories,
}: ApprovalFiltersToolbarProps) {
  const uniqueCategories = Array.from(
    new Set(categories.map((c) => c.heading))
  ).sort()

  const riskLevels: RiskLevel[] = ['LOW', 'MEDIUM', 'HIGH']

  const toggleCategory = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category]
    onFiltersChange({ ...filters, categories: newCategories })
  }

  const toggleRiskLevel = (level: RiskLevel) => {
    const newLevels = filters.riskLevels.includes(level)
      ? filters.riskLevels.filter((l) => l !== level)
      : [...filters.riskLevels, level]
    onFiltersChange({ ...filters, riskLevels: newLevels })
  }

  const hasActiveFilters =
    filters.search ||
    filters.categories.length > 0 ||
    filters.riskLevels.length > 0 ||
    filters.minAmount ||
    filters.maxAmount

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      categories: [],
      riskLevels: [],
      minAmount: undefined,
      maxAmount: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      groupBy: 'NONE',
    })
  }

  return (
    <div className="space-y-4">
      {/* Top row: Search and actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Left side: Search and filters */}
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-navy/40 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search vendor, description..."
              value={filters.search}
              onChange={(e) =>
                onFiltersChange({ ...filters, search: e.target.value })
              }
              className="pl-9"
            />
          </div>

          {/* Filters dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                    {filters.categories.length +
                      filters.riskLevels.length +
                      (filters.minAmount ? 1 : 0) +
                      (filters.maxAmount ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 bg-white">
              <DropdownMenuLabel className="text-navy font-semibold">Filter by Category</DropdownMenuLabel>
              {uniqueCategories.map((category) => (
                <DropdownMenuCheckboxItem
                  key={category}
                  checked={filters.categories.includes(category)}
                  onCheckedChange={() => toggleCategory(category)}
                  className="text-navy font-medium cursor-pointer"
                >
                  {category}
                </DropdownMenuCheckboxItem>
              ))}

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-navy font-semibold">Filter by Risk Level</DropdownMenuLabel>
              {riskLevels.map((level) => (
                <DropdownMenuCheckboxItem
                  key={level}
                  checked={filters.riskLevels.includes(level)}
                  onCheckedChange={() => toggleRiskLevel(level)}
                  className="text-navy font-medium cursor-pointer"
                >
                  {level}
                </DropdownMenuCheckboxItem>
              ))}

              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-navy hover:bg-navy/10"
                    onClick={clearFilters}
                  >
                    Clear all filters
                  </Button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Group by */}
          <Select
            value={filters.groupBy}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                groupBy: value as ApprovalFilters['groupBy'],
              })
            }
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Group by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">No grouping</SelectItem>
              <SelectItem value="CATEGORY">By Category</SelectItem>
              <SelectItem value="VENDOR">By Vendor</SelectItem>
              <SelectItem value="RISK">By Risk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Right side: Summary and bulk actions */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
          {/* Summary */}
          <div className="text-sm text-navy/70">
            <span className="font-semibold text-navy">{totalPending}</span> pending
            transactions •{' '}
            <span className="font-semibold text-navy">
              ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>{' '}
            total
          </div>

          {/* Bulk action buttons */}
          {selectedCount > 0 && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={onApproveSelected}
                disabled={bulkLoading}
                className="gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
              >
                <CheckCircle className="w-4 h-4" />
                Approve ({selectedCount})
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onRejectSelected}
                disabled={bulkLoading}
                className="gap-2 bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
              >
                <XCircle className="w-4 h-4" />
                Reject ({selectedCount})
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
