/**
 * Potential issues detection for audit/oversight
 * Rule-based detection of anomalies and suspicious patterns
 */

import { prisma } from '@/lib/prisma'

export interface PotentialIssue {
  id: string
  type: 'SELF_APPROVAL' | 'DUPLICATE_EXPENSE' | 'MISSING_RECEIPT' | 'MULTIPLE_EDITS'
  severity: 'low' | 'medium' | 'high'
  title: string
  description: string
  entityType: string
  entityId: string
  link: string
  detectedAt: Date
}

/**
 * Detect all potential issues for a team
 */
export async function detectPotentialIssues(teamId: string): Promise<PotentialIssue[]> {
  const issues: PotentialIssue[] = []

  // Run all detection functions in parallel
  const [
    selfApprovals,
    duplicateExpenses,
    missingReceipts,
    multipleEdits,
  ] = await Promise.all([
    detectSelfApprovals(teamId),
    detectDuplicateExpenses(teamId),
    detectMissingReceipts(teamId),
    detectMultipleEdits(teamId),
  ])

  issues.push(...selfApprovals, ...duplicateExpenses, ...missingReceipts, ...multipleEdits)

  return issues.sort((a, b) => {
    // Sort by severity (high > medium > low) then by date
    const severityOrder = { high: 0, medium: 1, low: 2 }
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity]
    }
    return b.detectedAt.getTime() - a.detectedAt.getTime()
  })
}

/**
 * Detect transactions where submitter == approver
 */
async function detectSelfApprovals(teamId: string): Promise<PotentialIssue[]> {
  // Get transactions where approval exists and submitter is in approvers list
  const transactions = await prisma.transaction.findMany({
    where: {
      teamId,
      status: 'approved',
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    include: {
      creator: true,
      approvals: {
        include: {
          approver: true,
        },
      },
    },
  })

  const issues: PotentialIssue[] = []

  for (const transaction of transactions) {
    const selfApproval = transaction.approvals.find(
      approval => approval.approvedBy === transaction.createdBy && approval.status === 'APPROVED'
    )

    if (selfApproval) {
      issues.push({
        id: `self-approval-${transaction.id}`,
        type: 'SELF_APPROVAL',
        severity: 'high',
        title: 'Self-Approved Transaction',
        description: `${transaction.creator.name} approved their own transaction for $${transaction.amount}`,
        entityType: 'Transaction',
        entityId: transaction.id,
        link: `/expenses/${transaction.id}`,
        detectedAt: selfApproval.createdAt,
      })
    }
  }

  return issues
}

/**
 * Detect duplicate expenses (same vendor + amount within 7 days)
 */
async function detectDuplicateExpenses(teamId: string): Promise<PotentialIssue[]> {
  const transactions = await prisma.transaction.findMany({
    where: {
      teamId,
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      creator: true,
    },
  })

  const issues: PotentialIssue[] = []
  const seenTransactions = new Map<string, typeof transactions[0]>()

  for (const transaction of transactions) {
    const key = `${transaction.vendor}-${transaction.amount}`
    const existing = seenTransactions.get(key)

    if (existing) {
      const daysDiff = Math.abs(
        (transaction.createdAt.getTime() - existing.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysDiff <= 7) {
        issues.push({
          id: `duplicate-${transaction.id}`,
          type: 'DUPLICATE_EXPENSE',
          severity: 'medium',
          title: 'Possible Duplicate Expense',
          description: `Similar transaction found: ${transaction.vendor} for $${transaction.amount} (${Math.round(daysDiff)} days apart)`,
          entityType: 'Transaction',
          entityId: transaction.id,
          link: `/expenses/${transaction.id}`,
          detectedAt: transaction.createdAt,
        })
      }
    }

    seenTransactions.set(key, transaction)
  }

  return issues
}

/**
 * Detect transactions without receipts after N days
 */
async function detectMissingReceipts(teamId: string): Promise<PotentialIssue[]> {
  const DAYS_THRESHOLD = 7 // Transactions older than 7 days should have receipts

  const transactions = await prisma.transaction.findMany({
    where: {
      teamId,
      receiptUrl: null,
      createdAt: {
        lte: new Date(Date.now() - DAYS_THRESHOLD * 24 * 60 * 60 * 1000),
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      },
    },
    include: {
      creator: true,
    },
  })

  return transactions.map(transaction => {
    const daysOld = Math.floor(
      (Date.now() - transaction.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      id: `missing-receipt-${transaction.id}`,
      type: 'MISSING_RECEIPT',
      severity: 'low',
      title: 'Missing Receipt',
      description: `Transaction by ${transaction.creator.name} for $${transaction.amount} at ${transaction.vendor} (${daysOld} days old)`,
      entityType: 'Transaction',
      entityId: transaction.id,
      link: `/expenses/${transaction.id}`,
      detectedAt: transaction.createdAt,
    }
  })
}

/**
 * Detect transactions edited multiple times in a short period
 */
async function detectMultipleEdits(teamId: string): Promise<PotentialIssue[]> {
  // Get all UPDATE_TRANSACTION audit logs from last 30 days
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      teamId,
      action: 'UPDATE_TRANSACTION',
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      user: true,
    },
  })

  // Group by entityId and count edits
  const editsByTransaction = new Map<string, typeof auditLogs>()

  for (const log of auditLogs) {
    if (!editsByTransaction.has(log.entityId)) {
      editsByTransaction.set(log.entityId, [])
    }
    editsByTransaction.get(log.entityId)!.push(log)
  }

  const issues: PotentialIssue[] = []

  for (const [transactionId, edits] of editsByTransaction.entries()) {
    if (edits.length >= 3) {
      // Check if edits were within a short period (e.g., 24 hours)
      const firstEdit = edits[edits.length - 1]
      const lastEdit = edits[0]
      const hoursDiff = (lastEdit.createdAt.getTime() - firstEdit.createdAt.getTime()) / (1000 * 60 * 60)

      if (hoursDiff <= 24) {
        issues.push({
          id: `multiple-edits-${transactionId}`,
          type: 'MULTIPLE_EDITS',
          severity: 'medium',
          title: 'Multiple Edits in Short Period',
          description: `Transaction edited ${edits.length} times within ${Math.round(hoursDiff)} hours`,
          entityType: 'Transaction',
          entityId: transactionId,
          link: `/expenses/${transactionId}`,
          detectedAt: lastEdit.createdAt,
        })
      }
    }
  }

  return issues
}

/**
 * Get severity badge classes
 */
export function getSeverityBadgeClasses(severity: PotentialIssue['severity']): string {
  const classes = {
    high: 'bg-red-50 text-red-700 border-red-200',
    medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    low: 'bg-blue-50 text-blue-700 border-blue-200',
  }
  return classes[severity]
}

/**
 * Get severity icon color
 */
export function getSeverityIconColor(severity: PotentialIssue['severity']): string {
  const colors = {
    high: 'text-red-500',
    medium: 'text-yellow-500',
    low: 'text-blue-500',
  }
  return colors[severity]
}
