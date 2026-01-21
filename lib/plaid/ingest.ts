/**
 * Plaid Transaction Ingestion
 *
 * Upserts PlaidBankTransaction records from Plaid API payloads
 */

import { prisma } from '@/lib/prisma'

export interface PlaidTransactionPayload {
  transaction_id: string
  amount: number // Positive for debits, negative for credits
  iso_currency_code?: string
  date: string // Posting date (YYYY-MM-DD)
  authorized_date?: string | null // Authorization date (YYYY-MM-DD)
  name?: string // Merchant/raw name
  merchant_name?: string | null
  payment_channel?: string
  pending: boolean
  [key: string]: any // Allow additional fields
}

export interface IngestResult {
  inserted: number
  updated: number
  errors: Array<{ transactionId: string; error: string }>
}

/**
 * Ingest Plaid transactions for a team
 * Upserts PlaidBankTransaction by plaidTransactionId (unique)
 *
 * @param teamId - The team ID
 * @param transactions - Array of Plaid transaction payloads
 * @returns Counts of inserted/updated records
 */
export async function ingestPlaidTransactions(
  teamId: string,
  transactions: PlaidTransactionPayload[]
): Promise<IngestResult> {
  const result: IngestResult = {
    inserted: 0,
    updated: 0,
    errors: [],
  }

  for (const tx of transactions) {
    try {
      // Normalize the transaction data
      const normalized = normalizeTransaction(teamId, tx)

      // Upsert by plaidTransactionId
      const existing = await prisma.plaidBankTransaction.findUnique({
        where: { plaidTransactionId: normalized.plaidTransactionId },
      })

      if (existing) {
        // Update existing record
        await prisma.plaidBankTransaction.update({
          where: { plaidTransactionId: normalized.plaidTransactionId },
          data: {
            amountCents: normalized.amountCents,
            currency: normalized.currency,
            postedAt: normalized.postedAt,
            authorizedAt: normalized.authorizedAt,
            merchantName: normalized.merchantName,
            rawName: normalized.rawName,
            paymentChannel: normalized.paymentChannel,
            pending: normalized.pending,
            raw: normalized.raw,
            updatedAt: new Date(),
          },
        })
        result.updated++
      } else {
        // Insert new record
        await prisma.plaidBankTransaction.create({
          data: normalized,
        })
        result.inserted++
      }
    } catch (error) {
      result.errors.push({
        transactionId: tx.transaction_id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return result
}

/**
 * Normalize Plaid transaction payload to PlaidBankTransaction format
 */
function normalizeTransaction(teamId: string, tx: PlaidTransactionPayload) {
  // Convert amount to cents (Plaid amounts are positive for debits)
  // We store all amounts as positive cents
  const amountCents = Math.abs(Math.round(tx.amount * 100))

  // Determine currency (default to CAD)
  const currency = tx.iso_currency_code?.toUpperCase() || 'CAD'

  // Parse dates
  const postedAt = new Date(tx.date + 'T00:00:00Z') // UTC midnight
  const authorizedAt = tx.authorized_date ? new Date(tx.authorized_date + 'T00:00:00Z') : null

  // Extract merchant info
  const merchantName = tx.merchant_name || null
  const rawName = tx.name || null
  const paymentChannel = tx.payment_channel || null

  return {
    teamId,
    plaidTransactionId: tx.transaction_id,
    amountCents,
    currency,
    postedAt,
    authorizedAt,
    merchantName,
    rawName,
    paymentChannel,
    pending: tx.pending,
    raw: tx as any, // Store full payload as JSON
  }
}
