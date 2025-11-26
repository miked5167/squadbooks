/**
 * CashPositionCards Component
 * Displays Income, Expenses, and Net Position in a clear row
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { TrendingUp, TrendingDown, HelpCircle } from 'lucide-react'

interface CashPositionCardsProps {
  totalIncome: number
  totalExpenses: number
  netPosition: number
}

export function CashPositionCards({
  totalIncome,
  totalExpenses,
  netPosition,
}: CashPositionCardsProps) {
  const isNetPositive = netPosition >= 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Total Income */}
      <Card className="border-0 shadow-card">
        <CardHeader className="pb-2">
          <CardDescription className="text-navy/60 text-sm">Total Income</CardDescription>
          <CardTitle className="text-2xl sm:text-3xl text-green-600">
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
            <span className="text-navy/70">Revenue received</span>
          </div>
        </CardContent>
      </Card>

      {/* Total Expenses */}
      <Card className="border-0 shadow-card">
        <CardHeader className="pb-2">
          <CardDescription className="text-navy/60 text-sm">Total Expenses</CardDescription>
          <CardTitle className="text-2xl sm:text-3xl text-navy">
            $
            {totalExpenses.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-navy/70">Season-to-date spending</div>
        </CardContent>
      </Card>

      {/* Net Position */}
      <Card className="border-0 shadow-card">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-1.5">
            <CardDescription className="text-navy/60 text-sm">Net Position</CardDescription>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="text-navy/40 hover:text-navy/60 transition-colors">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent className="bg-navy text-white">
                  <p>Income minus expenses</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardTitle
            className={`text-2xl sm:text-3xl ${isNetPositive ? 'text-green-600' : 'text-red-600'}`}
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
