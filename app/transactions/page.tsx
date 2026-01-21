'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileHeader } from '@/components/MobileHeader'
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
import { Plus, FileText, Loader2, Search, RefreshCw, X, Eye, ChevronDown, Info } from 'lucide-react'
import { toast } from 'sonner'
import { ReceiptViewer } from '@/components/ReceiptViewer'
import { TransactionDetailsDrawer } from '@/components/transactions/transaction-details-drawer'
import { Skeleton } from '@/components/ui/skeleton'
import { usePermissions } from '@/lib/hooks/use-permissions'
import { Permission } from '@/lib/permissions/permissions'
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
  _count: {
    approvals: number
  }
}

// Helper function to format dates in UTC without timezone conversion
function formatUTCDate(dateString: string): string {
  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid date'

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const day = date.getUTCDate()

  return `${monthNames[month]} ${day}, ${year}`
}

export default function TransactionsPage() {
  const searchParams = useSearchParams()
  const { hasPermission, isTreasurer } = usePermissions()

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

  // Receipt viewer state
  const [selectedReceipt, setSelectedReceipt] = useState<{
    url: string
    vendor: string
    id: string
  } | null>(null)

  // Transaction details drawer state
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [detailsDrawerOpen, setDetailsDrawerOpen] = useState(false)
  const [canEditTransaction, setCanEditTransaction] = useState(false)

  // Check permissions
  const canCreateTransaction = hasPermission(Permission.CREATE_TRANSACTION)

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

  // Fetch initial transactions when filters change
  useEffect(() => {
    if (mounted) {
      fetchInitialTransactions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, typeFilter, categoryFilter, debouncedSearch, mounted])

  // Fetch initial page (reset list)
  async function fetchInitialTransactions() {
    try {
      setLoading(true)
      setItems([])
      setNextCursor(null)

      const params = new URLSearchParams()
      params.append('limit', '20')

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
      params.append('limit', '20')
      params.append('cursor', nextCursor)

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
      setItems((prev) => [...prev, ...(data.items || [])])
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
    const transaction = items.find((t) => t.category.id === categoryFilter)
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

  function openReceiptViewer(transaction: Transaction) {
    if (transaction.receiptUrl) {
      setSelectedReceipt({
        url: transaction.receiptUrl,
        vendor: transaction.vendor,
        id: transaction.id,
      })
    }
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
      setCanEditTransaction(data.canEdit ?? false)
    } catch (error) {
      console.error('Error fetching transaction details:', error)
      toast.error('Failed to load transaction details')
      setDetailsDrawerOpen(false)
    }
  }

  // Loading skeleton
  const LoadingSkeleton = () => (
    <Card className="border-0 shadow-card">
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto lg:ml-64">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-40 bg-background border-b border-border">
          <MobileHeader />
        </div>

        {/* Header */}
        <div className="bg-navy text-white p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Transactions</h1>
              <p className="text-navy-light mt-1">
                View and manage all income and expenses
                {totalCount > 0 && ` (${totalCount} total)`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="bg-white/10 hover:bg-white/20 text-white border-white/30"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {canCreateTransaction && (
                <>
                  <Button asChild size="sm" className="bg-navy-light hover:bg-navy-lighter">
                    <Link href="/expenses/new">
                      <Plus className="mr-2 w-4 h-4" />
                      New Expense
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                    <Link href="/income/new">
                      <Plus className="mr-2 w-4 h-4" />
                      New Income
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Filters */}
          <Card className="border-0 shadow-card">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter Tabs */}
                <div className="md:col-span-3">
                  <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                    <TabsList className="grid grid-cols-5 w-full max-w-2xl">
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
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search vendor or description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        aria-label="Clear search"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>


              {/* Active Category Filter */}
              {categoryFilter && activeCategoryName && (
                <div className="flex items-center gap-2 p-2 mt-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-900">
                    Category: <strong>{activeCategoryName}</strong>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearCategoryFilter}
                    className="ml-auto h-6 px-2"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loading State */}
          {loading && <LoadingSkeleton />}

          {/* Empty State */}
          {!loading && items.length === 0 && (
            <Card className="border-0 shadow-card">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-navy mb-2">No transactions found</h3>
                <p className="text-navy/60 text-center mb-6">
                  {searchQuery || categoryFilter
                    ? 'Try adjusting your filters or search query'
                    : 'Get started by creating your first transaction'}
                </p>
                {canCreateTransaction && (
                  <div className="flex gap-2">
                    <Button asChild className="bg-navy hover:bg-navy-dark">
                      <Link href="/expenses/new">
                        <Plus className="mr-2 w-4 h-4" />
                        New Expense
                      </Link>
                    </Button>
                    <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
                      <Link href="/income/new">
                        <Plus className="mr-2 w-4 h-4" />
                        New Income
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Transaction List */}
          {!loading && items.length > 0 && (
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle className="text-navy">Transactions</CardTitle>
                <CardDescription>
                  Showing {items.length} of {totalCount} transaction{totalCount !== 1 ? 's' : ''}
                  {searchQuery && ` matching "${searchQuery}"`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-navy/5 hover:bg-navy/5">
                        <TableHead className="font-semibold text-navy">Date</TableHead>
                        <TableHead className="font-semibold text-navy">Type</TableHead>
                        <TableHead className="font-semibold text-navy">Vendor</TableHead>
                        <TableHead className="font-semibold text-navy">Category</TableHead>
                        <TableHead className="font-semibold text-navy text-right">Amount</TableHead>
                        <TableHead className="font-semibold text-navy">Status</TableHead>
                        <TableHead className="font-semibold text-navy">Validation</TableHead>
                        <TableHead className="font-semibold text-navy text-center">Receipt</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((transaction) => {
                        const uiState = getTransactionUIState(transaction)
                        return (
                          <TableRow
                            key={transaction.id}
                            className="hover:bg-navy/5 cursor-pointer"
                            onClick={() => openTransactionDetails(transaction)}
                          >
                            <TableCell className="font-medium text-navy/80">
                              {formatUTCDate(transaction.transactionDate)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  transaction.type === 'INCOME'
                                    ? 'bg-meadow/10 text-meadow border-meadow/30'
                                    : 'bg-red-50 text-red-700 border-red-200'
                                }
                              >
                                {transaction.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium text-navy">{transaction.vendor}</div>
                                {sanitizeDescription(transaction.description) && (
                                  <div className="text-sm text-navy/60 mt-0.5">
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
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openTransactionDetails(transaction)
                                  }}
                                  className="text-navy hover:text-navy-dark p-0 h-auto flex items-center gap-1"
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
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openReceiptViewer(transaction)
                                  }}
                                  className="text-navy hover:text-navy-dark"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              ) : (
                                <span className="text-sm text-navy/50">-</span>
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
                  <div className="flex justify-center mt-6">
                    <Button
                      onClick={loadMoreTransactions}
                      disabled={loadingMore}
                      variant="outline"
                      size="lg"
                    >
                      {loadingMore ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          Load more ({totalCount - items.length} remaining)
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* End of List Message */}
                {!nextCursor && items.length > 0 && totalCount > 20 && (
                  <div className="text-center mt-6 text-sm text-navy/60">
                    You&apos;ve reached the end of the list
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Receipt Viewer Modal */}
      {selectedReceipt && (
        <ReceiptViewer
          isOpen={!!selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          receiptUrl={selectedReceipt.url}
          transactionVendor={selectedReceipt.vendor}
          transactionId={selectedReceipt.id}
        />
      )}

      {/* Transaction Details Drawer */}
      <TransactionDetailsDrawer
        transaction={selectedTransaction}
        open={detailsDrawerOpen}
        onOpenChange={setDetailsDrawerOpen}
        canEdit={canEditTransaction}
      />
    </div>
  )
}
