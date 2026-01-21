import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/server-auth'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { CategoryType, TransactionStatus } from '@prisma/client'

/**
 * POST /api/dev/season-reports
 * Generate season-end financial and compliance reports
 * Protected by DEV_MODE check - only works in development
 */
export async function POST(request: NextRequest) {
  try {
    // Check if dev mode is enabled
    if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
      return NextResponse.json(
        { error: 'Dev mode not enabled' },
        { status: 403 }
      )
    }

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { teamId } = body

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId required in request body' },
        { status: 400 }
      )
    }

    // Fetch team with all financial data
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        categories: {
          include: {
            transactions: {
              where: {
                status: {
                  in: [TransactionStatus.APPROVED, TransactionStatus.PENDING],
                },
              },
            },
          },
        },
        transactions: {
          where: {
            status: {
              in: [TransactionStatus.APPROVED, TransactionStatus.PENDING],
            },
          },
          orderBy: { transactionDate: 'asc' },
        },
        players: {
          include: { family: true },
        },
        users: true,
      },
    })

    if (!team) {
      return NextResponse.json({ error: 'Team not found' }, { status: 404 })
    }

    // Calculate totals
    const totalIncome = team.transactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = team.transactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0)

    const netBalance = totalIncome - totalExpenses

    // Income by category
    const incomeCategories = team.categories
      .filter((c) => c.type === CategoryType.INCOME)
      .map((cat) => {
        const catTransactions = cat.transactions.filter(
          (t) => t.type === 'INCOME'
        )
        const total = catTransactions.reduce((sum, t) => sum + t.amount, 0)
        return {
          name: cat.name,
          budgeted: cat.budgeted,
          actual: total,
          variance: total - cat.budgeted,
          count: catTransactions.length,
        }
      })
      .filter((c) => c.actual > 0 || c.budgeted > 0)

    // Expenses by category
    const expenseCategories = team.categories
      .filter((c) => c.type === CategoryType.EXPENSE)
      .map((cat) => {
        const catTransactions = cat.transactions.filter(
          (t) => t.type === 'EXPENSE'
        )
        const total = catTransactions.reduce((sum, t) => sum + t.amount, 0)
        return {
          name: cat.name,
          budgeted: cat.budgeted,
          actual: total,
          variance: cat.budgeted - total,
          percentUsed:
            cat.budgeted > 0 ? Math.round((total / cat.budgeted) * 100) : 0,
          count: catTransactions.length,
        }
      })
      .filter((c) => c.actual > 0 || c.budgeted > 0)
      .sort((a, b) => b.actual - a.actual)

    // Pending items
    const pendingTransactions = team.transactions.filter(
      (t) => t.status === TransactionStatus.PENDING
    )
    const pendingAmount = pendingTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    )

    // Missing receipts
    const missingReceipts = team.transactions.filter(
      (t) =>
        t.status === TransactionStatus.APPROVED &&
        t.amount >= 100 &&
        !t.receiptUrl
    )

    // Financial Summary Report
    const financialSummary = {
      reportName: 'Financial Summary 2025-2026',
      teamName: team.name,
      season: '2025-2026',
      generatedAt: new Date().toISOString(),
      summary: {
        totalIncome,
        totalExpenses,
        netBalance,
        budgetUsed:
          totalIncome > 0
            ? Math.round((totalExpenses / totalIncome) * 100)
            : 0,
        transactionCount: team.transactions.length,
      },
      income: {
        total: totalIncome,
        categories: incomeCategories,
      },
      expenses: {
        total: totalExpenses,
        categories: expenseCategories,
      },
    }

    // Compliance Report
    const complianceReport = {
      reportName: 'Compliance Report 2025-2026',
      teamName: team.name,
      season: '2025-2026',
      generatedAt: new Date().toISOString(),
      summary: {
        pendingReviews: pendingTransactions.length,
        pendingAmount,
        missingReceipts: missingReceipts.length,
        missingReceiptAmount: missingReceipts.reduce(
          (sum, t) => sum + t.amount,
          0
        ),
      },
      pendingTransactions: pendingTransactions.map((t) => ({
        date: t.transactionDate,
        description: t.description,
        vendor: t.vendor,
        amount: t.amount,
        category: team.categories.find((c) => c.id === t.categoryId)?.name,
      })),
      missingReceipts: missingReceipts.map((t) => ({
        date: t.transactionDate,
        description: t.description,
        vendor: t.vendor,
        amount: t.amount,
        category: team.categories.find((c) => c.id === t.categoryId)?.name,
      })),
    }

    // Treasurer Handoff Report
    const treasurerHandoff = {
      reportName: 'Treasurer Handoff 2025-2026',
      teamName: team.name,
      season: '2025-2026',
      generatedAt: new Date().toISOString(),
      summary: {
        finalBalance: netBalance,
        pendingItems: pendingTransactions.length,
        totalFamilies: team.players.filter(
          (p, i, arr) => arr.findIndex((x) => x.familyId === p.familyId) === i
        ).length,
        totalPlayers: team.players.length,
        totalUsers: team.users.length,
      },
      accountBalances: {
        income: totalIncome,
        expenses: totalExpenses,
        net: netBalance,
      },
      outstandingItems: {
        pendingReviews: pendingTransactions.length,
        missingReceipts: missingReceipts.length,
      },
      nextSeasonPreparation: {
        notes: [
          'Review and close all pending transactions',
          'Collect missing receipts before archiving',
          'Verify final bank reconciliation matches system balance',
          'Prepare budget proposal for next season',
          'Update contact information for returning families',
        ],
      },
    }

    logger.info(
      `[DEV MODE] Generated season reports for team ${teamId} by user ${userId}`
    )

    return NextResponse.json(
      {
        success: true,
        teamId,
        teamName: team.name,
        reports: [financialSummary, complianceReport, treasurerHandoff],
        message: `3 season-end reports generated for ${team.name}`,
      },
      { status: 200 }
    )
  } catch (error) {
    logger.error('POST /api/dev/season-reports error', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
