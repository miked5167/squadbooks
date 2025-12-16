'use server'

import type { Decimal } from '@prisma/client';
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export type AssociationFinancialsResponse = {
  association: {
    id: string
    name: string
    abbreviation: string | null
    season: string | null
  } | null
  summary: {
    totalBudget: number
    totalSpent: number
    remainingBudget: number
    pendingAmount: number
    budgetUsedPercent: number
  }
  categories: Array<{
    name: string
    totalSpent: number
    percentOfTotal: number
  }>
  teams: Array<{
    id: string
    name: string
    division: string | null
    level: string | null
    budget: number
    spent: number
    budgetUsedPercent: number
    healthScore: number | null
    healthStatus: string | null
    pendingApprovals: number
    missingReceipts: number
  }>
}

function decimalToNumber(value: Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  return typeof value === 'number' ? value : Number(value)
}

export async function getAssociationFinancials(
  associationId: string
): Promise<AssociationFinancialsResponse> {
  try {
    // 1. Fetch association details
    const association = await prisma.association.findUnique({
      where: { id: associationId },
      select: {
        id: true,
        name: true,
        abbreviation: true,
        season: true,
      },
    })

    if (!association) {
      return {
        association: null,
        summary: {
          totalBudget: 0,
          totalSpent: 0,
          remainingBudget: 0,
          pendingAmount: 0,
          budgetUsedPercent: 0,
        },
        categories: [],
        teams: [],
      }
    }

    // 2. Fetch all association teams with their latest snapshots
    const associationTeams = await prisma.associationTeam.findMany({
      where: {
        associationId,
        isActive: true,
      },
      select: {
        id: true,
        teamName: true,
        division: true,
        team: {
          select: {
            id: true,
            level: true,
            budgetTotal: true,
          },
        },
        snapshots: {
          orderBy: {
            snapshotAt: 'desc',
          },
          take: 1,
          select: {
            healthStatus: true,
            healthScore: true,
            budgetTotal: true,
            spent: true,
            percentUsed: true,
            pendingApprovals: true,
            missingReceipts: true,
          },
        },
      },
    })

    // 3. Calculate association-level summary
    let totalBudget = 0
    let totalSpent = 0
    let pendingAmount = 0

    // Collect all team IDs to query transactions
    const teamInternalIds = associationTeams
      .map(at => at.team?.id)
      .filter(Boolean) as string[]

    // Get all APPROVED transactions for spent calculation
    const approvedTransactions = await prisma.transaction.findMany({
      where: {
        teamId: { in: teamInternalIds },
        status: 'APPROVED',
        type: 'EXPENSE',
      },
      select: {
        amount: true,
        teamId: true,
        categoryId: true,
        category: {
          select: {
            heading: true,
          },
        },
      },
    })

    // Get all PENDING transactions
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        teamId: { in: teamInternalIds },
        status: 'PENDING',
      },
      select: {
        amount: true,
      },
    })

    // Calculate totals
    for (const at of associationTeams) {
      const snapshot = at.snapshots[0]
      if (snapshot?.budgetTotal) {
        totalBudget += decimalToNumber(snapshot.budgetTotal)
      } else if (at.team?.budgetTotal) {
        totalBudget += decimalToNumber(at.team.budgetTotal)
      }
    }

    totalSpent = approvedTransactions.reduce(
      (sum, t) => sum + decimalToNumber(t.amount),
      0
    )

    pendingAmount = pendingTransactions.reduce(
      (sum, t) => sum + decimalToNumber(t.amount),
      0
    )

    const remainingBudget = totalBudget - totalSpent
    const budgetUsedPercent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

    // 4. Calculate category breakdown
    const categoryMap = new Map<string, number>()

    for (const txn of approvedTransactions) {
      const categoryName = txn.category.heading
      const currentTotal = categoryMap.get(categoryName) || 0
      categoryMap.set(categoryName, currentTotal + decimalToNumber(txn.amount))
    }

    // Calculate overall total spent first
    const overallTotalSpent = approvedTransactions.reduce(
      (sum, t) => sum + decimalToNumber(t.amount),
      0
    )

    const categories = Array.from(categoryMap.entries())
      .map(([name, categorySpent]) => ({
        name,
        totalSpent: categorySpent,
        percentOfTotal: overallTotalSpent > 0
          ? (categorySpent / overallTotalSpent) * 100
          : 0,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)

    // 5. Build team financial summary
    const teams = associationTeams
      .map(at => {
        const snapshot = at.snapshots[0]
        const teamId = at.team?.id

        // Get team's approved transactions
        const teamTransactions = approvedTransactions.filter(
          t => t.teamId === teamId
        )
        const teamSpent = teamTransactions.reduce(
          (sum, t) => sum + decimalToNumber(t.amount),
          0
        )

        // Get budget from snapshot or team
        const budget = snapshot?.budgetTotal
          ? decimalToNumber(snapshot.budgetTotal)
          : at.team?.budgetTotal
          ? decimalToNumber(at.team.budgetTotal)
          : 0

        const budgetUsedPercent = budget > 0 ? (teamSpent / budget) * 100 : 0

        return {
          id: at.id,
          name: at.teamName,
          division: at.division,
          level: at.team?.level || null,
          budget,
          spent: teamSpent,
          budgetUsedPercent,
          healthScore: snapshot?.healthScore || null,
          healthStatus: snapshot?.healthStatus || null,
          pendingApprovals: snapshot?.pendingApprovals || 0,
          missingReceipts: snapshot?.missingReceipts || 0,
        }
      })
      .sort((a, b) => b.budgetUsedPercent - a.budgetUsedPercent) // Sort by % used descending

    return {
      association,
      summary: {
        totalBudget,
        totalSpent,
        remainingBudget,
        pendingAmount,
        budgetUsedPercent,
      },
      categories,
      teams,
    }
  } catch (error) {
    console.error('Error fetching association financials:', error)
    return {
      association: null,
      summary: {
        totalBudget: 0,
        totalSpent: 0,
        remainingBudget: 0,
        pendingAmount: 0,
        budgetUsedPercent: 0,
      },
      categories: [],
      teams: [],
    }
  }
}
