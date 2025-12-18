'use server'

import type { Decimal } from '@prisma/client';
import { PrismaClient } from '@prisma/client'
import { getAlertsData } from '../alerts/actions'

const prisma = new PrismaClient()

function decimalToNumber(value: Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  return typeof value === 'number' ? value : Number(value)
}

export type SeasonFinancialRow = {
  teamId: string
  teamName: string
  budget: number
  totalSpent: number
  pendingAmount: number
  remainingBudget: number
  budgetUsedPercent: number
  healthScore: number | null
  healthStatus: string | null
  pendingReviews: number
  missingReceipts: number
}

export type TransactionDetailRow = {
  id: string
  date: Date
  teamId: string
  teamName: string
  category: string | null
  amount: number
  status: string
  missingReceipt: boolean
  notes: string | null
}

export type AlertReportRow = {
  id: string
  createdAt: Date
  teamId: string
  teamName: string
  type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  message: string
}

export type ReportsResponse = {
  association: {
    id: string
    name: string
    abbreviation: string | null
    season: string | null
  }
  seasonFinancial: SeasonFinancialRow[]
  transactions: TransactionDetailRow[]
  alerts: AlertReportRow[]
}

/**
 * Main data fetcher for all reports
 */
export async function getReportsData(
  associationId: string
): Promise<ReportsResponse> {
  // 1. Validate association exists
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
    throw new Error('Association not found')
  }

  // 2. Get all teams linked to this association
  const associationTeams = await prisma.associationTeam.findMany({
    where: { associationId: associationId },
    include: {
      team: true,
    },
  })

  const teamIds = associationTeams
    .map((at) => at.teamId)
    .filter((id): id is string => id !== null)

  if (teamIds.length === 0) {
    // No teams, return empty data
    return {
      association,
      seasonFinancial: [],
      transactions: [],
      alerts: [],
    }
  }

  // 3. Get all transactions for these teams
  const allTransactions = await prisma.transaction.findMany({
    where: {
      teamId: { in: teamIds },
      deletedAt: null,
    },
    include: {
      category: {
        select: {
          heading: true,
        },
      },
    },
    orderBy: { transactionDate: 'desc' },
  })

  // 4. Get latest snapshot per associationTeam
  const associationTeamIds = associationTeams.map((at) => at.id)
  const latestSnapshots = await Promise.all(
    associationTeamIds.map(async (atId) => {
      const snapshot = await prisma.teamFinancialSnapshot.findFirst({
        where: { associationTeamId: atId },
        orderBy: { snapshotAt: 'desc' },
      })
      return { associationTeamId: atId, snapshot }
    })
  )

  const snapshotMap = new Map(
    latestSnapshots.map((s) => [s.associationTeamId, s.snapshot])
  )

  // 5. Get all alerts using the same logic as Alerts page
  const alertsPageData = await getAlertsData(associationId)

  // 6. Build Season Financial Summary
  const seasonFinancial: SeasonFinancialRow[] = associationTeams
    .map((at) => {
      const team = at.team
      if (!team) return null

      const teamId = team.id

      // Calculate totals from transactions
      const teamTransactions = allTransactions.filter(
        (t) => t.teamId === teamId
      )
      const totalSpent = teamTransactions
        .filter((t) => t.status === 'APPROVED')
        .reduce((sum, t) => sum + decimalToNumber(t.amount), 0)
      const pendingAmount = teamTransactions
        .filter((t) => t.status === 'PENDING')
        .reduce((sum, t) => sum + decimalToNumber(t.amount), 0)

      const budget = decimalToNumber(team.budgetTotal)
      const remainingBudget = budget - totalSpent
      const budgetUsedPercent = budget > 0 ? (totalSpent / budget) * 100 : 0

      // Get snapshot data
      const snapshot = snapshotMap.get(at.id)
      const healthScore = snapshot?.healthScore || null
      const healthStatus = snapshot?.healthStatus || null
      const pendingReviews = snapshot?.pendingReviews || 0
      const missingReceipts = snapshot?.missingReceipts || 0

      return {
        teamId,
        teamName: at.teamName,
        budget,
        totalSpent,
        pendingAmount,
        remainingBudget,
        budgetUsedPercent,
        healthScore,
        healthStatus,
        pendingReviews,
        missingReceipts,
      }
    })
    .filter((row): row is SeasonFinancialRow => row !== null)

  // 7. Build Transaction Detail Report
  const transactions: TransactionDetailRow[] = allTransactions.map((t) => {
    const at = associationTeams.find((at) => at.teamId === t.teamId)
    return {
      id: t.id,
      date: t.transactionDate,
      teamId: t.teamId,
      teamName: at?.teamName || 'Unknown',
      category: t.category.heading || null,
      amount: decimalToNumber(t.amount),
      status: t.status,
      missingReceipt: t.missingReceipt || false,
      notes: t.description,
    }
  })

  // 8. Build Alerts Report - Use same alerts as Alerts page
  const alerts: AlertReportRow[] = alertsPageData.alerts.map((a) => ({
    id: a.id,
    createdAt: a.createdAt,
    teamId: a.teamId,
    teamName: a.teamName,
    type: a.type,
    severity: a.severity,
    message: a.message,
  }))

  return {
    association,
    seasonFinancial,
    transactions,
    alerts,
  }
}

