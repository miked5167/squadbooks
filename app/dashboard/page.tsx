import { auth } from '@/lib/auth/server-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileHeader } from '@/components/MobileHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { ArrowUpRight, Plus, DollarSign, List, TrendingUp, TrendingDown, Clock } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getFinancialSummary } from '@/lib/db/financial-summary'
import { ComplianceWidget } from '@/components/dashboard/ComplianceWidget'

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  // Fetch user and team data
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: { team: true },
  })

  if (!user) {
    redirect('/onboarding')
  }

  // Check if user is treasurer (authorized to create transactions)
  const isTreasurer = user.role === 'TREASURER' || user.role === 'ASSISTANT_TREASURER'

  // Check if user is a parent
  const isParent = user.role === 'PARENT'

  // Get comprehensive financial summary
  const financialSummary = await getFinancialSummary(user.teamId)

  // Fetch pending approvals count
  const pendingApprovalsCount = await prisma.approval.count({
    where: {
      teamId: user.teamId,
      status: 'PENDING',
    },
  })

  // Calculate expense percentage vs budget
  const expensePercentage =
    financialSummary.budgetedExpensesTotal > 0
      ? (financialSummary.totalExpenses / financialSummary.budgetedExpensesTotal) * 100
      : 0

  const isNetPositive = financialSummary.netPosition >= 0

  return (
    <div className="min-h-screen bg-cream">
      <MobileHeader>
        <AppSidebar />
      </MobileHeader>
      <AppSidebar />

      {/* Main Content */}
      <main className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy mb-2">Dashboard</h1>
          <p className="text-lg text-navy/70">Welcome to your team financial dashboard</p>
        </div>

        {/* Quick Actions */}
        <div className={`grid grid-cols-1 ${isTreasurer ? 'md:grid-cols-3' : 'md:grid-cols-1'} gap-6 mb-8`}>
          {isTreasurer && (
            <>
              <Link
                href="/expenses/new"
                className="group bg-white p-6 rounded-lg shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-meadow/20"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-meadow/10 rounded-lg flex items-center justify-center group-hover:bg-meadow/20 transition-colors">
                    <Plus className="w-6 h-6 text-meadow" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-navy/30 group-hover:text-meadow group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <h3 className="text-lg font-semibold text-navy mb-1">Add Expense</h3>
                <p className="text-sm text-navy/60">Record a new team expense with receipt</p>
              </Link>

              <Link
                href="/income/new"
                className="group bg-white p-6 rounded-lg shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-golden/20"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 bg-golden/10 rounded-lg flex items-center justify-center group-hover:bg-golden/20 transition-colors">
                    <DollarSign className="w-6 h-6 text-golden" />
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-navy/30 group-hover:text-golden group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>
                <h3 className="text-lg font-semibold text-navy mb-1">Add Income</h3>
                <p className="text-sm text-navy/60">Record registration fees, donations, or sponsorships</p>
              </Link>
            </>
          )}

          {!isParent && (
            <Link
              href="/transactions"
              className="group bg-white p-6 rounded-lg shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border border-transparent hover:border-navy/20"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 bg-navy/10 rounded-lg flex items-center justify-center group-hover:bg-navy/20 transition-colors">
                  <List className="w-6 h-6 text-navy" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-navy/30 group-hover:text-navy group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <h3 className="text-lg font-semibold text-navy mb-1">View Transactions</h3>
              <p className="text-sm text-navy/60">See all team financial activity</p>
            </Link>
          )}
        </div>

        {/* Financial Summary - 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total Income Card */}
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardDescription className="text-navy/60 font-semibold">Total Income</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                ${financialSummary.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-navy/70">Registration, fundraising, sponsorships</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Expenses vs Budget Card */}
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardDescription className="text-navy/60 font-semibold">Total Expenses</CardDescription>
              <CardTitle className="text-3xl text-navy">
                ${financialSummary.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={expensePercentage} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-navy/70">{expensePercentage.toFixed(1)}% of budget</span>
                  <span className="text-navy/70 font-medium">
                    ${financialSummary.budgetedExpensesTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} budgeted
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Position Card */}
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardDescription className="text-navy/60 font-semibold">Net Position</CardDescription>
              <CardTitle className={`text-3xl ${isNetPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isNetPositive ? '+' : ''}${financialSummary.netPosition.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
              <p className="text-xs text-navy/50 mt-1">Income minus expenses for this season</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals & Compliance - Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Pending Approvals */}
          <Card className="border-0 shadow-card">
            <CardHeader className="pb-2">
              <CardDescription className="text-navy/60 font-semibold">Pending Approvals</CardDescription>
              <CardTitle className="text-3xl text-golden">{pendingApprovalsCount}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-1 text-sm">
                <Clock className="w-4 h-4 text-golden" />
                <span className="text-navy/70">Awaiting review</span>
              </div>
              {pendingApprovalsCount > 0 && (
                <Button asChild className="mt-4 w-full bg-golden hover:bg-golden/90 text-navy">
                  <Link href="/approvals">
                    Review Approvals
                    <ArrowUpRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Compliance Widget */}
          <ComplianceWidget teamId={user.teamId} />
        </div>

        {/* Budget Overview Link */}
        <Card className="border-0 shadow-card mb-8">
          <CardHeader>
            <CardTitle className="text-navy">Budget Management</CardTitle>
            <CardDescription>Track category-level spending vs budget</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full bg-navy hover:bg-navy-medium text-white">
              <Link href="/budget">
                View Full Budget Breakdown
                <ArrowUpRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-card">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-navy">Recent Transactions</CardTitle>
                <CardDescription>Your team's latest financial activity</CardDescription>
              </div>
              <Button asChild variant="outline" className="border-navy/20 text-navy hover:bg-navy/5">
                <Link href="/transactions">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {financialSummary.totalIncome === 0 && financialSummary.totalExpenses === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-navy/40" />
                </div>
                <h3 className="text-lg font-semibold text-navy mb-2">No transactions yet</h3>
                <p className="text-navy/60 mb-6 max-w-sm mx-auto">
                  {isTreasurer
                    ? 'Create your first expense or income to get started tracking your team\'s finances'
                    : 'No financial activity to display yet'}
                </p>
                {isTreasurer && (
                  <div className="flex gap-3 justify-center">
                    <Button asChild className="bg-meadow hover:bg-meadow/90 text-white">
                      <Link href="/expenses/new">
                        <Plus className="mr-2 w-4 h-4" />
                        Add Expense
                      </Link>
                    </Button>
                    <Button asChild className="bg-golden hover:bg-golden/90 text-navy">
                      <Link href="/income/new">
                        <Plus className="mr-2 w-4 h-4" />
                        Add Income
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-navy/70">
                  You have {financialSummary.expensesByCategory.length} expense categories and{' '}
                  {financialSummary.incomeByCategory.length} income categories with activity.
                </p>
                <Button asChild className="w-full bg-navy hover:bg-navy-medium text-white">
                  <Link href="/transactions">
                    View All Transactions
                    <ArrowUpRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
