'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Eye, Receipt } from 'lucide-react'
import Link from 'next/link'
import { TransactionDetailsDrawer } from '@/components/transactions/transaction-details-drawer'

// Format date in UTC to avoid hydration mismatch
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`
}

interface Transaction {
  id: string
  type: string
  status: string
  amount: number
  vendor: string
  description: string | null
  receipt_status: string | null
  receiptUrl: string | null
  transactionDate: string
  createdAt: string
  category: {
    heading: string
    color: string
  } | null
  creator: {
    name: string | null
    email: string
  }
}

interface TransactionTableProps {
  transactions: Transaction[]
  associationId: string
  totalCount?: number
}

export function TransactionTable({ transactions, associationId, totalCount }: TransactionTableProps) {
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  async function openTransactionDetails(transaction: Transaction) {
    setDrawerOpen(true)

    try {
      const res = await fetch(`/api/transactions/${transaction.id}`)
      if (!res.ok) {
        throw new Error('Failed to fetch transaction details')
      }
      const data = await res.json()
      setSelectedTransaction(data.transaction)
    } catch (error) {
      console.error('Error fetching transaction details:', error)
      toast.error('Failed to load transaction details')
      setDrawerOpen(false)
    }
  }

  const isIncome = (type: string) => type === 'INCOME'
  const statusColors: Record<string, string> = {
    APPROVED: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    REJECTED: 'bg-red-100 text-red-800',
  }

  const hasReceipt = (tx: Transaction) => {
    // Show eye icon if NOT missing receipt (i.e., not an expense with NONE/MISSING status)
    const isMissingReceipt = (tx.receipt_status === 'NONE' || tx.receipt_status === 'MISSING') && tx.type === 'EXPENSE'
    return !isMissingReceipt
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Receipt
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map(transaction => (
              <tr
                key={transaction.id}
                className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => openTransactionDetails(transaction)}
              >
                <td className="px-4 py-3 text-sm text-gray-900">
                  {formatDate(transaction.transactionDate)}
                </td>
                <td className="px-4 py-3">
                  {transaction.category ? (
                    <span
                      className="inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: transaction.category.color + '20', color: transaction.category.color }}
                    >
                      {transaction.category.heading}
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">Uncategorized</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">{transaction.vendor}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-gray-600">{transaction.description || '-'}</span>
                    {(transaction.receipt_status === 'NONE' || transaction.receipt_status === 'MISSING') && transaction.type === 'EXPENSE' && (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Missing Receipt
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusColors[transaction.status] || 'bg-gray-100 text-gray-800'}`}>
                    {transaction.status}
                  </span>
                </td>
                <td className={`px-4 py-3 text-sm font-semibold text-right ${isIncome(transaction.type) ? 'text-green-600' : 'text-gray-900'}`}>
                  {isIncome(transaction.type) ? '+' : '-'}${Number(transaction.amount).toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  {hasReceipt(transaction) ? (
                    <span className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800" title="View receipt">
                      <Eye className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="text-gray-300">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View All Transactions Link */}
      {totalCount && totalCount > transactions.length && (
        <div className="mt-4 text-center">
          <Link
            href={`/association/${associationId}/transactions`}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
          >
            View all {totalCount} transactions →
          </Link>
        </div>
      )}

      <TransactionDetailsDrawer
        transaction={selectedTransaction}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        canEdit={false}
      />
    </>
  )
}
