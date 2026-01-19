'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { TransactionDetailsDrawer } from '@/components/transactions/transaction-details-drawer'
import { toast } from 'sonner'
import Link from 'next/link'
import { useParams } from 'next/navigation'

type TransactionType = 'all' | 'EXPENSE' | 'INCOME'
type TransactionStatus = 'all' | 'IMPORTED' | 'VALIDATED' | 'PENDING' | 'EXCEPTION' | 'RESOLVED'

interface Category {
  id: string
  name: string
  heading: string
  color: string
}

interface Creator {
  id: string
  name: string
  role: string
}

interface Approval {
  id: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  approvedAt: string | Date | null
  comment?: string | null
  approver: {
    id: string
    name: string
    role: string
  }
}

interface Transaction {
  id: string
  transactionDate: string
  type: 'INCOME' | 'EXPENSE'
  vendor: string
  description: string | null
  amount: number
  status: string
  receiptUrl: string | null
  category: Category
  creator: Creator
  approvals?: Approval[]
  validation_json?: {
    compliant: boolean
    violations: Array<{
      code: string
      message: string
      severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'
      category?: string
    }>
    score: number
  } | null
}

interface TransactionsSectionProps {
  teamId: string
  isAssociationUser?: boolean
}

function TransactionRow({
  transaction,
  onClick,
}: {
  transaction: Transaction
  onClick: () => void
}) {
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
    <TableRow onClick={onClick} className="hover:bg-navy/5 cursor-pointer transition-colors">
      <TableCell className="text-sm text-gray-900">
        {new Date(transaction.transactionDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })}
      </TableCell>
      <TableCell className="text-sm text-gray-900">{transaction.vendor}</TableCell>
      <TableCell>
        <span
          className="inline-flex items-center gap-2 rounded px-2 py-1 text-xs font-medium"
          style={{
            backgroundColor: transaction.category.color + '20',
            color: transaction.category.color,
          }}
        >
          {transaction.category.heading}
        </span>
      </TableCell>
      <TableCell
        className={`text-right text-sm font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}
      >
        {isIncome ? '+' : '-'}${Number(transaction.amount).toLocaleString()}
      </TableCell>
      <TableCell>
        {transaction.receiptUrl ? (
          <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700">
            Has Receipt
          </Badge>
        ) : (
          <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-700">
            No Receipt
          </Badge>
        )}
      </TableCell>
    </TableRow>
  )
}

export function TransactionsSection({
  teamId,
  isAssociationUser = false,
}: TransactionsSectionProps) {
  const params = useParams()
  const associationId = params?.associationId as string | undefined

  // Data state
  const [items, setItems] = useState<Transaction[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Filter state
  const [typeFilter, setTypeFilter] = useState<TransactionType>('all')
  const [statusFilter, setStatusFilter] = useState<TransactionStatus>('all')

  // Drawer state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false)

  // Fetch initial transactions
  useEffect(() => {
    fetchInitialTransactions()
  }, [teamId, typeFilter, statusFilter])

  async function fetchInitialTransactions() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('teamIds', teamId) // Pre-filter to this team only
      params.append('limit', '50')

      if (typeFilter !== 'all') {
        params.append('type', typeFilter)
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const res = await fetch(`/api/transactions?${params.toString()}`)

      if (!res.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const data = await res.json()

      setItems(data.items || [])
      setNextCursor(data.nextCursor || null)
    } catch (error) {
      console.error('Error fetching transactions:', error)
      toast.error('Failed to load transactions')
      setItems([])
      setNextCursor(null)
    } finally {
      setLoading(false)
    }
  }

  async function loadMoreTransactions() {
    if (!nextCursor || loading) return

    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('teamIds', teamId)
      params.append('limit', '50')
      params.append('cursor', nextCursor)

      if (typeFilter !== 'all') {
        params.append('type', typeFilter)
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const res = await fetch(`/api/transactions?${params.toString()}`)

      if (!res.ok) {
        throw new Error('Failed to load more transactions')
      }

      const data = await res.json()

      setItems(prev => [...prev, ...(data.items || [])])
      setNextCursor(data.nextCursor || null)
    } catch (error) {
      console.error('Error loading more transactions:', error)
      toast.error('Failed to load more transactions')
    } finally {
      setLoading(false)
    }
  }

  async function openTransactionDetails(transaction: Transaction) {
    setDetailsDrawerOpen(true)

    try {
      // Fetch full transaction details with all relations
      const res = await fetch(`/api/transactions/${transaction.id}`)

      if (!res.ok) {
        throw new Error('Failed to fetch transaction details')
      }

      const data = await res.json()
      setSelectedTransaction(data.transaction)
    } catch (error) {
      console.error('Error fetching transaction details:', error)
      toast.error('Failed to load transaction details')
      // Still show drawer with available data
      setSelectedTransaction(transaction)
    }
  }

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Team Transactions</h2>
        {isAssociationUser && associationId && (
          <Link
            href={`/association/${associationId}/transactions?teamIds=${teamId}`}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            View All Transactions →
          </Link>
        )}
      </div>

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
              <TabsTrigger value="PENDING">Pending Review</TabsTrigger>
              <TabsTrigger value="EXCEPTION">Exception</TabsTrigger>
              <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Loading State */}
      {loading && items.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-500">Loading transactions...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
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

      {/* Transactions Table */}
      {!loading && items.length > 0 && (
        <>
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(transaction => (
                  <TransactionRow
                    key={transaction.id}
                    transaction={transaction}
                    onClick={() => openTransactionDetails(transaction)}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Load More Button */}
          {nextCursor && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={loadMoreTransactions} disabled={loading}>
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}

          {/* Showing count */}
          <div className="pt-2 text-center text-sm text-gray-600">
            Showing {items.length} transaction{items.length !== 1 ? 's' : ''}
          </div>
        </>
      )}

      {/* Transaction Details Drawer */}
      <TransactionDetailsDrawer
        transaction={selectedTransaction}
        open={detailsDrawerOpen}
        onOpenChange={setDetailsDrawerOpen}
        isReadOnly={isAssociationUser}
      />
    </div>
  )
}
