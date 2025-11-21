import { prisma } from '@/lib/prisma'
import { TransactionType, TransactionStatus, Prisma } from '@prisma/client'
import type { CreateTransactionInput, UpdateTransactionInput, TransactionFilter } from '@/lib/validations/transaction'

/**
 * Business Logic: Determine if a transaction requires approval
 * Rule: EXPENSE transactions > $200 require approval
 */
export function requiresApproval(type: TransactionType, amount: number): boolean {
  return type === 'EXPENSE' && amount > 200
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

  // Determine initial status based on approval requirements
  const needsApproval = requiresApproval(type as TransactionType, amount)
  const status: TransactionStatus = needsApproval ? 'PENDING' : 'APPROVED'

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      teamId,
      type: type as TransactionType,
      status,
      amount,
      categoryId,
      vendor,
      description,
      transactionDate: new Date(transactionDate),
      receiptUrl,
      createdBy: userId,
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
  if (needsApproval) {
    // Find team assistant treasurer for approval
    const assistantTreasurer = await prisma.user.findFirst({
      where: {
        teamId,
        role: 'ASSISTANT_TREASURER',
      },
    })

    if (assistantTreasurer) {
      const approval = await prisma.approval.create({
        data: {
          transactionId: transaction.id,
          approvedBy: assistantTreasurer.id,
          createdBy: userId,
          teamId,
          status: 'PENDING',
        },
      })

      // Send approval request email (non-blocking)
      try {
        const { sendApprovalRequestEmail } = await import('@/lib/email')
        const team = await prisma.team.findUnique({
          where: { id: teamId },
          select: { name: true },
        })

        await sendApprovalRequestEmail({
          approverName: assistantTreasurer.name,
          approverEmail: assistantTreasurer.email,
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
    }
  }

  // TODO: Create audit log entry

  return {
    transaction,
    approvalRequired: needsApproval,
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

  // TODO: Log changes in audit trail
  // TODO: Recalculate budget if amount or category changed

  return transaction
}

/**
 * Soft delete a transaction
 * Can only delete if status is DRAFT
 */
export async function deleteTransaction(id: string, teamId: string) {
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

  // Delete associated receipt from storage if exists
  if (existing.receiptPath) {
    try {
      const { deleteReceipt } = await import('@/lib/storage')
      await deleteReceipt(existing.receiptPath)
    } catch (error) {
      console.error('Failed to delete receipt:', error)
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

  // TODO: Log deletion in audit trail
  // TODO: Recalculate budget for category

  return transaction
}
