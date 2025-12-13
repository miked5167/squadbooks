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
          <CardTitle className="text-base font-semibold text-navy">
            Budget Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="flex justify-between items-center">
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
  const topCategories = categories
    .sort((a, b) => b.budget - a.budget)
    .slice(0, 5)

  const hasCategories = topCategories.length > 0

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-navy">
          Budget Performance
        </CardTitle>
        <p className="text-sm text-navy/60 mt-1">Top spending categories</p>
      </CardHeader>
      <CardContent>
        {hasCategories ? (
          <div className="space-y-4 mb-4">
            {topCategories.map((category) => {
              const percentageUsed = category.budget > 0
                ? (category.spent / category.budget) * 100
                : 0
              const remaining = Math.max(0, category.budget - category.spent)
              const isOverBudget = category.spent > category.budget

              return (
                <div key={category.id} className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-medium text-navy">
                      {category.name}
                    </span>
                    <span className="text-xs text-navy/60">
                      ${category.spent.toLocaleString()} / ${category.budget.toLocaleString()}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(percentageUsed, 100)}
                    className="h-2"
                    indicatorClassName={isOverBudget ? 'bg-red-600' : undefined}
                  />
                  <div className="flex justify-between items-center">
                    <span
                      className={`text-xs font-medium ${
                        isOverBudget ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {isOverBudget
                        ? `$${(category.spent - category.budget).toLocaleString()} over`
                        : `$${remaining.toLocaleString()} remaining`}
                    </span>
                    <span className="text-xs text-navy/60">
                      {percentageUsed.toFixed(0)}% used
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-navy/60 mb-4">No budget categories yet</p>
          </div>
        )}

        <Button asChild variant="outline" className="w-full border-navy/20">
          <Link href="/budget">
            View Full Budget Breakdown
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}
