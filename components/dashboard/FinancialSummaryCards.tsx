'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface FinancialSummaryCardsProps {
  totalIncome: number
  totalExpenses: number
  netPosition: number
  budgetedExpensesTotal: number
  compact?: boolean
}

export function FinancialSummaryCards({
  totalIncome,
  totalExpenses,
  netPosition,
  budgetedExpensesTotal,
  compact = false,
}: FinancialSummaryCardsProps) {
  const isNetPositive = netPosition >= 0
  const expensePercentage =
    budgetedExpensesTotal > 0 ? (totalExpenses / budgetedExpensesTotal) * 100 : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total Income */}
      <Card className="border-0 shadow-card">
        <CardHeader className={compact ? 'pb-2' : 'pb-2'}>
          <CardDescription className="text-navy/60">Total Income</CardDescription>
          <CardTitle className={`${compact ? 'text-2xl' : 'text-3xl'} text-green-600`}>
            $
            {totalIncome.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-navy/70">
              {compact ? 'Revenue received' : 'Registration, fundraising, sponsorships'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Total Expenses */}
      <Card className="border-0 shadow-card">
        <CardHeader className={compact ? 'pb-2' : 'pb-2'}>
          <CardDescription className="text-navy/60">Total Expenses</CardDescription>
          <CardTitle className={`${compact ? 'text-2xl' : 'text-3xl'} text-navy`}>
            $
            {totalExpenses.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-navy/70">{expensePercentage.toFixed(1)}% of budget</span>
              <span className="text-navy/70 font-medium">
                $
                {budgetedExpensesTotal.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                budgeted
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Net Position */}
      <Card className="border-0 shadow-card">
        <CardHeader className={compact ? 'pb-2' : 'pb-2'}>
          <CardDescription className="text-navy/60">Net Position</CardDescription>
          <CardTitle
            className={`${compact ? 'text-2xl' : 'text-3xl'} ${isNetPositive ? 'text-green-600' : 'text-red-600'}`}
          >
            {isNetPositive ? '+' : ''}$
            {Math.abs(netPosition).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 text-sm">
            {isNetPositive ? (
              <>
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-navy/70">Positive cash position</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-navy/70">Deficit position</span>
              </>
            )}
          </div>
          <p className="text-xs text-navy/50 mt-1">Income minus expenses</p>
        </CardContent>
      </Card>
    </div>
  )
}
