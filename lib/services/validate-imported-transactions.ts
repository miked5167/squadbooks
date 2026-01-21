/**
 * Helper to validate imported transactions
 *
 * Runs validation on imported transactions and updates their status
 */

import { prisma } from '@/lib/prisma'
import { validateTransaction, deriveStatus } from './validation-engine-v1'
import type { ValidationContext } from '@/lib/types/validation'
import { DEFAULT_ASSOCIATION_RULES } from '@/lib/types/association-rules'
import { logger } from '@/lib/logger'
import { sendExceptionNotificationEmail } from '@/lib/email'

export interface ValidationStats {
  total: number
  validated: number
  exceptions: number
  errors: number
}

/**
 * Build validation context for a transaction
 */
async function buildValidationContext(
  transaction: any,
  teamId: string
): Promise<ValidationContext | null> {
  try {
    // Get team settings with receipt override
    const teamSettings = await prisma.teamSettings.findUnique({
      where: { teamId },
      select: {
        receiptGlobalThresholdOverrideCents: true,
        dualApprovalThreshold: true,
      },
    })

    // Get active budget for team
    const budget = await prisma.budget.findFirst({
      where: {
        teamId,
        status: 'LOCKED', // Only use approved/locked budgets
      },
      orderBy: { createdAt: 'desc' },
      include: {
        versions: {
          include: {
            allocations: {
              select: {
                categoryId: true,
                allocated: true,
              },
            },
          },
        },
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

    // For V1, use default association rules
    // TODO: Load from association settings when implemented
    const associationRules = DEFAULT_ASSOCIATION_RULES

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
          teamReceiptGlobalThresholdOverrideCents:
            teamSettings?.receiptGlobalThresholdOverrideCents,
        }
      : undefined

    // Find the current version from the versions array
    const currentVersion = budget?.versions.find(
      v => v.versionNumber === budget.currentVersionNumber
    )

    return {
      transaction: {
        amount: Number(transaction.amount),
        type: transaction.type as 'INCOME' | 'EXPENSE',
        categoryId: transaction.categoryId,
        systemCategoryId: transaction.systemCategoryId,
        vendor: transaction.vendor,
        transactionDate: new Date(transaction.transactionDate),
        receiptUrl: transaction.receiptUrl,
        description: transaction.description,
      },
      budget: budget && currentVersion
        ? {
            id: budget.id,
            status: budget.status,
            allocations: (currentVersion.allocations || []).map(a => ({
              categoryId: a.categoryId,
              allocated: Number(a.allocated),
              spent: 0, // TODO: Calculate spent amount from transactions
            })),
          }
        : undefined,
      teamSettings: {
        largeTransactionThreshold: Number(teamSettings?.dualApprovalThreshold || 200),
      },
      receiptPolicy,
      associationRules,
    }
  } catch (error) {
    logger.error('Error building validation context:', error)
    return null
  }
}

/**
 * Determine exception severity from validation result
 */
function calculateExceptionSeverity(validation: any, amount: number) {
  const criticalViolations = validation.violations.filter((v: any) => v.severity === 'CRITICAL')
  const errorViolations = validation.violations.filter((v: any) => v.severity === 'ERROR')

  if (criticalViolations.length > 0) return 'CRITICAL'
  if (errorViolations.length > 2) return 'HIGH'
  if (amount >= 500 && errorViolations.length > 0) return 'HIGH'
  if (errorViolations.length > 0) return 'MEDIUM'
  return 'LOW'
}

/**
 * Validate a single transaction and update its validation fields
 *
 * This is a reusable helper for both import and update flows
 */
export async function validateSingleTransaction(
  transactionId: string,
  teamId: string
): Promise<{ status: string; validationJson: any }> {
  // Get the transaction
  const txn = await prisma.transaction.findFirst({
    where: { id: transactionId, teamId },
  })

  if (!txn) {
    throw new Error('Transaction not found')
  }

  // Build validation context
  const context = await buildValidationContext(txn, teamId)

  if (!context) {
    throw new Error('Failed to build validation context')
  }

  // Run validation
  const validation = validateTransaction(context)
  const newStatus = deriveStatus(validation, txn.status)

  // Calculate exception severity if needed
  const exceptionSeverity = !validation.compliant
    ? calculateExceptionSeverity(validation, Number(txn.amount))
    : null

  // Calculate receipt status
  const receiptStatus =
    txn.receiptUrl !== null
      ? 'ATTACHED'
      : txn.type === 'EXPENSE' && Number(txn.amount) >= 100
        ? 'REQUIRED_MISSING'
        : 'NONE'

  // Prepare validation data
  const validationJson = {
    compliant: validation.compliant,
    violations: validation.violations,
    score: validation.score,
    validatedAt: validation.validatedAt.toISOString(),
    checksRun: validation.checksRun,
  }

  const exceptionReason =
    validation.violations.length > 0
      ? validation.violations
          .filter(v => v.severity === 'ERROR' || v.severity === 'CRITICAL')
          .map(v => v.message)
          .join('; ')
      : null

  // Update transaction with correct field names (snake_case for Prisma)
  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      status: newStatus,
      validation_json: validationJson as any,
      ...(exceptionSeverity ? { exception_severity: exceptionSeverity } : {}),
      receipt_status: receiptStatus,
      ...(exceptionReason ? { exception_reason: exceptionReason } : {}),
      // Set resolved_at timestamp when transitioning to RESOLVED
      ...(newStatus === 'RESOLVED' ? { resolved_at: new Date() } : {}),
    },
  })

  return { status: newStatus, validationJson }
}

