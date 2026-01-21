import { auth } from '@/lib/auth/server-auth'
import { redirect } from 'next/navigation'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileHeader } from '@/components/MobileHeader'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Receipt, TrendingUp, Lock } from 'lucide-react'
import { TransactionExport } from '@/components/reports/TransactionExport'
import { MonthlySummary } from '@/components/reports/MonthlySummary'
import { BudgetVariance } from '@/components/reports/BudgetVariance'
import { prisma } from '@/lib/prisma'

export default async function ReportsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Fetch user to check role
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true }
  })

  if (!user) {
    redirect('/onboarding')
  }

  const isParent = user.role === 'PARENT'

  return (
    <div className="min-h-screen bg-cream">
      <MobileHeader>
        <AppSidebar />
      </MobileHeader>
      <AppSidebar />

      <main className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-display-2 text-navy mb-2">Reports</h1>
          <p className="text-lg text-navy/70">Generate and export financial reports for your team</p>
        </div>

        {isParent ? (
          /* Restricted Access Message for Parents */
          <Card className="border-0 shadow-card">
            <CardContent className="pt-12 pb-12">
              <div className="text-center max-w-md mx-auto">
                <div className="w-20 h-20 bg-navy/5 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Lock className="w-10 h-10 text-navy/40" />
                </div>
                <h2 className="text-2xl font-semibold text-navy mb-3">Restricted Access</h2>
                <p className="text-navy/70 mb-6">
                  Financial reports are only available to team treasurers and assistant treasurers.
                  This helps maintain proper financial controls and accountability.
                </p>
                <p className="text-sm text-navy/60">
                  If you need access to specific financial information, please contact your team treasurer.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
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
          </>
        )}
      </main>
    </div>
  )
}
