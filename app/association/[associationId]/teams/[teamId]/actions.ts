'use server'

import { prisma } from '@/lib/prisma'
import type { AlertSeverity } from '../../alerts/actions'

export interface NormalizedAlert {
  id: string
  teamId: string
  teamName: string
  type: string
  message: string
  severity: AlertSeverity
  createdAt: Date
  link: string
}

export interface SnapshotHistory {
  id: string
  snapshotAt: Date
  healthStatus: string
  healthScore: number | null
  percentUsed: number | null
  pendingReviews: number | null
  missingReceipts: number | null
}

export interface TeamDetailData {
  association: {
    id: string
    name: string
    abbreviation: string | null
    season: string | null
  } | null
  associationTeam: {
    id: string
    teamName: string
    division: string | null
    season: string | null
    treasurerName: string | null
    treasurerEmail: string | null
    isActive: boolean
    connectedAt: Date | null
    lastSyncedAt: Date | null
    team: {
      id: string
      name: string
      level: string
      season: string
      budgetTotal: number
    } | null
  } | null
  latestSnapshot: {
    id: string
    healthStatus: string
    healthScore: number | null
    budgetTotal: number | null
    spent: number | null
    remaining: number | null
    percentUsed: number | null
    pendingReviews: number | null
    missingReceipts: number | null
    redFlags: any | null
    snapshotAt: Date
  } | null
  budgetByCategory: Array<{
    category: {
      id: string
      name: string
      heading: string
      color: string
      type: string
    }
    allocated: number
    spent: number
    remaining: number
    percentUsed: number
  }>
  allTransactions: Array<{
    id: string
    type: string
    status: string
    amount: number
    vendor: string
    description: string | null
    missingReceipt: boolean
    transactionDate: Date
    createdAt: Date
    category: {
      heading: string
      color: string
    }
    creator: {
      name: string | null
      email: string
    }
  }>
  recentTransactions: Array<{
    id: string
    type: string
    status: string
    amount: number
    vendor: string
    description: string | null
    missingReceipt: boolean
    transactionDate: Date
    createdAt: Date
    category: {
      heading: string
      color: string
    }
    creator: {
      name: string | null
      email: string
    }
  }>
  pendingTransactions: Array<{
    id: string
    type: string
    amount: number
    vendor: string
    description: string | null
    transactionDate: Date
    category: {
      heading: string
      color: string
    }
    creator: {
      name: string | null
      email: string
    }
  }>
  alerts: NormalizedAlert[]
  snapshotHistory: SnapshotHistory[]
}