/**
 * Validate imported transactions for a team
 *
 * This runs validation on all imported transactions and updates their status
 */
export async function validateImportedTransactions(
  teamId: string,
  transactionIds?: string[]
): Promise<ValidationStats> {
  const stats: ValidationStats = {
    total: 0,
    validated: 0,
    exceptions: 0,
    errors: 0,
  }

  try {
    // Find imported transactions without validation
    const transactions = await prisma.transaction.findMany({
      where: {
        teamId,
        status: 'IMPORTED',
        validationJson: null,
        ...(transactionIds ? { id: { in: transactionIds } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    })

    stats.total = transactions.length

    if (transactions.length === 0) {
      return stats
    }

    logger.info(`Validating ${transactions.length} imported transactions for team ${teamId}`)

    // Process each transaction
    for (const txn of transactions) {
      try {
        // Build validation context
        const context = await buildValidationContext(txn, teamId)

        if (!context) {
          stats.errors++
          continue
        }

        // Run validation
        const validation = validateTransaction(context)
        const newStatus = deriveStatus(validation, txn.status)

        // Calculate exception severity if needed
        const exceptionSeverity = !validation.compliant
          ? calculateExceptionSeverity(validation, Number(txn.amount))
          : null

        // Calculate receipt status
        const receiptStatus =
          txn.receiptUrl !== null
            ? 'ATTACHED'
            : txn.type === 'EXPENSE' && Number(txn.amount) >= 100
              ? 'REQUIRED_MISSING'
              : 'NONE'

        // Prepare update data
        const updateData = {
          status: newStatus,
          validationJson: {
            compliant: validation.compliant,
            violations: validation.violations,
            score: validation.score,
            validatedAt: validation.validatedAt.toISOString(),
            checksRun: validation.checksRun,
          },
          ...(exceptionSeverity ? { exceptionSeverity } : {}),
          receiptStatus,
          ...(validation.violations.length > 0
            ? {
                exceptionReason: validation.violations
                  .filter(v => v.severity === 'ERROR' || v.severity === 'CRITICAL')
                  .map(v => v.message)
                  .join('; '),
              }
            : {}),
        }

        // Update transaction
        await prisma.transaction.update({
          where: { id: txn.id },
          data: updateData as any,
        })

        if (validation.compliant) {
          stats.validated++
        } else {
          stats.exceptions++

          // Send email notification for CRITICAL and HIGH severity exceptions
          // This is non-blocking - we don't want to fail validation if email fails
          if (exceptionSeverity === 'CRITICAL' || exceptionSeverity === 'HIGH') {
            // Get team info and treasurers
            prisma.team
              .findUnique({
                where: { id: teamId },
                select: {
                  name: true,
                  members: {
                    where: {
                      role: { in: ['TREASURER', 'ASSISTANT_TREASURER'] },
                    },
                    select: {
                      name: true,
                      email: true,
                    },
                  },
                },
              })
              .then(team => {
                if (!team) return

                // Send email to each treasurer
                const violationSummary = validation.violations
                  .filter(v => v.severity === 'ERROR' || v.severity === 'CRITICAL')
                  .map(v => v.message)

                team.members.forEach(treasurer => {
                  sendExceptionNotificationEmail({
                    treasurerName: treasurer.name || 'Treasurer',
                    treasurerEmail: treasurer.email,
                    teamName: team.name || 'Your Team',
                    transactionVendor: txn.vendor || 'Unknown',
                    transactionAmount: Number(txn.amount),
                    transactionDate: txn.transactionDate.toISOString(),
                    transactionId: txn.id,
                    severity: exceptionSeverity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
                    violationCount: violationSummary.length,
                    violationSummary,
                  }).catch(err => {
                    logger.error(`Failed to send exception email for transaction ${txn.id}:`, err)
                  })
                })
              })
              .catch(err => {
                logger.error(`Failed to fetch team info for exception email (txn ${txn.id}):`, err)
              })
          }
        }
      } catch (error) {
        logger.error(`Error validating transaction ${txn.id}:`, error)
        stats.errors++
      }
    }

    logger.info(
      `Validation complete: ${stats.validated} validated, ${stats.exceptions} exceptions, ${stats.errors} errors`
    )

    return stats
  } catch (error) {
    logger.error('Error in validateImportedTransactions:', error)
    throw error
  }
}
