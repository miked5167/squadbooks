/**
 * HuddleBooks API Types
 *
 * These types represent the data structures returned by the HuddleBooks API
 * that the Association Command Center needs for daily snapshots.
 */

// ============================================
// TEAM SUMMARY
// ============================================

export type TeamSummary = {
  teamId: string
  teamName: string
  division: string | null
  season: string

  // Financial snapshot
  budgetTotal: number
  budgetAllocated: number
  spent: number
  pending: number
  remaining: number
  percentUsed: number

  // Treasurer information
  treasurer: {
    name: string
    email: string
    lastLogin: Date | null
  }

  // Operational metrics
  pendingApprovals: number
  missingReceipts: number
  totalTransactions: number
  lastActivityAt: Date | null

  // Bank connection status
  bankConnected: boolean
  bankReconciledThrough: Date | null

  // Timestamps
  snapshotAt: Date
}

// ============================================
// TEAM BUDGET
// ============================================

export type BudgetHealth = 'healthy' | 'warning' | 'critical'

export type CategoryBudget = {
  categoryId: string
  categoryName: string
  categoryHeading: string
  categoryColor: string
  allocated: number
  spent: number
  pending: number
  remaining: number
  percentage: number
  projectedPercentage: number
  health: BudgetHealth
  projectedHealth: BudgetHealth
}

export type TeamBudget = {
  season: string
  totalBudget: number
  totalAllocated: number
  totalSpent: number
  totalPending: number
  totalRemaining: number
  overallPercentage: number
  projectedPercentage: number
  overallHealth: BudgetHealth
  projectedHealth: BudgetHealth
  categories: CategoryBudget[]
  unallocated: number
}

// ============================================
// TRANSACTIONS
// ============================================

export type TransactionType = 'INCOME' | 'EXPENSE'
export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type Transaction = {
  id: string
  teamId: string
  type: TransactionType
  status: TransactionStatus
  amount: number
  vendor: string
  description: string | null
  transactionDate: Date
  receiptUrl: string | null
  categoryId: string
  category: {
    id: string
    name: string
    heading: string
  }
  createdAt: Date
  createdBy: {
    id: string
    name: string
    email: string
  }
  approvedAt: Date | null
  approvedBy: {
    id: string
    name: string
  } | null
}

export type TransactionFilter = {
  type?: TransactionType
  status?: TransactionStatus
  categoryId?: string
  startDate?: string
  endDate?: string
  page?: number
  perPage?: number
  sortBy?: 'date' | 'amount' | 'vendor'
  sortOrder?: 'asc' | 'desc'
}

export type TransactionsResponse = {
  transactions: Transaction[]
  total: number
  page: number
  perPage: number
  totalPages: number
  hasMore: boolean
}

// ============================================
// API ERROR
// ============================================

export class HuddleBooksApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message)
    this.name = 'HuddleBooksApiError'
  }
}

// ============================================
// API RESPONSE WRAPPER
// ============================================

export type HuddleBooksApiResponse<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: {
        code: string
        message: string
        statusCode: number
      }
    }
