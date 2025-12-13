/**
 * Parent Budget View Page
 *
 * Read-only budget view for parents with acknowledge button
 */

import { auth } from '@/lib/auth/server-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getBudgetWithVersions, getFamilyApproval } from '@/lib/budget-workflow/queries'
import { getApprovalProgress } from '@/lib/budget-workflow/threshold'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileHeader } from '@/components/MobileHeader'
import { Button } from '@/components/ui/button'
import { ArrowLeft, DollarSign, TrendingDown, Wallet, ActivitySquare } from 'lucide-react'
import Link from 'next/link'
import { ApprovalProgress } from '@/components/budget/ApprovalProgress'
import { ReapprovalBanner } from '@/components/budget/ReapprovalBanner'
import { ParentAcknowledgeButton } from '@/components/budget/ParentAcknowledgeButton'
import { BudgetStatus } from '@prisma/client'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { BudgetAllocationChart } from '@/components/dashboard/BudgetAllocationChart'
import { FundingSourcesCard } from '@/components/budget/FundingSourcesCard'
import { CategoryBreakdownTable } from '@/components/budget/CategoryBreakdownTable'
import { BudgetStatusPanel } from '@/components/budget/BudgetStatusPanel'
import { type BudgetHeadingGroup } from '@/lib/types/budget'
import { Card, CardContent } from '@/components/ui/card'

