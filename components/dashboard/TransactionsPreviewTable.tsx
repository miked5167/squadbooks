import Link from 'next/link'
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

interface Transaction {
  id: string
  transactionDate: Date
  vendor: string
  categoryName: string
  amount: number
  type: 'INCOME' | 'EXPENSE'
  status: 'VALIDATED' | 'IMPORTED' | 'EXCEPTION' | 'RESOLVED' | 'DRAFT' | 'LOCKED' | 'APPROVED' | 'APPROVED_AUTOMATIC' | 'PENDING' | 'REJECTED'
  receiptUrl: string | null
}

interface TransactionsPreviewTableProps {
  transactions: Transaction[]
  isLoading?: boolean
  isTreasurer?: boolean
  readOnly?: boolean
}

export function TransactionsPreviewTable({
  transactions,
  isLoading = false,
  isTreasurer = false,
  readOnly = false,
}: TransactionsPreviewTableProps) {
  const hasTransactions = transactions.length > 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VALIDATED':
        return <Badge variant="success" className="bg-green-100 text-green-800">Validated</Badge>
      case 'IMPORTED':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Imported</Badge>
      case 'EXCEPTION':
        return <Badge variant="warning" className="bg-orange-100 text-orange-800">Exception</Badge>
      case 'RESOLVED':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Resolved</Badge>
      case 'LOCKED':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800">Locked</Badge>
      case 'DRAFT':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Draft</Badge>
      // Legacy status mappings (for backward compatibility)
      case 'APPROVED':
      case 'APPROVED_AUTOMATIC':
        return <Badge variant="success" className="bg-green-100 text-green-800">Validated</Badge>
      case 'PENDING':
        return <Badge variant="warning" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>
      case 'REJECTED':
        return <Badge variant="warning" className="bg-red-100 text-red-800">Exception</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-navy">
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
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
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-base font-semibold text-navy">
              Recent Transactions
            </CardTitle>
            <p className="text-sm text-navy/60 mt-1">Latest financial activity</p>
          </div>
          {hasTransactions && (
            <Button asChild variant="outline" size="sm" className="border-navy/20">
              <Link href="/transactions">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasTransactions ? (
          <div className="rounded-md border border-navy/10">
            <Table>
              <TableHeader>
                <TableRow className="border-navy/10 hover:bg-transparent">
                  <TableHead className="text-navy/70">Date</TableHead>
                  <TableHead className="text-navy/70">Payee</TableHead>
                  <TableHead className="text-navy/70">Category</TableHead>
                  <TableHead className="text-right text-navy/70">Amount</TableHead>
                  <TableHead className="text-center text-navy/70">Status</TableHead>
                  <TableHead className="text-center text-navy/70 w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id} className="border-navy/10">
                    <TableCell className="text-sm text-navy/80">
                      {format(new Date(transaction.transactionDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="font-medium text-navy">
                      {transaction.vendor}
                    </TableCell>
                    <TableCell className="text-sm text-navy/70">
                      {transaction.categoryName}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        transaction.type === 'INCOME'
                          ? 'text-green-600'
                          : 'text-navy'
                      }`}
                    >
                      {transaction.type === 'INCOME' ? '+' : '-'}$
                      {transaction.amount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell className="text-center">
                      {transaction.receiptUrl && (
                        <Receipt className="w-4 h-4 text-navy/40 mx-auto" />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-navy/40" />
            </div>
            <h3 className="text-base font-semibold text-navy mb-2">No transactions yet</h3>
            <p className="text-sm text-navy/60 mb-6 max-w-sm mx-auto">
              {readOnly
                ? 'No financial activity to display yet. Transactions will appear here once your team treasurer adds them.'
                : isTreasurer
                ? 'Create your first expense or income to start tracking your team\'s finances'
                : 'No financial activity to display yet'}
            </p>
            {isTreasurer && !readOnly && (
              <div className="flex gap-3 justify-center">
                <Button asChild variant="default" size="sm" className="bg-navy hover:bg-navy-medium">
                  <Link href="/expenses/new">
                    <Plus className="mr-2 w-4 h-4" />
                    Add Expense
                  </Link>
                </Button>
                <Button asChild variant="outline" size="sm" className="border-navy/20">
                  <Link href="/income/new">
                    <Plus className="mr-2 w-4 h-4" />
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
