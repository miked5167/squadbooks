import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowRight, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryData {
  id: string
  name: string
  spent: number
  budget: number
}

interface ParentBudgetOverviewProps {
  categories: CategoryData[]
  totalSpent: number
  totalBudget: number
}

export function ParentBudgetOverview({
  categories,
  totalSpent,
  totalBudget,
}: ParentBudgetOverviewProps) {
  const percentageUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  // Determine budget status
  const getBudgetStatus = () => {
    if (percentageUsed >= 90) {
      return {
        label: 'Over Budget',
        variant: 'destructive' as const,
        icon: AlertTriangle,
        color: 'text-red-600',
      }
    } else if (percentageUsed >= 70) {
      return {
        label: 'Watch',
        variant: 'warning' as const,
        icon: AlertTriangle,
        color: 'text-amber-600',
      }
    } else {
      return {
        label: 'On Track',
        variant: 'success' as const,
        icon: CheckCircle2,
        color: 'text-green-600',
      }
    }
  }

  const status = getBudgetStatus()
  const StatusIcon = status.icon

  // Take top 5 categories by budget amount
  const topCategories = categories.sort((a, b) => b.budget - a.budget).slice(0, 5)

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-navy font-semibold">Budget Tracking</CardTitle>
            <p className="text-navy/60 mt-1 text-sm">Season spending vs. budget</p>
          </div>
          <Badge variant={status.variant} className="flex items-center gap-1">
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Budget Progress */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-navy/70 text-sm font-medium">Overall Budget</span>
            <div className="text-right">
              <div className="text-navy text-xl font-bold">
                ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-navy/60 text-xs">
                of ${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })} budgeted
              </div>
            </div>
          </div>
          <Progress
            value={Math.min(percentageUsed, 100)}
            className="h-2"
            indicatorClassName={cn(
              'transition-colors duration-300',
              percentageUsed >= 90 ? 'bg-red-600' : percentageUsed >= 70 ? 'bg-amber-600' : 'bg-green-600'
            )}
          />
          <div className="flex items-center justify-between">
            <span className={`text-sm font-semibold ${status.color}`}>
              {percentageUsed.toFixed(1)}% used
            </span>
            <span className="text-navy/60 text-sm">
              ${(totalBudget - totalSpent).toLocaleString('en-US', { minimumFractionDigits: 2 })}{' '}
              remaining
            </span>
          </div>
        </div>

        {/* Category Breakdown */}
        {topCategories.length > 0 && (
          <div className="border-navy/10 space-y-4 border-t pt-4">
            <h4 className="text-navy text-sm font-semibold">Top Spending Categories</h4>
            <div className="space-y-3">
              {topCategories.map(category => {
                const categoryPercentage =
                  category.budget > 0 ? (category.spent / category.budget) * 100 : 0
                const isOverBudget = category.spent > category.budget

                return (
                  <div key={category.id} className="space-y-1.5">
                    <div className="flex items-baseline justify-between">
                      <span className="text-navy text-sm font-medium">{category.name}</span>
                      <span className="text-navy/60 text-xs">
                        ${category.spent.toLocaleString()} / ${category.budget.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(categoryPercentage, 100)}
                      className="h-1.5"
                      indicatorClassName={cn(
                        'transition-colors duration-300',
                        isOverBudget ? 'bg-red-600' : 'bg-green-600'
                      )}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* View Details Link */}
        <Button asChild variant="outline" className="border-navy/20 w-full" size="sm">
          <Link href="/budget">
            View Budget Details
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
