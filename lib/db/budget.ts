import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

/**
 * Budget health status based on spending percentage
 */
export type BudgetHealth = 'healthy' | 'warning' | 'critical'

export interface CategoryBudget {
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
  health: BudgetHealth
  projectedHealth: BudgetHealth
}

export interface BudgetOverview {
  season: string
  totalBudget: number
  totalAllocated: number
  totalSpent: number
  totalPending: number
  totalRemaining: number
  overallPercentage: number
  projectedPercentage: number
  overallHealth: BudgetHealth
  projectedHealth: BudgetHealth
  categories: CategoryBudget[]
  unallocated: number
}

export interface BudgetStats {
  totalAllocated: number
  totalSpent: number
  totalRemaining: number
  healthyCount: number
  warningCount: number
  criticalCount: number
}

/**
 * Calculate budget health status based on percentage spent
 */
export function calculateBudgetHealth(percentage: number): BudgetHealth {
  if (percentage >= 90) return 'critical'
  if (percentage >= 70) return 'warning'
  return 'healthy'
}

/**
 * Calculate spending for a specific category
 */
export async function calculateCategorySpending(
  teamId: string,
  categoryId: string,
  season?: string
): Promise<number> {
  const result = await prisma.transaction.aggregate({
    where: {
      teamId,
      categoryId,
      type: 'EXPENSE',
      status: 'APPROVED',
      deletedAt: null,
    },
    _sum: {
      amount: true,
    },
  })

  return Number(result._sum.amount || 0)
}

/**
 * Calculate pending spending for a specific category
 */
export async function calculateCategoryPending(
  teamId: string,
  categoryId: string,
  season?: string
): Promise<number> {
  const result = await prisma.transaction.aggregate({
    where: {
      teamId,
      categoryId,
      type: 'EXPENSE',
      status: 'PENDING',
      deletedAt: null,
    },
    _sum: {
      amount: true,
    },
  })

  return Number(result._sum.amount || 0)
}

/**
 * Get budget overview with spending calculations for all categories
 */
export async function getBudgetOverview(
  teamId: string,
  season?: string
): Promise<BudgetOverview> {
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

  // Get all budget allocations for this team and season
  const budgetAllocations = await prisma.budgetAllocation.findMany({
    where: {
      teamId,
      season: currentSeason,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          heading: true,
          color: true,
          sortOrder: true,
        },
      },
    },
    orderBy: {
      category: {
        sortOrder: 'asc',
      },
    },
  })

  // Batch fetch all spending and pending amounts in 2 queries
  const categoryIds = budgetAllocations.map((a) => a.categoryId)

  const [spentByCategory, pendingByCategory] = await Promise.all([
    // Get all APPROVED spending grouped by category
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        teamId,
        categoryId: { in: categoryIds },
        type: 'EXPENSE',
        status: 'APPROVED',
        deletedAt: null,
      },
      _sum: {
        amount: true,
      },
    }),
    // Get all PENDING spending grouped by category
    prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        teamId,
        categoryId: { in: categoryIds },
        type: 'EXPENSE',
        status: 'PENDING',
        deletedAt: null,
      },
      _sum: {
        amount: true,
      },
    }),
  ])

  // Create lookup maps for fast access
  const spentMap = new Map(
    spentByCategory.map((item) => [item.categoryId, Number(item._sum.amount || 0)])
  )
  const pendingMap = new Map(
    pendingByCategory.map((item) => [item.categoryId, Number(item._sum.amount || 0)])
  )

  // Calculate spending for each category
  const categoryBudgets: CategoryBudget[] = budgetAllocations.map((allocation) => {
    const spent = spentMap.get(allocation.categoryId) || 0
    const pending = pendingMap.get(allocation.categoryId) || 0

    const allocated = Number(allocation.allocated)
    const remaining = allocated - spent
    const percentage = allocated > 0 ? (spent / allocated) * 100 : 0
    const projectedSpent = spent + pending
    const projectedPercentage = allocated > 0 ? (projectedSpent / allocated) * 100 : 0
    const health = calculateBudgetHealth(percentage)
    const projectedHealth = calculateBudgetHealth(projectedPercentage)

    return {
      categoryId: allocation.category.id,
      categoryName: allocation.category.name,
      categoryHeading: allocation.category.heading,
      categoryColor: allocation.category.color,
      allocated,
      spent,
      pending,
      remaining,
      percentage,
      projectedPercentage,
      health,
      projectedHealth,
    }
  })

  // Calculate totals
  const totalAllocated = categoryBudgets.reduce((sum, cat) => sum + cat.allocated, 0)
  const totalSpent = categoryBudgets.reduce((sum, cat) => sum + cat.spent, 0)
  const totalPending = categoryBudgets.reduce((sum, cat) => sum + cat.pending, 0)
  const totalRemaining = totalAllocated - totalSpent
  const overallPercentage = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0
  const projectedSpent = totalSpent + totalPending
  const projectedPercentage = totalAllocated > 0 ? (projectedSpent / totalAllocated) * 100 : 0
  const overallHealth = calculateBudgetHealth(overallPercentage)
  const projectedHealth = calculateBudgetHealth(projectedPercentage)

  const totalBudget = Number(team.budgetTotal)
  const unallocated = totalBudget - totalAllocated

  return {
    season: currentSeason,
    totalBudget,
    totalAllocated,
    totalSpent,
    totalPending,
    totalRemaining,
    overallPercentage,
    projectedPercentage,
    overallHealth,
    projectedHealth,
    categories: categoryBudgets,
    unallocated,
  }
}

