'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign, TrendingDown, Wallet, ActivitySquare, AlertTriangle, Loader2, Eye, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { BudgetAllocationChart } from '@/components/dashboard/BudgetAllocationChart'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { FundingSourcesCard } from '@/components/budget/FundingSourcesCard'
import { CategoryBreakdownTable } from '@/components/budget/CategoryBreakdownTable'
import type { BudgetHeadingGroup } from '@/lib/types/budget'

interface BudgetData {
  teamId: string
  season: string
  totalBudget: number
  totalAllocated: number
  totalSpent: number
  totalPending: number
  totalRemaining: number
  overallPercentage: number
  projectedPercentage: number
  overallHealth: string
  projectedHealth: string
  categories: Array<{
    categoryId: string
    categoryName: string
    categoryHeading: string
    categoryColor: string
    allocated: number
    spent: number
    pending: number
    remaining: number
    percentage: number
    projectedPercentage: number
    health: string
    projectedHealth: string
  }>
  unallocated: number
}

interface BudgetPageClientProps {
  isTreasurer: boolean
}

export function BudgetPageClient({ isTreasurer }: BudgetPageClientProps) {
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null)
  const [loading, setLoading] = useState(true)

  // Financial summary state
  const [financialSummary, setFinancialSummary] = useState<{
    totalIncome: number
    totalExpenses: number
    netPosition: number
    budgetedExpensesTotal: number
    incomeByCategory: Array<{
      categoryId: string
      categoryName: string
      amount: number
    }>
  } | null>(null)

  async function fetchBudget() {
    try {
      const res = await fetch('/api/budget')
      if (res.ok) {
        const data = await res.json()
        setBudgetData(data)
      } else {
        toast.error('Failed to load budget data')
      }
    } catch (err) {
      console.error('Failed to fetch budget:', err)
      toast.error('Failed to load budget data')
    } finally {
      setLoading(false)
    }
  }

  async function fetchFinancialSummary() {
    try {
      const res = await fetch('/api/financial-summary')
      if (res.ok) {
        const data = await res.json()
        setFinancialSummary(data)
      }
    } catch (err) {
      console.error('Failed to fetch financial summary:', err)
    }
  }

  useEffect(() => {
    fetchBudget()
    fetchFinancialSummary()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-navy" />
      </div>
    )
  }

  if (!budgetData) {
    return (
      <Card className="border-0 shadow-card">
        <CardContent className="py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-navy/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-navy" />
            </div>
            <h3 className="text-lg font-semibold text-navy mb-2">No Budget Data</h3>
            <p className="text-navy/60 mb-4">
              Set up your budget to start tracking spending
            </p>
            {isTreasurer && (
              <Button className="bg-navy hover:bg-navy-medium text-white">
                <Plus className="mr-2 w-4 h-4" />
                Create Budget
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const { totalAllocated, totalSpent, totalRemaining, categories, season } = budgetData

  // Calculate budget health
  const percentUsed = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0
  const getBudgetHealth = (percent: number) => {
    if (percent >= 100) return { label: 'Over Budget', variant: 'destructive' as const }
    if (percent >= 90) return { label: 'At Limit', variant: 'warning' as const }
    if (percent >= 70) return { label: 'Watch', variant: 'warning' as const }
    return { label: 'On Track', variant: 'success' as const }
  }
  const budgetHealth = getBudgetHealth(percentUsed)

  // Group categories by heading for allocation chart
  const headingGroups = categories.reduce((acc, item) => {
    const heading = item.categoryHeading
    if (!acc[heading]) {
      acc[heading] = {
        heading,
        color: item.categoryColor,
        allocated: 0,
        spent: 0,
        percentOfTotal: 0,
      }
    }
    acc[heading].allocated += item.allocated * 100 // Convert to cents
    acc[heading].spent += item.spent * 100
    return acc
  }, {} as Record<string, BudgetHeadingGroup>)

  // Calculate percentages
  const allocationGroups = Object.values(headingGroups).map((group) => ({
    ...group,
    percentOfTotal: totalAllocated > 0 ? (group.allocated / 100 / totalAllocated) * 100 : 0,
  }))

  // Prepare category data for breakdown table
  const categoryData = categories.map((cat) => ({
    categoryId: cat.categoryId,
    categoryName: cat.categoryName,
    categoryHeading: cat.categoryHeading,
    categoryColor: cat.categoryColor,
    budgeted: cat.allocated,
    spent: cat.spent,
    remaining: cat.remaining,
    percentUsed: cat.percentage,
  }))

  // Prepare funding sources from financial summary
  const fundingSources = financialSummary?.incomeByCategory.map((income) => ({
    categoryId: income.categoryId,
    categoryName: income.categoryName,
    amount: income.amount,
  })) || []

  return (
    <>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-navy">Budget</h1>
              {!isTreasurer && (
                <Badge variant="secondary" className="bg-navy/10 text-navy hover:bg-navy/10">
                  <Eye className="w-3 h-3 mr-1" />
                  Read-only
                </Badge>
              )}
            </div>
            <p className="text-base text-navy/60 mt-1">
              {season || '2024-25 Season'}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          title="Total Budget"
          value={`$${totalAllocated.toLocaleString('en-US', {
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

      {/* Main Content */}
      <div className="space-y-6">
        {/* Budget Allocation Chart */}
        <BudgetAllocationChart
          groups={allocationGroups}
          totalBudget={totalAllocated * 100}
        />

        {/* Funding Sources */}
        {financialSummary && fundingSources.length > 0 && (
          <FundingSourcesCard
            sources={fundingSources}
            totalIncome={financialSummary.totalIncome}
            totalBudget={totalAllocated}
          />
        )}

        {/* Category Breakdown Table */}
        <CategoryBreakdownTable
          categories={categoryData}
          isTreasurer={isTreasurer}
          canProposeUpdate={false}
        />
      </div>
    </>
  )
}
