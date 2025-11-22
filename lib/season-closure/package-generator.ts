import { prisma } from '@/lib/prisma';
import { SeasonPackage, SeasonSummary } from './types';
import {
  generateFinalBudgetPDF,
  generateTransactionHistoryPDF,
  generateBudgetVariancePDF,
  generateAuditTrailPDF,
} from './pdf-generator';

/**
 * Generate complete season package with all reports and receipts
 */
export async function generateSeasonPackage(
  teamId: string,
  season: string
): Promise<SeasonPackage> {
  // Generate all PDF reports in parallel
  const [finalBudget, transactionHistory, budgetVariance, auditTrail, receipts, summary] =
    await Promise.all([
      generateFinalBudgetPDF({ teamId, season, includeVariance: true, includeNotes: true }),
      generateTransactionHistoryPDF({ teamId, season, includeReceipts: false, sortBy: 'date' }),
      generateBudgetVariancePDF({ teamId, season, highlightOverages: true }),
      generateAuditTrailPDF({ teamId, season, includeApprovals: true }),
      fetchReceipts(teamId, season),
      calculateSeasonSummary(teamId, season),
    ]);

  return {
    reports: {
      finalBudget,
      transactionHistory,
      budgetVariance,
      auditTrail,
    },
    receipts,
    summary,
  };
}

/**
 * Fetch all receipt information for transactions
 */
async function fetchReceipts(
  teamId: string,
  season: string
): Promise<Array<{ fileName: string; fileUrl: string; transactionId: string }>> {
  const transactions = await prisma.transaction.findMany({
    where: {
      teamId,
      receiptUrl: {
        not: null,
      },
      deletedAt: null,
    },
    orderBy: {
      transactionDate: 'asc',
    },
  });

  return transactions
    .filter((tx) => tx.receiptUrl)
    .map((tx, index) => {
      // Extract file extension from URL if possible
      const url = tx.receiptUrl!;
      const extension = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/)?.[1] || 'pdf';

      return {
        fileName: `receipt-${index + 1}-${tx.id}.${extension}`,
        fileUrl: url,
        transactionId: tx.id,
      };
    });
}

/**
 * Calculate season summary with all key metrics
 */
async function calculateSeasonSummary(
  teamId: string,
  season: string
): Promise<SeasonSummary> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
  });

  if (!team) {
    throw new Error('Team not found');
  }

  // Get total income
  const income = await prisma.transaction.aggregate({
    where: {
      teamId,
      type: 'INCOME',
      status: 'APPROVED',
      deletedAt: null,
    },
    _sum: {
      amount: true,
    },
  });

  // Get total expenses
  const expenses = await prisma.transaction.aggregate({
    where: {
      teamId,
      type: 'EXPENSE',
      status: 'APPROVED',
      deletedAt: null,
    },
    _sum: {
      amount: true,
    },
  });

  // Count transactions
  const transactionCount = await prisma.transaction.count({
    where: {
      teamId,
      status: 'APPROVED',
      deletedAt: null,
    },
  });

  // Count receipts
  const receiptCount = await prisma.transaction.count({
    where: {
      teamId,
      receiptUrl: {
        not: null,
      },
      deletedAt: null,
    },
  });

  const totalIncome = income._sum.amount ? Number(income._sum.amount) : 0;
  const totalExpenses = expenses._sum.amount ? Number(expenses._sum.amount) : 0;

  return {
    teamName: team.name,
    season,
    totalIncome,
    totalExpenses,
    finalBalance: totalIncome - totalExpenses,
    transactionCount,
    receiptCount,
    generatedAt: new Date(),
  };
}
