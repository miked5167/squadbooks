'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export function MissingReceiptsToggle() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const missingOnly = searchParams.get('missingReceipts') === 'true'

  const handleToggle = (checked: boolean) => {
    const params = new URLSearchParams(searchParams.toString())
    if (checked) {
      params.set('missingReceipts', 'true')
    } else {
      params.delete('missingReceipts')
    }
    // Reset cursor when filter changes
    params.delete('cursor')
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex items-center gap-2">
      <Switch id="missing-receipts" checked={missingOnly} onCheckedChange={handleToggle} />
      <Label htmlFor="missing-receipts" className="cursor-pointer">
        Missing receipts only
      </Label>
    </div>
  )
}
