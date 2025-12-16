/**
 * Treasurer Budget Detail Page
 *
 * Main budget management page for treasurers showing status-specific actions
 */

import { auth } from '@/lib/auth/server-auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getBudgetWithVersions } from '@/lib/budget-workflow/queries'
import { getApprovalProgress } from '@/lib/budget-workflow/threshold'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileHeader } from '@/components/MobileHeader'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Edit, DollarSign, TrendingDown, Wallet, ActivitySquare, Users } from 'lucide-react'
import Link from 'next/link'
import { BudgetStatusBadge } from '@/components/budget/BudgetStatusBadge'
import { VersionBadge } from '@/components/budget/VersionBadge'
import { ApprovalProgress } from '@/components/budget/ApprovalProgress'
import { BudgetStatus, UserRole } from '@prisma/client'
import { SubmitForReviewButton } from '@/components/budget/SubmitForReviewButton'
import { PresentToParentsButton } from '@/components/budget/PresentToParentsButton'
import { ProposeUpdateButton } from '@/components/budget/ProposeUpdateButton'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { BudgetAllocationChart } from '@/components/dashboard/BudgetAllocationChart'
import { FundingSourcesCard } from '@/components/budget/FundingSourcesCard'
import { CategoryBreakdownTable } from '@/components/budget/CategoryBreakdownTable'
import { BudgetStatusPanel } from '@/components/budget/BudgetStatusPanel'
import { type BudgetHeadingGroup } from '@/lib/types/budget'

// Roles that can manage budgets
const AUTHORIZED_ROLES = [UserRole.TREASURER, UserRole.ASSISTANT_TREASURER, UserRole.PRESIDENT, UserRole.BOARD_MEMBER]

