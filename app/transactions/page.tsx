'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AppNav } from '@/components/app-nav'
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
import { Plus, FileText, ExternalLink, Loader2, Search, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, X, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { ReceiptViewer } from '@/components/ReceiptViewer'

interface Transaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
  amount: string
  vendor: string
  description: string | null
  transactionDate: string
  receiptUrl: string | null
  category: {
    id: string
    name: string
    heading: string
  }
  creator: {
    id: string
    name: string
    role: string
  }
}

type SortKey = 'date' | 'amount' | 'vendor' | 'category' | 'status' | null
type SortDirection = 'asc' | 'desc'

export default function TransactionsPage() {
  const searchParams = useSearchParams()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [perPage] = useState(50)

  // Receipt viewer state
  const [selectedReceipt, setSelectedReceipt] = useState<{
    url: string
    vendor: string
    id: string
  } | null>(null)

  // Sort state - default to date descending (newest first)
  const [sortConfig, setSortConfig] = useState<{
    key: SortKey
    direction: SortDirection
  }>({
    key: 'date',
    direction: 'desc',
  })

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

  useEffect(() => {
    if (mounted) {
      setCurrentPage(1) // Reset to page 1 when filter changes
      fetchTransactions(1)
    }
  }, [filter, mounted])

  useEffect(() => {
    if (mounted) {
      fetchTransactions(currentPage)
    }
  }, [currentPage])

  useEffect(() => {
    filterTransactions()
  }, [transactions, typeFilter, categoryFilter, searchQuery])

  async function fetchTransactions(page: number = currentPage) {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('status', filter.toUpperCase())
      }
      params.append('page', page.toString())
      params.append('perPage', perPage.toString())

      const res = await fetch(`/api/transactions?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const data = await res.json()
      setTransactions(data.transactions || [])
      setTotalPages(data.totalPages || 1)
      setTotalCount(data.totalCount || 0)
      setCurrentPage(data.currentPage || 1)
      toast.success(`Loaded ${data.transactions?.length || 0} of ${data.totalCount || 0} transactions`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load transactions'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  function filterTransactions() {
    let filtered = [...transactions]

    // Filter by category
    if (categoryFilter) {
      filtered = filtered.filter((t) => t.category.id === categoryFilter)
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter((t) => t.type === typeFilter.toUpperCase())
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (t) =>
          t.vendor.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query) ||
          t.category.name.toLowerCase().includes(query)
      )
    }

    setFilteredTransactions(filtered)
  }

  // Sort handler - toggles direction or switches column
  function handleSort(key: SortKey) {
    setSortConfig((prev) => {
      // If clicking the same column, toggle direction
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        }
      }
      // If clicking a new column, sort ascending by default (except date which defaults to desc)
      return {
        key,
        direction: key === 'date' ? 'desc' : 'asc',
      }
    })
  }

  // Apply sorting to filtered transactions
  const sortedTransactions = useMemo(() => {
    if (!sortConfig.key) return filteredTransactions

    return [...filteredTransactions].sort((a, b) => {
      let compareResult = 0

      switch (sortConfig.key) {
        case 'date':
          // Sort by transaction date
          const dateA = new Date(a.transactionDate).getTime()
          const dateB = new Date(b.transactionDate).getTime()
          compareResult = dateA - dateB
          break

        case 'amount':
          // Sort by absolute value (ignore +/- sign for income vs expense)
          const amountA = Math.abs(parseFloat(a.amount))
          const amountB = Math.abs(parseFloat(b.amount))
          compareResult = amountA - amountB
          break

        case 'vendor':
          // Alphabetical, case-insensitive
          compareResult = a.vendor.localeCompare(b.vendor, undefined, {
            sensitivity: 'base',
          })
          break

        case 'category':
          // Alphabetical by category name, case-insensitive
          compareResult = a.category.name.localeCompare(b.category.name, undefined, {
            sensitivity: 'base',
          })
          break

        case 'status':
          // Priority order: PENDING > DRAFT > APPROVED > REJECTED
          const statusOrder: Record<string, number> = {
            PENDING: 1,
            DRAFT: 2,
            APPROVED: 3,
            REJECTED: 4,
          }
          compareResult = statusOrder[a.status] - statusOrder[b.status]
          break

        default:
          compareResult = 0
      }

      // Apply sort direction
      return sortConfig.direction === 'asc' ? compareResult : -compareResult
    })
  }, [filteredTransactions, sortConfig])

  function handleRefresh() {
    toast.loading('Refreshing transactions...')
    fetchTransactions(currentPage).then(() => {
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
    if (!categoryFilter || transactions.length === 0) return null
    const transaction = transactions.find((t) => t.category.id === categoryFilter)
    return transaction?.category.name || null
  }, [categoryFilter, transactions])

  function getStatusBadge(status: string) {
    const variants = {
      DRAFT: { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-700' },
      PENDING: { variant: 'outline' as const, className: 'bg-golden/10 text-golden border-golden/30' },
      APPROVED: { variant: 'outline' as const, className: 'bg-meadow/10 text-meadow border-meadow/30' },
      REJECTED: { variant: 'outline' as const, className: 'bg-red-100 text-red-700 border-red-300' },
    }
    return variants[status as keyof typeof variants] || variants.DRAFT
  }

  // Render sort icon based on current sort state
  function renderSortIcon(columnKey: SortKey) {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="w-4 h-4 text-navy" />
    ) : (
      <ArrowDown className="w-4 h-4 text-navy" />
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <AppNav />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-display-2 text-navy mb-2">Transactions</h1>
            <p className="text-lg text-navy/70">View and manage all financial transactions</p>
          </div>
          <div className="flex gap-3">
            <Button asChild className="bg-meadow hover:bg-meadow/90 text-white">
              <Link href="/expenses/new">
                <Plus className="mr-2 w-4 h-4" />
                New Expense
              </Link>
            </Button>
            <Button asChild className="bg-golden hover:bg-golden/90 text-navy">
              <Link href="/income/new">
                <Plus className="mr-2 w-4 h-4" />
                New Income
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-0 shadow-card mb-6">
          <CardContent className="pt-6 space-y-4">
            {/* Status Tabs */}
            {mounted ? (
              <Tabs value={filter} onValueChange={setFilter} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="approved">Approved</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="draft">Draft</TabsTrigger>
                </TabsList>
              </Tabs>
            ) : (
              <div className="h-9 flex items-center text-sm text-muted-foreground">
                Loading filters...
              </div>
            )}

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy/40" />
                <Input
                  type="text"
                  placeholder="Search by vendor, description, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Type Filter */}
              {mounted ? (
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="expense">Expenses</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="h-9 w-full sm:w-[180px] rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground flex items-center">
                  Loading...
                </div>
              )}

              {/* Refresh Button */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={loading}
                className="shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {/* Active Category Filter Chip */}
            {categoryFilter && activeCategoryName && (
              <div className="flex items-center gap-2 pt-2">
                <span className="text-sm text-navy/60">Filtered by category:</span>
                <Badge
                  variant="outline"
                  className="bg-navy/5 text-navy border-navy/20 gap-2 pr-1"
                >
                  {activeCategoryName}
                  <button
                    onClick={handleClearCategoryFilter}
                    className="ml-1 rounded-full hover:bg-navy/10 p-0.5 transition-colors"
                    aria-label="Clear category filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <Card className="border-0 shadow-card">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-12 h-12 text-navy animate-spin mb-4" />
              <p className="text-navy/70">Loading transactions...</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!loading && filteredTransactions.length === 0 && (
          <Card className="border-0 shadow-card">
            <CardContent className="text-center py-16">
              <div className="w-16 h-16 bg-navy/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-navy/40" />
              </div>
              <CardTitle className="text-navy mb-2">No transactions found</CardTitle>
              <CardDescription className="mb-6 max-w-sm mx-auto">
                {transactions.length === 0
                  ? 'Get started by creating your first expense or income'
                  : 'No transactions match your current filters'}
              </CardDescription>
              {transactions.length === 0 ? (
                <div className="flex gap-3 justify-center">
                  <Button asChild className="bg-meadow hover:bg-meadow/90 text-white">
                    <Link href="/expenses/new">
                      <Plus className="mr-2 w-4 h-4" />
                      New Expense
                    </Link>
                  </Button>
                  <Button asChild className="bg-golden hover:bg-golden/90 text-navy">
                    <Link href="/income/new">
                      <Plus className="mr-2 w-4 h-4" />
                      New Income
                    </Link>
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('')
                    setTypeFilter('all')
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Transaction List */}
        {!loading && filteredTransactions.length > 0 && (
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-navy">All Transactions</CardTitle>
              <CardDescription>
                Showing {filteredTransactions.length} of {transactions.length} transaction
                {transactions.length !== 1 ? 's' : ''}
                {searchQuery && ` matching "${searchQuery}"`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-navy/5 hover:bg-navy/5">
                      {/* Date Column - Sortable */}
                      <TableHead className="font-semibold text-navy">
                        <button
                          onClick={() => handleSort('date')}
                          className="flex items-center gap-1.5 hover:bg-gray-100 rounded px-2 py-1.5 -mx-2 -my-1.5 transition-colors cursor-pointer"
                          aria-label="Sort by date"
                        >
                          <span>Date</span>
                          {renderSortIcon('date')}
                        </button>
                      </TableHead>

                      {/* Type Column - Not Sortable */}
                      <TableHead className="font-semibold text-navy">Type</TableHead>

                      {/* Vendor Column - Sortable */}
                      <TableHead className="font-semibold text-navy">
                        <button
                          onClick={() => handleSort('vendor')}
                          className="flex items-center gap-1.5 hover:bg-gray-100 rounded px-2 py-1.5 -mx-2 -my-1.5 transition-colors cursor-pointer"
                          aria-label="Sort by vendor"
                        >
                          <span>Vendor</span>
                          {renderSortIcon('vendor')}
                        </button>
                      </TableHead>

                      {/* Category Column - Sortable */}
                      <TableHead className="font-semibold text-navy">
                        <button
                          onClick={() => handleSort('category')}
                          className="flex items-center gap-1.5 hover:bg-gray-100 rounded px-2 py-1.5 -mx-2 -my-1.5 transition-colors cursor-pointer"
                          aria-label="Sort by category"
                        >
                          <span>Category</span>
                          {renderSortIcon('category')}
                        </button>
                      </TableHead>

                      {/* Amount Column - Sortable */}
                      <TableHead className="font-semibold text-navy text-right">
                        <button
                          onClick={() => handleSort('amount')}
                          className="flex items-center gap-1.5 justify-end hover:bg-gray-100 rounded px-2 py-1.5 -mx-2 -my-1.5 transition-colors cursor-pointer ml-auto"
                          aria-label="Sort by amount"
                        >
                          <span>Amount</span>
                          {renderSortIcon('amount')}
                        </button>
                      </TableHead>

                      {/* Status Column - Sortable */}
                      <TableHead className="font-semibold text-navy">
                        <button
                          onClick={() => handleSort('status')}
                          className="flex items-center gap-1.5 hover:bg-gray-100 rounded px-2 py-1.5 -mx-2 -my-1.5 transition-colors cursor-pointer"
                          aria-label="Sort by status"
                        >
                          <span>Status</span>
                          {renderSortIcon('status')}
                        </button>
                      </TableHead>

                      {/* Receipt Column - Not Sortable */}
                      <TableHead className="font-semibold text-navy text-center">Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTransactions.map((transaction) => {
                      const statusBadge = getStatusBadge(transaction.status)
                      return (
                        <TableRow key={transaction.id} className="hover:bg-navy/5">
                          <TableCell className="font-medium text-navy/80">
                            {new Date(transaction.transactionDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
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
                              {transaction.description && (
                                <div className="text-sm text-navy/60 mt-0.5">
                                  {transaction.description}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-navy/70">{transaction.category.name}</TableCell>
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
                            <Badge variant={statusBadge.variant} className={statusBadge.className}>
                              {transaction.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {transaction.receiptUrl ? (
                              <button
                                onClick={() =>
                                  setSelectedReceipt({
                                    url: transaction.receiptUrl!,
                                    vendor: transaction.vendor,
                                    id: transaction.id,
                                  })
                                }
                                className="inline-flex items-center gap-1 text-navy hover:text-navy-medium transition-colors hover:underline"
                              >
                                <Eye className="w-4 h-4" />
                                <span className="text-sm">View</span>
                              </button>
                            ) : (
                              <span className="text-navy/30 text-sm">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages} ({totalCount} total transactions)
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || loading}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
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
    </div>
  )
}
