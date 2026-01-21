'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency } from '@/lib/utils/currency'

interface SummaryBarProps {
  totalIncome: number
  totalExpenses: number
  netPosition: number
  loading?: boolean
}

export function SummaryBar({
  totalIncome,
  totalExpenses,
  netPosition,
  loading = false,
}: SummaryBarProps) {
  if (loading) {
    return (
      <Card className="shadow-card border-0">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </div>
          </div>
          <Skeleton className="mt-4 h-3 w-48" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-card border-0">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Total Income */}
          <div className="space-y-1">
            <p className="text-navy/70 text-sm font-medium">Total Income</p>
            <p className="text-meadow text-2xl font-semibold">{formatCurrency(totalIncome)}</p>
          </div>

          {/* Total Expenses */}
          <div className="space-y-1">
            <p className="text-navy/70 text-sm font-medium">Total Expenses</p>
            <p className="text-2xl font-semibold text-red-600">{formatCurrency(totalExpenses)}</p>
          </div>

          {/* Net */}
          <div className="space-y-1">
            <p className="text-navy/70 text-sm font-medium">Net</p>
            <p
              className={`text-2xl font-semibold ${
                netPosition >= 0 ? 'text-meadow' : 'text-red-600'
              }`}
            >
              {formatCurrency(netPosition)}
            </p>
          </div>
        </div>

        {/* Caption */}
        <p className="text-navy/60 mt-4 text-xs">All transactions for this team</p>
      </CardContent>
    </Card>
  )
}
