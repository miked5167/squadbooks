import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight } from 'lucide-react'

interface CategoryData {
  id: string
  name: string
  spent: number
  budget: number
}

interface BudgetCategoryListProps {
  categories: CategoryData[]
  isLoading?: boolean
}

export function BudgetCategoryList({ categories, isLoading = false }: BudgetCategoryListProps) {
  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-navy font-semibold">Budget Performance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  // Take top 5 categories by budget amount
  const topCategories = categories.sort((a, b) => b.budget - a.budget).slice(0, 5)

  const hasCategories = topCategories.length > 0

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-navy font-semibold">Budget Performance</CardTitle>
        <p className="text-navy/60 mt-1 text-sm">Top spending categories</p>
      </CardHeader>
      <CardContent>
        {hasCategories ? (
          <div className="mb-4 space-y-4">
            {topCategories.map(category => {
              const percentageUsed =
                category.budget > 0 ? (category.spent / category.budget) * 100 : 0
              const remaining = Math.max(0, category.budget - category.spent)
              const isOverBudget = category.spent > category.budget

              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-navy text-sm font-medium">{category.name}</span>
                    <span className="text-navy/60 text-xs">
                      ${category.spent.toLocaleString()} / ${category.budget.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(percentageUsed, 100)}
                    className="h-2"
                    indicatorClassName={isOverBudget ? 'bg-red-600' : undefined}
                  />
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium ${
                        isOverBudget ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {isOverBudget
                        ? `$${(category.spent - category.budget).toLocaleString()} over`
                        : `$${remaining.toLocaleString()} remaining`}
                    </span>
                    <span className="text-navy/60 text-xs">{percentageUsed.toFixed(0)}% used</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-navy/60 mb-4 text-sm">No budget categories yet</p>
          </div>
        )}

        <Button asChild variant="outline" className="border-navy/20 w-full">
          <Link href="/budget">
            View Full Budget Breakdown
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
