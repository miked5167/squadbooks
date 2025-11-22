'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, Receipt, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function BudgetVariance() {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/reports/budget-variance')

      if (!response.ok) {
        throw new Error('Failed to fetch budget variance')
      }

      const data = await response.json()

      // Convert JSON to CSV
      const headers = ['Category', 'Heading', 'Budgeted', 'Actual', 'Variance', 'Percent Used', 'Status']
      const rows = data.categories.map((cat: any) => [
        escapeCsvValue(cat.category),
        escapeCsvValue(cat.heading),
        cat.budgeted.toFixed(2),
        cat.actual.toFixed(2),
        cat.variance.toFixed(2),
        cat.percentUsed.toFixed(1) + '%',
        cat.status,
      ])

      // Add summary row
      rows.push([])
      rows.push([
        'TOTAL',
        '',
        data.totalBudget.toFixed(2),
        data.totalSpent.toFixed(2),
        data.totalVariance.toFixed(2),
        data.totalPercentUsed.toFixed(1) + '%',
        '',
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(',')),
      ].join('\n')

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `budget-variance-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()

      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Budget variance exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export budget variance')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card className="border-0 shadow-card hover:shadow-card-hover transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-navy/10 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-navy" />
            </div>
            <div>
              <CardTitle className="text-navy">Budget Variance</CardTitle>
              <CardDescription>Budget vs actual spending by category</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-navy/70">
          Compare budgeted amounts to actual spending across all categories. Identify over-budget areas at a glance.
        </p>
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-navy hover:bg-navy-medium text-white w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="mr-2 w-4 h-4" />
                Export to CSV
              </>
            )}
          </Button>
          <p className="text-xs text-navy/60 text-center">
            Shows variance in dollars and percentages
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to escape CSV values
function escapeCsvValue(value: string): string {
  if (!value) return ''

  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }

  return value
}
