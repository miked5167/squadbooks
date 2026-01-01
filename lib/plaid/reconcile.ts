/**
 * Plaid Bank Transaction Reconciliation
 *
 * Links PlaidBankTransactions to SpendIntents and creates/updates Transaction ledger
 */

import { prisma } from '@/lib/prisma'
import { matchPlaidBankTxToSpendIntent } from './matcher'
import {
  detectETransferPaidWithoutApproval,
  detectChequeMissingEvidence,
  createPolicyException,
} from './exceptions'
import type { SpendIntentStatus, TransactionStatus } from '@prisma/client'

export interface ReconcileResult {
  success: boolean
  matched: boolean
  spendIntentId?: string
  transactionId?: string
  exceptions: Array<{
    id: string
    type: string
    severity: string
  }>
  message: string
}

/**
 * Reconcile a PlaidBankTransaction
 *
 * Process:
 * 1. Load PlaidBankTransaction
 * 2. Run matcher
 * 3. If matched:
 *    - Link PlaidBankTransaction.spendIntentId
 *    - Create or update Transaction ledger row
 *    - Update SpendIntent.status
 *    - Detect and create policy exceptions
 * 4. If unmatched:
 *    - Create UNMATCHED_BANK_TRANSACTION exception
 *
 * @param teamId - The team ID
 * @param plaidTransactionId - The Plaid transaction ID
 * @returns Reconciliation result
 */
export async function reconcilePlaidBankTransaction(
  teamId: string,
  plaidTransactionId: string
): Promise<ReconcileResult> {
  // 1. Load PlaidBankTransaction
  const bankTx = await prisma.plaidBankTransaction.findUnique({
    where: { plaidTransactionId },
  })

  if (!bankTx) {
    return {
      success: false,
      matched: false,
      message: `PlaidBankTransaction not found: ${plaidTransactionId}`,
      exceptions: [],
    }
  }

  if (bankTx.teamId !== teamId) {
    return {
      success: false,
      matched: false,
      message: `PlaidBankTransaction does not belong to team ${teamId}`,
      exceptions: [],
    }
  }

  // 2. Run matcher
  const matchResult = await matchPlaidBankTxToSpendIntent(teamId, bankTx)

  if (!matchResult.matched) {
    // 4. Create UNMATCHED_BANK_TRANSACTION exception
    const exception = await createPolicyException(
      null,
      bankTx.id,
      'UNMATCHED_BANK_TRANSACTION',
      'WARNING',
      {
        plaidTransactionId: bankTx.plaidTransactionId,
        amountCents: bankTx.amountCents,
        postedAt: bankTx.postedAt.toISOString(),
        merchantName: bankTx.merchantName,
        rawName: bankTx.rawName,
        message: matchResult.reason,
      }
    )

    return {
      success: true,
      matched: false,
      message: matchResult.reason,
      exceptions: [
        {
          id: exception.id,
          type: exception.type,
          severity: exception.severity,
        },
      ],
    }
  }

  // 3. Matched - process reconciliation
  const spendIntentId = matchResult.spendIntentId!

  // Load SpendIntent with relations
  const spendIntent = await prisma.spendIntent.findUnique({
    where: { id: spendIntentId },
    include: {
      approvals: true,
      chequeMetadata: true,
      transaction: true,
    },
  })

  if (!spendIntent) {
    return {
      success: false,
      matched: true,
      spendIntentId,
      message: `SpendIntent not found: ${spendIntentId}`,
      exceptions: [],
    }
  }

  // Load TeamSettings for threshold checks
  const teamSettings = await prisma.teamSettings.findUnique({
    where: { teamId },
  })

  if (!teamSettings) {
    return {
      success: false,
      matched: true,
      spendIntentId,
      message: `TeamSettings not found for team: ${teamId}`,
      exceptions: [],
    }
  }

  const exceptions: Array<{
    id: string
    type: string
    severity: string
  }> = []

  // 3a. Link PlaidBankTransaction to SpendIntent
  await prisma.plaidBankTransaction.update({
    where: { id: bankTx.id },
    data: { spendIntentId },
  })

  // 3b. Create or update Transaction ledger
  const paidAt = bankTx.authorizedAt || bankTx.postedAt
  const settledAt = bankTx.postedAt

  let transaction = spendIntent.transaction

  if (!transaction) {
    // Create new Transaction
    transaction = await prisma.transaction.create({
      data: {
        teamId,
        type: 'EXPENSE',
        status: 'VALIDATED' as TransactionStatus,
        amount: spendIntent.amountCents / 100, // Convert cents to dollars
        vendor: spendIntent.vendorName || 'Unknown',
        description: `Reconciled from Plaid: ${bankTx.merchantName || bankTx.rawName}`,
        transactionDate: settledAt,
        createdBy: spendIntent.createdByUserId,
        spendIntentId,
        plaidTransactionId: bankTx.plaidTransactionId,
      },
    })
  } else {
    // Update existing Transaction
    transaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: 'VALIDATED' as TransactionStatus,
        plaidTransactionId: bankTx.plaidTransactionId,
      },
    })
  }

  // 3c. Update SpendIntent status
  const currentStatus = spendIntent.status
  let newStatus: SpendIntentStatus = currentStatus

  if (currentStatus === 'OUTSTANDING' || currentStatus === 'AUTHORIZED') {
    newStatus = 'SETTLED'
  } else if (currentStatus === 'AUTHORIZATION_PENDING') {
    // Paid before approval - set to SETTLED but create exception
    newStatus = 'SETTLED'
  }

  await prisma.spendIntent.update({
    where: { id: spendIntentId },
    data: { status: newStatus },
  })

  // 3d. Detect and create policy exceptions

  // Check for E-Transfer paid without approval
  const eTransferException = await detectETransferPaidWithoutApproval(
    spendIntent,
    bankTx,
    transaction
  )

  if (eTransferException?.shouldCreate) {
    const ex = await createPolicyException(
      transaction.id,
      bankTx.id,
      eTransferException.type,
      eTransferException.severity,
      eTransferException.details
    )
    exceptions.push({
      id: ex.id,
      type: ex.type,
      severity: ex.severity,
    })
  }

  // Check for Cheque missing evidence
  const chequeException = await detectChequeMissingEvidence(spendIntent, teamSettings)

  if (chequeException?.shouldCreate) {
    const ex = await createPolicyException(
      transaction.id,
      bankTx.id,
      chequeException.type,
      chequeException.severity,
      chequeException.details
    )
    exceptions.push({
      id: ex.id,
      type: ex.type,
      severity: ex.severity,
    })
  }

  return {
    success: true,
    matched: true,
    spendIntentId,
    transactionId: transaction.id,
    exceptions,
    message: `Reconciled: SpendIntent ${spendIntentId} -> Transaction ${transaction.id} (${exceptions.length} exceptions)`,
  }
}
