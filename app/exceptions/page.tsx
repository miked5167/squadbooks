'use client'

import { useState, useMemo, useEffect } from 'react'
import { AppSidebar } from '@/components/app-sidebar'
import { MobileHeader } from '@/components/MobileHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { ExceptionFiltersToolbar } from '@/components/exceptions/ExceptionFiltersToolbar'
import { ExceptionTable } from '@/components/exceptions/ExceptionTable'
import { ExceptionDetailsDrawer } from '@/components/exceptions/ExceptionDetailsDrawer'
import { ExceptionAnalytics } from '@/components/exceptions/ExceptionAnalytics'
import { useExceptions } from '@/lib/hooks/use-exceptions'
import type { TransactionWithValidation } from '@/lib/types/exceptions'

type StatusTab = 'EXCEPTION' | 'IMPORTED' | 'VALIDATED' | 'RESOLVED'

export default function ExceptionsPage() {
  // Data fetching
  const { transactions, loading, refetch } = useExceptions()

  // UI state
  const [activeTab, setActiveTab] = useState<StatusTab>('EXCEPTION')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeTransaction, setActiveTransaction] = useState<TransactionWithValidation | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [severityFilter, setSeverityFilter] = useState<string[]>([])

  // Filter transactions by tab status
  const filteredByStatus = useMemo(() => {
    return transactions.filter((txn) => {
      if (activeTab === 'EXCEPTION') return txn.status === 'EXCEPTION'
      if (activeTab === 'IMPORTED') return txn.status === 'IMPORTED'
      if (activeTab === 'VALIDATED') return txn.status === 'VALIDATED'
      if (activeTab === 'RESOLVED') return txn.status === 'RESOLVED'
      return false
    })
  }, [transactions, activeTab])

  // Apply search and filters
  const filteredTransactions = useMemo(() => {
    let result = [...filteredByStatus]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (txn) =>
          txn.vendor.toLowerCase().includes(query) ||
          txn.description?.toLowerCase().includes(query) ||
          txn.category?.name.toLowerCase().includes(query)
      )
    }

    // Category filter
    if (categoryFilter.length > 0) {
      result = result.filter((txn) => txn.category && categoryFilter.includes(txn.category.name))
    }

    // Severity filter (for exceptions)
    if (severityFilter.length > 0 && activeTab === 'EXCEPTION') {
      result = result.filter((txn) => txn.exceptionSeverity && severityFilter.includes(txn.exceptionSeverity))
    }

    return result
  }, [filteredByStatus, searchQuery, categoryFilter, severityFilter, activeTab])

  // Count by status for tab badges
  const statusCounts = useMemo(() => {
    return {
      EXCEPTION: transactions.filter((t) => t.status === 'EXCEPTION').length,
      IMPORTED: transactions.filter((t) => t.status === 'IMPORTED').length,
      VALIDATED: transactions.filter((t) => t.status === 'VALIDATED').length,
      RESOLVED: transactions.filter((t) => t.status === 'RESOLVED').length,
    }
  }, [transactions])

  // Handlers
  const handleRowClick = (transaction: TransactionWithValidation) => {
    setActiveTransaction(transaction)
    setIsDrawerOpen(true)
  }

  const handleRefresh = async () => {
    await refetch()
  }

  // Auto-update activeTransaction when transactions list changes
  useEffect(() => {
    if (activeTransaction && transactions.length > 0) {
      const updated = transactions.find((t) => t.id === activeTransaction.id)
      if (updated && JSON.stringify(updated) !== JSON.stringify(activeTransaction)) {
        setActiveTransaction(updated)
      }
    }
  }, [transactions, activeTransaction])

  if (loading) {
    return (
      <div className="min-h-screen bg-cream">
        <MobileHeader>
          <AppSidebar />
        </MobileHeader>
        <AppSidebar />
        <main className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <MobileHeader>
        <AppSidebar />
      </MobileHeader>
      <AppSidebar />

      <main className="ml-0 lg:ml-64 px-4 py-6 pt-20 lg:pt-8 lg:px-8 lg:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-display-2 text-navy mb-2">Exceptions Inbox</h1>
          <p className="text-lg text-navy/70">
            Review transactions flagged by validation rules and resolve any issues
          </p>
        </div>

        {/* Main Grid - Analytics Sidebar + Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Analytics Sidebar - 4 cols on desktop */}
          <div className="lg:col-span-4 order-2 lg:order-1">
            <ExceptionAnalytics />
          </div>

          {/* Main Content - 8 cols on desktop */}
          <div className="lg:col-span-8 order-1 lg:order-2">
            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as StatusTab)} className="space-y-6">
          <TabsList className="bg-white border-0 shadow-card">
            <TabsTrigger value="EXCEPTION" className="relative">
              Exceptions
              {statusCounts.EXCEPTION > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                  {statusCounts.EXCEPTION}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="IMPORTED" className="relative">
              Imported
              {statusCounts.IMPORTED > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                  {statusCounts.IMPORTED}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="VALIDATED" className="relative">
              Validated
              {statusCounts.VALIDATED > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                  {statusCounts.VALIDATED}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
          </TabsList>

          {/* Filters */}
          <ExceptionFiltersToolbar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            severityFilter={severityFilter}
            onSeverityFilterChange={setSeverityFilter}
            showSeverityFilter={activeTab === 'EXCEPTION'}
            totalCount={filteredTransactions.length}
            transactions={transactions}
          />

          <TabsContent value="EXCEPTION" className="mt-0">
            {filteredTransactions.length === 0 ? (
              <Card className="border-0 shadow-card">
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-navy mb-2">No exceptions 🎉</h3>
                    <p className="text-navy/60">
                      All transactions passed validation rules
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ExceptionTable
                transactions={filteredTransactions}
                onRowClick={handleRowClick}
              />
            )}
          </TabsContent>

          <TabsContent value="IMPORTED" className="mt-0">
            {filteredTransactions.length === 0 ? (
              <Card className="border-0 shadow-card">
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertCircle className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-navy mb-2">No imported transactions</h3>
                    <p className="text-navy/60">
                      Transactions are automatically validated after import
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ExceptionTable
                transactions={filteredTransactions}
                onRowClick={handleRowClick}
              />
            )}
          </TabsContent>

          <TabsContent value="VALIDATED" className="mt-0">
            {filteredTransactions.length === 0 ? (
              <Card className="border-0 shadow-card">
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-navy mb-2">No validated transactions</h3>
                    <p className="text-navy/60">
                      Transactions that pass all validation rules will appear here
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ExceptionTable
                transactions={filteredTransactions}
                onRowClick={handleRowClick}
              />
            )}
          </TabsContent>

          <TabsContent value="RESOLVED" className="mt-0">
            {filteredTransactions.length === 0 ? (
              <Card className="border-0 shadow-card">
                <CardContent className="py-12">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-gray-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-navy mb-2">No resolved exceptions</h3>
                    <p className="text-navy/60">
                      Manually resolved exceptions will appear here
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ExceptionTable
                transactions={filteredTransactions}
                onRowClick={handleRowClick}
              />
            )}
          </TabsContent>
        </Tabs>
          </div>
        </div>
      </main>

      {/* Details Drawer */}
      <ExceptionDetailsDrawer
        transaction={activeTransaction}
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        onRefresh={handleRefresh}
      />
    </div>
  )
}
