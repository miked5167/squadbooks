/**
 * Policy Exception Detection for Plaid Reconciliation
 *
 * Detects GTHL policy violations during bank transaction reconciliation
 */

import { prisma } from '@/lib/prisma'
import type {
  SpendIntent,
  PlaidBankTransaction,
  Transaction,
  ChequeMetadata,
  SpendIntentApproval,
  TeamSettings,
  PolicyExceptionType,
  AlertSeverity,
} from '@prisma/client'

export interface ExceptionDetails {
  [key: string]: any
}

/**
 * Detect if E-Transfer was paid before required approval
 *
 * Triggers when:
 * - paymentMethod == E_TRANSFER
 * - requiresManualApproval == true
 * - authorizedAt is null OR bankTxTime < authorizedAt
 */
export async function detectETransferPaidWithoutApproval(
  spendIntent: SpendIntent & {
    approvals: SpendIntentApproval[]
  },
  bankTx: PlaidBankTransaction,
  transaction: Transaction
): Promise<{
  shouldCreate: boolean
  type: PolicyExceptionType
  severity: AlertSeverity
  details: ExceptionDetails
} | null> {
  if (spendIntent.paymentMethod !== 'E_TRANSFER') {
    return null
  }

  if (!spendIntent.requiresManualApproval) {
    return null
  }

  const bankTxTime = bankTx.authorizedAt || bankTx.postedAt
  const authorizedAt = spendIntent.authorizedAt

  const paidBeforeApproval = !authorizedAt || bankTxTime < authorizedAt

  if (!paidBeforeApproval) {
    return null
  }

  // Count approvals and independent reps
  const approvalsCount = spendIntent.approvals.length
  const independentRepCount = spendIntent.approvals.filter(a => a.isIndependentParentRep).length

  return {
    shouldCreate: true,
    type: 'ETRANSFER_PAID_WITHOUT_REQUIRED_APPROVAL',
    severity: 'CRITICAL',
    details: {
      bankTxTime: bankTxTime.toISOString(),
      authorizedAt: authorizedAt?.toISOString() || null,
      approvalsCount,
      independentRepCount,
      payeeUserId: spendIntent.payeeUserId,
      amountCents: spendIntent.amountCents,
      spendIntentId: spendIntent.id,
      plaidBankTransactionId: bankTx.id,
      message: authorizedAt
        ? `E-transfer paid on ${bankTxTime.toISOString()} before authorization on ${authorizedAt.toISOString()}`
        : `E-transfer paid on ${bankTxTime.toISOString()} but never authorized`,
    },
  }
}

/**
 * Detect if Cheque is missing required evidence
 *
 * Triggers when:
 * - paymentMethod == CHEQUE
 * - cheque clears (bank tx matched)
 * - missing ChequeMetadata OR signer2 OR image (if required by amount threshold)
 */
export async function detectChequeMissingEvidence(
  spendIntent: SpendIntent & {
    chequeMetadata: ChequeMetadata | null
  },
  teamSettings: TeamSettings
): Promise<{
  shouldCreate: boolean
  type: PolicyExceptionType
  severity: AlertSeverity
  details: ExceptionDetails
} | null> {
  if (spendIntent.paymentMethod !== 'CHEQUE') {
    return null
  }

  const cheque = spendIntent.chequeMetadata
  const missingFields: string[] = []

  // Check if ChequeMetadata exists
  if (!cheque) {
    missingFields.push('ChequeMetadata')
  } else {
    // Check for second signer
    if (!cheque.signer2UserId && !cheque.signer2Name) {
      missingFields.push('signer2')
    }

    // Check for cheque image if amount exceeds threshold
    const requiresImage = spendIntent.amountCents >= teamSettings.requireChequeImageThresholdCents

    if (requiresImage && !cheque.chequeImageFileId) {
      missingFields.push('chequeImageFileId')
    }
  }

  if (missingFields.length === 0) {
    return null
  }

  // Determine severity based on amount threshold
  const severity: AlertSeverity =
    spendIntent.amountCents >= teamSettings.requireChequeImageThresholdCents
      ? 'CRITICAL'
      : 'WARNING'

  return {
    shouldCreate: true,
    type: 'CHEQUE_MISSING_EVIDENCE',
    severity,
    details: {
      missingFields,
      thresholdCents: teamSettings.requireChequeImageThresholdCents,
      amountCents: spendIntent.amountCents,
      chequeNumber: cheque?.chequeNumber || null,
      spendIntentId: spendIntent.id,
      message: `Cheque cleared but missing required evidence: ${missingFields.join(', ')}`,
    },
  }
}

/**
 * Create policy exception record
 */
export async function createPolicyException(
  transactionId: string | null,
  plaidBankTransactionId: string | null,
  type: PolicyExceptionType,
  severity: AlertSeverity,
  details: ExceptionDetails
) {
  // At least one of transactionId or plaidBankTransactionId must be provided
  if (!transactionId && !plaidBankTransactionId) {
    throw new Error('Either transactionId or plaidBankTransactionId must be provided')
  }

  return prisma.policyException.create({
    data: {
      transactionId: transactionId || undefined,
      plaidBankTransactionId: plaidBankTransactionId || undefined,
      type,
      severity,
      details: details as any,
      detectedAt: new Date(),
    },
  })
}
