import { prisma } from '@/lib/prisma'
import type { ApprovalStatus } from '@prisma/client'
import { sendApprovalStatusEmail } from '@/lib/email'

/**
 * Get all pending approvals for a specific approver
 */
export async function getPendingApprovals(teamId: string, approverId: string) {
  const approvals = await prisma.approval.findMany({
    where: {
      teamId,
      approvedBy: approverId,
      status: 'PENDING',
    },
    include: {
      transaction: {
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
              email: true,
              role: true,
            },
          },
        },
      },
      approver: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      creator: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return approvals
}

/**
 * Get all approvals for a team (for admin/auditor view)
 */
export async function getAllApprovals(
  teamId: string,
  status?: ApprovalStatus,
  limit = 50
) {
  const where: any = { teamId }
  if (status) {
    where.status = status
  }

  const approvals = await prisma.approval.findMany({
    where,
    include: {
      transaction: {
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
              email: true,
              role: true,
            },
          },
        },
      },
      approver: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: limit,
  })

  return approvals
}

/**
 * Approve a transaction
 */
export async function approveTransaction(
  approvalId: string,
  approverId: string,
  teamId: string,
  comment?: string
) {
  // Get the approval with transaction details
  const approval = await prisma.approval.findFirst({
    where: {
      id: approvalId,
      teamId,
      approvedBy: approverId,
      status: 'PENDING',
    },
    include: {
      transaction: {
        include: {
          category: true,
          creator: true,
        },
      },
      approver: true,
    },
  })

  if (!approval) {
    throw new Error('Approval not found or already processed')
  }

  if (approval.transaction.status !== 'PENDING') {
    throw new Error('Transaction is not in pending state')
  }

  // CRITICAL: Prevent self-approval fraud
  if (approval.transaction.createdBy === approverId) {
    throw new Error('You cannot approve your own transaction')
  }

  // Update approval status
  const updatedApproval = await prisma.approval.update({
    where: { id: approvalId },
    data: {
      status: 'APPROVED',
      comment,
      approvedAt: new Date(),
    },
  })

  // Update transaction status
  await prisma.transaction.update({
    where: { id: approval.transactionId },
    data: {
      status: 'APPROVED',
    },
  })

  // Send notification email to the creator (non-blocking)
  try {
    await sendApprovalStatusEmail(
      approval.transaction.creator.name,
      approval.transaction.creator.email,
      true, // approved
      Number(approval.transaction.amount),
      approval.transaction.vendor,
      approval.approver.name,
      comment
    )
  } catch (error) {
    console.error('Failed to send approval notification email:', error)
    // Don't fail the approval if email fails
  }

  // Create audit log entry
  try {
    const { createAuditLog, AuditAction, EntityType } = await import('@/lib/db/audit')
    await createAuditLog({
      teamId,
      userId: approverId,
      action: AuditAction.APPROVE_TRANSACTION,
      entityType: EntityType.APPROVAL,
      entityId: approvalId,
      oldValues: {
        status: 'PENDING',
        transactionStatus: 'PENDING',
      },
      newValues: {
        status: 'APPROVED',
        transactionStatus: 'APPROVED',
        comment,
        approvedAt: new Date().toISOString(),
        transactionId: approval.transactionId,
        amount: approval.transaction.amount.toString(),
        vendor: approval.transaction.vendor,
      },
    })
  } catch (error) {
    logger.warn('Failed to create audit log for approval', {
      approvalId,
      error: error instanceof Error ? error.message : String(error),
    })
    // Don't fail the approval if audit logging fails
  }

  // Revalidate budget cache to reflect approved transaction (moves from pending to spent)
  const { revalidateBudgetCache } = await import('@/lib/db/budget')
  revalidateBudgetCache()

  return updatedApproval
}

/**
 * Reject a transaction
 */
export async function rejectTransaction(
  approvalId: string,
  approverId: string,
  teamId: string,
  comment?: string
) {
  // Get the approval with transaction details
  const approval = await prisma.approval.findFirst({
    where: {
      id: approvalId,
      teamId,
      approvedBy: approverId,
      status: 'PENDING',
    },
    include: {
      transaction: {
        include: {
          category: true,
          creator: true,
        },
      },
      approver: true,
    },
  })

  if (!approval) {
    throw new Error('Approval not found or already processed')
  }

  if (approval.transaction.status !== 'PENDING') {
    throw new Error('Transaction is not in pending state')
  }

  // CRITICAL: Prevent self-approval fraud (also applies to rejections)
  if (approval.transaction.createdBy === approverId) {
    throw new Error('You cannot approve or reject your own transaction')
  }

  // Update approval status
  const updatedApproval = await prisma.approval.update({
    where: { id: approvalId },
    data: {
      status: 'REJECTED',
      comment,
      approvedAt: new Date(),
    },
  })

  // Update transaction status
  await prisma.transaction.update({
    where: { id: approval.transactionId },
    data: {
      status: 'REJECTED',
    },
  })

  // Send notification email to the creator (non-blocking)
  try {
    await sendApprovalStatusEmail(
      approval.transaction.creator.name,
      approval.transaction.creator.email,
      false, // rejected
      Number(approval.transaction.amount),
      approval.transaction.vendor,
      approval.approver.name,
      comment
    )
  } catch (error) {
    console.error('Failed to send rejection notification email:', error)
    // Don't fail the rejection if email fails
  }

  // Create audit log entry
  try {
    const { createAuditLog, AuditAction, EntityType } = await import('@/lib/db/audit')
    await createAuditLog({
      teamId,
      userId: approverId,
      action: AuditAction.REJECT_TRANSACTION,
      entityType: EntityType.APPROVAL,
      entityId: approvalId,
      oldValues: {
        status: 'PENDING',
        transactionStatus: 'PENDING',
      },
      newValues: {
        status: 'REJECTED',
        transactionStatus: 'REJECTED',
        comment,
        approvedAt: new Date().toISOString(),
        transactionId: approval.transactionId,
        amount: approval.transaction.amount.toString(),
        vendor: approval.transaction.vendor,
      },
    })
  } catch (error) {
    console.error('Failed to create audit log for rejection:', error)
    // Don't fail the rejection if audit logging fails
  }

  return updatedApproval
}

/**
 * Get approval statistics for a team
 */
export async function getApprovalStats(teamId: string) {
  const [pending, approved, rejected] = await Promise.all([
    prisma.approval.count({
      where: { teamId, status: 'PENDING' },
    }),
    prisma.approval.count({
      where: { teamId, status: 'APPROVED' },
    }),
    prisma.approval.count({
      where: { teamId, status: 'REJECTED' },
    }),
  ])

  return {
    pending,
    approved,
    rejected,
    total: pending + approved + rejected,
  }
}
