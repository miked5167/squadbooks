// AI Assistant Tool Functions
import type { TransactionType} from '@prisma/client';
import { PrismaClient, TransactionStatus } from '@prisma/client'
import type {
  AssistantContext,
  ToolResult,
  ToolFunction,
} from '@/lib/types/assistant'
import {
  createTransactionSchema,
  editTransactionSchema,
  approveTransactionSchema,
  sendParentReminderSchema,
  openPageSchema,
  generateReportSchema,
  getTeamBudgetStatusSchema,
  getTeamTransactionsSchema,
} from '@/lib/types/assistant'
import { validateToolPermission } from './permissions'

const prisma = new PrismaClient()

// ============================================
// TOOL EXECUTOR
// ============================================

export async function executeTool(
  toolName: ToolFunction,
  parameters: Record<string, any>,
  context: AssistantContext
): Promise<ToolResult> {
  // Validate permissions
  const permissionCheck = validateToolPermission(context.permissions, toolName)
  if (!permissionCheck.allowed) {
    return {
      success: false,
      error: permissionCheck.reason || 'Permission denied',
    }
  }

  try {
    switch (toolName) {
      case 'createTransaction':
        return await createTransaction(parameters, context)
      case 'editTransaction':
        return await editTransaction(parameters, context)
      case 'approveTransaction':
        return await approveTransaction(parameters, context)
      case 'sendParentReminder':
        return await sendParentReminder(parameters, context)
      case 'openPage':
        return await openPage(parameters, context)
      case 'generateReport':
        return await generateReport(parameters, context)
      case 'getTeamBudgetStatus':
        return await getTeamBudgetStatus(parameters, context)
      case 'getAssociationComplianceFlags':
        return await getAssociationComplianceFlags(parameters, context)
      case 'getTeamTransactions':
        return await getTeamTransactions(parameters, context)
      default:
        return {
          success: false,
          error: `Unknown tool: ${toolName}`,
        }
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'An unknown error occurred',
    }
  }
}

// ============================================
// INDIVIDUAL TOOL FUNCTIONS
// ============================================

async function createTransaction(
  params: any,
  context: AssistantContext
): Promise<ToolResult> {
  const validated = createTransactionSchema.parse(params)

  // Verify category belongs to team
  const category = await prisma.category.findFirst({
    where: {
      id: validated.categoryId,
      teamId: context.teamId,
    },
  })

  if (!category) {
    return {
      success: false,
      error: 'Invalid category or category does not belong to your team',
    }
  }

  const transaction = await prisma.transaction.create({
    data: {
      teamId: context.teamId,
      type: validated.type as TransactionType,
      status: TransactionStatus.DRAFT,
      amount: validated.amount,
      categoryId: validated.categoryId,
      vendor: validated.vendor,
      description: validated.description,
      transactionDate: new Date(validated.transactionDate),
      receiptUrl: validated.receiptUrl,
      createdBy: context.userId,
    },
    include: {
      category: true,
    },
  })

  return {
    success: true,
    data: transaction,
    message: `Created ${validated.type.toLowerCase()} transaction for $${validated.amount} with ${validated.vendor}`,
  }
}

