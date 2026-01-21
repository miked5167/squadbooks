/**
 * Funding Sources Card Component
 *
 * Displays income sources and total funding for the budget
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FundingSource {
  categoryId: string
  categoryName: string
  amount: number
  color?: string
}

interface FundingSourcesCardProps {
  sources: FundingSource[]
  totalIncome: number
  totalBudget: number
  className?: string
}

export function FundingSourcesCard({
  sources,
  totalIncome,
  totalBudget,
  className,
}: FundingSourcesCardProps) {
  const sortedSources = [...sources].sort((a, b) => b.amount - a.amount)
  const topSources = sortedSources.slice(0, 5)
  const netPosition = totalIncome - totalBudget

  return (
    <Card className={cn('border-0 shadow-sm', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-navy">
                Funding Sources
              </CardTitle>
              <CardDescription className="text-sm">
                Top income categories
              </CardDescription>
            </div>
          </div>
          <Badge
            variant={netPosition >= 0 ? 'success' : 'warning'}
            className={cn(
              'text-xs font-semibold',
              netPosition >= 0
                ? 'bg-green-100 text-green-800 hover:bg-green-100'
                : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
            )}
          >
            {netPosition >= 0 ? 'Funded' : 'Deficit'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Total Income */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-green-900">Total Income</span>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-900">
            ${totalIncome.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="text-xs text-green-700 mt-1">
            vs ${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })} budgeted
          </div>
        </div>

        {/* Net Position */}
        <div
          className={cn(
            'p-4 rounded-lg border',
            netPosition >= 0
              ? 'bg-navy/5 border-navy/10'
              : 'bg-yellow-50 border-yellow-200'
          )}
        >
          <div className="text-sm font-medium text-navy/70 mb-1">Net Position</div>
          <div
            className={cn(
              'text-xl font-bold',
              netPosition >= 0 ? 'text-green-600' : 'text-yellow-700'
            )}
          >
            {netPosition >= 0 ? '+' : ''}$
            {Math.abs(netPosition).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="text-xs text-navy/60 mt-1">Income minus budgeted expenses</div>
        </div>

        {/* Top Sources */}
        {topSources.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-navy/70 uppercase tracking-wide">
              Top Sources
            </div>
            {topSources.map((source) => {
              const percentage = totalIncome > 0 ? (source.amount / totalIncome) * 100 : 0
              return (
                <div key={source.categoryId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {source.color && (
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: source.color }}
                        />
                      )}
                      <span className="text-sm font-medium text-navy truncate">
                        {source.categoryName}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-sm font-bold text-navy">
                        ${source.amount.toLocaleString('en-US', {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </div>
                      <div className="text-xs text-navy/60">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="h-1.5 bg-navy/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {sources.length === 0 && (
          <div className="text-center py-6">
            <DollarSign className="w-8 h-8 text-navy/20 mx-auto mb-2" />
            <p className="text-sm text-navy/60">No income recorded yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
