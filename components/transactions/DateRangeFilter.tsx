'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import type { DateRange } from 'react-day-picker'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DateRangeFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  // Read from URL on mount
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')

  const [range, setRange] = useState<DateRange | undefined>({
    from: dateFrom ? new Date(dateFrom + 'T00:00:00Z') : undefined,
    to: dateTo ? new Date(dateTo + 'T00:00:00Z') : undefined,
  })

  const handleSelect = (newRange: DateRange | undefined) => {
    setRange(newRange)

    const params = new URLSearchParams(searchParams.toString())
    if (newRange?.from) {
      params.set('dateFrom', format(newRange.from, 'yyyy-MM-dd'))
    } else {
      params.delete('dateFrom')
    }
    if (newRange?.to) {
      params.set('dateTo', format(newRange.to, 'yyyy-MM-dd'))
    } else {
      params.delete('dateTo')
    }
    // Reset cursor when filter changes
    params.delete('cursor')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const presets = [
    { label: 'Last 7 days', range: { from: subDays(new Date(), 7), to: new Date() } },
    { label: 'Last 30 days', range: { from: subDays(new Date(), 30), to: new Date() } },
    {
      label: 'This month',
      range: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
    },
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-[280px] justify-start text-left font-normal',
            !range && 'text-muted-foreground'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {range?.from ? (
            range.to ? (
              <>
                {format(range.from, 'MMM d, yyyy')} - {format(range.to, 'MMM d, yyyy')}
              </>
            ) : (
              format(range.from, 'MMM d, yyyy')
            )
          ) : (
            'Select date range'
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto max-w-none p-0" align="start">
        <div className="flex flex-col md:flex-row">
          {/* Presets */}
          <div className="flex flex-col gap-1 border-b p-3 md:border-r md:border-b-0">
            {presets.map(preset => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleSelect(preset.range)
                  setOpen(false)
                }}
                className="justify-start font-normal whitespace-nowrap"
              >
                {preset.label}
              </Button>
            ))}
            {range && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  handleSelect(undefined)
                  setOpen(false)
                }}
                className="justify-start font-normal whitespace-nowrap text-red-600"
              >
                Clear
              </Button>
            )}
          </div>
          {/* Calendar */}
          <div className="p-4">
            <Calendar
              mode="range"
              selected={range}
              onSelect={handleSelect}
              numberOfMonths={2}
              defaultMonth={range?.from}
              className="[--cell-size:3rem]"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
