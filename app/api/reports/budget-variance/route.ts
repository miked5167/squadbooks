import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user and team
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { team: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const season = user.team.season

    // Get all budget allocations for the current season
    const budgetAllocations = await prisma.budgetAllocation.findMany({
      where: {
        teamId: user.teamId,
        season,
      },
      include: {
        category: true,
      },
    })

    // Get all approved expenses for the season
    const transactions = await prisma.transaction.findMany({
      where: {
        teamId: user.teamId,
        type: 'EXPENSE',
        status: 'APPROVED',
        deletedAt: null,
      },
      include: {
        category: true,
      },
    })

    // Calculate actual spending by category
    const actualByCategory: Record<string, number> = {}
    transactions.forEach((t) => {
      const categoryId = t.categoryId
      const amount = Number(t.amount)
      actualByCategory[categoryId] = (actualByCategory[categoryId] || 0) + amount
    })

    // Build variance report
    const categories = budgetAllocations.map((allocation) => {
      const budgeted = Number(allocation.allocated)
      const actual = actualByCategory[allocation.categoryId] || 0
      const variance = budgeted - actual
      const percentUsed = budgeted > 0 ? (actual / budgeted) * 100 : 0

      let status: 'healthy' | 'warning' | 'danger'
      if (percentUsed < 70) {
        status = 'healthy'
      } else if (percentUsed < 90) {
        status = 'warning'
      } else {
        status = 'danger'
      }

      return {
        categoryId: allocation.categoryId,
        category: allocation.category.name,
        heading: allocation.category.heading,
        budgeted,
        actual,
        variance,
        percentUsed: Math.round(percentUsed * 10) / 10, // Round to 1 decimal
        status,
      }
    })

    // Calculate totals
    const totalBudget = categories.reduce((sum, c) => sum + c.budgeted, 0)
    const totalSpent = categories.reduce((sum, c) => sum + c.actual, 0)
    const totalVariance = totalBudget - totalSpent
    const totalPercentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

    // Sort by heading, then by category name
    categories.sort((a, b) => {
      if (a.heading !== b.heading) {
        return a.heading.localeCompare(b.heading)
      }
      return a.category.localeCompare(b.category)
    })

    return NextResponse.json({
      season,
      totalBudget,
      totalSpent,
      totalVariance,
      totalPercentUsed: Math.round(totalPercentUsed * 10) / 10,
      categories,
      overBudgetCategories: categories.filter((c) => c.variance < 0),
    })
  } catch (error) {
    logger.error('Error generating budget variance report', error as Error)
    return NextResponse.json(
      { error: 'Failed to generate budget variance report' },
      { status: 500 }
    )
  }
}
