'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ArrowRight, Receipt, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { mapTransactionToUIState, type TransactionStatus } from '@/lib/utils/transaction-ui-mapping'

interface Transaction {
  id: string
  transactionDate: Date
  vendor: string
  categoryName: string
  categoryId?: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  status: TransactionStatus
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

interface TransactionsPreviewTableProps {
  transactions: Transaction[]
  isLoading?: boolean
  isTreasurer?: boolean
  readOnly?: boolean
  isAssociationUser?: boolean
  onTransactionClick?: (transactionId: string) => void
}

// Custom hook for managing transaction sort state (for association users)
type SortField = 'date' | 'amount' | 'category' | 'vendor'
type SortDir = 'asc' | 'desc'

function useTransactionSort() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const sortBy = (searchParams?.get('sortBy') as SortField) || 'date'
  const sortDir = (searchParams?.get('sortDir') as SortDir) || 'desc'

  const handleSort = (field: SortField) => {
    const params = new URLSearchParams(searchParams?.toString() || '')

    // Toggle direction if clicking same field, default desc for new field
    const newDir = field === sortBy && sortDir === 'desc' ? 'asc' : 'desc'

    params.set('sortBy', field)
    params.set('sortDir', newDir)
    params.delete('cursor') // Reset pagination when sort changes

    router.push(`?${params.toString()}`, { scroll: false })
  }

  return { sortBy, sortDir, handleSort }
}

export function TransactionsPreviewTable({
  transactions,
  isLoading = false,
  isTreasurer = false,
  readOnly = false,
  isAssociationUser = false,
  onTransactionClick,
}: TransactionsPreviewTableProps) {
  const hasTransactions = transactions.length > 0

  // Always call hook (React rules of hooks), but only use values if isAssociationUser
  const { sortBy, sortDir, handleSort } = useTransactionSort()

  const getTransactionUIState = (transaction: Transaction) => {
    return mapTransactionToUIState(
      {
        status: transaction.status,
        validation: transaction.validation,
        exceptionReason: transaction.exceptionReason,
        resolvedAt: transaction.resolvedAt,
        categoryId: transaction.categoryId,
        receiptUrl: transaction.receiptUrl,
        amount: transaction.amount,
        type: transaction.type,
      },
      {
        receiptRequiredOver: 100,
      }
    )
  }

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-navy text-base font-semibold">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-navy text-base font-semibold">Recent Transactions</CardTitle>
            <p className="text-navy/60 mt-1 text-sm">Latest financial activity</p>
          </div>
          {hasTransactions && (
            <Button asChild variant="outline" size="sm" className="border-navy/20">
              <Link href="/transactions">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasTransactions ? (
          <div className="border-navy/10 rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="border-navy/10 hover:bg-transparent">
                  <TableHead
                    className={`text-navy/70 ${isAssociationUser && handleSort ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    onClick={isAssociationUser && handleSort ? () => handleSort('date') : undefined}
                  >
                    Date
                    {isAssociationUser && sortBy === 'date' && (
                      <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHead>
                  <TableHead
                    className={`text-navy/70 ${isAssociationUser && handleSort ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    onClick={
                      isAssociationUser && handleSort ? () => handleSort('vendor') : undefined
                    }
                  >
                    Payee
                    {isAssociationUser && sortBy === 'vendor' && (
                      <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHead>
                  <TableHead
                    className={`text-navy/70 ${isAssociationUser && handleSort ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    onClick={
                      isAssociationUser && handleSort ? () => handleSort('category') : undefined
                    }
                  >
                    Category
                    {isAssociationUser && sortBy === 'category' && (
                      <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHead>
                  <TableHead
                    className={`text-navy/70 text-right ${isAssociationUser && handleSort ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                    onClick={
                      isAssociationUser && handleSort ? () => handleSort('amount') : undefined
                    }
                  >
                    Amount
                    {isAssociationUser && sortBy === 'amount' && (
                      <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </TableHead>
                  <TableHead className="text-navy/70 text-center">Status</TableHead>
                  <TableHead className="text-navy/70 w-16 text-center"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(transaction => {
                  const uiState = getTransactionUIState(transaction)
                  return (
                    <TableRow
                      key={transaction.id}
                      className={`border-navy/10 ${onTransactionClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                      onClick={() => onTransactionClick?.(transaction.id)}
                    >
                      <TableCell className="text-navy/80 text-sm">
                        {format(new Date(transaction.transactionDate), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-navy font-medium">{transaction.vendor}</TableCell>
                      <TableCell className="text-navy/70 text-sm">
                        {transaction.categoryName}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${
                          transaction.type === 'INCOME' ? 'text-green-600' : 'text-navy'
                        }`}
                      >
                        {transaction.type === 'INCOME' ? '+' : '-'}$
                        {transaction.amount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={uiState.validationColor}>
                          {uiState.validationIcon} {uiState.validationLabel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {transaction.receiptUrl && (
                          <Receipt className="text-navy/40 mx-auto h-4 w-4" />
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-12 text-center">
            <div className="bg-navy/5 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
              <Receipt className="text-navy/40 h-8 w-8" />
            </div>
            <h3 className="text-navy mb-2 text-base font-semibold">No transactions yet</h3>
            <p className="text-navy/60 mx-auto mb-6 max-w-sm text-sm">
              {readOnly
                ? 'No financial activity to display yet. Transactions will appear here once your team treasurer adds them.'
                : isTreasurer
                  ? "Create your first expense or income to start tracking your team's finances"
                  : 'No financial activity to display yet'}
            </p>
            {isTreasurer && !readOnly && (
              <div className="flex justify-center gap-3">
                <Button
                  asChild
                  variant="default"
                  size="sm"
                  className="bg-navy hover:bg-navy-medium"
                >
                  <Link href="/expenses/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="border-navy/20">
                  <Link href="/income/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Income
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
