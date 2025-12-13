/**
 * Budget Envelope Matching Service
 *
 * Handles the logic for matching transactions to pre-authorized budget envelopes
 * and determining if a transaction can be auto-approved.
 */

import { prisma } from "@/lib/prisma";
import { BudgetStatus, PeriodType, TransactionStatus, VendorMatchType } from "@prisma/client";

export interface TransactionData {
  amount: number;
  categoryId: string;
  vendor: string;
  transactionDate: Date;
  teamId: string;
  type: "INCOME" | "EXPENSE";
}

export interface EnvelopeMatchResult {
  canAutoApprove: boolean;
  reason: string;
  envelopeId?: string;
  requiresApproval: boolean;
  approvalReason?: string;
}

/**
 * Calculate the total spent within an envelope, considering period type
 */
async function calculateEnvelopeSpent(
  envelopeId: string,
  periodType: PeriodType,
  transactionDate: Date
): Promise<number> {
  const where: any = {
    envelopeId,
    status: {
      in: [TransactionStatus.APPROVED, TransactionStatus.APPROVED_AUTOMATIC],
    },
    deletedAt: null,
  };

  // For monthly envelopes, only count transactions in the same month
  if (periodType === PeriodType.MONTHLY) {
    const startOfMonth = new Date(
      transactionDate.getFullYear(),
      transactionDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      transactionDate.getFullYear(),
      transactionDate.getMonth() + 1,
      0
    );

    where.transactionDate = {
      gte: startOfMonth,
      lte: endOfMonth,
    };
  }

  const result = await prisma.transaction.aggregate({
    where,
    _sum: {
      amount: true,
    },
  });

  return Number(result._sum.amount || 0);
}

/**
 * Check if vendor matches the envelope's vendor constraint
 */
function matchesVendor(
  transactionVendor: string,
  matchType: VendorMatchType,
  vendorMatch: string | null
): boolean {
  if (matchType === VendorMatchType.ANY) {
    return true;
  }

  if (!vendorMatch) {
    return true; // No constraint specified
  }

  const normalizedTransaction = transactionVendor.toLowerCase().trim();
  const normalizedMatch = vendorMatch.toLowerCase().trim();

  switch (matchType) {
    case VendorMatchType.EXACT:
      return normalizedTransaction === normalizedMatch;
    case VendorMatchType.CONTAINS:
      return normalizedTransaction.includes(normalizedMatch);
    default:
      return true;
  }
}

/**
 * Check if transaction date is within the envelope's date range
 */
function matchesDateRange(
  transactionDate: Date,
  startDate: Date | null,
  endDate: Date | null
): boolean {
  const txDate = new Date(transactionDate).setHours(0, 0, 0, 0);

  if (startDate) {
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    if (txDate < start) {
      return false;
    }
  }

  if (endDate) {
    const end = new Date(endDate).setHours(0, 0, 0, 0);
    if (txDate > end) {
      return false;
    }
  }

  return true;
}

/**
 * Find and match a transaction to an active budget envelope
 *
 * @param transaction - The transaction data to match
 * @returns EnvelopeMatchResult indicating if it can be auto-approved
 */
