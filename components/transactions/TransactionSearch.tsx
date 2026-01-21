'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function TransactionSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Local state for immediate input feedback
  const [localValue, setLocalValue] = useState(searchParams.get('search') || '')

  // Debounce: 300ms delay after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      const trimmedValue = localValue.trim()

      if (trimmedValue) {
        params.set('search', trimmedValue)
      } else {
        params.delete('search')
      }

      // Reset cursor when search changes
      params.delete('cursor')

      router.push(`?${params.toString()}`, { scroll: false })
    }, 300)

    // Cleanup function to clear timeout
    return () => clearTimeout(timer)
  }, [localValue, router, searchParams])

  return (
    <div className="relative">
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        type="text"
        placeholder="Search vendor or description..."
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        className="pl-9"
      />
    </div>
  )
}
