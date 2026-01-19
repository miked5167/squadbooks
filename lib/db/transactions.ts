import { prisma } from '@/lib/prisma'
import type { TransactionType, TransactionStatus, Prisma } from '@prisma/client'
import type {
  CreateTransactionInput,
  UpdateTransactionInput,
  TransactionFilter,
} from '@/lib/validations/transaction'
import { logger } from '@/lib/logger'
import { computeValidation } from '@/lib/services/transaction-validator'
import type { ValidationContext } from '@/lib/types/validation'
import { RuleEnforcementEngine } from '@/lib/services/rule-enforcement-engine'

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
 * Build validation context for a transaction
 * Helper function to gather all necessary data for validation
 */
async function buildValidationContext(
  data: {
    amount: number
    type: TransactionType
    categoryId: string
    systemCategoryId?: string | null
    vendor: string
    transactionDate: Date
    receiptUrl?: string | null
    description?: string | null
  },
  teamId: string
): Promise<ValidationContext> {
  // Get team settings with receipt override
  const teamSettings = await prisma.teamSettings.findUnique({
    where: { teamId },
    select: {
      receiptGlobalThresholdOverrideCents: true,
      dualApprovalThreshold: true,
    },
  })

  // Get association receipt policy
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      associationTeam: {
        select: {
          association: {
            select: {
              id: true,
              receiptsEnabled: true,
              receiptGlobalThresholdCents: true,
              receiptGracePeriodDays: true,
              receiptCategoryThresholdsEnabled: true,
              receiptCategoryOverrides: true,
              allowedTeamThresholdOverride: true,
            },
          },
        },
      },
    },
  })

  // Get active budget
  const budgetRecord = await prisma.budget.findFirst({
    where: {
      teamId,
      status: 'LOCKED',
    },
    select: {
      id: true,
      status: true,
      currentVersionNumber: true,
    },
  })

  // Get current budget version with allocations
  let budget = null
  if (budgetRecord) {
    const currentVersion = await prisma.budgetVersion.findFirst({
      where: {
        budgetId: budgetRecord.id,
        versionNumber: budgetRecord.currentVersionNumber,
      },
      include: {
        allocations: {
          select: {
            categoryId: true,
            allocated: true,
            spent: true,
          },
        },
      },
    })

    if (currentVersion) {
      budget = {
        id: budgetRecord.id,
        status: budgetRecord.status,
        currentVersion,
      }
    }
  }

  // Get active envelopes
  const envelopes = await prisma.budgetEnvelope.findMany({
    where: {
      budgetId: budgetRecord?.id,
      isActive: true,
    },
    select: {
      id: true,
      categoryId: true,
      vendorMatch: true,
      vendorMatchType: true,
      capAmount: true,
      maxSingleTransaction: true,
    },
  })

  // Get season dates if available
  const teamSeason = await prisma.teamSeason.findFirst({
    where: {
      teamId,
    },
    select: {
      seasonStart: true,
      seasonEnd: true,
    },
  })

  // Build receipt policy object if association exists
  const association = team?.associationTeam?.association
  const receiptPolicy = association
    ? {
        receiptsEnabled: association.receiptsEnabled,
        receiptGlobalThresholdCents: association.receiptGlobalThresholdCents,
        receiptGracePeriodDays: association.receiptGracePeriodDays,
        receiptCategoryThresholdsEnabled: association.receiptCategoryThresholdsEnabled,
        receiptCategoryOverrides:
          (association.receiptCategoryOverrides as Record<
            string,
            { thresholdCents?: number; exempt?: boolean }
          >) || {},
        allowedTeamThresholdOverride: association.allowedTeamThresholdOverride,
        teamReceiptGlobalThresholdOverrideCents: teamSettings?.receiptGlobalThresholdOverrideCents,
      }
    : undefined

  return {
    transaction: {
      amount: Number(data.amount),
      type: data.type as 'INCOME' | 'EXPENSE',
      categoryId: data.categoryId,
      systemCategoryId: data.systemCategoryId ?? null,
      vendor: data.vendor,
      transactionDate: data.transactionDate,
      receiptUrl: data.receiptUrl ?? null,
      description: data.description ?? null,
    },
    budget: budget
      ? {
          id: budget.id,
          status: budget.status,
          allocations: (budget.currentVersion?.allocations || []).map(a => ({
            categoryId: a.categoryId,
            allocated: Number(a.allocated),
            spent: Number(a.spent),
          })),
        }
      : undefined,
    envelopes: envelopes.map(e => ({
      id: e.id,
      categoryId: e.categoryId,
      vendorMatch: e.vendorMatch,
      vendorMatchType: e.vendorMatchType,
      capAmount: Number(e.capAmount),
      spent: Number(e.spent),
      maxSingleTransaction: e.maxSingleTransaction ? Number(e.maxSingleTransaction) : null,
    })),
    teamSettings: {
      largeTransactionThreshold: Number(teamSettings?.dualApprovalThreshold || 200),
    },
    receiptPolicy,
    season: teamSeason
      ? {
          startDate: teamSeason.seasonStart,
          endDate: teamSeason.seasonEnd,
        }
      : undefined,
  }
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
      type: type as 'INCOME' | 'EXPENSE',
    },
    approvalThreshold
  )

  // NEW: Run validation (parallel to routing decision)
  const validationContext = await buildValidationContext(
    {
      amount,
      type: type as TransactionType,
      categoryId,
      systemCategoryId: data.systemCategoryId,
      vendor,
      transactionDate: new Date(transactionDate),
      receiptUrl,
      description,
    },
    teamId
  )
  const validationResult = await computeValidation(validationContext)

  // Check coach compensation limits via RuleEnforcementEngine
  const ruleEngine = new RuleEnforcementEngine()
  const ruleValidation = await ruleEngine.validateTransaction(teamId, {
    id: undefined, // New transaction, no ID yet
    amount,
    type: type as 'INCOME' | 'EXPENSE',
    systemCategoryId: data.systemCategoryId,
    teamId,
  })

  // BLOCK enforcement: throw error if coach comp validation fails and enforcement is BLOCK
  if (ruleValidation.coachCompValidation && !ruleValidation.coachCompValidation.allowed) {
    if (ruleValidation.coachCompValidation.severity === 'critical') {
      throw new Error(
        ruleValidation.coachCompValidation.message ||
          'Transaction blocked by coach compensation policy'
      )
    }
  }

  // Merge coach comp violations into validation result
  if (ruleValidation.coachCompValidation && ruleValidation.coachCompValidation.severity !== 'ok') {
    // Add coach comp validation message to violations
    validationResult.violations.push({
      type: 'COACH_COMPENSATION_CAP',
      severity:
        ruleValidation.coachCompValidation.severity === 'critical'
          ? 'CRITICAL'
          : ruleValidation.coachCompValidation.severity === 'error'
            ? 'ERROR'
            : 'WARNING',
      message: ruleValidation.coachCompValidation.message || 'Coach compensation cap issue',
      metadata: {
        cap: ruleValidation.coachCompValidation.cap,
        actual: ruleValidation.coachCompValidation.currentActual,
        projected: ruleValidation.coachCompValidation.projectedActual,
        percentUsed: ruleValidation.coachCompValidation.percentUsed,
      },
    })

    // Update compliance status if we have errors or critical violations
    if (
      ruleValidation.coachCompValidation.severity === 'error' ||
      ruleValidation.coachCompValidation.severity === 'critical'
    ) {
      validationResult.compliant = false
    }
  }

  // Create transaction with routing decision AND validation result
  const transaction = await prisma.transaction.create({
    data: {
      teamId,
      type: type as TransactionType,
      status: routingDecision.status, // Keep existing routing for now
      amount,
      categoryId,
      vendor,
      description,
      transactionDate: new Date(transactionDate),
      receiptUrl,
      createdBy: userId,
      envelopeId: routingDecision.envelopeId,
      approvalReason: routingDecision.approvalReason,
      // NEW: Store validation result
      validation: {
        create: {
          compliant: validationResult.compliant,
          score: validationResult.score,
          violations: validationResult.violations as any, // JSON field
          checksRun: validationResult.checksRun as any, // JSON field
        },
      },
      // NEW: Store exception reason if not compliant
      exceptionReason: !validationResult.compliant
        ? validationResult.violations
            .filter(v => v.severity === 'ERROR' || v.severity === 'CRITICAL')
            .map(v => v.message)
            .join('; ')
        : null,
    },
    include: {
      category: true,
      validation: true,
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
        throw new Error(
          'Cannot assign approval to transaction creator. Team needs both a treasurer and assistant treasurer.'
        )
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

  // Trigger coach compensation alerts if applicable (non-blocking)
  if (transaction.systemCategoryId) {
    Promise.resolve().then(async () => {
      try {
        const { triggerCoachCompAlertsForTeam } = await import('@/lib/services/coach-compensation')
        const team = await prisma.team.findUnique({
          where: { id: teamId },
          select: {
            associationTeam: {
              select: {
                associationId: true,
                association: { select: { season: true } },
              },
            },
          },
        })

        if (team?.associationTeam?.[0]) {
          const associationId = team.associationTeam[0].associationId
          const season = team.associationTeam[0].association.season

          await triggerCoachCompAlertsForTeam({
            teamId,
            season,
            associationId,
          })
        }
      } catch (error) {
        console.error('Failed to trigger coach comp alerts after transaction creation:', error)
        // Don't fail transaction creation if alert triggering fails
      }
    })
  }

  return {
    transaction,
    approvalRequired: routingDecision.requiresApprovalRecords,
  }
}

/**
 * Get transactions with filters, pagination, and sorting
 */
export async function getTransactions(teamId: string, filters: TransactionFilter) {
  const { type, status, categoryId, startDate, endDate, page, perPage, sortBy, sortOrder } = filters

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
  teamId?: string
  teamIds?: string[]
  limit?: number
  cursor?: { transactionDate: Date; id: string }
  filters?: {
    type?: TransactionType
    categoryId?: string
    status?: TransactionStatus
    search?: string
    dateFrom?: string
    dateTo?: string
    missingReceipts?: boolean
  }
  sortBy?: 'date' | 'amount' | 'category' | 'vendor'
  sortDir?: 'asc' | 'desc'
}) {
  const {
    teamId,
    teamIds,
    limit = 20,
    cursor,
    filters = {},
    sortBy = 'date',
    sortDir = 'desc',
  } = params
  const { type, categoryId, status, search, dateFrom, dateTo, missingReceipts } = filters

  // Clamp limit to prevent abuse
  const take = Math.min(limit, 50)

  // Build where clause - support either single teamId or multiple teamIds
  const where: Prisma.TransactionWhereInput = {
    deletedAt: null,
  }

  // Add team filter - either single or multiple
  if (teamIds && teamIds.length > 0) {
    where.teamId = { in: teamIds }
  } else if (teamId) {
    where.teamId = teamId
  } else {
    throw new Error('Either teamId or teamIds must be provided')
  }

  // Add filters
  if (type) where.type = type
  if (categoryId) where.categoryId = categoryId

  // Date range filter - only apply if both dateFrom and dateTo are provided
  if (dateFrom && dateTo) {
    where.transactionDate = {
      gte: new Date(dateFrom + 'T00:00:00Z'),
      lte: new Date(dateTo + 'T23:59:59Z'),
    }
  }

  // Missing receipts filter
  if (missingReceipts) {
    where.receiptUrl = null
  }

  // Handle computed validation-first statuses and search (combining OR conditions)
  const statusConditions: Prisma.TransactionWhereInput[] = []
  const searchConditions: Prisma.TransactionWhereInput[] = []

  if (status) {
    switch (status) {
      case 'IMPORTED':
        // Transactions missing category or receipt (need validation)
        statusConditions.push({ categoryId: null })
        statusConditions.push({ receiptUrl: null })
        break
      case 'VALIDATED':
        // Transactions that passed validation
        where.validation_json = {
          path: ['compliant'],
          equals: true,
        }
        break
      case 'EXCEPTION':
        // Transactions with policy violations (compliant = false)
        where.validation_json = {
          path: ['compliant'],
          equals: false,
        }
        where.resolved_at = null // Not yet resolved
        break
      case 'RESOLVED':
        // Exceptions that were addressed
        where.resolved_at = { not: null }
        break
      case 'LOCKED':
      case 'APPROVED':
      case 'PENDING':
      case 'DRAFT':
      case 'REJECTED':
        // Legacy statuses - filter by database status field
        where.status = status
        break
      default:
        // Unknown status - ignore filter
        break
    }
  }

  // Server-side search on vendor and description
  if (search && search.trim()) {
    searchConditions.push({ vendor: { contains: search, mode: 'insensitive' } })
    searchConditions.push({ description: { contains: search, mode: 'insensitive' } })
  }

  // Combine OR conditions properly
  if (statusConditions.length > 0 && searchConditions.length > 0) {
    // Both status OR and search OR - combine with AND
    where.AND = [{ OR: statusConditions }, { OR: searchConditions }]
  } else if (statusConditions.length > 0) {
    // Only status OR
    where.OR = statusConditions
  } else if (searchConditions.length > 0) {
    // Only search OR
    where.OR = searchConditions
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
              AND: [{ transactionDate: cursor.transactionDate }, { id: { lt: cursor.id } }],
            },
          ],
        },
      ]
    } else {
      // No search, just add cursor OR
      whereWithCursor.OR = [
        { transactionDate: { lt: cursor.transactionDate } },
        {
          AND: [{ transactionDate: cursor.transactionDate }, { id: { lt: cursor.id } }],
        },
      ]
    }
  }

  // Get total count (without cursor, but with filters)
  const totalCount = await prisma.transaction.count({ where })

  // Build orderBy clause based on sortBy parameter
  const orderBy: Prisma.TransactionOrderByWithRelationInput[] = []

  switch (sortBy) {
    case 'date':
      orderBy.push({ transactionDate: sortDir })
      break
    case 'amount':
      orderBy.push({ amount: sortDir })
      break
    case 'category':
      orderBy.push({ category: { name: sortDir } })
      break
    case 'vendor':
      orderBy.push({ vendor: sortDir })
      break
    default:
      orderBy.push({ transactionDate: sortDir })
  }

  // Always add id as secondary sort for stable pagination
  orderBy.push({ id: 'desc' })

  // Fetch transactions with optimized select
  const transactions = await prisma.transaction.findMany({
    where: whereWithCursor,
    orderBy,
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
      // Validation fields for exception tracking
      validation_json: true,
      exception_severity: true,
      exception_reason: true,
      resolved_at: true,
      resolved_by: true,
      override_justification: true,
      resolution_notes: true,
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
      // Team data (for association view)
      team: {
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

  // In validation-first workflow, only LOCKED transactions cannot be edited
  // All other statuses (IMPORTED, VALIDATED, EXCEPTION, RESOLVED) can be edited by treasurers
  if (existing.status === 'LOCKED') {
    throw new Error('Cannot update locked transactions. Season has been locked.')
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

  // Check coach compensation limits for edits (if amount or category changed)
  const amountChanged = data.amount !== undefined && data.amount !== Number(existing.amount)
  const categoryChanged = data.categoryId !== undefined && data.categoryId !== existing.categoryId

  if (amountChanged || categoryChanged) {
    const ruleEngine = new RuleEnforcementEngine()
    const ruleValidation = await ruleEngine.validateTransaction(teamId, {
      id: existing.id,
      amount: data.amount ?? Number(existing.amount),
      type: (data.type ?? existing.type) as 'INCOME' | 'EXPENSE',
      systemCategoryId: existing.systemCategoryId,
      teamId,
    })

    // BLOCK enforcement: throw error if coach comp validation fails
    if (ruleValidation.coachCompValidation && !ruleValidation.coachCompValidation.allowed) {
      if (ruleValidation.coachCompValidation.severity === 'critical') {
        throw new Error(
          ruleValidation.coachCompValidation.message ||
            'Transaction update blocked by coach compensation policy'
        )
      }
    }

    // Log warning if not blocking
    if (
      ruleValidation.coachCompValidation &&
      ruleValidation.coachCompValidation.severity === 'warn'
    ) {
      logger.warn('Transaction update exceeds coach compensation cap (WARN_ONLY mode)', {
        transactionId: id,
        teamId,
        message: ruleValidation.coachCompValidation.message,
      })
    }
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

  // NEW: Re-run validation after update (especially important for category/receipt changes)
  // Run validation synchronously to ensure exceptions are cleared before returning
  try {
    const { validateSingleTransaction } =
      await import('@/lib/services/validate-imported-transactions')
    const validationResult = await validateSingleTransaction(id, teamId)
    logger.info(`Re-validated transaction ${id} after update`, {
      newStatus: validationResult.status,
      compliant: validationResult.validationJson.compliant,
      violations: validationResult.validationJson.violations.length,
    })
  } catch (error) {
    logger.error('Failed to re-validate transaction after update:', error)
    // Don't fail the update if validation fails
  }

  // Trigger coach compensation alerts if applicable (non-blocking)
  if (transaction.systemCategoryId) {
    Promise.resolve().then(async () => {
      try {
        const { triggerCoachCompAlertsForTeam } = await import('@/lib/services/coach-compensation')
        const team = await prisma.team.findUnique({
          where: { id: teamId },
          select: {
            associationTeam: {
              select: {
                associationId: true,
                association: { select: { season: true } },
              },
            },
          },
        })

        if (team?.associationTeam?.[0]) {
          const associationId = team.associationTeam[0].associationId
          const season = team.associationTeam[0].association.season

          await triggerCoachCompAlertsForTeam({
            teamId,
            season,
            associationId,
          })
        }
      } catch (error) {
        logger.error('Failed to trigger coach comp alerts after transaction update:', error)
        // Don't fail transaction update if alert triggering fails
      }
    })
  }

  // Revalidate budget cache to reflect updated transaction
  const { revalidateBudgetCache } = await import('@/lib/db/budget')
  revalidateBudgetCache()

  // Fetch the transaction again to get the updated validation_json
  const updatedTransaction = await prisma.transaction.findUnique({
    where: { id },
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

  return updatedTransaction || transaction
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