/**
 * Get budget for a specific category
 */
export async function getBudgetByCategory(
  teamId: string,
  categoryId: string,
  season?: string
): Promise<CategoryBudget | null> {
  // Get team season if not provided
  if (!season) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { season: true },
    })
    season = team?.season
  }

  if (!season) {
    throw new Error('Season not found')
  }

  // Get budget allocation
  const allocation = await prisma.budgetAllocation.findUnique({
    where: {
      teamId_categoryId_season: {
        teamId,
        categoryId,
        season,
      },
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          heading: true,
          color: true,
        },
      },
    },
  })

  if (!allocation) {
    return null
  }

  // Calculate spending
  const spent = await calculateCategorySpending(teamId, categoryId, season)

  const allocated = Number(allocation.allocated)
  const remaining = allocated - spent
  const percentage = allocated > 0 ? (spent / allocated) * 100 : 0
  const health = calculateBudgetHealth(percentage)

  return {
    categoryId: allocation.category.id,
    categoryName: allocation.category.name,
    categoryHeading: allocation.category.heading,
    categoryColor: allocation.category.color,
    allocated,
    spent,
    remaining,
    percentage,
    health,
  }
}

/**
 * Create or update a budget allocation
 */
export async function createOrUpdateBudgetAllocation(
  teamId: string,
  categoryId: string,
  allocated: number,
  season?: string
) {
  // Get team season if not provided
  if (!season) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { season: true, budgetTotal: true },
    })
    season = team?.season

    if (!season) {
      throw new Error('Season not found')
    }

    // Validate total allocation doesn't exceed team budget
    const currentAllocations = await prisma.budgetAllocation.findMany({
      where: {
        teamId,
        season,
        categoryId: { not: categoryId }, // Exclude current category
      },
    })

    const totalOtherAllocations = currentAllocations.reduce(
      (sum, alloc) => sum + Number(alloc.allocated),
      0
    )

    const newTotal = totalOtherAllocations + allocated

    if (newTotal > Number(team!.budgetTotal)) {
      throw new Error(
        `Total budget allocation ($${newTotal.toFixed(2)}) would exceed team budget ($${Number(team!.budgetTotal).toFixed(2)})`
      )
    }
  }

  // Upsert budget allocation
  const budgetAllocation = await prisma.budgetAllocation.upsert({
    where: {
      teamId_categoryId_season: {
        teamId,
        categoryId,
        season,
      },
    },
    update: {
      allocated,
    },
    create: {
      teamId,
      categoryId,
      season,
      allocated,
    },
    include: {
      category: true,
    },
  })

  return budgetAllocation
}

/**
 * Delete a budget allocation
 */
export async function deleteBudgetAllocation(
  teamId: string,
  categoryId: string,
  season?: string
) {
  // Get team season if not provided
  if (!season) {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { season: true },
    })
    season = team?.season
  }

  if (!season) {
    throw new Error('Season not found')
  }

  await prisma.budgetAllocation.delete({
    where: {
      teamId_categoryId_season: {
        teamId,
        categoryId,
        season,
      },
    },
  })
}

/**
 * Get budget statistics (for dashboard cards)
 */
export async function getBudgetStats(
  teamId: string,
  season?: string
): Promise<BudgetStats> {
  const overview = await getBudgetOverview(teamId, season)

  const healthyCount = overview.categories.filter((c) => c.health === 'healthy').length
  const warningCount = overview.categories.filter((c) => c.health === 'warning').length
  const criticalCount = overview.categories.filter((c) => c.health === 'critical').length

  return {
    totalAllocated: overview.totalAllocated,
    totalSpent: overview.totalSpent,
    totalRemaining: overview.totalRemaining,
    healthyCount,
    warningCount,
    criticalCount,
  }
}

/**
 * Revalidate budget-related pages after transaction changes
 * Call this after creating, updating, or deleting transactions to ensure
 * budget calculations reflect the latest data on next page load
 */
export function revalidateBudgetCache(): void {
  try {
    revalidatePath('/budget')
    revalidatePath('/expenses')
    revalidatePath('/transactions')
    revalidatePath('/', 'layout') // Revalidate all pages (for dashboard widgets)
  } catch (error) {
    logger.error('Failed to revalidate budget cache', error as Error)
    // Don't throw - budget revalidation failures shouldn't break transactions
  }
}
