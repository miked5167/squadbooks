// Type definitions for season closure system

export interface ValidationResult {
  isValid: boolean;

  // Snapshot flags
  budgetBalanced: boolean;
  allTransactionsApproved: boolean;
  allReceiptsPresent: boolean;
  bankReconciled: boolean;

  // Counts / metrics for messaging in the UI
  pendingCount: number;
  missingReceipts: number;
  unreconciledCount: number;
  receiptCount: number;
  totalTransactions: number;

  // Financial summary
  totalIncome: number;
  totalExpenses: number;
  finalBalance: number;

  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ValidationIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface SeasonPackage {
  reports: {
    finalBudget: Buffer;        // PDF
    transactionHistory: Buffer; // PDF
    budgetVariance: Buffer;     // PDF
    auditTrail: Buffer;         // PDF
  };
  receipts: {
    fileName: string;
    fileUrl: string;
    transactionId: string;
  }[];
  summary: SeasonSummary;
}

export interface SeasonSummary {
  teamName: string;
  season: string;
  totalIncome: number;
  totalExpenses: number;
  finalBalance: number;
  transactionCount: number;
  receiptCount: number;
  generatedAt: Date;
}

export interface PolicySnapshot {
  minReceiptAmount: number;
  requireZeroBalance: boolean;
  bankReconciliationDays: number;
}