/**
 * Helper to escape CSV fields
 */
function escapeCsvField(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }
  const str = String(value)
  // If contains comma, newline, or quote, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * CSV Export: Season Financial Summary
 */
export async function getSeasonFinancialCsv(
  associationId: string
): Promise<string> {
  const data = await getReportsData(associationId)
  const rows = data.seasonFinancial

  const headers = [
    'Team Name',
    'Budget',
    'Total Spent',
    'Pending Amount',
    'Remaining Budget',
    'Budget Used %',
    'Health Score',
    'Health Status',
    'Pending Reviews',
    'Missing Receipts',
  ]

  const csvLines = [headers.join(',')]

  for (const row of rows) {
    const line = [
      escapeCsvField(row.teamName),
      escapeCsvField(row.budget.toFixed(2)),
      escapeCsvField(row.totalSpent.toFixed(2)),
      escapeCsvField(row.pendingAmount.toFixed(2)),
      escapeCsvField(row.remainingBudget.toFixed(2)),
      escapeCsvField(row.budgetUsedPercent.toFixed(2)),
      escapeCsvField(row.healthScore?.toFixed(2) || ''),
      escapeCsvField(row.healthStatus || ''),
      escapeCsvField(row.pendingReviews),
      escapeCsvField(row.missingReceipts),
    ].join(',')
    csvLines.push(line)
  }

  return csvLines.join('\n')
}

/**
 * CSV Export: Transaction Detail
 */
export async function getTransactionDetailCsv(
  associationId: string
): Promise<string> {
  const data = await getReportsData(associationId)
  const rows = data.transactions

  const headers = [
    'Date',
    'Team Name',
    'Category',
    'Amount',
    'Status',
    'Missing Receipt',
    'Notes',
  ]

  const csvLines = [headers.join(',')]

  for (const row of rows) {
    const line = [
      escapeCsvField(row.date.toISOString().split('T')[0]),
      escapeCsvField(row.teamName),
      escapeCsvField(row.category || ''),
      escapeCsvField(row.amount.toFixed(2)),
      escapeCsvField(row.status),
      escapeCsvField(row.missingReceipt ? 'Yes' : 'No'),
      escapeCsvField(row.notes || ''),
    ].join(',')
    csvLines.push(line)
  }

  return csvLines.join('\n')
}

/**
 * CSV Export: Alerts & Issues
 */
export async function getAlertsCsv(associationId: string): Promise<string> {
  const data = await getReportsData(associationId)
  const rows = data.alerts

  const headers = [
    'Created Date',
    'Team Name',
    'Alert Type',
    'Severity',
    'Message',
  ]

  const csvLines = [headers.join(',')]

  for (const row of rows) {
    const line = [
      escapeCsvField(row.createdAt.toISOString().split('T')[0]),
      escapeCsvField(row.teamName),
      escapeCsvField(row.type),
      escapeCsvField(row.severity),
      escapeCsvField(row.message),
    ].join(',')
    csvLines.push(line)
  }

  return csvLines.join('\n')
}
