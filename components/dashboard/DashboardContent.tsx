'use client'

import { TransactionsPreviewTable } from './TransactionsPreviewTable'

interface Transaction {
  id: string
  transactionDate: Date
  vendor: string
  categoryName: string
  categoryId?: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  status: any
  receiptUrl: string | null
  validation?: {
    compliant: boolean
    violations?: any[]
  } | null
  exceptionReason?: string | null
  resolvedAt?: string | null
  overrideJustification?: string | null
  resolutionNotes?: string | null
}

interface DashboardContentProps {
  transactions: Transaction[]
  isTreasurer?: boolean
}

export function DashboardContent({ transactions, isTreasurer }: DashboardContentProps) {
  return (
    <TransactionsPreviewTable
      transactions={transactions}
      isTreasurer={isTreasurer}
    />
  )
}
