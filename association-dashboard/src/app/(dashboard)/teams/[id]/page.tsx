/**
 * Team Detail Page
 *
 * Displays comprehensive team information including:
 * - Team header (name, division, treasurer, health status)
 * - Budget summary with progress bar
 * - Category breakdown table
 * - Transactions list (paginated, filtered)
 * - Red flags section
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Mail,
  Calendar,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface TeamDetailData {
  teamInfo: {
    id: string
    teamName: string
    division: string | null
    season: string | null
    treasurerName: string | null
    treasurerEmail: string | null
    healthStatus: string | null
    lastSynced: string | null
  }
  budgetSummary: {
    budgetTotal: number | null
    spent: number | null
    remaining: number | null
    percentUsed: number | null
  }
  categoryBreakdown: Array<{
    categoryName: string
    budgeted: number
    spent: number
    remaining: number
    percentUsed: number
    status: 'on_track' | 'warning' | 'over'
  }>
  redFlags: Array<{
    code: string
    message: string
    severity: 'warning' | 'critical'
  }>
  operationalMetrics: {
    pendingApprovals: number | null
    missingReceipts: number | null
    bankConnected: boolean | null
    bankReconciledThrough: string | null
    lastActivity: string | null
  }
}

interface Transaction {
  id: string
  date: string
  type: 'expense' | 'income'
  vendor: string | null
  description: string
  amount: number
  category: string | null
  status: 'pending' | 'approved' | 'rejected'
  hasReceipt: boolean
}

interface TransactionsData {
  transactions: Transaction[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

type TransactionType = 'all' | 'expense' | 'income'
type TransactionStatus = 'all' | 'pending' | 'approved' | 'rejected'

export default function TeamDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const teamId = params.id

  // Team detail state
  const [teamData, setTeamData] = useState<TeamDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Transactions state
  const [transactions, setTransactions] = useState<TransactionsData | null>(null)
  const [txLoading, setTxLoading] = useState(false)
  const [txPage, setTxPage] = useState(1)
  const [txType, setTxType] = useState<TransactionType>('all')
  const [txStatus, setTxStatus] = useState<TransactionStatus>('all')

  // Fetch team detail
  useEffect(() => {
    async function fetchTeamDetail() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/teams/${teamId}`, {
          cache: 'no-store',
        })

        if (!response.ok) {
          const result = await response.json()
          throw new Error(result.error?.message || 'Failed to fetch team detail')
        }

        const result = await response.json()
        setTeamData(result.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchTeamDetail()
  }, [teamId])

  // Fetch transactions
  const fetchTransactions = useCallback(async () => {
    setTxLoading(true)

    try {
      const params = new URLSearchParams({
        page: txPage.toString(),
        pageSize: '25',
        type: txType,
        status: txStatus,
      })

      const response = await fetch(
        `/api/teams/${teamId}/transactions?${params.toString()}`,
        {
          cache: 'no-store',
        }
      )

      if (!response.ok) {
        // Silently fail for transactions (team might not be connected)
        console.error('Failed to fetch transactions')
        setTransactions(null)
        return
      }

      const result = await response.json()
      setTransactions(result.data)
    } catch (err) {
      console.error('Error fetching transactions:', err)
      setTransactions(null)
    } finally {
      setTxLoading(false)
    }
  }, [teamId, txPage, txType, txStatus])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !teamData) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Error</h2>
          <p className="text-muted-foreground mb-4">{error || 'Team not found'}</p>
          <Button onClick={() => router.push('/teams')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Teams
          </Button>
        </div>
      </div>
    )
  }

  const { teamInfo, budgetSummary, categoryBreakdown, redFlags, operationalMetrics } =
    teamData

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/teams')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Teams
        </Button>

        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {teamInfo.teamName}
              </h1>
              {teamInfo.healthStatus && (
                <HealthBadge status={teamInfo.healthStatus} />
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {teamInfo.division && <span>{teamInfo.division}</span>}
              {teamInfo.season && <span>• {teamInfo.season}</span>}
            </div>
          </div>
        </div>

        {/* Treasurer Info */}
        {(teamInfo.treasurerName || teamInfo.treasurerEmail) && (
          <div className="mt-4 flex items-center gap-6 text-sm">
            {teamInfo.treasurerName && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Treasurer:</span>
                <span>{teamInfo.treasurerName}</span>
              </div>
            )}
            {teamInfo.treasurerEmail && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a
                  href={`mailto:${teamInfo.treasurerEmail}`}
                  className="text-primary hover:underline"
                >
                  {teamInfo.treasurerEmail}
                </a>
              </div>
            )}
          </div>
        )}

        {teamInfo.lastSynced && (
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>
              Last updated{' '}
              {formatDistanceToNow(new Date(teamInfo.lastSynced), { addSuffix: true })}
            </span>
          </div>
        )}
      </div>

      {/* Budget Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          {budgetSummary.budgetTotal ? (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Budget</p>
                  <p className="text-2xl font-bold">
                    ${budgetSummary.budgetTotal.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Spent</p>
                  <p className="text-2xl font-bold">
                    ${(budgetSummary.spent || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                  <p className="text-2xl font-bold">
                    ${(budgetSummary.remaining || 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">% Used</p>
                  <p className="text-2xl font-bold">
                    {(budgetSummary.percentUsed || 0).toFixed(0)}%
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget utilization</span>
                  <span className="font-medium">
                    {(budgetSummary.percentUsed || 0).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      (budgetSummary.percentUsed || 0) >= 95
                        ? 'bg-red-600'
                        : (budgetSummary.percentUsed || 0) >= 80
                        ? 'bg-yellow-600'
                        : 'bg-green-600'
                    }`}
                    style={{
                      width: `${Math.min(budgetSummary.percentUsed || 0, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No budget data available</p>
          )}
        </CardContent>
      </Card>

      {/* Red Flags */}
      {redFlags.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Red Flags ({redFlags.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {redFlags.map((flag, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border"
                >
                  <Badge
                    variant={flag.severity === 'critical' ? 'destructive' : 'outline'}
                    className={
                      flag.severity === 'warning'
                        ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        : ''
                    }
                  >
                    {flag.severity}
                  </Badge>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{flag.code}</p>
                    <p className="text-sm text-muted-foreground">{flag.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
            <CardDescription>Budget allocation by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Budgeted</TableHead>
                    <TableHead className="text-right">Spent</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">% Used</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryBreakdown.map((cat, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">
                        {cat.categoryName}
                      </TableCell>
                      <TableCell className="text-right">
                        ${cat.budgeted.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${cat.spent.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${cat.remaining.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {cat.percentUsed.toFixed(0)}%
                      </TableCell>
                      <TableCell>
                        <CategoryStatusBadge status={cat.status} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transactions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transactions</CardTitle>
              <CardDescription>
                Recent financial activity for this team
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <Tabs
              value={txType}
              onValueChange={(value) => {
                setTxType(value as TransactionType)
                setTxPage(1)
              }}
            >
              <TabsList>
                <TabsTrigger value="all">All Types</TabsTrigger>
                <TabsTrigger value="expense">Expenses</TabsTrigger>
                <TabsTrigger value="income">Income</TabsTrigger>
              </TabsList>
            </Tabs>

            <Tabs
              value={txStatus}
              onValueChange={(value) => {
                setTxStatus(value as TransactionStatus)
                setTxPage(1)
              }}
            >
              <TabsList>
                <TabsTrigger value="all">All Status</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Table */}
          {txLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : transactions && transactions.transactions.length > 0 ? (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Vendor/Source</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="text-sm">
                          {format(new Date(tx.date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              tx.type === 'expense'
                                ? 'bg-red-50 text-red-700 border-red-200'
                                : 'bg-green-50 text-green-700 border-green-200'
                            }
                          >
                            {tx.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{tx.vendor || '-'}</TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {tx.description}
                        </TableCell>
                        <TableCell className="text-sm">{tx.category || '-'}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${tx.amount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <TransactionStatusBadge status={tx.status} />
                        </TableCell>
                        <TableCell className="text-center">
                          {tx.hasReceipt ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600 inline" />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {transactions.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(txPage - 1) * 25 + 1} to{' '}
                    {Math.min(txPage * 25, transactions.pagination.totalCount)} of{' '}
                    {transactions.pagination.totalCount} transactions
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setTxPage(txPage - 1)}
                      disabled={txPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {txPage} of {transactions.pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setTxPage(txPage + 1)}
                      disabled={txPage === transactions.pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-2">No transactions found</p>
              {(txType !== 'all' || txStatus !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setTxType('all')
                    setTxStatus('all')
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// Health Badge Component
function HealthBadge({ status }: { status: string }) {
  const variants: Record<string, { label: string; className: string }> = {
    healthy: {
      label: 'Healthy',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    needs_attention: {
      label: 'Needs Attention',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    at_risk: {
      label: 'At Risk',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
  }

  const variant = variants[status] || variants.healthy

  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  )
}

// Category Status Badge
function CategoryStatusBadge({ status }: { status: 'on_track' | 'warning' | 'over' }) {
  const variants = {
    on_track: {
      label: 'On Track',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    warning: {
      label: 'Warning',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    over: {
      label: 'Over Budget',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
  }

  const variant = variants[status]

  return (
    <Badge variant="outline" className={`text-xs ${variant.className}`}>
      {variant.label}
    </Badge>
  )
}

// Transaction Status Badge
function TransactionStatusBadge({
  status,
}: {
  status: 'pending' | 'approved' | 'rejected'
}) {
  const variants = {
    pending: {
      label: 'Pending',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    approved: {
      label: 'Approved',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    rejected: {
      label: 'Rejected',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
  }

  const variant = variants[status]

  return (
    <Badge variant="outline" className={`text-xs ${variant.className}`}>
      {variant.label}
    </Badge>
  )
}
