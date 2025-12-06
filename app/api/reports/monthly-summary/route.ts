import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import { auth } from '@/lib/auth/server-auth'
import { logger } from '@/lib/logger'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = req.nextUrl.searchParams
    const month = searchParams.get('month') // Expected format: "2025-01"

    if (!month) {
      return NextResponse.json({ error: 'Month parameter is required' }, { status: 400 })
    }

    // Parse month
    const [year, monthNum] = month.split('-').map(Number)
    if (!year || !monthNum || monthNum < 1 || monthNum > 12) {
      return NextResponse.json({ error: 'Invalid month format. Use YYYY-MM' }, { status: 400 })
    }

    // Get user and team
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { team: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate date range for the month
    const startDate = new Date(year, monthNum - 1, 1)
    const endDate = new Date(year, monthNum, 0, 23, 59, 59, 999)

    // Get all approved transactions for the month
    const transactions = await prisma.transaction.findMany({
      where: {
        teamId: user.teamId,
        deletedAt: null,
        status: 'APPROVED',
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        category: true,
      },
    })

    // Calculate income by category
    const incomeByCategory: Record<string, number> = {}
    let totalIncome = 0

    transactions
      .filter((t) => t.type === 'INCOME')
      .forEach((t) => {
        const categoryName = t.category.name
        const amount = Number(t.amount)
        incomeByCategory[categoryName] = (incomeByCategory[categoryName] || 0) + amount
        totalIncome += amount
      })

    // Calculate expenses by category
    const expensesByCategory: Record<string, number> = {}
    let totalExpenses = 0

    transactions
      .filter((t) => t.type === 'EXPENSE')
      .forEach((t) => {
        const categoryName = t.category.name
        const amount = Number(t.amount)
        expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + amount
        totalExpenses += amount
      })

    // Format response
    const monthName = new Date(year, monthNum - 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })

    return NextResponse.json({
      month: monthName,
      monthCode: month,
      income: {
        total: totalIncome,
        byCategory: Object.entries(incomeByCategory).map(([category, amount]) => ({
          category,
          amount,
        })),
      },
      expenses: {
        total: totalExpenses,
        byCategory: Object.entries(expensesByCategory)
          .map(([category, amount]) => ({
            category,
            amount,
          }))
          .sort((a, b) => b.amount - a.amount), // Sort by amount descending
      },
      netIncome: totalIncome - totalExpenses,
      transactionCount: transactions.length,
    })
  } catch (error) {
    logger.error('Error generating monthly summary', error as Error)
    return NextResponse.json(
      { error: 'Failed to generate monthly summary' },
      { status: 500 }
    )
  }
}
