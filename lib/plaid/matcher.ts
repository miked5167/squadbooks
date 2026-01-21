/**
 * Plaid Bank Transaction Matching Engine
 *
 * Deterministic matching of PlaidBankTransaction to SpendIntent
 */

import { prisma } from '@/lib/prisma'
import type { PlaidBankTransaction, SpendIntent } from '@prisma/client'

export interface MatchResult {
  matched: boolean
  spendIntentId?: string
  reason: string
  candidates?: Array<{
    id: string
    amountCents: number
    createdAt: Date
    status: string
    score: number
  }>
}

/**
 * Match a PlaidBankTransaction to a SpendIntent
 *
 * Matching Rules (MVP):
 * 1. Amount must match exactly
 * 2. SpendIntent created within ±14 days of bank transaction posted date
 * 3. SpendIntent status must be in [AUTHORIZED, OUTSTANDING, AUTHORIZATION_PENDING]
 * 4. If multiple candidates: choose the one with createdAt closest BEFORE postedAt
 *
 * @param teamId - The team ID
 * @param bankTx - The bank transaction to match
 * @returns Match result with spendIntentId if matched
 */
export async function matchPlaidBankTxToSpendIntent(
  teamId: string,
  bankTx: PlaidBankTransaction
): Promise<MatchResult> {
  // Calculate date range: ±14 days from posted date
  const postedAt = new Date(bankTx.postedAt)
  const minDate = new Date(postedAt)
  minDate.setDate(minDate.getDate() - 14)
  const maxDate = new Date(postedAt)
  maxDate.setDate(maxDate.getDate() + 14)

  // Find candidate SpendIntents
  const candidates = await prisma.spendIntent.findMany({
    where: {
      teamId,
      amountCents: bankTx.amountCents, // Exact amount match
      createdAt: {
        gte: minDate,
        lte: maxDate,
      },
      status: {
        in: ['AUTHORIZED', 'OUTSTANDING', 'AUTHORIZATION_PENDING'],
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  if (candidates.length === 0) {
    return {
      matched: false,
      reason: 'No matching SpendIntent found (amount and date criteria)',
    }
  }

  // Score candidates
  const scoredCandidates = candidates.map(candidate => {
    const createdAt = new Date(candidate.createdAt)
    const timeDiff = Math.abs(postedAt.getTime() - createdAt.getTime())

    // Prefer SpendIntents created BEFORE the bank transaction posted
    const isPrior = createdAt <= postedAt
    const score = isPrior ? timeDiff : timeDiff + 1000000000 // Penalize future dates

    return {
      id: candidate.id,
      amountCents: candidate.amountCents,
      createdAt: candidate.createdAt,
      status: candidate.status,
      score,
    }
  })

  // Sort by score (lowest is best)
  scoredCandidates.sort((a, b) => a.score - b.score)

  // Select best match
  const bestMatch = scoredCandidates[0]

  return {
    matched: true,
    spendIntentId: bestMatch.id,
    reason: `Matched to SpendIntent ${bestMatch.id} (${bestMatch.status}, created ${bestMatch.createdAt.toISOString()})`,
    candidates: scoredCandidates.slice(0, 5), // Return top 5 for debugging
  }
}

/**
 * Check if a SpendIntent is already matched to a bank transaction
 */
export async function isSpendIntentMatched(spendIntentId: string): Promise<boolean> {
  const matched = await prisma.plaidBankTransaction.findFirst({
    where: {
      spendIntentId,
    },
  })

  return matched !== null
}
