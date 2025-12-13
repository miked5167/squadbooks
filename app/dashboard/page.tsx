import { auth } from '@/lib/auth/server-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileHeader } from '@/components/MobileHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DollarSign,
  TrendingUp,
  Clock,
  ShieldCheck,
  ArrowRight,
  PiggyBank,
} from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getFinancialSummary } from '@/lib/db/financial-summary'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard'
import { BudgetCategoryList } from '@/components/dashboard/BudgetCategoryList'
import { TransactionsPreviewTable } from '@/components/dashboard/TransactionsPreviewTable'
import { ParentDashboard } from '@/components/dashboard/ParentDashboard'
import { getTeamCompliance } from '@/app/transactions/actions'

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

  // Fetch budget allocations with category info for budget performance
  const budgetAllocations = await prisma.budgetAllocation.findMany({
    where: {
      teamId: user.teamId,
      season: user.team?.season,
    },
    include: {
      category: true,
    },
    orderBy: {
      allocated: 'desc',
    },
  })

  // Calculate spent per category
  const categorySpending = new Map<string, number>()
  financialSummary.expensesByCategory.forEach((expense) => {
    categorySpending.set(expense.categoryId, expense.amount)
  })

  // Format budget data for component
  const budgetCategories = budgetAllocations.map((allocation) => ({
    id: allocation.categoryId,
    name: allocation.category.name,
    spent: categorySpending.get(allocation.categoryId) || 0,
    budget: Number(allocation.allocated),
  }))

  // Fetch recent transactions (last 10)
  const recentTransactions = await prisma.transaction.findMany({
    where: {
      teamId: user.teamId,
      deletedAt: null,
    },
    include: {
      category: true,
    },
    orderBy: {
      transactionDate: 'desc',
    },
    take: 10,
  })

  // Format transactions for preview table
  const formattedTransactions = recentTransactions.map((tx) => ({
    id: tx.id,
    transactionDate: tx.transactionDate,
    vendor: tx.vendor,
    categoryName: tx.category.name,
    amount: Number(tx.amount),
    type: tx.type,
    status: tx.status,
    receiptUrl: tx.receiptUrl,
  }))

  // Get compliance data
  const complianceResult = await getTeamCompliance()
  const complianceScore = complianceResult.score || 100
  const complianceStatus = complianceResult.status || 'COMPLIANT'

  // Calculate expense percentage vs budget
  const expensePercentage =
    financialSummary.budgetedExpensesTotal > 0
      ? (financialSummary.totalExpenses / financialSummary.budgetedExpensesTotal) * 100
      : 0

  const isNetPositive = financialSummary.netPosition >= 0

  // Determine budget burn status
  const budgetBurnStatus =
    expensePercentage >= 90
      ? 'destructive'
      : expensePercentage >= 75
      ? 'warning'
      : 'success'

  const complianceBadgeVariant =
    complianceStatus === 'COMPLIANT'
      ? 'success'
      : complianceStatus === 'AT_RISK'
      ? 'warning'
      : 'destructive'

  // If parent user, show parent-specific dashboard
  if (isParent) {
    // Fetch treasurer contact info for parents
    const treasurer = await prisma.user.findFirst({
      where: {
        teamId: user.teamId,
        role: 'TREASURER',
      },
      select: {
        name: true,
        email: true,
      },
    })

    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader>
          <AppSidebar />
        </MobileHeader>
        <AppSidebar />

        {/* Main Content */}
        <main className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
          <ParentDashboard
            teamName={user.team?.name || 'Your Team'}
            season={user.team?.season || '2024-2025'}
            totalIncome={financialSummary.totalIncome}
            totalExpenses={financialSummary.totalExpenses}
            netPosition={financialSummary.netPosition}
            budgetTotal={financialSummary.budgetedExpensesTotal}
            categories={budgetCategories}
            transactions={formattedTransactions}
            treasurerName={treasurer?.name}
            treasurerEmail={treasurer?.email}
          />
        </main>
      </div>
    )
  }

  // Treasurer/Staff Dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader>
        <AppSidebar />
      </MobileHeader>
      <AppSidebar />

      {/* Main Content */}
      <main className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-navy mb-1">Dashboard</h1>
            <p className="text-base text-navy/60">{user.team?.name || 'Your Team'}</p>
          </div>
          {!isParent && (
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="border-navy/20">
                <Link href="/transactions">View Transactions</Link>
              </Button>
              {isTreasurer && (
                <>
                  <Button asChild variant="outline" size="sm" className="border-navy/20">
                    <Link href="/income/new">Add Income</Link>
                  </Button>
                  <Button asChild size="sm" className="bg-navy hover:bg-navy-medium text-white">
                    <Link href="/expenses/new">Add Expense</Link>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Financial Health Overview - 4 KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          <KpiCard
            title="Cash Position"
            value={`${isNetPositive ? '+' : ''}$${Math.abs(financialSummary.netPosition).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle="Income minus expenses"
            icon={DollarSign}
            trend={{
              value: isNetPositive ? 'Positive balance' : 'Deficit',
              isPositive: isNetPositive,
            }}
            badge={{
              label: isNetPositive ? 'Healthy' : 'Deficit',
              variant: isNetPositive ? 'success' : 'warning',
            }}
          />

          <KpiCard
            title="Budget Burn"
            value={`$${financialSummary.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            subtitle={`of $${financialSummary.budgetedExpensesTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} budgeted`}
            icon={PiggyBank}
            trend={{
              value: `${expensePercentage.toFixed(1)}% used`,
            }}
            badge={{
              label:
                expensePercentage >= 90
                  ? 'High'
                  : expensePercentage >= 75
                  ? 'Moderate'
                  : 'On Track',
              variant: budgetBurnStatus,
            }}
          />

          <KpiCard
            title="Pending Approvals"
            value={pendingApprovalsCount}
            subtitle={pendingApprovalsCount === 1 ? 'transaction' : 'transactions'}
            icon={Clock}
            trend={
              pendingApprovalsCount > 0
                ? {
                    value: 'Requires review',
                  }
                : undefined
            }
            badge={
              pendingApprovalsCount > 0
                ? {
                    label: 'Action Needed',
                    variant: 'warning',
                  }
                : undefined
            }
          />

          <KpiCard
            title="Compliance"
            value={`${complianceScore}/100`}
            subtitle="Association rules"
            icon={ShieldCheck}
            trend={{
              value:
                complianceStatus === 'COMPLIANT'
                  ? 'Fully compliant'
                  : complianceStatus === 'AT_RISK'
                  ? 'At risk'
                  : 'Non-compliant',
              isPositive: complianceStatus === 'COMPLIANT',
            }}
            badge={{
              label:
                complianceStatus === 'COMPLIANT'
                  ? 'Compliant'
                  : complianceStatus === 'AT_RISK'
                  ? 'At Risk'
                  : 'Non-Compliant',
              variant: complianceBadgeVariant,
            }}
          />
        </div>

        {/* Middle Grid - Budget Performance + Quick Actions/Approvals */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Budget Performance - 8 cols on desktop */}
          <div className="lg:col-span-8">
            <BudgetCategoryList categories={budgetCategories} />
          </div>

          {/* Right Column - Quick Actions + Approvals/Compliance - 4 cols on desktop */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Actions */}
            <QuickActionsCard isTreasurer={isTreasurer} />

            {/* Pending Approvals Card (if any) */}
            {pendingApprovalsCount > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-navy flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Approvals Needed
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-2xl font-bold text-golden">{pendingApprovalsCount}</p>
                    <p className="text-sm text-navy/60">
                      {pendingApprovalsCount === 1 ? 'transaction' : 'transactions'} awaiting
                      review
                    </p>
                  </div>
                  <Button
                    asChild
                    className="w-full bg-golden hover:bg-golden/90 text-navy font-semibold"
                  >
                    <Link href="/approvals">
                      Review Approvals
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Compliance Quick Card */}
            {complianceStatus !== 'COMPLIANT' && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-navy flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" />
                    Compliance Alert
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-navy/70">Status</span>
                    <Badge variant={complianceBadgeVariant}>
                      {complianceStatus === 'AT_RISK' ? 'At Risk' : 'Non-Compliant'}
                    </Badge>
                  </div>
                  <p className="text-sm text-navy/60">
                    {complianceResult.violations?.length || 0} active{' '}
                    {(complianceResult.violations?.length || 0) === 1 ? 'violation' : 'violations'}
                  </p>
                  <Button asChild variant="outline" className="w-full border-navy/20" size="sm">
                    <Link href="/compliance">
                      View Details
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Transactions - Full Width */}
        <TransactionsPreviewTable
          transactions={formattedTransactions}
          isTreasurer={isTreasurer}
        />
      </main>
    </div>
  )
}