async function editTransaction(
  params: any,
  context: AssistantContext
): Promise<ToolResult> {
  const validated = editTransactionSchema.parse(params)

  // Verify transaction belongs to team
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: validated.transactionId,
      teamId: context.teamId,
    },
  })

  if (!transaction) {
    return {
      success: false,
      error: 'Transaction not found or does not belong to your team',
    }
  }

  // Verify category if being updated
  if (validated.updates.categoryId) {
    const category = await prisma.category.findFirst({
      where: {
        id: validated.updates.categoryId,
        teamId: context.teamId,
      },
    })

    if (!category) {
      return {
        success: false,
        error: 'Invalid category or category does not belong to your team',
      }
    }
  }

  const updated = await prisma.transaction.update({
    where: { id: validated.transactionId },
    data: {
      ...(validated.updates.amount && { amount: validated.updates.amount }),
      ...(validated.updates.categoryId && {
        categoryId: validated.updates.categoryId,
      }),
      ...(validated.updates.vendor && { vendor: validated.updates.vendor }),
      ...(validated.updates.description && {
        description: validated.updates.description,
      }),
      ...(validated.updates.transactionDate && {
        transactionDate: new Date(validated.updates.transactionDate),
      }),
      ...(validated.updates.receiptUrl && {
        receiptUrl: validated.updates.receiptUrl,
      }),
    },
    include: {
      category: true,
    },
  })

  return {
    success: true,
    data: updated,
    message: 'Transaction updated successfully',
  }
}

async function approveTransaction(
  params: any,
  context: AssistantContext
): Promise<ToolResult> {
  const validated = approveTransactionSchema.parse(params)

  // Get the transaction
  const transaction = await prisma.transaction.findFirst({
    where: {
      id: validated.transactionId,
      teamId: context.teamId,
    },
  })

  if (!transaction) {
    return {
      success: false,
      error: 'Transaction not found or does not belong to your team',
    }
  }

  // Check if already approved
  if (transaction.status === TransactionStatus.APPROVED) {
    return {
      success: false,
      error: 'Transaction is already approved',
    }
  }

  // Create approval record
  const approval = await prisma.approval.create({
    data: {
      transactionId: validated.transactionId,
      approvedBy: context.userId,
      createdBy: context.userId,
      teamId: context.teamId,
      status: 'APPROVED',
      comment: validated.comment,
      approvedAt: new Date(),
    },
  })

  // Update transaction status
  await prisma.transaction.update({
    where: { id: validated.transactionId },
    data: { status: TransactionStatus.APPROVED },
  })

  return {
    success: true,
    data: approval,
    message: 'Transaction approved successfully',
  }
}

async function sendParentReminder(
  params: any,
  context: AssistantContext
): Promise<ToolResult> {
  const validated = sendParentReminderSchema.parse(params)

  // For MVP, we'll just return a success message
  // In production, this would integrate with email service (Resend)
  return {
    success: true,
    message: `Reminder "${validated.subject}" would be sent to ${validated.recipientType === 'all' ? 'all parents' : validated.recipientIds?.length + ' selected parents'}`,
    data: {
      subject: validated.subject,
      message: validated.message,
      recipientType: validated.recipientType,
      recipientCount:
        validated.recipientType === 'all' ? 'all' : validated.recipientIds?.length,
    },
  }
}

async function openPage(
  params: any,
  _context: AssistantContext
): Promise<ToolResult> {
  const validated = openPageSchema.parse(params)

  // Build the URL
  let url = `/${validated.page}`
  if (validated.params) {
    const searchParams = new URLSearchParams(validated.params)
    url += `?${searchParams.toString()}`
  }

  return {
    success: true,
    data: { url },
    message: `Opening ${validated.page} page`,
  }
}

async function generateReport(
  params: any,
  context: AssistantContext
): Promise<ToolResult> {
  const validated = generateReportSchema.parse(params)

  // For MVP, return a placeholder
  // In production, this would trigger actual report generation
  return {
    success: true,
    message: `Report "${validated.reportType}" generation started`,
    data: {
      reportType: validated.reportType,
      dateRange: validated.dateRange,
      status: 'pending',
    },
  }
}

