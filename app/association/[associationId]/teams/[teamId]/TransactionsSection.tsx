'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type TransactionType = 'all' | 'EXPENSE' | 'INCOME'
type TransactionStatus = 'all' | 'PENDING' | 'APPROVED' | 'REJECTED'

interface Transaction {
  id: string
  transactionDate: string
  type: string
  vendor: string
  description: string | null
  amount: number
  status: string
  missingReceipt: boolean
  category: {
    id: string
    heading: string
    color: string
  }
}

interface TransactionsSectionProps {
  transactions: Transaction[]
}

function TransactionRow({ transaction }: { transaction: Transaction }) {
  const isIncome = transaction.type === 'INCOME'
  const statusColors = {
    APPROVED: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    REJECTED: 'bg-red-100 text-red-800',
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-900">
        {new Date(transaction.transactionDate).toLocaleDateString()}
      </td>
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-medium"
          style={{ backgroundColor: transaction.category.color + '20', color: transaction.category.color }}
        >
          {transaction.category.heading}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">{transaction.vendor}</td>
      <td className="px-4 py-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">{transaction.description || '-'}</span>
          {transaction.missingReceipt && (
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
        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${statusColors[transaction.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
          {transaction.status}
        </span>
      </td>
      <td className={`px-4 py-3 text-sm font-semibold text-right ${isIncome ? 'text-green-600' : 'text-gray-900'}`}>
        {isIncome ? '+' : '-'}${Number(transaction.amount).toLocaleString()}
      </td>
    </tr>
  )
}

export function TransactionsSection({ transactions }: TransactionsSectionProps) {
  const [typeFilter, setTypeFilter] = useState<TransactionType>('all')
  const [statusFilter, setStatusFilter] = useState<TransactionStatus>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    const matchesType = typeFilter === 'all' || tx.type === typeFilter
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter
    return matchesType && matchesStatus
  })

  // Paginate
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [typeFilter, statusFilter])

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">All Transactions</h2>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Type</p>
          <Tabs value={typeFilter} onValueChange={(value) => setTypeFilter(value as TransactionType)}>
            <TabsList>
              <TabsTrigger value="all">All Types</TabsTrigger>
              <TabsTrigger value="EXPENSE">Expenses</TabsTrigger>
              <TabsTrigger value="INCOME">Income</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">Status</p>
          <Tabs value={statusFilter} onValueChange={(value) => setStatusFilter(value as TransactionStatus)}>
            <TabsList>
              <TabsTrigger value="all">All Status</TabsTrigger>
              <TabsTrigger value="PENDING">Pending</TabsTrigger>
              <TabsTrigger value="APPROVED">Approved</TabsTrigger>
              <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Transactions Table */}
      {paginatedTransactions.length > 0 ? (
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
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTransactions.map(transaction => (
                  <TransactionRow key={transaction.id} transaction={transaction} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <div className="text-sm text-gray-600">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} transactions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-2">No transactions found</p>
          {(typeFilter !== 'all' || statusFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTypeFilter('all')
                setStatusFilter('all')
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
