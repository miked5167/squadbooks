'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, Loader2, Search, RefreshCw, X, Eye, ChevronDown, Info } from 'lucide-react'
import { toast } from 'sonner'
import { TransactionDetailsDrawer } from '@/components/transactions/transaction-details-drawer'
import { TeamFilter } from '@/components/transactions/TeamFilter'
import { Skeleton } from '@/components/ui/skeleton'
import {
  mapTransactionToUIState,
  mapUIFilterToBackendStatus,
  type TransactionStatus,
} from '@/lib/utils/transaction-ui-mapping'

interface Transaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  status: TransactionStatus
  amount: string
  vendor: string
  description: string | null
  transactionDate: string
  receiptUrl: string | null
  envelopeId: string | null
  approvalReason: string | null
  exceptionReason?: string | null
  resolvedAt?: string | null
  overrideJustification?: string | null
  resolutionNotes?: string | null
  category: {
    id: string
    name: string
    color?: string
  }
  validation?: {
    compliant: boolean
    violations?: any[]
  } | null
  creator: {
    id: string
    name: string
  }
  team: {
    id: string
    name: string
  }
  _count: {
    approvals: number
  }
}

interface PageProps {
  params: Promise<{
    associationId: string
  }>
}

// Helper function to format dates in UTC without timezone conversion
function formatUTCDate(dateString: string): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid date'

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ]
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()

  return `${monthNames[month]} ${day}, ${year}`
}

