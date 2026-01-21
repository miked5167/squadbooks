'use client'

import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

interface FilterChipsProps {
  filters: Array<{ key: string; label: string; value: string }>
  onRemove: (key: string) => void
  onClearAll: () => void
}

export function FilterChips({ filters, onRemove, onClearAll }: FilterChipsProps) {
  // Don't show anything if no filters are active
  if (filters.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {filters.map(filter => (
        <Badge key={filter.key} variant="secondary" className="gap-2 pr-1">
          <span>
            {filter.label}: {filter.value}
          </span>
          <button
            onClick={() => onRemove(filter.key)}
            className="rounded-full p-0.5 hover:bg-gray-300"
            aria-label={`Remove ${filter.label} filter`}
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      {filters.length > 1 && (
        <button
          onClick={onClearAll}
          className="text-sm text-gray-600 underline hover:text-gray-900"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
