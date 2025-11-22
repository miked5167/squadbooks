import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { AppNav } from '@/components/app-nav'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Receipt, TrendingUp } from 'lucide-react'
import { TransactionExport } from '@/components/reports/TransactionExport'
import { MonthlySummary } from '@/components/reports/MonthlySummary'
import { BudgetVariance } from '@/components/reports/BudgetVariance'

export default async function ReportsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <div className="min-h-screen bg-cream">
      <AppNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-display-2 text-navy mb-2">Reports</h1>
          <p className="text-lg text-navy/70">Generate and export financial reports for your team</p>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Transaction Export */}
          <TransactionExport />

          {/* Monthly Summary */}
          <MonthlySummary />

          {/* Budget Variance */}
          <BudgetVariance />

          {/* Year-to-Date Summary */}
          <Card className="border-0 shadow-card hover:shadow-card-hover transition-all duration-300 opacity-60">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-navy/10 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-navy" />
                  </div>
                  <div>
                    <CardTitle className="text-navy">Year-to-Date Summary</CardTitle>
                    <CardDescription>Season-long financial overview</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-navy/70">
                Complete financial summary from the start of the season to today. Track overall income, expenses, and budget performance.
              </p>
              <div className="flex flex-col gap-2">
                <Button className="bg-navy hover:bg-navy-medium text-white w-full" disabled>
                  <Download className="mr-2 w-4 h-4" />
                  Coming Soon
                </Button>
                <p className="text-xs text-navy/60 text-center">
                  Available in next update
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="border-0 shadow-card mt-8 bg-meadow/5 border-l-4 border-l-meadow">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-meadow/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Receipt className="w-5 h-5 text-meadow" />
              </div>
              <div>
                <h3 className="font-semibold text-navy mb-1">Export Tips</h3>
                <ul className="text-sm text-navy/70 space-y-1">
                  <li>• CSV files can be opened in Excel, Google Sheets, or any spreadsheet program</li>
                  <li>• Reports include only approved transactions unless specified otherwise</li>
                  <li>• All dates are in YYYY-MM-DD format for easy sorting</li>
                  <li>• Monetary values are formatted with 2 decimal places</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
