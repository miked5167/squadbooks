import { prisma } from '@/lib/prisma'
import type { TransactionType, TransactionStatus, Prisma } from '@prisma/client'
import type { CreateTransactionInput, UpdateTransactionInput, TransactionFilter } from '@/lib/validations/transaction'
import { logger } from '@/lib/logger'

/**
 * Business Logic: Determine if a transaction requires approval
 * Rule: EXPENSE transactions above the dual approval threshold require approval
 * The threshold is configured per-team in Settings (default: $200)
 */
export async function requiresApproval(
  type: TransactionType,
  amount: number,
  teamId: string
): Promise<boolean> {
  if (type !== 'EXPENSE') {
    return false
  }

  // Get team's dual approval settings
  const { requiresDualApproval } = await import('@/lib/auth/permissions')

  // Amount is in cents, requiresDualApproval expects cents
  return await requiresDualApproval(amount, teamId)
}

/**
 * Create a new transaction
 */
export async function createTransaction(
  data: CreateTransactionInput,
  teamId: string,
  userId: string
) {
  const { type, amount, categoryId, vendor, description, transactionDate, receiptUrl } = data

  // Get team's approval threshold
  const teamSettings = await prisma.teamSettings.findUnique({
    where: { teamId },
    select: { dualApprovalThreshold: true },
  })
  const approvalThreshold = Number(teamSettings?.dualApprovalThreshold || 200)

  // Use envelope routing logic to determine status and approval requirements
  const { routeTransaction } = await import('@/lib/services/envelope-matcher')
  const routingDecision = await routeTransaction(
    {
      amount,
      categoryId,
      vendor,
      transactionDate: new Date(transactionDate),
      teamId,
      type: type as "INCOME" | "EXPENSE",
    },
    approvalThreshold
  )

  // Create transaction with routing decision
  const transaction = await prisma.transaction.create({
    data: {
      teamId,
      type: type as TransactionType,
      status: routingDecision.status,
      amount,
      categoryId,
      vendor,
      description,
      transactionDate: new Date(transactionDate),
      receiptUrl,
      createdBy: userId,
      envelopeId: routingDecision.envelopeId,
      approvalReason: routingDecision.approvalReason,
    },
    include: {
      category: true,
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  })

  // If approval required, create approval record and send email
  if (routingDecision.requiresApprovalRecords) {
    // CRITICAL: Determine appropriate approver based on creator's role
    // If creator is assistant treasurer, assign to treasurer and vice versa
    const creatorRole = transaction.creator.role
    const approverRole = creatorRole === 'ASSISTANT_TREASURER' ? 'TREASURER' : 'ASSISTANT_TREASURER'

    // Find the appropriate approver (not the creator)
    const approver = await prisma.user.findFirst({
      where: {
        teamId,
        role: approverRole,
      },
    })

    if (approver) {
      // Additional safety check: ensure approver is not the creator
      if (approver.id === userId) {
        throw new Error('Cannot assign approval to transaction creator. Team needs both a treasurer and assistant treasurer.')
      }

      const approval = await prisma.approval.create({
        data: {
          transactionId: transaction.id,
          approvedBy: approver.id,
          createdBy: userId,
          teamId,
          status: 'PENDING',
        },
      })

      // Send approval request email (non-blocking, fire and forget)
      Promise.resolve().then(async () => {
        try {
          const { sendApprovalRequestEmail } = await import('@/lib/email')
          const team = await prisma.team.findUnique({
            where: { id: teamId },
            select: { name: true },
          })

          await sendApprovalRequestEmail({
            approverName: approver.name,
            approverEmail: approver.email,
            treasurerName: transaction.creator.name,
            teamName: team?.name || 'Your Team',
            transactionType: type as 'EXPENSE' | 'INCOME',
            amount: Number(amount),
            vendor,
            description: description || undefined,
            categoryName: transaction.category.name,
            transactionDate: transactionDate,
            transactionId: transaction.id,
            approvalId: approval.id,
          })
        } catch (error) {
          console.error('Failed to send approval email:', error)
          // Don't fail the transaction creation if email fails
        }
      })
    }
  }

  // Create audit log entry
  try {
    const { createAuditLog, AuditAction, EntityType } = await import('@/lib/db/audit')
    await createAuditLog({
      teamId,
      userId,
      action: AuditAction.CREATE_TRANSACTION,
      entityType: EntityType.TRANSACTION,
      entityId: transaction.id,
      newValues: {
        type: transaction.type,
        status: transaction.status,
        amount: transaction.amount.toString(),
        categoryId: transaction.categoryId,
        vendor: transaction.vendor,
        description: transaction.description,
        transactionDate: transaction.transactionDate.toISOString(),
      },
    })
  } catch (error) {
    console.error('Failed to create audit log for transaction creation:', error)
    // Don't fail transaction creation if audit logging fails
  }

  return {
    transaction,
    approvalRequired: routingDecision.requiresApprovalRecords,
  }
}

/**
 * Get transactions with filters, pagination, and sorting
 */
export async function getTransactions(
  teamId: string,
  filters: TransactionFilter
) {
  const {
    type,
    status,
    categoryId,
    startDate,
    endDate,
    page,
    perPage,
    sortBy,
    sortOrder,
  } = filters

  // Build where clause
  const where: Prisma.TransactionWhereInput = {
    teamId,
    deletedAt: null, // Only show non-deleted transactions
  }

  if (type) where.type = type as TransactionType
  if (status) where.status = status as TransactionStatus
  if (categoryId) where.categoryId = categoryId

  if (startDate || endDate) {
    where.transactionDate = {}
    if (startDate) where.transactionDate.gte = new Date(startDate)
    if (endDate) where.transactionDate.lte = new Date(endDate)
  }

  // Build orderBy
  let orderBy: Prisma.TransactionOrderByWithRelationInput = {}
  switch (sortBy) {
    case 'date':
      orderBy = { transactionDate: sortOrder }
      break
    case 'amount':
      orderBy = { amount: sortOrder }
      break
    case 'vendor':
      orderBy = { vendor: sortOrder }
      break
  }

  // Get total count
  const total = await prisma.transaction.count({ where })

  // Get paginated transactions
  const transactions = await prisma.transaction.findMany({
    where,
    orderBy,
    skip: (page - 1) * perPage,
    take: perPage,
    include: {
      category: {
        select: {
          id: true,
          name: true,
          heading: true,
          color: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
      approvals: {
        select: {
          id: true,
          status: true,
          approvedAt: true,
          approver: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      },
    },
  })

  return {
    transactions,
    pagination: {
      page,
      perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    },
  }
}

/**
 * Get transactions with cursor-based pagination (optimized for list view)
 * Returns only fields needed for the transaction list, with minimal relations
 */
export async function getTransactionsWithCursor(params: {
  teamId: string
  limit?: number
  cursor?: { transactionDate: Date; id: string }
  filters?: {
    type?: TransactionType
    categoryId?: string
    status?: TransactionStatus
    search?: string
  }
}) {
  const { teamId, limit = 20, cursor, filters = {} } = params
  const { type, categoryId, status, search } = filters

  // Clamp limit to prevent abuse
  const take = Math.min(limit, 50)

  // Build where clause
  const where: Prisma.TransactionWhereInput = {
    teamId,
    deletedAt: null,
  }

  // Add filters
  if (type) where.type = type
  if (status) where.status = status
  if (categoryId) where.categoryId = categoryId

  // Server-side search on vendor and description
  if (search && search.trim()) {
    where.OR = [
      { vendor: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ]
  }

  // Build cursor where clause separately to avoid OR conflicts
  const whereWithCursor = { ...where }

  // Add cursor condition for pagination
  // Order is: transactionDate DESC, id DESC
  // For cursor, we want items that come AFTER the cursor (older transactions)
  if (cursor) {
    // If we already have OR (from search), wrap everything in AND
    if (whereWithCursor.OR) {
      const searchOR = whereWithCursor.OR
      delete whereWithCursor.OR
      whereWithCursor.AND = [
        { OR: searchOR },
        {
          OR: [
            // Transaction date is older than cursor date
            { transactionDate: { lt: cursor.transactionDate } },
            // OR transaction date equals cursor date but ID is less than cursor ID
            {
              AND: [
                { transactionDate: cursor.transactionDate },
                { id: { lt: cursor.id } },
              ],
            },
          ],
        },
      ]
    } else {
      // No search, just add cursor OR
      whereWithCursor.OR = [
        { transactionDate: { lt: cursor.transactionDate } },
        {
          AND: [
            { transactionDate: cursor.transactionDate },
            { id: { lt: cursor.id } },
          ],
        },
      ]
    }
  }

  // Get total count (without cursor, but with filters)
  const totalCount = await prisma.transaction.count({ where })

  // Fetch transactions with optimized select
  const transactions = await prisma.transaction.findMany({
    where: whereWithCursor,
    orderBy: [
      { transactionDate: 'desc' },
      { id: 'desc' }, // Secondary sort for stable ordering
    ],
    take: take + 1, // Fetch one extra to check if there are more
    select: {
      id: true,
      transactionDate: true,
      amount: true,
      vendor: true,
      description: true,
      status: true,
      type: true,
      receiptUrl: true,
      envelopeId: true,
      approvalReason: true,
      // Minimal category data
      category: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      // Minimal creator data
      creator: {
        select: {
          id: true,
          name: true,
        },
      },
      // Just count approvals, don't load full records
      _count: {
        select: {
          approvals: true,
        },
      },
    },
  })

  // Check if there are more results
  const hasMore = transactions.length > take
  const items = hasMore ? transactions.slice(0, take) : transactions

  // Generate next cursor from last item
  let nextCursor: string | null = null
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1]
    // Encode cursor as base64 JSON
    const cursorData = {
      transactionDate: lastItem.transactionDate.toISOString(),
      id: lastItem.id,
    }
    nextCursor = Buffer.from(JSON.stringify(cursorData)).toString('base64')
  }

  return {
    items,
    nextCursor,
    totalCount,
  }
}

/**
 * Decode cursor from base64-encoded JSON
 */
export function decodeCursor(cursor: string): { transactionDate: Date; id: string } | null {
  try {
    const decoded = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'))
    return {
      transactionDate: new Date(decoded.transactionDate),
      id: decoded.id,
    }
  } catch (error) {
    logger.error('Failed to decode cursor', { error, cursor })
    return null
  }
}

/**
 * Get a single transaction by ID
 */
export async function getTransactionById(id: string, teamId: string) {
  const transaction = await prisma.transaction.findFirst({
    where: {
      id,
      teamId,
      deletedAt: null,
    },
    include: {
      category: true,
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      approvals: {
        include: {
          approver: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  })

  if (!transaction) {
    return null
  }

  // Calculate budget impact (if EXPENSE and APPROVED)
  let budgetRemaining = null
  if (transaction.type === 'EXPENSE' && transaction.status === 'APPROVED') {
    const budgetAllocation = await prisma.budgetAllocation.findFirst({
      where: {
        teamId,
        categoryId: transaction.categoryId,
      },
    })

    if (budgetAllocation) {
      const totalSpent = await prisma.transaction.aggregate({
        where: {
          teamId,
          categoryId: transaction.categoryId,
          type: 'EXPENSE',
          status: 'APPROVED',
          deletedAt: null,
        },
        _sum: {
          amount: true,
        },
      })

      const spent = totalSpent._sum.amount || 0
      budgetRemaining = Number(budgetAllocation.allocated) - Number(spent)
    }
  }

  return {
    ...transaction,
    budgetRemaining,
  }
}

/**
 * Update a transaction
 * Can only update if status is DRAFT or PENDING
 */
export async function updateTransaction(
  id: string,
  teamId: string,
  userId: string,
  data: UpdateTransactionInput
) {
  // Check current transaction status
  const existing = await prisma.transaction.findFirst({
    where: { id, teamId, deletedAt: null },
  })

  if (!existing) {
    throw new Error('Transaction not found')
  }

  if (existing.status === 'APPROVED' || existing.status === 'REJECTED') {
    throw new Error('Cannot update approved or rejected transactions')
  }

  // Capture old values for audit trail
  const oldValues = {
    type: existing.type,
    status: existing.status,
    amount: existing.amount.toString(),
    categoryId: existing.categoryId,
    vendor: existing.vendor,
    description: existing.description,
    transactionDate: existing.transactionDate.toISOString(),
  }

  // Update transaction
  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      ...data,
      transactionDate: data.transactionDate ? new Date(data.transactionDate) : undefined,
      updatedAt: new Date(),
    },
    include: {
      category: true,
      creator: {
        select: {
          id: true,
          name: true,
          role: true,
        },
      },
    },
  })

  // Create audit log entry
  try {
    const { createAuditLog, AuditAction, EntityType } = await import('@/lib/db/audit')
    await createAuditLog({
      teamId,
      userId,
      action: AuditAction.UPDATE_TRANSACTION,
      entityType: EntityType.TRANSACTION,
      entityId: transaction.id,
      oldValues,
      newValues: {
        type: transaction.type,
        status: transaction.status,
        amount: transaction.amount.toString(),
        categoryId: transaction.categoryId,
        vendor: transaction.vendor,
        description: transaction.description,
        transactionDate: transaction.transactionDate.toISOString(),
      },
    })
  } catch (error) {
    logger.warn('Failed to create audit log for transaction update', {
      transactionId: id,
      error: error instanceof Error ? error.message : String(error),
    })
    // Don't fail transaction update if audit logging fails
  }

  // Revalidate budget cache to reflect updated transaction
  const { revalidateBudgetCache } = await import('@/lib/db/budget')
  revalidateBudgetCache()

  return transaction
}

/**
 * Soft delete a transaction
 * Can only delete if status is DRAFT
 */
export async function deleteTransaction(id: string, teamId: string, userId: string) {
  // Check current transaction status
  const existing = await prisma.transaction.findFirst({
    where: { id, teamId, deletedAt: null },
  })

  if (!existing) {
    throw new Error('Transaction not found')
  }

  if (existing.status !== 'DRAFT') {
    throw new Error('Can only delete draft transactions')
  }

  // Capture old values for audit trail
  const oldValues = {
    type: existing.type,
    status: existing.status,
    amount: existing.amount.toString(),
    categoryId: existing.categoryId,
    vendor: existing.vendor,
    description: existing.description,
    transactionDate: existing.transactionDate.toISOString(),
  }

  // Delete associated receipt from storage if exists
  if (existing.receiptPath) {
    try {
      const { deleteReceipt } = await import('@/lib/storage')
      await deleteReceipt(existing.receiptPath)
    } catch (error) {
      logger.warn('Failed to delete receipt from storage', {
        receiptPath: existing.receiptPath,
        error: error instanceof Error ? error.message : String(error),
      })
      // Continue with transaction deletion even if receipt deletion fails
    }
  }

  // Soft delete
  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      deletedAt: new Date(),
    },
  })

  // Create audit log entry
  try {
    const { createAuditLog, AuditAction, EntityType } = await import('@/lib/db/audit')
    await createAuditLog({
      teamId,
      userId,
      action: AuditAction.DELETE_TRANSACTION,
      entityType: EntityType.TRANSACTION,
      entityId: transaction.id,
      oldValues,
    })
  } catch (error) {
    logger.warn('Failed to create audit log for transaction deletion', {
      transactionId: transaction.id,
      error: error instanceof Error ? error.message : String(error),
    })
    // Don't fail transaction deletion if audit logging fails
  }

  // Revalidate budget cache to reflect deleted transaction
  const { revalidateBudgetCache } = await import('@/lib/db/budget')
  revalidateBudgetCache()

  return transaction
}
