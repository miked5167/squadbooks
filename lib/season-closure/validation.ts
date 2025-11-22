import { prisma } from '@/lib/prisma';
import { ValidationResult, ValidationIssue, PolicySnapshot } from './types';

// Configuration constants
export const DEFAULT_POLICY: PolicySnapshot = {
  minReceiptAmount: 100,
  requireZeroBalance: true,
  bankReconciliationDays: 30,
};

/**
 * Validates that a season is ready to be closed
 * Checks budget balance, transaction approvals, receipts, and bank reconciliation
 */
export async function validateSeasonClosure(
  teamId: string,
  season: string
): Promise<ValidationResult> {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Run all validation checks in parallel
  const [
    budgetCheck,
    transactionCheck,
    receiptCheck,
    bankReconciliationCheck,
    financialSummary,
  ] = await Promise.all([
    checkBudgetBalance(teamId, season),
    checkTransactionApprovals(teamId, season),
    checkReceiptsPresent(teamId, season),
    checkBankReconciliation(teamId),
    calculateFinancialSummary(teamId, season),
  ]);

  // Budget balance check
  if (!budgetCheck.balanced) {
    errors.push({
      code: 'BUDGET_NOT_BALANCED',
      message: `Budget is not balanced. Current balance: $${budgetCheck.balance.toFixed(2)}. Budget must equal $0.00 to close the season.`,
      severity: 'error',
    });
  }

  // Transaction approval check
  if (transactionCheck.pendingCount > 0) {
    errors.push({
      code: 'PENDING_TRANSACTIONS',
      message: `${transactionCheck.pendingCount} transaction(s) are still pending approval. All transactions must be approved before closing the season.`,
      severity: 'error',
    });
  }

  // Receipt check
  if (receiptCheck.missingCount > 0) {
    errors.push({
      code: 'MISSING_RECEIPTS',
      message: `${receiptCheck.missingCount} expense(s) over $${DEFAULT_POLICY.minReceiptAmount} are missing receipts. All expenses above this threshold must have receipts attached.`,
      severity: 'error',
    });
  }

  // Bank reconciliation check (warning only)
  if (!bankReconciliationCheck.reconciled && bankReconciliationCheck.unreconciledCount > 0) {
    warnings.push({
      code: 'UNRECONCILED_TRANSACTIONS',
      message: `${bankReconciliationCheck.unreconciledCount} bank transaction(s) from the last ${DEFAULT_POLICY.bankReconciliationDays} days are not reconciled. While not blocking, it's recommended to reconcile all transactions before closing.`,
      severity: 'warning',
    });
  }

  return {
    isValid: errors.length === 0,
    budgetBalanced: budgetCheck.balanced,
    allTransactionsApproved: transactionCheck.pendingCount === 0,
    allReceiptsPresent: receiptCheck.missingCount === 0,
    bankReconciled: bankReconciliationCheck.reconciled,
    pendingCount: transactionCheck.pendingCount,
    missingReceipts: receiptCheck.missingCount,
    unreconciledCount: bankReconciliationCheck.unreconciledCount,
    receiptCount: receiptCheck.totalWithReceipts,
    totalTransactions: transactionCheck.totalCount,
    totalIncome: financialSummary.totalIncome,
    totalExpenses: financialSummary.totalExpenses,
    finalBalance: financialSummary.finalBalance,
    errors,
    warnings,
  };
}

/**
 * Check if budget is balanced (final balance = $0)
 */
async function checkBudgetBalance(
  teamId: string,
  season: string
): Promise<{ balanced: boolean; balance: number }> {
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

  const totalIncome = income._sum.amount ? Number(income._sum.amount) : 0;
  const totalExpenses = expenses._sum.amount ? Number(expenses._sum.amount) : 0;
  const balance = totalIncome - totalExpenses;

  return {
    balanced: Math.abs(balance) < 0.01, // Allow for minor floating point differences
    balance,
  };
}

/**
 * Check if all transactions are approved
 */
async function checkTransactionApprovals(
  teamId: string,
  season: string
): Promise<{ pendingCount: number; totalCount: number }> {
  // Count pending/draft transactions
  const pendingCount = await prisma.transaction.count({
    where: {
      teamId,
      status: {
        in: ['PENDING', 'DRAFT'],
      },
      deletedAt: null,
    },
  });

  // Count total transactions
  const totalCount = await prisma.transaction.count({
    where: {
      teamId,
      deletedAt: null,
    },
  });

  return { pendingCount, totalCount };
}

/**
 * Check if all expenses above threshold have receipts
 */
async function checkReceiptsPresent(
  teamId: string,
  season: string
): Promise<{ missingCount: number; totalWithReceipts: number }> {
  // Count expenses over threshold without receipts
  const missingCount = await prisma.transaction.count({
    where: {
      teamId,
      type: 'EXPENSE',
      amount: {
        gt: DEFAULT_POLICY.minReceiptAmount,
      },
      receiptUrl: null,
      deletedAt: null,
    },
  });

  // Count total transactions with receipts
  const totalWithReceipts = await prisma.transaction.count({
    where: {
      teamId,
      receiptUrl: {
        not: null,
      },
      deletedAt: null,
    },
  });

  return { missingCount, totalWithReceipts };
}

/**
 * Check bank reconciliation status (warning only)
 */
async function checkBankReconciliation(
  teamId: string
): Promise<{ reconciled: boolean; unreconciledCount: number }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - DEFAULT_POLICY.bankReconciliationDays);

  // Count unreconciled bank transactions in last N days
  const unreconciledCount = await prisma.bankTransaction.count({
    where: {
      bankAccount: {
        teamId,
      },
      isReconciled: false,
      date: {
        gte: cutoffDate,
      },
    },
  });

  return {
    reconciled: unreconciledCount === 0,
    unreconciledCount,
  };
}

/**
 * Calculate financial summary for the season
 */
export async function calculateFinancialSummary(
  teamId: string,
  season: string
): Promise<{
  totalIncome: number;
  totalExpenses: number;
  finalBalance: number;
}> {
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

  const totalIncome = income._sum.amount ? Number(income._sum.amount) : 0;
  const totalExpenses = expenses._sum.amount ? Number(expenses._sum.amount) : 0;

  return {
    totalIncome,
    totalExpenses,
    finalBalance: totalIncome - totalExpenses,
  };
}