export default async function ParentBudgetViewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: budgetId } = await params
  const { userId } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    include: {
      team: true,
    },
  })

  if (!user) {
    redirect('/onboarding')
  }

  // Get budget with versions
  const budget = await getBudgetWithVersions(budgetId)

  if (!budget) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader>
          <AppSidebar />
        </MobileHeader>
        <AppSidebar />
        <main className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-navy mb-2">Budget Not Found</h2>
            <p className="text-navy/60 mb-6">The budget you're looking for doesn't exist.</p>
            <Button asChild>
              <Link href="/budget">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Budgets
              </Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  // Check authorization
  if (budget.teamId !== user.teamId) {
    redirect('/dashboard')
  }

  // Get presented version (what parents are approving)
  const presentedVersion = budget.presentedVersion || budget.currentVersion
  if (!presentedVersion) {
    redirect('/budget')
  }

  // Find user's family
  const family = await prisma.family.findFirst({
    where: {
      teamId: user.teamId,
      OR: [
        { primaryEmail: user.email },
        { secondaryEmail: user.email },
      ],
    },
  })

  // Check if family already approved this version
  let familyApproval = null
  let lastApprovedVersion: number | undefined
  if (family) {
    familyApproval = await getFamilyApproval(presentedVersion.id, family.id)

    // Check if they approved any previous version
    if (!familyApproval && presentedVersion.versionNumber > 1) {
      const previousApprovals = await prisma.budgetVersionApproval.findMany({
        where: {
          familyId: family.id,
          budgetVersion: {
            budgetId: budget.id,
            versionNumber: { lt: presentedVersion.versionNumber },
          },
        },
        orderBy: {
          budgetVersion: { versionNumber: 'desc' },
        },
        take: 1,
        include: {
          budgetVersion: true,
        },
      })

      if (previousApprovals.length > 0) {
        lastApprovedVersion = previousApprovals[0].budgetVersion.versionNumber
      }
    }
  }

  // Get approval progress
  const progress = budget.status === BudgetStatus.PRESENTED && budget.presentedVersionNumber
    ? await getApprovalProgress(budget.id)
    : null

  const canAcknowledge = budget.status === BudgetStatus.PRESENTED && family && !familyApproval

  // Fetch spending data per category (same as treasurer view)
  const categorySpending = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      teamId: budget.teamId,
      type: 'EXPENSE',
      status: 'APPROVED',
      deletedAt: null,
    },
    _sum: {
      amount: true,
    },
  })

  const categoryIncome = await prisma.transaction.groupBy({
    by: ['categoryId'],
    where: {
      teamId: budget.teamId,
      type: 'INCOME',
      status: 'APPROVED',
      deletedAt: null,
    },
    _sum: {
      amount: true,
    },
  })

  const incomeCategories = await prisma.category.findMany({
    where: {
      id: { in: categoryIncome.map((c) => c.categoryId) },
    },
    select: {
      id: true,
      name: true,
      color: true,
      heading: true,
    },
  })

  const spendingMap = new Map(
    categorySpending.map((s) => [s.categoryId, Number(s._sum.amount || 0)])
  )

  const totalBudget = Number(presentedVersion.totalBudget)
  const totalSpent = categorySpending.reduce((sum, s) => sum + Number(s._sum.amount || 0), 0)
  const totalRemaining = totalBudget - totalSpent
  const totalIncome = categoryIncome.reduce((sum, i) => sum + Number(i._sum.amount || 0), 0)

  const categoryData = presentedVersion.allocations.map((allocation) => ({
    categoryId: allocation.categoryId,
    categoryName: allocation.categoryName,
    categoryHeading: allocation.categoryHeading,
    categoryColor: '#3B82F6',
    budgeted: Number(allocation.allocated),
    spent: spendingMap.get(allocation.categoryId) || 0,
    remaining: Number(allocation.allocated) - (spendingMap.get(allocation.categoryId) || 0),
    percentUsed: Number(allocation.allocated) > 0
      ? ((spendingMap.get(allocation.categoryId) || 0) / Number(allocation.allocated)) * 100
      : 0,
  }))

  const fundingSources = categoryIncome.map((income) => {
    const category = incomeCategories.find((c) => c.id === income.categoryId)
    return {
      categoryId: income.categoryId,
      categoryName: category?.name || 'Unknown',
      amount: Number(income._sum.amount || 0),
      color: category?.color,
    }
  })

  const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  const getBudgetHealth = (percent: number) => {
    if (percent >= 100) return { label: 'Over Budget', variant: 'destructive' as const }
    if (percent >= 90) return { label: 'At Limit', variant: 'warning' as const }
    if (percent >= 70) return { label: 'Watch', variant: 'warning' as const }
    return { label: 'On Track', variant: 'success' as const }
  }
  const budgetHealth = getBudgetHealth(percentUsed)

  const headingGroups = presentedVersion.allocations.reduce((acc, allocation) => {
    const heading = allocation.categoryHeading
    if (!acc[heading]) {
      acc[heading] = {
        heading,
        color: '#3B82F6',
        allocated: 0,
        spent: 0,
        percentOfTotal: 0,
      }
    }
    acc[heading].allocated += Number(allocation.allocated) * 100
    acc[heading].spent += (spendingMap.get(allocation.categoryId) || 0) * 100
    return acc
  }, {} as Record<string, BudgetHeadingGroup>)

  const allocationGroups = Object.values(headingGroups).map((group) => ({
    ...group,
    percentOfTotal: totalBudget > 0 ? (group.allocated / 100 / totalBudget) * 100 : 0,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <MobileHeader>
        <AppSidebar />
      </MobileHeader>
      <AppSidebar />

      <main className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Button variant="ghost" asChild size="sm">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-navy mb-1">Budget</h1>
              <p className="text-base text-navy/60">
                {budget.season} • {user.team?.name}
              </p>
            </div>
          </div>
        </div>

        {/* Re-approval Banner */}
        {lastApprovedVersion && (
          <div className="mb-6">
            <ReapprovalBanner
              currentVersionNumber={presentedVersion.versionNumber}
              lastApprovedVersion={lastApprovedVersion}
            />
          </div>
        )}

        {/* KPI Overview Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard
            title="Total Budget"
            value={`$${totalBudget.toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`}
            subtitle="Budgeted expenses"
            icon={DollarSign}
          />
          <KpiCard
            title="Total Spent"
            value={`$${totalSpent.toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`}
            subtitle={`${percentUsed.toFixed(1)}% of budget`}
            icon={TrendingDown}
          />
          <KpiCard
            title="Remaining"
            value={`$${totalRemaining.toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`}
            subtitle={totalRemaining >= 0 ? 'Under budget' : 'Over budget'}
            icon={Wallet}
            badge={
              totalRemaining >= 0
                ? { label: 'Available', variant: 'success' }
                : { label: 'Deficit', variant: 'destructive' }
            }
          />
          <KpiCard
            title="Budget Health"
            value={`${percentUsed.toFixed(1)}%`}
            subtitle="Used to date"
            icon={ActivitySquare}
            badge={{ label: budgetHealth.label, variant: budgetHealth.variant }}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Content - 8 cols */}
          <div className="lg:col-span-8 space-y-6">
            <BudgetAllocationChart
              groups={allocationGroups}
              totalBudget={totalBudget * 100}
            />

            {fundingSources.length > 0 && (
              <FundingSourcesCard
                sources={fundingSources}
                totalIncome={totalIncome}
                totalBudget={totalBudget}
              />
            )}

            <CategoryBreakdownTable
              categories={categoryData}
              isTreasurer={false}
              canProposeUpdate={false}
            />
          </div>

          {/* Right Sidebar - 4 cols */}
          <div className="lg:col-span-4 space-y-4">
            <BudgetStatusPanel
              status={budget.status}
              versionNumber={presentedVersion.versionNumber}
              presentedVersionNumber={budget.presentedVersionNumber}
              changeSummary={presentedVersion.changeSummary}
              createdAt={presentedVersion.createdAt}
              updatedAt={budget.updatedAt}
              lockedAt={budget.lockedAt}
              isParentView
            />

            {progress && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <ApprovalProgress progress={progress} showCard={false} size="sm" />
                </CardContent>
              </Card>
            )}

            {canAcknowledge && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <ParentAcknowledgeButton
                    budgetVersionId={presentedVersion.id}
                    familyId={family.id}
                    userId={user.id}
                    isAlreadyAcknowledged={!!familyApproval}
                    budgetId={budget.id}
                  />
                  <p className="text-xs text-center text-navy/60">
                    By acknowledging, you confirm your review and approval of this budget.
                  </p>
                </CardContent>
              </Card>
            )}

            {familyApproval && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-900 mb-1">
                  ✓ You've Acknowledged This Budget
                </p>
                <p className="text-sm text-green-700">
                  Thank you for reviewing and approving the budget. You acknowledged this on{' '}
                  {new Date(familyApproval.acknowledgedAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  .
                </p>
              </div>
            )}

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm font-medium text-navy mb-2">Questions?</p>
              <p className="text-sm text-navy/70">
                Contact your team treasurer for any questions about the budget or specific
                allocations.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
