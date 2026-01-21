'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, TrendingUp, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function MonthlySummary() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Default to current month
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [summary, setSummary] = useState<any>(null)

  // Generate list of last 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const now = new Date()
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    return {
      value: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    }
  })

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/reports/monthly-summary?month=${selectedMonth}`)

      if (!response.ok) {
        throw new Error('Failed to generate summary')
      }

      const data = await response.json()
      setSummary(data)
      toast.success('Summary generated successfully')
    } catch (error) {
      console.error('Generate error:', error)
      toast.error('Failed to generate summary')
    } finally {
      setIsGenerating(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  return (
    <Card className="border-0 shadow-card hover:shadow-card-hover transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-golden/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-golden" />
            </div>
            <div>
              <CardTitle className="text-navy">Monthly Summary</CardTitle>
              <CardDescription>Income and expense breakdown by month</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-navy/70">
          View total income, expenses, and net balance for any month. Perfect for board meetings and financial updates.
        </p>
        <div className="flex flex-col gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 border border-navy/20 rounded-lg text-navy focus:outline-none focus:ring-2 focus:ring-meadow"
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="bg-golden hover:bg-golden/90 text-navy w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 w-4 h-4" />
                Generate Report
              </>
            )}
          </Button>
        </div>

        {/* Display summary if generated */}
        {summary && (
          <div className="mt-4 p-4 bg-navy/5 rounded-lg space-y-3">
            <h3 className="font-semibold text-navy">{summary.month}</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-navy/60 mb-1">Total Income</p>
                <p className="text-lg font-semibold text-meadow">
                  {formatCurrency(summary.income.total)}
                </p>
              </div>
              <div>
                <p className="text-navy/60 mb-1">Total Expenses</p>
                <p className="text-lg font-semibold text-red-600">
                  {formatCurrency(summary.expenses.total)}
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-navy/10">
              <p className="text-navy/60 text-sm mb-1">Net Income</p>
              <p
                className={`text-xl font-bold ${
                  summary.netIncome >= 0 ? 'text-meadow' : 'text-red-600'
                }`}
              >
                {formatCurrency(summary.netIncome)}
              </p>
            </div>
            {summary.expenses.byCategory.length > 0 && (
              <div className="pt-2 border-t border-navy/10">
                <p className="text-navy/60 text-sm mb-2">Top Expenses</p>
                <div className="space-y-1">
                  {summary.expenses.byCategory.slice(0, 5).map((item: any) => (
                    <div key={item.category} className="flex justify-between text-sm">
                      <span className="text-navy/70">{item.category}</span>
                      <span className="font-medium text-navy">
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
