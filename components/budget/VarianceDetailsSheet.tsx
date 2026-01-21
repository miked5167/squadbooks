/**
 * Variance Details Sheet Component
 *
 * Right-side drawer that shows variance details for a category,
 * including summary metrics and top transactions
 */

'use client'

import React, { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowRight, FileText, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { formatDate } from '@/lib/utils/formatters'

interface CategoryItem {
  categoryId: string
  categoryName: string
  budgeted: number
  spent: number
  remaining: number
  percentUsed: number
}

interface Transaction {
  id: string
  date: string
  merchant: string
  amount: number
  hasReceipt: boolean
  status: string
}

interface VarianceDetailsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: CategoryItem
}

export function VarianceDetailsSheet({ open, onOpenChange, category }: VarianceDetailsSheetProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const variance = category.budgeted - category.spent

  const formatCurrency = (amount: number): string => {
    return `$${amount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`
  }

  const formatVariance = (variance: number): string => {
    if (variance === 0) return '$0'
    const absValue = Math.abs(variance).toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    return variance > 0 ? `+$${absValue}` : `-$${absValue}`
  }

  const getVarianceColor = (variance: number): string => {
    if (variance > 0) return 'text-green-600'
    if (variance < 0) return 'text-red-600'
    return 'text-navy/60'
  }

  // Fetch transactions when sheet opens
  useEffect(() => {
    if (open && category.categoryId) {
      fetchTransactions()
    }
  }, [open, category.categoryId])

  async function fetchTransactions() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/budget/category/${category.categoryId}/variance`)

      if (!res.ok) {
        throw new Error('Failed to load transaction details')
      }

      const data = await res.json()
      setTransactions(data.transactions || [])
    } catch (err) {
      console.error('Failed to fetch variance transactions:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="text-navy">{category.categoryName} Variance</SheetTitle>
          <SheetDescription>Breakdown of spending and variance in this category</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border-navy/10 rounded-lg border bg-gray-50/50 p-4">
              <div className="text-navy/50 mb-1 text-xs font-medium">Allocated</div>
              <div className="text-navy text-lg font-semibold">
                {formatCurrency(category.budgeted)}
              </div>
            </div>

            <div className="border-navy/10 rounded-lg border bg-gray-50/50 p-4">
              <div className="text-navy/50 mb-1 text-xs font-medium">Actual</div>
              <div className="text-navy text-lg font-semibold">
                {formatCurrency(category.spent)}
              </div>
            </div>

            <div className="border-navy/10 rounded-lg border bg-gray-50/50 p-4">
              <div className="text-navy/50 mb-1 text-xs font-medium">Variance</div>
              <div className={cn('text-lg font-semibold', getVarianceColor(variance))}>
                {formatVariance(variance)}
              </div>
            </div>

            <div className="border-navy/10 rounded-lg border bg-gray-50/50 p-4">
              <div className="text-navy/50 mb-1 text-xs font-medium">% Used</div>
              <div className="text-navy text-lg font-semibold">
                {category.percentUsed.toFixed(1)}%
              </div>
            </div>
          </div>

          <Separator className="bg-navy/10" />

          {/* Top Transactions Section */}
          <div>
            <h3 className="text-navy mb-3 text-sm font-semibold">Top Transactions</h3>

            {loading && (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Error loading transactions</p>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {!loading && !error && transactions.length === 0 && (
              <div className="py-8 text-center">
                <div className="bg-navy/10 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
                  <FileText className="text-navy/40 h-6 w-6" />
                </div>
                <p className="text-navy/60 text-sm">
                  No transactions recorded for this category yet.
                </p>
              </div>
            )}

            {!loading && !error && transactions.length > 0 && (
              <div className="space-y-2">
                {transactions.map(transaction => (
                  <div
                    key={transaction.id}
                    className="border-navy/10 rounded-lg border p-3 transition-colors hover:bg-gray-50/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-navy truncate text-sm font-medium">
                          {transaction.merchant}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="text-navy/60 text-xs">{formatDate(transaction.date)}</p>
                          {transaction.hasReceipt ? (
                            <Badge
                              variant="secondary"
                              className="bg-green-100 text-xs text-green-800 hover:bg-green-100"
                            >
                              Receipt
                            </Badge>
                          ) : (
                            <Badge
                              variant="secondary"
                              className="bg-yellow-100 text-xs text-yellow-800 hover:bg-yellow-100"
                            >
                              No receipt
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <p className="text-navy text-sm font-semibold">
                          $
                          {transaction.amount.toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer CTA */}
          {!loading && !error && transactions.length > 0 && (
            <>
              <Separator className="bg-navy/10" />

              <div>
                <Button
                  variant="default"
                  className="bg-navy hover:bg-navy-medium w-full text-white"
                  asChild
                >
                  <Link href={`/transactions?categoryId=${category.categoryId}`}>
                    View All Transactions
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-navy/60 mt-2 text-center text-xs">
                  See complete transaction history for this category
                </p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