export default function AssociationTransactionsPage({ params }: PageProps) {
  const searchParams = useSearchParams()

  // Resolve async params
  const [associationId, setAssociationId] = useState<string | null>(null)

  // Data state
  const [items, setItems] = useState<Transaction[]>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  // Loading states
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  // Filter state (sent to server)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // UI state
  const [mounted, setMounted] = useState(false)

  // Transaction details drawer state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false)

  // Resolve async params
  useEffect(() => {
    async function loadParams() {
      const resolvedParams = await params
      setAssociationId(resolvedParams.associationId)
    }
    loadParams()
  }, [params])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Read categoryId from URL on mount
  useEffect(() => {
    if (searchParams) {
      const categoryId = searchParams.get('categoryId')
      setCategoryFilter(categoryId)
    }
  }, [searchParams])

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch initial transactions when filters change or teamIds change
  useEffect(() => {
    if (mounted && associationId) {
      fetchInitialTransactions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    statusFilter,
    typeFilter,
    categoryFilter,
    debouncedSearch,
    mounted,
    associationId,
    searchParams,
  ])

  // Fetch initial page (reset list)
  async function fetchInitialTransactions() {
    try {
      setLoading(true)
      setItems([])
      setNextCursor(null)

      const params = new URLSearchParams()
      params.append('limit', '50') // 50 items per page for association view

      // Read teamIds from URL (set by TeamFilter component)
      const teamIds = searchParams?.get('teamIds')
      if (teamIds) {
        params.append('teamIds', teamIds)
      }

      const backendStatus = mapUIFilterToBackendStatus(statusFilter)
      if (backendStatus) {
        params.append('status', backendStatus)
      }

      if (typeFilter !== 'all') {
        params.append('type', typeFilter.toUpperCase())
      }

      if (categoryFilter) {
        params.append('categoryId', categoryFilter)
      }

      if (debouncedSearch.trim()) {
        params.append('search', debouncedSearch.trim())
      }

      const res = await fetch(`/api/transactions?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const data = await res.json()
      setItems(data.items || [])
      setNextCursor(data.nextCursor || null)
      setTotalCount(data.totalCount || 0)

      if (data.items?.length > 0) {
        toast.success(`Loaded ${data.items.length} transactions`)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load transactions'
      toast.error(errorMsg)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  // Load more transactions using cursor
  async function loadMoreTransactions() {
    if (!nextCursor || loadingMore) return

    try {
      setLoadingMore(true)

      const params = new URLSearchParams()
      params.append('limit', '50')
      params.append('cursor', nextCursor)

      // Read teamIds from URL (set by TeamFilter component)
      const teamIds = searchParams?.get('teamIds')
      if (teamIds) {
        params.append('teamIds', teamIds)
      }

      const backendStatus = mapUIFilterToBackendStatus(statusFilter)
      if (backendStatus) {
        params.append('status', backendStatus)
      }

      if (typeFilter !== 'all') {
        params.append('type', typeFilter.toUpperCase())
      }

      if (categoryFilter) {
        params.append('categoryId', categoryFilter)
      }

      if (debouncedSearch.trim()) {
        params.append('search', debouncedSearch.trim())
      }

      const res = await fetch(`/api/transactions?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Failed to fetch more transactions')
      }

      const data = await res.json()
      setItems(prev => [...prev, ...(data.items || [])])
      setNextCursor(data.nextCursor || null)

      if (data.items?.length > 0) {
        toast.success(`Loaded ${data.items.length} more transactions`)
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load more transactions'
      toast.error(errorMsg)
    } finally {
      setLoadingMore(false)
    }
  }

  function handleRefresh() {
    toast.loading('Refreshing transactions...')
    fetchInitialTransactions().then(() => {
      toast.dismiss()
      toast.success('Transactions refreshed')
    })
  }

  function handleClearCategoryFilter() {
    setCategoryFilter(null)
    // Update URL to remove categoryId parameter
    const url = new URL(window.location.href)
    url.searchParams.delete('categoryId')
    window.history.replaceState({}, '', url.toString())
  }

  // Get the category name for the active filter
  const activeCategoryName = useMemo(() => {
    if (!categoryFilter || items.length === 0) return null
    const transaction = items.find(t => t.category.id === categoryFilter)
    return transaction?.category.name || null
  }, [categoryFilter, items])

  function getTransactionUIState(transaction: Transaction) {
    return mapTransactionToUIState(
      {
        status: transaction.status,
        validation: transaction.validation,
        exceptionReason: transaction.exceptionReason,
        resolvedAt: transaction.resolvedAt,
        categoryId: transaction.category?.id,
        receiptUrl: transaction.receiptUrl,
        amount: transaction.amount,
        type: transaction.type,
      },
      {
        receiptRequiredOver: 100, // Configure receipt requirement threshold
      }
    )
  }

  /**
   * Sanitize transaction description by removing approval-first language
   * This handles legacy data that may contain old semantics
   */
  function sanitizeDescription(description: string | null | undefined): string | null {
    if (!description) return null

    // Remove approval-first language patterns
    const approvalPatterns = [
      /\s*-?\s*pending\s+expense\s+awaiting\s+approval\s*/gi,
      /\s*-?\s*awaiting\s+approval\s*/gi,
      /\s*-?\s*pending\s+approval\s*/gi,
      /\s*-?\s*needs\s+approval\s*/gi,
      /\s*-?\s*requires\s+approval\s*/gi,
    ]

    let sanitized = description
    approvalPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '')
    })

    // Clean up any double spaces or leading/trailing spaces
    sanitized = sanitized.replace(/\s+/g, ' ').trim()

    // If the description is now empty or just punctuation, return null
    if (!sanitized || /^[\s\-,.:;]+$/.test(sanitized)) {
      return null
    }

    return sanitized
  }

  async function openTransactionDetails(transaction: Transaction) {
    setDetailsDrawerOpen(true)

    // Fetch full transaction details with review history
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
      setDetailsDrawerOpen(false)
    }
  }

  // Loading skeleton
  const LoadingSkeleton = () => (
    <Card className="shadow-card border-0">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 20 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )

  if (!associationId) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="text-navy mx-auto mb-4 h-12 w-12 animate-spin" />
          <p className="text-navy/60">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-navy p-6 text-white md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Transactions</h1>
            <p className="text-navy-light mt-1">
              View all transactions across teams
              {totalCount > 0 && ` (${totalCount} total)`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
              className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6 p-6 md:p-8">
        {/* Filters */}
        <Card className="shadow-card border-0">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Team Filter */}
              <div className="md:col-span-3">
                <TeamFilter />
              </div>

              {/* Status Filter Tabs */}
              <div className="md:col-span-3">
                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                  <TabsList className="grid w-full max-w-2xl grid-cols-5">
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="imported">Imported</TabsTrigger>
                    <TabsTrigger value="validated">Validated</TabsTrigger>
                    <TabsTrigger value="exceptions">Exceptions</TabsTrigger>
                    <TabsTrigger value="resolved">Resolved</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Type Filter */}
              <div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                  <Input
                    placeholder="Search vendor or description..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pr-10 pl-10"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute top-1/2 right-3 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Active Category Filter */}
            {categoryFilter && activeCategoryName && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-2 text-sm">
                <Info className="h-4 w-4 text-blue-600" />
                <span className="text-blue-900">
                  Category: <strong>{activeCategoryName}</strong>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCategoryFilter}
                  className="ml-auto h-6 px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && <LoadingSkeleton />}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <Card className="shadow-card border-0">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="mb-4 h-16 w-16 text-gray-300" />
              <h3 className="text-navy mb-2 text-lg font-semibold">No transactions found</h3>
              <p className="text-navy/60 mb-6 text-center">
                {searchQuery || categoryFilter
                  ? 'Try adjusting your filters or search query'
                  : 'No transactions available for the selected teams'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Transaction List */}
        {!loading && items.length > 0 && (
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-navy">Transactions</CardTitle>
              <CardDescription>
                Showing {items.length} of {totalCount} transaction{totalCount !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-navy/5 hover:bg-navy/5">
                      <TableHead className="text-navy font-semibold">Date</TableHead>
                      <TableHead className="text-navy font-semibold">Team</TableHead>
                      <TableHead className="text-navy font-semibold">Type</TableHead>
                      <TableHead className="text-navy font-semibold">Vendor</TableHead>
                      <TableHead className="text-navy font-semibold">Category</TableHead>
                      <TableHead className="text-navy text-right font-semibold">Amount</TableHead>
                      <TableHead className="text-navy font-semibold">Status</TableHead>
                      <TableHead className="text-navy font-semibold">Validation</TableHead>
                      <TableHead className="text-navy text-center font-semibold">Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(transaction => {
                      const uiState = getTransactionUIState(transaction)
                      return (
                        <TableRow
                          key={transaction.id}
                          className="hover:bg-navy/5 cursor-pointer"
                          onClick={() => openTransactionDetails(transaction)}
                        >
                          <TableCell className="text-navy/80 font-medium">
                            {formatUTCDate(transaction.transactionDate)}
                          </TableCell>
                          <TableCell className="text-navy/70">
                            {transaction.team?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                transaction.type === 'INCOME'
                                  ? 'bg-meadow/10 text-meadow border-meadow/30'
                                  : 'border-red-200 bg-red-50 text-red-700'
                              }
                            >
                              {transaction.type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="text-navy font-medium">{transaction.vendor}</div>
                              {sanitizeDescription(transaction.description) && (
                                <div className="text-navy/60 mt-0.5 text-sm">
                                  {sanitizeDescription(transaction.description)}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-navy/70">
                            {transaction.category?.name || (
                              <span className="text-amber-600 italic">Needs category</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={`font-semibold ${
                                transaction.type === 'INCOME' ? 'text-meadow' : 'text-red-600'
                              }`}
                            >
                              {transaction.type === 'INCOME' ? '+' : '-'}$
                              {parseFloat(transaction.amount).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={uiState.statusColor}>
                              {uiState.statusLabel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {uiState.validationState === 'exception' ? (
                              <Button
                                variant="link"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation()
                                  openTransactionDetails(transaction)
                                }}
                                className="text-navy hover:text-navy-dark flex h-auto items-center gap-1 p-0"
                              >
                                <span>{uiState.validationIcon}</span>
                                <Badge variant="outline" className={uiState.validationColor}>
                                  {uiState.validationLabel}
                                </Badge>
                              </Button>
                            ) : (
                              <div className="flex items-center gap-1">
                                <span>{uiState.validationIcon}</span>
                                <Badge variant="outline" className={uiState.validationColor}>
                                  {uiState.validationLabel}
                                </Badge>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {transaction.receiptUrl ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation()
                                  openTransactionDetails(transaction)
                                }}
                                className="text-navy hover:text-navy-dark"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            ) : (
                              <span className="text-navy/50 text-sm">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Load More Button */}
              {nextCursor && (
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={loadMoreTransactions}
                    disabled={loadingMore}
                    variant="outline"
                    size="lg"
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-2 h-4 w-4" />
                        Load more ({totalCount - items.length} remaining)
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* End of List Message */}
              {!nextCursor && items.length > 0 && totalCount > 50 && (
                <div className="text-navy/60 mt-6 text-center text-sm">
                  You&apos;ve reached the end of the list
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transaction Details Drawer */}
      <TransactionDetailsDrawer
        transaction={selectedTransaction}
        open={detailsDrawerOpen}
        onOpenChange={setDetailsDrawerOpen}
        isReadOnly={true}
      />
    </div>
  )
}
