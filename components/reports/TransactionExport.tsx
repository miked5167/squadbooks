'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function TransactionExport() {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/reports/transactions/export')

      if (!response.ok) {
        throw new Error('Failed to export transactions')
      }

      // Get the CSV content
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      // Create a temporary link and trigger download
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()

      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success('Transactions exported successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export transactions')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Card className="border-0 shadow-card hover:shadow-card-hover transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-meadow/10 rounded-lg flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-meadow" />
            </div>
            <div>
              <CardTitle className="text-navy">Transaction History</CardTitle>
              <CardDescription>Export all transactions to CSV</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-navy/70">
          Download a complete list of all income and expenses with dates, vendors, categories, amounts, and approval status.
        </p>
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-meadow hover:bg-meadow/90 text-white w-full"
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
            Includes all approved, pending, and rejected transactions
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
