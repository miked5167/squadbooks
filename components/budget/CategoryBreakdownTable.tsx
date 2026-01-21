/**
 * Category Breakdown Table Component
 *
 * Enhanced table showing budget categories with spending, remaining, and progress
 */

'use client'

import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

interface CategoryItem {
  categoryId: string
  categoryName: string
  categoryHeading: string
  categoryColor?: string
  budgeted: number
  spent: number
  remaining: number
  percentUsed: number
}

interface CategoryBreakdownTableProps {
  categories: CategoryItem[]
  showNotes?: boolean
  className?: string
  isTreasurer?: boolean
  canProposeUpdate?: boolean
}

function getBudgetStatus(percentUsed: number): {
  label: string
  variant: 'success' | 'warning' | 'destructive'
  color: string
} {
  if (percentUsed >= 100) {
    return { label: 'Over Budget', variant: 'destructive', color: 'text-red-600' }
  } else if (percentUsed >= 90) {
    return { label: 'At Limit', variant: 'warning', color: 'text-yellow-600' }
  } else if (percentUsed >= 70) {
    return { label: 'Watch', variant: 'warning', color: 'text-yellow-600' }
  } else {
    return { label: 'On Track', variant: 'success', color: 'text-green-600' }
  }
}

function getVarianceExplanation(category: CategoryItem): {
  text: string
  overAmount?: number
  isOverBudget: boolean
} {
  const { percentUsed, budgeted, spent } = category
  const overAmount = spent - budgeted

  if (budgeted === 0) {
    return {
      text: 'No budget was set for this category.',
      isOverBudget: false,
    }
  } else if (percentUsed >= 100) {
    return {
      text: 'This category is over budget by',
      overAmount,
      isOverBudget: true,
    }
  } else if (percentUsed >= 80) {
    return {
      text: 'Spending is nearing the approved budget limit.',
      isOverBudget: false,
    }
  } else {
    return {
      text: 'Spending aligns with the approved budget.',
      isOverBudget: false,
    }
  }
}