export async function matchTransactionToEnvelope(
  transaction: TransactionData
): Promise<EnvelopeMatchResult> {
  // Only EXPENSE transactions can be matched to envelopes
  if (transaction.type !== "EXPENSE") {
    return {
      canAutoApprove: false,
      requiresApproval: false,
      reason: "Income transactions don't require envelope matching",
    };
  }

  // Find the team's current LOCKED budget
  const budget = await prisma.budget.findFirst({
    where: {
      teamId: transaction.teamId,
      status: BudgetStatus.LOCKED,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!budget) {
    return {
      canAutoApprove: false,
      requiresApproval: true,
      approvalReason: "No locked budget found - requires manual approval",
    };
  }

  // Find active envelopes for this budget and category
  const envelopes = await prisma.budgetEnvelope.findMany({
    where: {
      budgetId: budget.id,
      categoryId: transaction.categoryId,
      isActive: true,
    },
    orderBy: {
      createdAt: "asc", // Process oldest envelopes first
    },
  });

  if (envelopes.length === 0) {
    // No envelopes for this category - will use normal approval threshold logic
    return {
      canAutoApprove: false,
      requiresApproval: true,
      approvalReason: "No pre-authorized envelope for this category",
    };
  }

  // Try to match against each envelope
  for (const envelope of envelopes) {
    // Check vendor match
    if (!matchesVendor(transaction.vendor, envelope.vendorMatchType, envelope.vendorMatch)) {
      continue; // Doesn't match vendor constraint
    }

    // Check date range
    if (!matchesDateRange(transaction.transactionDate, envelope.startDate, envelope.endDate)) {
      continue; // Outside date range
    }

    // Check single transaction limit
    if (envelope.maxSingleTransaction && transaction.amount > Number(envelope.maxSingleTransaction)) {
      return {
        canAutoApprove: false,
        requiresApproval: true,
        approvalReason: `Transaction amount $${transaction.amount.toFixed(2)} exceeds envelope single transaction limit of $${Number(envelope.maxSingleTransaction).toFixed(2)}`,
      };
    }

    // Calculate spent amount for this envelope
    const spent = await calculateEnvelopeSpent(
      envelope.id,
      envelope.periodType,
      transaction.transactionDate
    );

    const remaining = Number(envelope.capAmount) - spent;

    // Check if transaction fits within remaining cap
    if (transaction.amount <= remaining) {
      // MATCH! Can auto-approve
      const periodLabel = envelope.periodType === PeriodType.MONTHLY ? "this month" : "for the season";
      return {
        canAutoApprove: true,
        requiresApproval: false,
        reason: `Auto-approved within pre-authorized envelope. Spent: $${spent.toFixed(2)}, Remaining: $${remaining.toFixed(2)} ${periodLabel}`,
        envelopeId: envelope.id,
      };
    } else {
      // Would exceed cap
      return {
        canAutoApprove: false,
        requiresApproval: true,
        approvalReason: `Transaction would exceed envelope cap. Amount: $${transaction.amount.toFixed(2)}, Remaining: $${remaining.toFixed(2)} ${envelope.periodType === PeriodType.MONTHLY ? "this month" : "for the season"}`,
      };
    }
  }

  // No envelope matched (vendor or date constraints didn't match)
  return {
    canAutoApprove: false,
    requiresApproval: true,
    approvalReason: "Transaction doesn't match any active envelope constraints (vendor or date)",
  };
}

/**
 * Determine transaction routing based on envelope matching and approval thresholds
 *
 * @param transaction - The transaction data
 * @param approvalThreshold - The team's approval threshold amount
 * @returns Routing decision with status and reason
 */
export async function routeTransaction(
  transaction: TransactionData,
  approvalThreshold: number
): Promise<{
  status: TransactionStatus;
  approvalReason: string;
  envelopeId?: string;
  requiresApprovalRecords: boolean;
}> {
  // First, try envelope matching
  const envelopeMatch = await matchTransactionToEnvelope(transaction);

  if (envelopeMatch.canAutoApprove && envelopeMatch.envelopeId) {
    // Auto-approve via envelope
    return {
      status: TransactionStatus.APPROVED_AUTOMATIC,
      approvalReason: envelopeMatch.reason,
      envelopeId: envelopeMatch.envelopeId,
      requiresApprovalRecords: false,
    };
  }

  // Envelope didn't match or doesn't exist, check approval threshold
  if (transaction.type === "EXPENSE" && transaction.amount >= approvalThreshold) {
    // Requires approval
    return {
      status: TransactionStatus.PENDING,
      approvalReason: envelopeMatch.approvalReason || `Transaction amount $${transaction.amount.toFixed(2)} meets or exceeds approval threshold of $${approvalThreshold.toFixed(2)}`,
      requiresApprovalRecords: true,
    };
  }

  // Under threshold - auto-approve
  return {
    status: TransactionStatus.APPROVED_AUTOMATIC,
    approvalReason: `Auto-approved - amount $${transaction.amount.toFixed(2)} is below approval threshold of $${approvalThreshold.toFixed(2)}`,
    requiresApprovalRecords: false,
  };
}

/**
 * Get envelope spending summary for a team's budget
 */
export async function getEnvelopeSpendingSummary(teamId: string, budgetId: string) {
  const envelopes = await prisma.budgetEnvelope.findMany({
    where: {
      teamId,
      budgetId,
      isActive: true,
    },
    include: {
      category: {
        select: {
          name: true,
          heading: true,
        },
      },
      _count: {
        select: {
          transactions: {
            where: {
              status: {
                in: [TransactionStatus.APPROVED, TransactionStatus.APPROVED_AUTOMATIC],
              },
              deletedAt: null,
            },
          },
        },
      },
    },
  });

  const summaries = await Promise.all(
    envelopes.map(async (envelope) => {
      // For current period (month or season)
      const now = new Date();
      const spent = await calculateEnvelopeSpent(envelope.id, envelope.periodType, now);
      const remaining = Number(envelope.capAmount) - spent;
      const percentUsed = (spent / Number(envelope.capAmount)) * 100;

      return {
        envelopeId: envelope.id,
        categoryName: envelope.category.name,
        categoryHeading: envelope.category.heading,
        vendorConstraint: envelope.vendorMatch,
        capAmount: Number(envelope.capAmount),
        spent,
        remaining,
        percentUsed,
        transactionCount: envelope._count.transactions,
        periodType: envelope.periodType,
        isActive: envelope.isActive,
      };
    })
  );

  return summaries;
}
