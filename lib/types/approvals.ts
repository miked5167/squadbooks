/**
 * Types for the Approvals system
 */

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH'

export interface PendingApproval {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  comment?: string
  transaction: {
    id: string
    type: 'INCOME' | 'EXPENSE'
    amount: number
    vendor: string
    description?: string
    transactionDate: string
    receiptUrl?: string | null
    category: {
      id: string
      name: string
      heading: string
      color: string
    }
    creator: {
      id: string
      name: string
      email: string
      role: string
    }
  }
}

export interface PendingApprovalWithRisk extends PendingApproval {
  riskLevel: RiskLevel
  riskReasons: string[]
}

export interface ApprovalFilters {
  search: string
  categories: string[]
  riskLevels: RiskLevel[]
  minAmount?: number
  maxAmount?: number
  dateFrom?: Date
  dateTo?: Date
  groupBy: 'NONE' | 'CATEGORY' | 'VENDOR' | 'RISK'
}

export interface ApprovalSort {
  field: 'amount' | 'submittedAt' | 'transactionDate' | 'vendor'
  direction: 'asc' | 'desc'
}