export function CategoryBreakdownTable({
  categories,
  _showNotes = false,
  className,
  isTreasurer = false,
  canProposeUpdate = false,
}: CategoryBreakdownTableProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Group categories by heading
  const groupedByHeading = categories.reduce((acc, category) => {
    const heading = category.categoryHeading
    if (!acc[heading]) {
      acc[heading] = {
        heading,
        color: category.categoryColor,
        categories: [],
        totalBudgeted: 0,
        totalSpent: 0,
        totalRemaining: 0,
      }
    }
    acc[heading].categories.push(category)
    acc[heading].totalBudgeted += category.budgeted
    acc[heading].totalSpent += category.spent
    acc[heading].totalRemaining += category.remaining
    return acc
  }, {} as Record<string, {
    heading: string
    color?: string
    categories: CategoryItem[]
    totalBudgeted: number
    totalSpent: number
    totalRemaining: number
  }>)

  const headingGroups = Object.values(groupedByHeading)
  const totalBudgeted = categories.reduce((sum, c) => sum + c.budgeted, 0)
  const totalSpent = categories.reduce((sum, c) => sum + c.spent, 0)
  const totalRemaining = categories.reduce((sum, c) => sum + c.remaining, 0)
  const totalPercentUsed = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0

  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
  }

  return (
    <Card className={cn('border-0 shadow-sm', className)}>
      <CardHeader>
        <CardTitle className="text-navy">Category Breakdown</CardTitle>
        <CardDescription>
          Detailed breakdown by category with spending progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-navy/10">
          <Table>
            <TableHeader>
              <TableRow className="border-navy/10 hover:bg-transparent">
                <TableHead className="text-navy/70 w-[250px]">Category</TableHead>
                <TableHead className="text-right text-navy/70">Budgeted</TableHead>
                <TableHead className="text-right text-navy/70">Spent</TableHead>
                <TableHead className="text-right text-navy/70">Remaining</TableHead>
                <TableHead className="text-center text-navy/70">% Used</TableHead>
                <TableHead className="text-center text-navy/70">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {headingGroups.map((group) => (
                <React.Fragment key={group.heading}>
                  {/* Heading Row (Non-expandable separator) */}
                  <TableRow className="bg-navy/5 hover:bg-navy/5 border-navy/10">
                    <TableCell colSpan={6} className="py-2">
                      <div className="flex items-center gap-3">
                        {group.color && (
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: group.color }}
                          />
                        )}
                        <span className="font-semibold text-navy text-sm">
                          {group.heading}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {group.categories.length}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Individual Category Rows (Each expandable) */}
                  {group.categories.map((category, index) => {
                    const status = getBudgetStatus(category.percentUsed)
                    const explanation = getVarianceExplanation(category)
                    const isExpanded = expandedCategory === category.categoryId
                    const uniqueKey = `${group.heading}-${category.categoryId}-${index}`

                    return (
                      <React.Fragment key={uniqueKey}>
                        {/* Collapsed Category Row */}
                        <TableRow
                          className="border-navy/10 hover:bg-gray-50/50 cursor-pointer"
                          onClick={() => toggleCategory(category.categoryId)}
                        >
                          <TableCell colSpan={6} className="p-0">
                            <div className="w-full px-4 py-3">
                              <div className="flex items-center gap-4 w-full">
                                {/* Expand icon */}
                                <div className="flex-shrink-0">
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-navy/40" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-navy/40" />
                                  )}
                                </div>

                                {/* Category Name */}
                                <div className="flex-1 text-left">
                                  <span className="text-sm font-medium text-navy">
                                    {category.categoryName}
                                  </span>
                                </div>

                                {/* % Used with Progress Bar */}
                                <div className="w-32">
                                  <div className="space-y-1">
                                    <div className="text-xs text-center font-medium text-navy/70">
                                      {category.percentUsed.toFixed(1)}% used
                                    </div>
                                    <Progress
                                      value={Math.min(category.percentUsed, 100)}
                                      className="h-1.5"
                                      indicatorClassName={cn(
                                        category.percentUsed >= 100
                                          ? 'bg-red-500'
                                          : category.percentUsed >= 80
                                          ? 'bg-yellow-500'
                                          : 'bg-green-500'
                                      )}
                                    />
                                  </div>
                                </div>

                                {/* Remaining */}
                                <div className="w-28 text-right">
                                  <div className="text-sm font-semibold text-navy">
                                    ${Math.abs(category.remaining).toLocaleString('en-US', {
                                      minimumFractionDigits: 0,
                                      maximumFractionDigits: 0,
                                    })}
                                  </div>
                                  <div className="text-xs text-navy/60">
                                    {category.remaining >= 0 ? 'remaining' : 'over'}
                                  </div>
                                </div>

                                {/* Status Badge */}
                                <div className="w-24">
                                  <Badge
                                    variant={status.variant}
                                    className={cn(
                                      'text-xs',
                                      status.variant === 'success' &&
                                        'bg-green-100 text-green-800 hover:bg-green-100',
                                      status.variant === 'warning' &&
                                        'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
                                      status.variant === 'destructive' &&
                                        'bg-red-100 text-red-800 hover:bg-red-100'
                                    )}
                                  >
                                    {status.label}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <TableRow className="border-navy/10">
                            <TableCell colSpan={6} className="p-6 bg-gray-50/50 border-t border-navy/5">
                              <div className="max-w-4xl">
                                {/* SECTION 1: Mini KPI Strip */}
                                <div className="flex gap-8 mb-4">
                                  <div>
                                    <div className="text-xs font-medium text-navy/50 mb-1">
                                      Budgeted
                                    </div>
                                    <div className="text-sm font-semibold text-navy">
                                      ${category.budgeted.toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium text-navy/50 mb-1">
                                      Spent
                                    </div>
                                    <div className="text-sm font-semibold text-navy">
                                      ${category.spent.toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-xs font-medium text-navy/50 mb-1">
                                      Remaining
                                    </div>
                                    <div className="text-sm font-semibold text-navy text-right">
                                      ${Math.abs(category.remaining).toLocaleString('en-US', {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}
                                    </div>
                                  </div>
                                </div>

                                <Separator className="my-4 bg-navy/10" />

                                {/* SECTION 2: Variance Explanation */}
                                <div className="mb-4">
                                  <p className="text-sm text-navy/70">
                                    {explanation.text}
                                    {explanation.overAmount !== undefined && (
                                      <span className="font-semibold text-red-600 ml-1">
                                        ${explanation.overAmount.toLocaleString('en-US', {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}
                                      </span>
                                    )}
                                    .
                                  </p>
                                </div>

                                <Separator className="my-4 bg-navy/10" />

                                {/* SECTION 3: Actions & Top Contributors */}
                                <div className="space-y-4">
                                  {isTreasurer ? (
                                    <>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="default"
                                          size="sm"
                                          asChild
                                          className="bg-navy hover:bg-navy-medium text-white"
                                        >
                                          <Link href={`/transactions?categoryId=${category.categoryId}`}>
                                            View Transactions
                                          </Link>
                                        </Button>
                                        {canProposeUpdate && (
                                          <Button variant="outline" size="sm">
                                            Propose Budget Update
                                          </Button>
                                        )}
                                      </div>
                                      <p className="text-xs text-navy/60">
                                        Budget changes require coach review and parent re-approval once
                                        re-presented.
                                      </p>
                                    </>
                                  ) : (
                                    <p className="text-sm text-navy/60">
                                      This is a summary of approved spending in this category.
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    )
                  })}
                </React.Fragment>
              ))}

              {/* Total Row */}
              <TableRow className="bg-navy/5 hover:bg-navy/5 border-t-2 border-navy/20">
                <TableCell className="font-bold text-navy text-base">
                  Total Expenses
                </TableCell>
                <TableCell className="text-right font-bold text-navy text-base">
                  ${totalBudgeted.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className="text-right font-bold text-navy text-base">
                  ${totalSpent.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell
                  className={cn(
                    'text-right font-bold text-base',
                    totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  ${Math.abs(totalRemaining).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell className="text-center">
                  <div className="font-bold text-navy text-base">
                    {totalPercentUsed.toFixed(1)}%
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={getBudgetStatus(totalPercentUsed).variant}
                    className={cn(
                      'text-xs font-semibold',
                      getBudgetStatus(totalPercentUsed).variant === 'success' &&
                        'bg-green-100 text-green-800 hover:bg-green-100',
                      getBudgetStatus(totalPercentUsed).variant === 'warning' &&
                        'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
                      getBudgetStatus(totalPercentUsed).variant === 'destructive' &&
                        'bg-red-100 text-red-800 hover:bg-red-100'
                    )}
                  >
                    {getBudgetStatus(totalPercentUsed).label}
                  </Badge>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-navy/60">No budget categories found</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
