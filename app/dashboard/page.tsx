import { auth } from '@/lib/auth/server-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileHeader } from '@/components/MobileHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, Clock, ShieldCheck, ArrowRight, PiggyBank } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { getFinancialSummary } from '@/lib/db/financial-summary'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard'
import { BudgetCategoryList } from '@/components/dashboard/BudgetCategoryList'
import { TransactionsPreviewTable } from '@/components/dashboard/TransactionsPreviewTable'
import { ParentDashboard } from '@/components/dashboard/ParentDashboard'
import { ValidationComplianceCard } from '@/components/dashboard/ValidationComplianceCard'
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

  // Parallelize all database queries for better performance
  const [
    financialSummary,
    exceptionsCount,
    budgetAllocations,
    recentTransactions,
    complianceResult,
  ] = await Promise.all([
    getFinancialSummary(user.teamId),
    prisma.transaction.count({
      where: {
        teamId: user.teamId,
        status: 'EXCEPTION',
        deletedAt: null,
      },
    }),
    prisma.budgetAllocation.findMany({
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
    }),
    prisma.transaction.findMany({
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
    }),
    getTeamCompliance(),
  ])

  // Calculate spent per category
  const categorySpending = new Map<string, number>()
  financialSummary.expensesByCategory.forEach(expense => {
    categorySpending.set(expense.categoryId, expense.amount)
  })

  // Format budget data for component
  const budgetCategories = budgetAllocations.map(allocation => ({
    id: allocation.categoryId,
    name: allocation.category.name,
    spent: categorySpending.get(allocation.categoryId) || 0,
    budget: Number(allocation.allocated),
  }))

  // Format transactions for preview table
  const formattedTransactions = recentTransactions.map(tx => ({
    id: tx.id,
    transactionDate: tx.transactionDate,
    vendor: tx.vendor,
    categoryName: tx.category.name,
    categoryId: tx.categoryId,
    amount: Number(tx.amount),
    type: tx.type,
    status: tx.status,
    receiptUrl: tx.receiptUrl,
    validation: tx.validationJson as { compliant: boolean; violations?: any[] } | null,
    exceptionReason: tx.exceptionReason,
    resolvedAt: tx.resolvedAt?.toISOString(),
    overrideJustification: tx.overrideJustification,
    resolutionNotes: tx.resolutionNotes,
  }))
  const complianceScore = complianceResult.score || 100
  const complianceStatus = complianceResult.status || 'COMPLIANT'

  // Calculate expense percentage vs budget
  const expensePercentage =
    financialSummary.budgetedExpensesTotal > 0
      ? (financialSummary.totalExpenses / financialSummary.budgetedExpensesTotal) * 100
      : 0

  const isNetPositive = financialSummary.netPosition >= 0

  // Determine budget utilization status
  const budgetUtilizationStatus =
    expensePercentage >= 90 ? 'destructive' : expensePercentage >= 75 ? 'warning' : 'success'

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
        <main className="ml-0 px-4 py-6 pt-20 lg:ml-64 lg:px-8 lg:py-8 lg:pt-8">
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
      <main className="ml-0 px-4 py-6 pt-20 lg:ml-64 lg:px-8 lg:py-8 lg:pt-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-navy mb-1 text-3xl font-bold">Dashboard</h1>
          <p className="text-navy/60 text-base">{user.team?.name || 'Your Team'}</p>
        </div>

        {/* Financial Health Overview - 4 KPI Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            title="Cash Position"
            value={`${isNetPositive ? '+' : '-'}$${Math.abs(financialSummary.netPosition).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
            title="Budget Utilization"
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
              variant: budgetUtilizationStatus,
            }}
          />

          <KpiCard
            title="Exceptions"
            value={exceptionsCount}
            subtitle={exceptionsCount === 1 ? 'transaction' : 'transactions'}
            icon={Clock}
            trend={
              exceptionsCount > 0
                ? {
                    value: 'Review required',
                  }
                : undefined
            }
            badge={
              exceptionsCount > 0
                ? {
                    label: 'Action Needed',
                    variant: 'warning',
                  }
                : undefined
            }
            href="/exceptions"
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

        {/* Middle Grid - Budget Performance + Quick Actions/Exceptions */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Budget Performance - 8 cols on desktop */}
          <div className="lg:col-span-8">
            <BudgetCategoryList categories={budgetCategories} />
          </div>

          {/* Right Column - Quick Actions + Approvals/Compliance - 4 cols on desktop */}
          <div className="space-y-6 lg:col-span-4">
            {/* Quick Actions */}
            <QuickActionsCard isTreasurer={isTreasurer} />

            {/* Validation Compliance Analytics */}
            <ValidationComplianceCard teamId={user.teamId} />

            {/* Exceptions Card (if any) */}
            {exceptionsCount > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-navy flex items-center gap-2 text-base font-semibold">
                    <Clock className="h-4 w-4" />
                    Exceptions Need Review
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-golden text-2xl font-bold">{exceptionsCount}</p>
                    <p className="text-navy/60 text-sm">
                      {exceptionsCount === 1 ? 'transaction' : 'transactions'} flagged by validation
                      rules
                    </p>
                  </div>
                  <Button
                    asChild
                    className="bg-golden hover:bg-golden/90 text-navy w-full font-semibold"
                  >
                    <Link href="/exceptions">
                      Review Exceptions
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Compliance Quick Card */}
            {complianceStatus !== 'COMPLIANT' && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-navy flex items-center gap-2 text-base font-semibold">
                    <ShieldCheck className="h-4 w-4" />
                    Compliance Alert
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-navy/70 text-sm">Status</span>
                    <Badge variant={complianceBadgeVariant}>
                      {complianceStatus === 'AT_RISK' ? 'At Risk' : 'Non-Compliant'}
                    </Badge>
                  </div>
                  <p className="text-navy/60 text-sm">
                    {complianceResult.violations?.length || 0} active{' '}
                    {(complianceResult.violations?.length || 0) === 1 ? 'violation' : 'violations'}
                  </p>
                  <Button asChild variant="outline" className="border-navy/20 w-full" size="sm">
                    <Link href="/compliance">
                      View Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Recent Transactions - Full Width */}
        <TransactionsPreviewTable transactions={formattedTransactions} isTreasurer={isTreasurer} />
      </main>
    </div>
  )
}
