'use client'

/**
 * Activity Filters Component
 * Provides filtering and search capabilities for the activity feed
 */

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Search, X, Filter, Calendar } from 'lucide-react'
import { EventCategory, getCategoryLabel, type EventCategoryType } from '@/lib/activity/event-config'
import type { User } from '@prisma/client'

export interface ActivityFilters {
  search: string
  userId: string | null
  categories: EventCategoryType[]
  dateRange: 'all' | 'today' | '7days' | '30days'
  hideOnboarding: boolean
}

interface ActivityFiltersBarProps {
  filters: ActivityFilters
  onFiltersChange: (filters: ActivityFilters) => void
  teamMembers: Pick<User, 'id' | 'name'>[]
  totalResults: number
}

export function ActivityFiltersBar({
  filters,
  onFiltersChange,
  teamMembers,
  totalResults,
}: ActivityFiltersBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search)

  const handleSearchChange = (value: string) => {
    setSearchInput(value)
  }

  const handleSearchSubmit = () => {
    onFiltersChange({ ...filters, search: searchInput })
  }

  const handleCategoryToggle = (category: EventCategoryType) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category]

    onFiltersChange({ ...filters, categories: newCategories })
  }

  const handleResetFilters = () => {
    setSearchInput('')
    onFiltersChange({
      search: '',
      userId: null,
      categories: [],
      dateRange: '7days',
      hideOnboarding: true,
    })
  }

  const hasActiveFilters =
    filters.search ||
    filters.userId ||
    filters.categories.length > 0 ||
    filters.dateRange !== '7days' ||
    !filters.hideOnboarding

  return (
    <div className="space-y-4">
      {/* Search and Primary Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
          <Input
            placeholder="Search by vendor, amount, category, or user..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearchSubmit()
              }
            }}
            className="pl-10 pr-10"
          />
          {searchInput && (
            <button
              onClick={() => {
                setSearchInput('')
                if (filters.search) {
                  onFiltersChange({ ...filters, search: '' })
                }
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-navy/40 hover:text-navy"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Date Range Selector */}
        <Select
          value={filters.dateRange}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, dateRange: value as ActivityFilters['dateRange'] })
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>

        {/* User Filter */}
        <Select
          value={filters.userId || 'all'}
          onValueChange={(value) =>
            onFiltersChange({ ...filters, userId: value === 'all' ? null : value })
          }
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {teamMembers.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-navy/60 font-medium">Filter by:</span>
        {Object.values(EventCategory).map((category) => {
          const isActive = filters.categories.includes(category)
          return (
            <Badge
              key={category}
              variant={isActive ? 'default' : 'outline'}
              className={`cursor-pointer transition-colors ${
                isActive
                  ? 'bg-navy text-white hover:bg-navy/90'
                  : 'hover:bg-navy/5'
              }`}
              onClick={() => handleCategoryToggle(category)}
            >
              {getCategoryLabel(category)}
            </Badge>
          )
        })}

        {/* Hide Onboarding Toggle */}
        <Badge
          variant={filters.hideOnboarding ? 'default' : 'outline'}
          className={`cursor-pointer transition-colors ${
            filters.hideOnboarding
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'hover:bg-purple-50'
          }`}
          onClick={() =>
            onFiltersChange({ ...filters, hideOnboarding: !filters.hideOnboarding })
          }
        >
          {filters.hideOnboarding ? 'Onboarding Hidden' : 'Show Onboarding'}
        </Badge>
      </div>

      {/* Active Filters Summary */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-navy/60">
          {totalResults} {totalResults === 1 ? 'event' : 'events'} found
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="text-navy/60 hover:text-navy"
          >
            <X className="w-4 h-4 mr-1" />
            Clear all filters
          </Button>
        )}
      </div>
    </div>
  )
}
