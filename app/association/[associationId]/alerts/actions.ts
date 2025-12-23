'use server'

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH'

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

export interface AlertsData {
  association: {
    id: string
    name: string
  } | null
  alerts: NormalizedAlert[]
}

export async function getAlertsData(associationId: string): Promise<AlertsData> {
  try {
    // Validate association exists
    const association = await prisma.association.findUnique({
      where: { id: associationId },
      select: {
        id: true,
        name: true,
      },
    })

    if (!association) {
      return {
        association: null,
        alerts: [],
      }
    }

    // Fetch all association teams with their related data
    const associationTeams = await prisma.associationTeam.findMany({
      where: {
        associationId,
        isActive: true,
      },
      select: {
        id: true,
        teamName: true,
        team: {
          select: {
            id: true,
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
            percentUsed: true,
            pendingReviews: true,
            missingReceipts: true,
            budgetTotal: true,
            spent: true,
            remaining: true,
            snapshotAt: true,
          },
        },
      },
    })

    const allAlerts: NormalizedAlert[] = []

    // Process each team to gather alerts
    for (const assocTeam of associationTeams) {
      const teamInternalId = assocTeam.team?.id
      const latestSnapshot = assocTeam.snapshots[0]

      if (!teamInternalId) continue

      // 1. Fetch direct alerts from alerts table
      const directAlerts = await prisma.alert.findMany({
        where: {
          associationTeamId: assocTeam.id,
          resolvedAt: null, // Only unresolved alerts
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
        allAlerts.push({
          id: `alert-${alert.id}`,
          teamId: assocTeam.id,
          teamName: assocTeam.teamName,
          type: alert.alertType,
          message: alert.title,
          severity: alert.severity as AlertSeverity,
          createdAt: alert.createdAt,
          link: `/association/${associationId}/teams/${assocTeam.id}`,
        })
      }

      // 2. Fetch pending transactions (pending approvals)
      const pendingTransactions = await prisma.transaction.findMany({
        where: {
          teamId: teamInternalId,
          status: 'PENDING',
        },
        select: {
          id: true,
          amount: true,
          vendor: true,
          transactionDate: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5, // Limit to 5 most recent per team
      })

      for (const txn of pendingTransactions) {
        allAlerts.push({
          id: `pending-${txn.id}`,
          teamId: assocTeam.id,
          teamName: assocTeam.teamName,
          type: 'PENDING_REVIEW',
          message: `Pending review for ${txn.vendor} - $${Number(txn.amount).toLocaleString()}`,
          severity: 'MEDIUM',
          createdAt: txn.createdAt,
          link: `/association/${associationId}/teams/${assocTeam.id}`,
        })
      }

      // 3. Fetch transactions with ERROR severity MISSING_RECEIPT violations
      // Query for transactions where validation_json contains violations with:
      // - code: 'MISSING_RECEIPT'
      // - severity: 'ERROR' (excludes INFO violations which are within grace period)
      const missingReceiptTxns = await prisma.$queryRaw<Array<{
        id: string;
        amount: number;
        vendor: string;
        transactionDate: Date;
        createdAt: Date;
      }>>`
        SELECT id, amount, vendor, "transactionDate", "createdAt"
        FROM "transactions"
        WHERE "teamId" = ${teamInternalId}
          AND validation_json IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM jsonb_array_elements(validation_json->'violations') AS violation
            WHERE violation->>'code' = 'MISSING_RECEIPT'
              AND violation->>'severity' = 'ERROR'
          )
        ORDER BY "transactionDate" DESC
      `

      for (const txn of missingReceiptTxns) {
        allAlerts.push({
          id: `receipt-${txn.id}`,
          teamId: assocTeam.id,
          teamName: assocTeam.teamName,
          type: 'MISSING_RECEIPT',
          message: `Missing receipt for ${txn.vendor} - $${Number(txn.amount).toLocaleString()}`,
          severity: 'HIGH',
          createdAt: txn.createdAt,
          link: `/association/${associationId}/teams/${assocTeam.id}?receiptFilter=missing_required`,
        })
      }

      // 4. Check for overspending from latest snapshot
      if (latestSnapshot) {
        // Critical health status
        if (latestSnapshot.healthStatus === 'critical') {
          allAlerts.push({
            id: `health-critical-${assocTeam.id}`,
            teamId: assocTeam.id,
            teamName: assocTeam.teamName,
            type: 'CRITICAL_HEALTH',
            message: `Team health is critical (Score: ${latestSnapshot.healthScore}/100)`,
            severity: 'HIGH',
            createdAt: latestSnapshot.snapshotAt,
            link: `/association/${associationId}/teams/${assocTeam.id}`,
          })
        }

        // Warning health status
        if (latestSnapshot.healthStatus === 'needs_attention') {
          allAlerts.push({
            id: `health-warning-${assocTeam.id}`,
            teamId: assocTeam.id,
            teamName: assocTeam.teamName,
            type: 'WARNING_HEALTH',
            message: `Team health needs attention (Score: ${latestSnapshot.healthScore}/100)`,
            severity: 'MEDIUM',
            createdAt: latestSnapshot.snapshotAt,
            link: `/association/${associationId}/teams/${assocTeam.id}`,
          })
        }

        // Overspending alert
        if (latestSnapshot.percentUsed !== null && latestSnapshot.percentUsed > 100) {
          const overage = latestSnapshot.percentUsed - 100
          allAlerts.push({
            id: `overspend-${assocTeam.id}`,
            teamId: assocTeam.id,
            teamName: assocTeam.teamName,
            type: 'OVERSPEND',
            message: `Budget exceeded by ${overage.toFixed(1)}%`,
            severity: 'HIGH',
            createdAt: latestSnapshot.snapshotAt,
            link: `/association/${associationId}/teams/${assocTeam.id}`,
          })
        }

        // High budget usage warning (90-100%)
        if (
          latestSnapshot.percentUsed !== null &&
          latestSnapshot.percentUsed >= 90 &&
          latestSnapshot.percentUsed <= 100
        ) {
          allAlerts.push({
            id: `budget-high-${assocTeam.id}`,
            teamId: assocTeam.id,
            teamName: assocTeam.teamName,
            type: 'HIGH_BUDGET_USAGE',
            message: `Budget usage at ${latestSnapshot.percentUsed.toFixed(1)}% - approaching limit`,
            severity: 'MEDIUM',
            createdAt: latestSnapshot.snapshotAt,
            link: `/association/${associationId}/teams/${assocTeam.id}`,
          })
        }

        // Multiple pending approvals alert
        if (latestSnapshot.pendingReviews !== null && latestSnapshot.pendingReviews >= 3) {
          allAlerts.push({
            id: `pending-count-${assocTeam.id}`,
            teamId: assocTeam.id,
            teamName: assocTeam.teamName,
            type: 'MULTIPLE_PENDING',
            message: `${latestSnapshot.pendingReviews} transactions awaiting review`,
            severity: 'MEDIUM',
            createdAt: latestSnapshot.snapshotAt,
            link: `/association/${associationId}/teams/${assocTeam.id}`,
          })
        }

        // Multiple missing receipts alert - calculate from actual violations
        const missingReceiptsCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) as count
          FROM "transactions"
          WHERE "teamId" = ${teamInternalId}
            AND validation_json IS NOT NULL
            AND EXISTS (
              SELECT 1
              FROM jsonb_array_elements(validation_json->'violations') AS violation
              WHERE violation->>'code' = 'MISSING_RECEIPT'
                AND violation->>'severity' = 'ERROR'
            )
        `

        const receiptCount = Number(missingReceiptsCount[0]?.count || 0)
        if (receiptCount >= 3) {
          allAlerts.push({
            id: `receipts-count-${assocTeam.id}`,
            teamId: assocTeam.id,
            teamName: assocTeam.teamName,
            type: 'MULTIPLE_RECEIPTS',
            message: `${receiptCount} missing receipts require attention`,
            severity: 'HIGH',
            createdAt: new Date(),
            link: `/association/${associationId}/teams/${assocTeam.id}?receiptFilter=missing_required`,
          })
        }
      }
    }

    // Sort all alerts by createdAt descending (most recent first)
    allAlerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return {
      association,
      alerts: allAlerts,
    }
  } catch (error) {
    console.error('Error fetching alerts data:', error)
    return {
      association: null,
      alerts: [],
    }
  }
}
