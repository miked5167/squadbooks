'use client'

import { useState, useEffect } from 'react'
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
import { Plus, FileText, TrendingUp, ExternalLink, Loader2, Search, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      fetchTransactions()
    }
  }, [filter, mounted])

  useEffect(() => {
    filterTransactions()
  }, [transactions, typeFilter, searchQuery])

  async function fetchTransactions() {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.append('status', filter.toUpperCase())
      }

      const res = await fetch(`/api/transactions?${params.toString()}`)
      if (!res.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const data = await res.json()
      setTransactions(data.transactions || [])
      toast.success(`Loaded ${data.transactions?.length || 0} transactions`)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load transactions'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  function filterTransactions() {
    let filtered = [...transactions]

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

  function handleRefresh() {
    toast.loading('Refreshing transactions...')
    fetchTransactions().then(() => {
      toast.dismiss()
      toast.success('Transactions refreshed')
    })
  }

  function getStatusBadge(status: string) {
    const variants = {
      DRAFT: { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-700' },
      PENDING: { variant: 'outline' as const, className: 'bg-golden/10 text-golden border-golden/30' },
      APPROVED: { variant: 'outline' as const, className: 'bg-meadow/10 text-meadow border-meadow/30' },
      REJECTED: { variant: 'outline' as const, className: 'bg-red-100 text-red-700 border-red-300' },
    }
    return variants[status as keyof typeof variants] || variants.DRAFT
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
              <Link href="/payments/new">
                <Plus className="mr-2 w-4 h-4" />
                New Payment
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
                  ? 'Get started by creating your first expense or payment'
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
                    <Link href="/payments/new">
                      <Plus className="mr-2 w-4 h-4" />
                      New Payment
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
                      <TableHead className="font-semibold text-navy">Date</TableHead>
                      <TableHead className="font-semibold text-navy">Type</TableHead>
                      <TableHead className="font-semibold text-navy">Vendor</TableHead>
                      <TableHead className="font-semibold text-navy">Category</TableHead>
                      <TableHead className="font-semibold text-navy text-right">Amount</TableHead>
                      <TableHead className="font-semibold text-navy">Status</TableHead>
                      <TableHead className="font-semibold text-navy">Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => {
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
                              <a
                                href={transaction.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-navy hover:text-navy-medium transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                                <span className="text-sm">View</span>
                              </a>
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
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
