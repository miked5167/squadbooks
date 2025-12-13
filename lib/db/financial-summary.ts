import { prisma } from '@/lib/prisma'

export interface FinancialSummary {
  totalIncome: number
  totalExpenses: number
  netPosition: number
  budgetedExpensesTotal: number
  incomeByCategory: Array<{
    categoryId: string
    categoryName: string
    amount: number
  }>
  expensesByCategory: Array<{
    categoryId: string
    categoryName: string
    amount: number
  }>
}

/**
 * Get comprehensive financial summary for a team/season
 * Combines income, expenses, and net position calculations
 */
export async function getFinancialSummary(
  teamId: string,
  season?: string
): Promise<FinancialSummary> {
  // Get team info
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      budgetTotal: true,
      season: true,
    },
  })

  if (!team) {
    throw new Error('Team not found')
  }

  const currentSeason = season || team.season

  // Fetch all approved transactions for this team
  const [incomeTransactions, expenseTransactions, budgetAllocations] = await Promise.all([
    // Get all approved INCOME transactions
    prisma.transaction.findMany({
      where: {
        teamId,
        type: 'INCOME',
        status: 'APPROVED',
        deletedAt: null,
      },
      select: {
        amount: true,
        systemCategoryId: true,
        systemCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    // Get all approved EXPENSE transactions
    prisma.transaction.findMany({
      where: {
        teamId,
        type: 'EXPENSE',
        status: 'APPROVED',
        deletedAt: null,
      },
      select: {
        amount: true,
        systemCategoryId: true,
        systemCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
    // Get budget allocations for budgeted expenses total
    prisma.budgetAllocation.findMany({
      where: {
        teamId,
        season: currentSeason,
      },
      select: {
        allocated: true,
      },
    }),
  ])

  // Calculate total income
  const totalIncome = incomeTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0
  )

  // Calculate total expenses
  const totalExpenses = expenseTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.amount),
    0
  )

  // Calculate net position
  const netPosition = totalIncome - totalExpenses

  // Calculate budgeted expenses total
  const budgetedExpensesTotal = budgetAllocations.reduce(
    (sum, allocation) => sum + Number(allocation.allocated),
    0
  )

  // Group income by category
  const incomeMap = new Map<string, { name: string; amount: number }>()
  incomeTransactions.forEach((transaction) => {
    if (!transaction.systemCategoryId || !transaction.systemCategory) return
    const existing = incomeMap.get(transaction.systemCategoryId)
    if (existing) {
      existing.amount += Number(transaction.amount)
    } else {
      incomeMap.set(transaction.systemCategoryId, {
        name: transaction.systemCategory.name,
        amount: Number(transaction.amount),
      })
    }
  })

  const incomeByCategory = Array.from(incomeMap.entries()).map(([categoryId, data]) => ({
    categoryId,
    categoryName: data.name,
    amount: data.amount,
  }))

  // Group expenses by category
  const expenseMap = new Map<string, { name: string; amount: number }>()
  expenseTransactions.forEach((transaction) => {
    if (!transaction.systemCategoryId || !transaction.systemCategory) return
    const existing = expenseMap.get(transaction.systemCategoryId)
    if (existing) {
      existing.amount += Number(transaction.amount)
    } else {
      expenseMap.set(transaction.systemCategoryId, {
        name: transaction.systemCategory.name,
        amount: Number(transaction.amount),
      })
    }
  })

  const expensesByCategory = Array.from(expenseMap.entries()).map(([categoryId, data]) => ({
    categoryId,
    categoryName: data.name,
    amount: data.amount,
  }))

  return {
    totalIncome,
    totalExpenses,
    netPosition,
    budgetedExpensesTotal,
    incomeByCategory,
    expensesByCategory,
  }
}
