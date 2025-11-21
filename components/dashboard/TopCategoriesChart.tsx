'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BudgetCategoryRow } from './BudgetCategoryRow'
import type { BudgetCategory } from '@/lib/types/budget'
import { ArrowRight } from 'lucide-react'

interface TopCategoriesChartProps {
  categories: BudgetCategory[]
  limit?: number
}

export function TopCategoriesChart({ categories, limit = 10 }: TopCategoriesChartProps) {
  const router = useRouter()

  // Sort by allocated amount (descending) and take top N
  const topCategories = [...categories]
    .filter((cat) => cat.allocated > 0)
    .sort((a, b) => b.allocated - a.allocated)
    .slice(0, limit)

  // Responsive limit based on screen size
  const mobileLimit = Math.min(5, topCategories.length)
  const tabletLimit = Math.min(8, topCategories.length)

  return (
    <Card className="border-0 shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold text-navy">
              Top Budget Categories
            </CardTitle>
            <p className="text-sm text-navy/60 mt-1">
              Highest budget allocations and spending
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/budget')}
            className="hidden sm:flex items-center gap-1 text-navy hover:text-navy/80"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop view - show all */}
        <div className="hidden lg:block space-y-2">
          {topCategories.map((category) => (
            <BudgetCategoryRow
              key={category.id}
              category={category}
              onClick={() => router.push(`/transactions?category=${category.id}`)}
            />
          ))}
        </div>

        {/* Tablet view - show 8 */}
        <div className="hidden md:block lg:hidden space-y-2">
          {topCategories.slice(0, tabletLimit).map((category) => (
            <BudgetCategoryRow
              key={category.id}
              category={category}
              onClick={() => router.push(`/transactions?category=${category.id}`)}
            />
          ))}
        </div>

        {/* Mobile view - show 5 */}
        <div className="md:hidden space-y-2">
          {topCategories.slice(0, mobileLimit).map((category) => (
            <BudgetCategoryRow
              key={category.id}
              category={category}
              onClick={() => router.push(`/transactions?category=${category.id}`)}
            />
          ))}
        </div>

        {/* View all button - Mobile */}
        <div className="mt-4 sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/budget')}
            className="w-full border-navy/20 text-navy hover:bg-navy/5"
          >
            View All Categories
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Empty state */}
        {topCategories.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-navy mb-2">No Budget Data</h3>
            <p className="text-sm text-navy/60">
              Set up your budget allocations to see spending data here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