export async function getTeamDetailData(
  associationId: string,
  teamId: string
): Promise<TeamDetailData> {
  try {
    // Fetch association data
    const association = await prisma.association.findUnique({
      where: { id: associationId },
      select: {
        id: true,
        name: true,
        abbreviation: true,
        season: true,
      },
    })

    // Fetch association team with linked team data
    const associationTeam = await prisma.associationTeam.findFirst({
      where: {
        id: teamId,
        associationId: associationId,
      },
      select: {
        id: true,
        teamName: true,
        division: true,
        season: true,
        treasurerName: true,
        treasurerEmail: true,
        isActive: true,
        connectedAt: true,
        lastSyncedAt: true,
        team: {
          select: {
            id: true,
            name: true,
            level: true,
            season: true,
            budgetTotal: true,
          },
        },
        snapshots: {
          orderBy: {
            snapshotAt: 'desc',
          },
          take: 1,
          select: {
            id: true,
            healthStatus: true,
            healthScore: true,
            budgetTotal: true,
            spent: true,
            remaining: true,
            percentUsed: true,
            pendingReviews: true,
            missingReceipts: true,
            redFlags: true,
            snapshotAt: true,
          },
        },
      },
    })

    if (!associationTeam || !associationTeam.team) {
      return {
        association,
        associationTeam: null,
        latestSnapshot: null,
        budgetByCategory: [],
        allTransactions: [],
        recentTransactions: [],
        pendingTransactions: [],
        alerts: [],
        snapshotHistory: [],
      }
    }

    const teamInternalId = associationTeam.team.id

    // Fetch budget allocations with category details
    const budgetAllocations = await prisma.budgetAllocation.findMany({
      where: {
        teamId: teamInternalId,
        season: associationTeam.team.season,
      },
      select: {
        allocated: true,
        category: {
          select: {
            id: true,
            name: true,
            heading: true,
            color: true,
            type: true,
          },
        },
      },
    })

    // Calculate spent and remaining per category
    const budgetByCategory = await Promise.all(
      budgetAllocations.map(async allocation => {
        const transactions = await prisma.transaction.findMany({
          where: {
            teamId: teamInternalId,
            categoryId: allocation.category.id,
            status: 'APPROVED',
            type: 'EXPENSE',
          },
          select: {
            amount: true,
          },
        })

        const spent = transactions.reduce((sum, t) => sum + Number(t.amount), 0)
        const allocated = Number(allocation.allocated)
        const remaining = allocated - spent
        const percentUsed = allocated > 0 ? (spent / allocated) * 100 : 0

        return {
          category: allocation.category,
          allocated,
          spent,
          remaining,
          percentUsed,
        }
      })
    )

    // Fetch ALL transactions for comprehensive table
    const allTransactions = await prisma.transaction
      .findMany({
        where: {
          teamId: teamInternalId,
        },
        orderBy: {
          transactionDate: 'desc',
        },
        select: {
          id: true,
          type: true,
          status: true,
          amount: true,
          vendor: true,
          description: true,
          receiptUrl: true,
          transactionDate: true,
          createdAt: true,
          category: {
            select: {
              heading: true,
              color: true,
            },
          },
          creator: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })
      .then(txns =>
        txns.map(t => ({
          ...t,
          missingReceipt: !t.receiptUrl,
        }))
      )

    // Fetch recent approved transactions
    const recentTransactions = await prisma.transaction
      .findMany({
        where: {
          teamId: teamInternalId,
          status: 'APPROVED',
        },
        orderBy: {
          transactionDate: 'desc',
        },
        take: 10,
        select: {
          id: true,
          type: true,
          status: true,
          amount: true,
          vendor: true,
          description: true,
          receiptUrl: true,
          transactionDate: true,
          createdAt: true,
          category: {
            select: {
              heading: true,
              color: true,
            },
          },
          creator: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })
      .then(txns =>
        txns.map(t => ({
          ...t,
          missingReceipt: !t.receiptUrl,
        }))
      )

    // Fetch pending transactions
    const pendingTransactions = await prisma.transaction.findMany({
      where: {
        teamId: teamInternalId,
        status: 'PENDING',
      },
      orderBy: {
        transactionDate: 'desc',
      },
      select: {
        id: true,
        type: true,
        amount: true,
        vendor: true,
        description: true,
        transactionDate: true,
        category: {
          select: {
            heading: true,
            color: true,
          },
        },
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    // Fetch snapshot history (last 10)
    const snapshotHistory = await prisma.teamFinancialSnapshot.findMany({
      where: {
        associationTeamId: associationTeam.id,
      },
      orderBy: {
        snapshotAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        snapshotAt: true,
        healthStatus: true,
        healthScore: true,
        percentUsed: true,
        pendingReviews: true,
        missingReceipts: true,
      },
    })

    // Build team-specific alerts (reuse logic from alerts page)
    const alerts: NormalizedAlert[] = []
    const latestSnapshot = associationTeam.snapshots[0]

    // 1. Direct alerts from alerts table
    const directAlerts = await prisma.alert.findMany({
      where: {
        associationTeamId: associationTeam.id,
        resolvedAt: null,
      },
      select: {
        id: true,
        alertType: true,
        title: true,
        severity: true,
        createdAt: true,
      },
    })

    for (const alert of directAlerts) {
      alerts.push({
        id: `alert-${alert.id}`,
        teamId: associationTeam.id,
        teamName: associationTeam.teamName,
        type: alert.alertType,
        message: alert.title,
        severity: alert.severity as AlertSeverity,
        createdAt: alert.createdAt,
        link: `/association/${associationId}/teams/${teamId}`,
      })
    }

    // 2. Pending transactions alerts
    for (const txn of pendingTransactions.slice(0, 5)) {
      alerts.push({
        id: `pending-${txn.id}`,
        teamId: associationTeam.id,
        teamName: associationTeam.teamName,
        type: 'PENDING_REVIEW',
        message: `Pending review for ${txn.vendor} - $${Number(txn.amount).toLocaleString()}`,
        severity: 'MEDIUM',
        createdAt: txn.transactionDate,
        link: `/association/${associationId}/teams/${teamId}`,
      })
    }

    // 3. Missing receipts
    const missingReceiptTxns = allTransactions
      .filter(t => t.missingReceipt && (t.status === 'PENDING' || t.status === 'VALIDATED'))
      .slice(0, 5)
    for (const txn of missingReceiptTxns) {
      alerts.push({
        id: `receipt-${txn.id}`,
        teamId: associationTeam.id,
        teamName: associationTeam.teamName,
        type: 'MISSING_RECEIPT',
        message: `Missing receipt for ${txn.vendor} - $${Number(txn.amount).toLocaleString()}`,
        severity: 'HIGH',
        createdAt: txn.createdAt,
        link: `/association/${associationId}/teams/${teamId}`,
      })
    }

    // 4. Snapshot-based alerts
    if (latestSnapshot) {
      if (latestSnapshot.healthStatus === 'at_risk') {
        alerts.push({
          id: `health-critical-${associationTeam.id}`,
          teamId: associationTeam.id,
          teamName: associationTeam.teamName,
          type: 'CRITICAL_HEALTH',
          message: `Team health is critical (Score: ${latestSnapshot.healthScore}/100)`,
          severity: 'HIGH',
          createdAt: latestSnapshot.snapshotAt,
          link: `/association/${associationId}/teams/${teamId}`,
        })
      }

      if (latestSnapshot.percentUsed !== null && latestSnapshot.percentUsed > 100) {
        const overage = latestSnapshot.percentUsed - 100
        alerts.push({
          id: `overspend-${associationTeam.id}`,
          teamId: associationTeam.id,
          teamName: associationTeam.teamName,
          type: 'OVERSPEND',
          message: `Budget exceeded by ${overage.toFixed(1)}%`,
          severity: 'HIGH',
          createdAt: latestSnapshot.snapshotAt,
          link: `/association/${associationId}/teams/${teamId}`,
        })
      }

      if (
        latestSnapshot.percentUsed !== null &&
        latestSnapshot.percentUsed >= 90 &&
        latestSnapshot.percentUsed <= 100
      ) {
        alerts.push({
          id: `budget-high-${associationTeam.id}`,
          teamId: associationTeam.id,
          teamName: associationTeam.teamName,
          type: 'HIGH_BUDGET_USAGE',
          message: `Budget usage at ${latestSnapshot.percentUsed.toFixed(1)}% - approaching limit`,
          severity: 'MEDIUM',
          createdAt: latestSnapshot.snapshotAt,
          link: `/association/${associationId}/teams/${teamId}`,
        })
      }
    }

    // Sort alerts by createdAt descending
    alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // Convert Decimal values to numbers for client components (required by Next.js)
    const transformedAssociationTeam = associationTeam
      ? {
          ...associationTeam,
          team: associationTeam.team
            ? {
                ...associationTeam.team,
                budgetTotal: Number(associationTeam.team.budgetTotal),
              }
            : null,
        }
      : null

    const transformedLatestSnapshot = latestSnapshot
      ? {
          ...latestSnapshot,
          budgetTotal:
            latestSnapshot.budgetTotal !== null ? Number(latestSnapshot.budgetTotal) : null,
          spent: latestSnapshot.spent !== null ? Number(latestSnapshot.spent) : null,
          remaining: latestSnapshot.remaining !== null ? Number(latestSnapshot.remaining) : null,
          percentUsed:
            latestSnapshot.percentUsed !== null ? Number(latestSnapshot.percentUsed) : null,
        }
      : null

    const transformedAllTransactions = allTransactions.map(t => ({
      ...t,
      amount: Number(t.amount),
    }))

    const transformedRecentTransactions = recentTransactions.map(t => ({
      ...t,
      amount: Number(t.amount),
    }))

    const transformedPendingTransactions = pendingTransactions.map(t => ({
      ...t,
      amount: Number(t.amount),
    }))

    return {
      association,
      associationTeam: transformedAssociationTeam,
      latestSnapshot: transformedLatestSnapshot,
      budgetByCategory,
      allTransactions: transformedAllTransactions,
      recentTransactions: transformedRecentTransactions,
      pendingTransactions: transformedPendingTransactions,
      alerts,
      snapshotHistory,
    }
  } catch (error) {
    console.error('Error fetching team detail data:', error)
    console.error('Error details:', {
      name: (error as Error).name,
      message: (error as Error).message,
      stack: (error as Error).stack,
    })
    return {
      association: null,
      associationTeam: null,
      latestSnapshot: null,
      budgetByCategory: [],
      allTransactions: [],
      recentTransactions: [],
      pendingTransactions: [],
      alerts: [],
      snapshotHistory: [],
    }
  }
}
