/**
 * BudgetPositionCards Component
 * Displays Total Budgeted, Total Spent, and Remaining Budget
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Progress } from '@/components/ui/progress'
import { TrendingUp, TrendingDown, HelpCircle } from 'lucide-react'

interface BudgetPositionCardsProps {
  totalBudgeted: number
  totalSpent: number
  totalRemaining: number
}

export function BudgetPositionCards({
  totalBudgeted,
  totalSpent,
  totalRemaining,
}: BudgetPositionCardsProps) {
  const percentageUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Budgeted */}
      <Card className="border-0 shadow-card">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-1.5">
            <CardDescription className="text-navy/60 text-sm">Total Budgeted</CardDescription>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-navy/40 hover:text-navy/60 transition-colors">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-navy text-white">
                  <p>Sum of all category budget allocations</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardTitle className="text-2xl sm:text-3xl text-navy">
            ${totalBudgeted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-navy/70">Planned expenses</div>
        </CardContent>
      </Card>

      {/* Total Spent (Budget) */}
      <Card className="border-0 shadow-card">
        <CardHeader className="pb-2">
          <CardDescription className="text-navy/60 text-sm">Total Spent</CardDescription>
          <CardTitle className="text-2xl sm:text-3xl text-navy">
            ${totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={percentageUsed} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-navy/70">{percentageUsed.toFixed(1)}% of budget</span>
            </div>
            <div className="text-xs text-navy/60">Against budgeted categories</div>
          </div>
        </CardContent>
      </Card>

      {/* Remaining Budget */}
      <Card className="border-0 shadow-card">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-1.5">
            <CardDescription className="text-navy/60 text-sm">Remaining Budget</CardDescription>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-navy/40 hover:text-navy/60 transition-colors">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-navy text-white">
                  <p>Total Budgeted − Total Spent</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardTitle className={`text-2xl sm:text-3xl ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${totalRemaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 text-sm">
            {totalRemaining >= 0 ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-navy/70">Budget still available</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-navy/70">Over budget</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
