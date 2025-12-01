'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter, X, ArrowUpDown } from 'lucide-react'

interface BudgetApprovalFiltersProps {
  onFilterChange: (filters: FilterState) => void
}

export interface FilterState {
  status: string
  type: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export function BudgetApprovalFilters({ onFilterChange }: BudgetApprovalFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    status: 'all',
    type: 'all',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const hasActiveFilters = filters.status !== 'all' || filters.type !== 'all'

  const updateFilters = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const defaultFilters: FilterState = {
      status: 'all',
      type: 'all',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }
    setFilters(defaultFilters)
    onFilterChange(defaultFilters)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 p-4 bg-cream rounded-lg border border-navy/10">
      {/* Filter Icon and Label */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-navy/60" />
        <span className="text-sm font-semibold text-navy">Filters:</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 flex-1">
        {/* Status Filter */}
        <Select value={filters.status} onValueChange={(value) => updateFilters({ status: value })}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {/* Type Filter */}
        <Select value={filters.type} onValueChange={(value) => updateFilters({ type: value })}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="INITIAL">Initial Budget</SelectItem>
            <SelectItem value="REPORT">Financial Report</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort By */}
        <Select value={filters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt">Date Created</SelectItem>
            <SelectItem value="expiresAt">Due Date</SelectItem>
            <SelectItem value="budgetTotal">Budget Amount</SelectItem>
            <SelectItem value="progress">Progress</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort Order Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            updateFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })
          }
          className="h-9"
        >
          <ArrowUpDown className="h-4 w-4 mr-1" />
          {filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="h-9 text-navy/70 hover:text-navy"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex gap-2 items-center">
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Status: {filters.status}
            </Badge>
          )}
          {filters.type !== 'all' && (
            <Badge variant="secondary" className="text-xs">
              Type: {filters.type}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