export default async function TreasurerBudgetDetailPage({
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

  // Check authorization - must be treasurer or leadership
  if (!AUTHORIZED_ROLES.includes(user.role)) {
    redirect('/dashboard')
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
            <p className="text-navy/60 mb-6">The budget you&apos;re looking for doesn&apos;t exist.</p>
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

  // Check authorization - must belong to same team
  if (budget.teamId !== user.teamId) {
    redirect('/dashboard')
  }

  // Get current version
  const currentVersion = budget.currentVersion
  if (!currentVersion) {
    redirect('/budget')
  }

  // Get approval progress if presented
  const progress = budget.status === BudgetStatus.PRESENTED && budget.presentedVersionNumber
    ? await getApprovalProgress(budget.id)
    : null

  // Get team season lifecycle state
  const teamSeason = await prisma.teamSeason.findUnique({
    where: {
      teamId_seasonLabel: {
        teamId: budget.teamId,
        seasonLabel: budget.season,
      },
    },
  })

  // Get available actions from lifecycle state machine
  let availableActions: string[] = []
  if (teamSeason) {
    const { getAvailableActions } = await import('@/lib/services/team-season-lifecycle')
    availableActions = await getAvailableActions(teamSeason.id, user.id)
  }

  // Determine what actions are available based on lifecycle state
  const canEdit = budget.status === BudgetStatus.DRAFT || availableActions.includes('START_BUDGET')
  const canSubmitForReview = availableActions.includes('SUBMIT_BUDGET_FOR_REVIEW')
  const canPresentToParents = availableActions.includes('PRESENT_BUDGET')
  const canProposeUpdate = availableActions.includes('PROPOSE_BUDGET_UPDATE')
  const isLocked = budget.status === BudgetStatus.LOCKED || (teamSeason?.state && ['LOCKED', 'ACTIVE', 'CLOSEOUT'].includes(teamSeason.state))

  // Fetch spending data per category
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

  // Fetch income data per category
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

  // Get category details for income
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

  // Create spending map
  const spendingMap = new Map(
    categorySpending.map((s) => [s.categoryId, Number(s._sum.amount || 0)])
  )

  // Calculate totals
  const totalBudget = Number(currentVersion.totalBudget)
  const totalSpent = categorySpending.reduce((sum, s) => sum + Number(s._sum.amount || 0), 0)
  const totalRemaining = totalBudget - totalSpent
  const totalIncome = categoryIncome.reduce((sum, i) => sum + Number(i._sum.amount || 0), 0)

  // Prepare category data for breakdown table
  const categoryData = currentVersion.allocations.map((allocation) => ({
    categoryId: allocation.categoryId,
    categoryName: allocation.categoryName,
    categoryHeading: allocation.categoryHeading,
    categoryColor: '#3B82F6', // Default color, can be fetched from category table
    budgeted: Number(allocation.allocated),
    spent: spendingMap.get(allocation.categoryId) || 0,
    remaining: Number(allocation.allocated) - (spendingMap.get(allocation.categoryId) || 0),
    percentUsed: Number(allocation.allocated) > 0
      ? ((spendingMap.get(allocation.categoryId) || 0) / Number(allocation.allocated)) * 100
      : 0,
  }))

  // Prepare funding sources data
  const fundingSources = categoryIncome.map((income) => {
    const category = incomeCategories.find((c) => c.id === income.categoryId)
    return {
      categoryId: income.categoryId,
      categoryName: category?.name || 'Unknown',
      amount: Number(income._sum.amount || 0),
      color: category?.color,
    }
  })

  // Calculate budget health
  const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
  const getBudgetHealth = (percent: number) => {
    if (percent >= 100) return { label: 'Over Budget', variant: 'destructive' as const }
    if (percent >= 90) return { label: 'At Limit', variant: 'warning' as const }
    if (percent >= 70) return { label: 'Watch', variant: 'warning' as const }
    return { label: 'On Track', variant: 'success' as const }
  }
  const budgetHealth = getBudgetHealth(percentUsed)

  // Group categories by heading for allocation chart
  const headingGroups = currentVersion.allocations.reduce((acc, allocation) => {
    const heading = allocation.categoryHeading
    if (!acc[heading]) {
      acc[heading] = {
        heading,
        color: '#3B82F6', // Default, should be fetched from category
        allocated: 0,
        spent: 0,
        percentOfTotal: 0,
      }
    }
    acc[heading].allocated += Number(allocation.allocated) * 100 // Convert to cents
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
              <Link href="/budget">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Budgets
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
            <div className="flex gap-2">
              {canEdit && (
                <Button variant="outline" asChild>
                  <Link href={`/budget/${budget.id}/edit`}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Budget
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

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
            {/* Budget Allocation Chart */}
            <BudgetAllocationChart
              groups={allocationGroups}
              totalBudget={totalBudget * 100}
            />

            {/* Funding Sources */}
            {fundingSources.length > 0 && (
              <FundingSourcesCard
                sources={fundingSources}
                totalIncome={totalIncome}
                totalBudget={totalBudget}
              />
            )}

            {/* Category Breakdown Table */}
            <CategoryBreakdownTable
              categories={categoryData}
              isTreasurer={true}
              canProposeUpdate={canProposeUpdate}
            />
          </div>

          {/* Right Sidebar - 4 cols */}
          <div className="lg:col-span-4">
            <BudgetStatusPanel
              status={budget.status}
              versionNumber={currentVersion.versionNumber}
              presentedVersionNumber={budget.presentedVersionNumber}
              changeSummary={currentVersion.changeSummary}
              createdAt={currentVersion.createdAt}
              updatedAt={budget.updatedAt}
              lockedAt={budget.lockedAt}
              actions={
                <div className="space-y-2">
                  {canSubmitForReview && (
                    <SubmitForReviewButton budgetId={budget.id} />
                  )}
                  {canPresentToParents && (
                    <PresentToParentsButton
                      budgetId={budget.id}
                      versionNumber={currentVersion.versionNumber}
                      userId={user.id}
                    />
                  )}
                  {canProposeUpdate && (
                    <ProposeUpdateButton
                      budgetId={budget.id}
                      currentVersion={currentVersion}
                    />
                  )}
                  {budget.status === BudgetStatus.PRESENTED && progress && (
                    <div className="pt-2 space-y-2">
                      <ApprovalProgress progress={progress} showCard={false} size="sm" />
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <Link href="/budget/approvals">
                          <Users className="mr-2 h-4 w-4" />
                          View Parent Acknowledgments
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              }
            />
          </div>
        </div>
      </main>
    </div>
  )
}
