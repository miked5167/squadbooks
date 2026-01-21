import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'
import { formatTeamLevel } from '@/lib/team-utils'
import { logger } from '@/lib/logger'

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

    const team = user.team
    const season = team.season

    // Get budget allocations
    const budgetAllocations = await prisma.budgetAllocation.findMany({
      where: {
        teamId: user.teamId,
        season,
      },
      include: {
        category: true,
      },
    })

    // Get all approved expenses for budget calculations
    const approvedExpenses = await prisma.transaction.findMany({
      where: {
        teamId: user.teamId,
        type: 'EXPENSE',
        status: 'APPROVED',
        deletedAt: null,
      },
    })

    // Calculate actual spending by category
    const spentByCategory: Record<string, number> = {}
    let totalSpent = 0

    approvedExpenses.forEach((txn) => {
      const amount = Number(txn.amount)
      spentByCategory[txn.categoryId] = (spentByCategory[txn.categoryId] || 0) + amount
      totalSpent += amount
    })

    // Calculate total budget
    const totalBudget = budgetAllocations.reduce(
      (sum, alloc) => sum + Number(alloc.allocated),
      0
    )

    // Build category breakdown for pie chart
    const categoryBreakdown = budgetAllocations
      .map((allocation) => {
        const spent = spentByCategory[allocation.categoryId] || 0
        return {
          category: allocation.category.name,
          heading: allocation.category.heading,
          amount: spent,
          percentage: totalSpent > 0 ? Math.round((spent / totalSpent) * 100) : 0,
          color: allocation.category.color,
        }
      })
      .filter((item) => item.amount > 0) // Only show categories with spending
      .sort((a, b) => b.amount - a.amount) // Sort by amount descending

    // Get recent APPROVED transactions (last 30 days) for parent view
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentTransactions = await prisma.transaction.findMany({
      where: {
        teamId: user.teamId,
        status: 'APPROVED', // Parents only see approved transactions
        deletedAt: null,
        transactionDate: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        category: true,
      },
      orderBy: {
        transactionDate: 'desc',
      },
      take: 20, // Limit to 20 most recent
    })

    // Format transactions for parent view (hide sensitive info)
    const formattedTransactions = recentTransactions.map((txn) => ({
      id: txn.id,
      date: txn.transactionDate.toISOString().split('T')[0],
      vendor: txn.vendor,
      category: txn.category.name,
      amount: Number(txn.amount),
      type: txn.type,
      status: txn.status,
    }))

    // Calculate financial health
    const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    const remaining = totalBudget - totalSpent

    let financialHealth: {
      status: 'healthy' | 'warning' | 'danger'
      message: string
    }

    if (percentUsed < 70) {
      financialHealth = {
        status: 'healthy',
        message: 'On track with budget',
      }
    } else if (percentUsed < 90) {
      financialHealth = {
        status: 'warning',
        message: 'Approaching budget limit',
      }
    } else if (percentUsed < 100) {
      financialHealth = {
        status: 'danger',
        message: 'Near budget maximum',
      }
    } else {
      financialHealth = {
        status: 'danger',
        message: 'Over budget',
      }
    }

    return NextResponse.json({
      team: {
        name: team.name,
        level: formatTeamLevel(team.teamType, team.ageDivision, team.competitiveLevel, team.level),
        season: team.season,
      },
      budget: {
        total: totalBudget,
        spent: totalSpent,
        remaining,
        percentUsed: Math.round(percentUsed * 10) / 10, // Round to 1 decimal
      },
      categoryBreakdown,
      recentTransactions: formattedTransactions,
      financialHealth,
    })
  } catch (error) {
    logger.error('Error fetching parent dashboard', error as Error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
