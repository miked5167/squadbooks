import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowRight, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'

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
    if (percentageUsed >= 95) {
      return {
        label: 'Over Budget',
        variant: 'destructive' as const,
        icon: AlertTriangle,
        color: 'text-red-600',
      }
    } else if (percentageUsed >= 85) {
      return {
        label: 'Watch',
        variant: 'warning' as const,
        icon: AlertTriangle,
        color: 'text-yellow-600',
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
  const topCategories = categories
    .sort((a, b) => b.budget - a.budget)
    .slice(0, 5)

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-navy">
              Budget Tracking
            </CardTitle>
            <p className="text-sm text-navy/60 mt-1">Season spending vs. budget</p>
          </div>
          <Badge variant={status.variant} className="flex items-center gap-1">
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Budget Progress */}
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-navy/70">Overall Budget</span>
            <div className="text-right">
              <div className="text-xl font-bold text-navy">
                ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-navy/60">
                of ${totalBudget.toLocaleString('en-US', { minimumFractionDigits: 2 })} budgeted
              </div>
            </div>
          </div>
          <Progress
            value={Math.min(percentageUsed, 100)}
            className="h-3"
            indicatorClassName={percentageUsed >= 95 ? 'bg-red-600' : percentageUsed >= 85 ? 'bg-yellow-600' : undefined}
          />
          <div className="flex justify-between items-center">
            <span className={`text-sm font-semibold ${status.color}`}>
              {percentageUsed.toFixed(1)}% used
            </span>
            <span className="text-sm text-navy/60">
              ${(totalBudget - totalSpent).toLocaleString('en-US', { minimumFractionDigits: 2 })} remaining
            </span>
          </div>
        </div>

        {/* Category Breakdown */}
        {topCategories.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-navy/10">
            <h4 className="text-sm font-semibold text-navy">Top Spending Categories</h4>
            <div className="space-y-3">
              {topCategories.map((category) => {
                const categoryPercentage = category.budget > 0
                  ? (category.spent / category.budget) * 100
                  : 0
                const isOverBudget = category.spent > category.budget

                return (
                  <div key={category.id} className="space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-navy font-medium">
                        {category.name}
                      </span>
                      <span className="text-xs text-navy/60">
                        ${category.spent.toLocaleString()} / ${category.budget.toLocaleString()}
                      </span>
                    </div>
                    <Progress
                      value={Math.min(categoryPercentage, 100)}
                      className="h-1.5"
                      indicatorClassName={isOverBudget ? 'bg-red-600' : undefined}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* View Details Link */}
        <Button asChild variant="outline" className="w-full border-navy/20" size="sm">
          <Link href="/budget">
            View Budget Details
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