async function getTeamBudgetStatus(
  params: any,
  context: AssistantContext
): Promise<ToolResult> {
  const validated = getTeamBudgetStatusSchema.parse(params)

  const whereClause = {
    teamId: context.teamId,
    ...(validated.categoryId && { categoryId: validated.categoryId }),
  }

  // Get budget allocations
  const allocations = await prisma.budgetAllocation.findMany({
    where: whereClause,
    include: {
      category: true,
    },
  })

  // Get spending for each category
  const budgetStatus = await Promise.all(
    allocations.map(async (allocation) => {
      const spent = await prisma.transaction.aggregate({
        where: {
          teamId: context.teamId,
          categoryId: allocation.categoryId,
          type: 'EXPENSE',
          status: 'APPROVED',
        },
        _sum: {
          amount: true,
        },
      })

      const spentAmount = spent._sum.amount || 0
      const remaining = Number(allocation.allocated) - Number(spentAmount)
      const percentUsed =
        Number(allocation.allocated) > 0
          ? (Number(spentAmount) / Number(allocation.allocated)) * 100
          : 0

      return {
        category: allocation.category.name,
        allocated: allocation.allocated,
        spent: spentAmount,
        remaining,
        percentUsed: Math.round(percentUsed),
      }
    })
  )

  return {
    success: true,
    data: budgetStatus,
    message: validated.categoryId
      ? 'Budget status for specific category'
      : 'Budget status for all categories',
  }
}

async function getAssociationComplianceFlags(
  _params: any,
  context: AssistantContext
): Promise<ToolResult> {
  // Check for common compliance issues
  const issues = []

  // Check for transactions without receipts
  const missingReceipts = await prisma.transaction.count({
    where: {
      teamId: context.teamId,
      type: 'EXPENSE',
      receiptUrl: null,
      status: { in: ['PENDING', 'APPROVED'] },
    },
  })

  if (missingReceipts > 0) {
    issues.push({
      type: 'missing_receipts',
      severity: 'warning',
      count: missingReceipts,
      message: `${missingReceipts} approved expenses are missing receipts`,
    })
  }

  // Check for pending approvals
  const pendingApprovals = await prisma.approval.count({
    where: {
      teamId: context.teamId,
      status: 'PENDING',
    },
  })

  if (pendingApprovals > 0) {
    issues.push({
      type: 'pending_approvals',
      severity: 'info',
      count: pendingApprovals,
      message: `${pendingApprovals} transactions pending approval`,
    })
  }

  // Check budget overspending
  const allocations = await prisma.budgetAllocation.findMany({
    where: { teamId: context.teamId },
    include: { category: true },
  })

  for (const allocation of allocations) {
    const spent = await prisma.transaction.aggregate({
      where: {
        teamId: context.teamId,
        categoryId: allocation.categoryId,
        type: 'EXPENSE',
        status: 'APPROVED',
      },
      _sum: { amount: true },
    })

    const spentAmount = Number(spent._sum.amount || 0)
    const allocatedAmount = Number(allocation.allocated)

    if (spentAmount > allocatedAmount) {
      issues.push({
        type: 'budget_overspend',
        severity: 'critical',
        category: allocation.category.name,
        overspent: spentAmount - allocatedAmount,
        message: `${allocation.category.name} is over budget by $${(spentAmount - allocatedAmount).toFixed(2)}`,
      })
    }
  }

  return {
    success: true,
    data: {
      issues,
      totalIssues: issues.length,
      complianceScore:
        issues.length === 0
          ? 100
          : Math.max(0, 100 - issues.length * 10),
    },
    message:
      issues.length === 0
        ? 'No compliance issues found'
        : `Found ${issues.length} compliance issues`,
  }
}

async function getTeamTransactions(
  params: any,
  context: AssistantContext
): Promise<ToolResult> {
  const validated = getTeamTransactionsSchema.parse(params)

  const transactions = await prisma.transaction.findMany({
    where: {
      teamId: context.teamId,
      ...(validated.categoryId && { categoryId: validated.categoryId }),
      ...(validated.status && { status: validated.status }),
    },
    include: {
      category: true,
      creator: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      transactionDate: 'desc',
    },
    take: validated.limit || 10,
  })

  return {
    success: true,
    data: transactions,
    message: `Retrieved ${transactions.length} transactions`,
  }
}
