'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type TransactionType = 'all' | 'EXPENSE' | 'INCOME'
type TransactionStatus = 'all' | 'IMPORTED' | 'VALIDATED' | 'EXCEPTION' | 'RESOLVED'

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
    VALIDATED: 'bg-green-100 text-green-800',
    DRAFT: 'bg-gray-100 text-gray-800',
    IMPORTED: 'bg-blue-100 text-blue-800',
    EXCEPTION: 'bg-orange-100 text-orange-800',
    RESOLVED: 'bg-purple-100 text-purple-800',
    LOCKED: 'bg-purple-100 text-purple-800',
    // Legacy status mappings (for backward compatibility)
    APPROVED: 'bg-green-100 text-green-800',
    APPROVED_AUTOMATIC: 'bg-green-100 text-green-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    REJECTED: 'bg-red-100 text-red-800',
  }

  const statusLabels: Record<string, string> = {
    VALIDATED: 'Validated',
    DRAFT: 'Draft',
    IMPORTED: 'Imported',
    EXCEPTION: 'Exception',
    RESOLVED: 'Resolved',
    LOCKED: 'Locked',
    // Legacy status mappings (for backward compatibility)
    APPROVED: 'Validated',
    APPROVED_AUTOMATIC: 'Validated',
    PENDING: 'Pending Review',
    REJECTED: 'Exception',
  }

  const displayStatus = statusLabels[transaction.status] || transaction.status

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-900">
        {new Date(transaction.transactionDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })}
      </td>
      <td className="px-4 py-3">
        <span
          className="inline-flex items-center gap-2 rounded px-2 py-1 text-xs font-medium"
          style={{
            backgroundColor: transaction.category.color + '20',
            color: transaction.category.color,
          }}
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
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Missing Receipt
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-block rounded px-2 py-1 text-xs font-medium ${statusColors[transaction.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}
        >
          {displayStatus}
        </span>
      </td>
      <td
        className={`px-4 py-3 text-right text-sm font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}
      >
        {isIncome ? '+' : '-'}${Number(transaction.amount).toLocaleString()}
      </td>
    </tr>
  )
}

type SortColumn = 'date' | 'vendor' | 'amount' | 'status' | 'category'
type SortDirection = 'asc' | 'desc'

export function TransactionsSection({ transactions }: TransactionsSectionProps) {
  const searchParams = useSearchParams()
  const initialReceiptFilter = searchParams.get('receiptFilter') as 'all' | 'missing_required' | null

  const [typeFilter, setTypeFilter] = useState<TransactionType>('all')
  const [statusFilter, setStatusFilter] = useState<TransactionStatus>('all')
  const [receiptFilter, setReceiptFilter] = useState<'all' | 'missing_required'>(
    initialReceiptFilter || 'all'
  )
  const [sortColumn, setSortColumn] = useState<SortColumn>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 25

  // Helper function to check if transaction has missing required receipt violation
  const hasMissingRequiredReceipt = (tx: any) => {
    if (!tx.validation_json?.violations) return false
    return tx.validation_json.violations.some(
      (v: any) => v.code === 'MISSING_RECEIPT' && v.severity === 'ERROR'
    )
  }

  // Handle column header click for sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // New column - default to descending
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  // Filter transactions
  const filteredTransactions = transactions.filter(tx => {
    const matchesType = typeFilter === 'all' || tx.type === typeFilter
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter
    const matchesReceipt = receiptFilter === 'all' ||
      (receiptFilter === 'missing_required' && hasMissingRequiredReceipt(tx))
    return matchesType && matchesStatus && matchesReceipt
  })

  // Sort filtered transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0

    switch (sortColumn) {
      case 'date':
        comparison = new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
        break
      case 'vendor':
        comparison = a.vendor.localeCompare(b.vendor)
        break
      case 'amount':
        comparison = Number(a.amount) - Number(b.amount)
        break
      case 'status':
        comparison = a.status.localeCompare(b.status)
        break
      case 'category':
        comparison = a.category.heading.localeCompare(b.category.heading)
        break
    }

    return sortDirection === 'asc' ? comparison : -comparison
  })

  // Paginate sorted transactions
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTransactions = sortedTransactions.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [typeFilter, statusFilter, receiptFilter])

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-xl font-bold text-gray-900">All Transactions</h2>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Type</p>
          <Tabs value={typeFilter} onValueChange={value => setTypeFilter(value as TransactionType)}>
            <TabsList>
              <TabsTrigger value="all">All Types</TabsTrigger>
              <TabsTrigger value="EXPENSE">Expenses</TabsTrigger>
              <TabsTrigger value="INCOME">Income</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Status</p>
          <Tabs
            value={statusFilter}
            onValueChange={value => setStatusFilter(value as TransactionStatus)}
          >
            <TabsList>
              <TabsTrigger value="all">All Status</TabsTrigger>
              <TabsTrigger value="IMPORTED">Imported</TabsTrigger>
              <TabsTrigger value="VALIDATED">Validated</TabsTrigger>
              <TabsTrigger value="EXCEPTION">Exception</TabsTrigger>
              <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Receipts</p>
          <Tabs
            value={receiptFilter}
            onValueChange={value => setReceiptFilter(value as 'all' | 'missing_required')}
          >
            <TabsList>
              <TabsTrigger value="all">All Receipts</TabsTrigger>
              <TabsTrigger value="missing_required">Missing Required</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Transactions Table */}
      {paginatedTransactions.length > 0 ? (
        <>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-1">
                      Date
                      {sortColumn === 'date' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center gap-1">
                      Category
                      {sortColumn === 'category' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('vendor')}
                  >
                    <div className="flex items-center gap-1">
                      Vendor
                      {sortColumn === 'vendor' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
                    Description
                  </th>
                  <th
                    className="px-4 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-1">
                      Status
                      {sortColumn === 'status' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-4 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('amount')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      Amount
                      {sortColumn === 'amount' && (
                        <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
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
                Showing {startIndex + 1} to {Math.min(endIndex, sortedTransactions.length)} of{' '}
                {sortedTransactions.length} transactions
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
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="mb-2 text-gray-500">No transactions found</p>
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
