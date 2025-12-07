'use client'

/**
 * Transaction Review Modal Component
 * Modal for reviewing and editing DRAFT transactions (typically imported from Plaid)
 * Allows users to edit category, vendor, description, and approve the transaction
 */

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'

interface Transaction {
  id: string
  type: 'INCOME' | 'EXPENSE'
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'
  amount: string
  vendor: string
  description: string | null
  transactionDate: string
  category: {
    id: string
    name: string
    heading: string
  }
  // Plaid metadata
  plaidTransactionId?: string | null
  categoryConfidence?: number | null
  isImported?: boolean
  importSource?: string | null
}

interface Category {
  id: string
  name: string
  heading: string
}

interface TransactionReviewModalProps {
  transaction: Transaction | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete: () => void
}

export function TransactionReviewModal({
  transaction,
  open,
  onOpenChange,
  onComplete,
}: TransactionReviewModalProps) {
  const [vendor, setVendor] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)

  // Load categories on mount
  useEffect(() => {
    if (open) {
      fetchCategories()
    }
  }, [open])

  // Initialize form when transaction changes
  useEffect(() => {
    if (transaction) {
      setVendor(transaction.vendor)
      setDescription(transaction.description || '')
      setCategoryId(transaction.category.id)
    }
  }, [transaction])

  async function fetchCategories() {
    try {
      setLoadingCategories(true)
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to fetch categories')
      const data = await res.json()
      setCategories(data.categories || [])
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      toast.error('Failed to load categories')
    } finally {
      setLoadingCategories(false)
    }
  }

  async function handleApprove() {
    if (!transaction) return

    if (!vendor.trim()) {
      toast.error('Vendor is required')
      return
    }

    if (!categoryId) {
      toast.error('Category is required')
      return
    }

    try {
      setLoading(true)

      // Update the transaction
      const updateRes = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendor: vendor.trim(),
          description: description.trim() || null,
          categoryId,
          status: 'PENDING_APPROVAL', // Move to pending approval state
        }),
      })

      if (!updateRes.ok) {
        const error = await updateRes.json()
        throw new Error(error.error || 'Failed to update transaction')
      }

      toast.success('Transaction approved and submitted for approval')
      onComplete()
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to approve transaction'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  function getConfidenceBadge(confidence: number | null | undefined) {
    if (!confidence) return null

    if (confidence >= 90) {
      return (
        <Badge variant="outline" className="bg-meadow/10 text-meadow border-meadow/30 text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          High Confidence
        </Badge>
      )
    } else if (confidence >= 70) {
      return (
        <Badge variant="secondary" className="text-xs">
          <AlertCircle className="w-3 h-3 mr-1" />
          Medium Confidence
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="text-xs text-gray-600">
          <AlertCircle className="w-3 h-3 mr-1" />
          Low Confidence
        </Badge>
      )
    }
  }

  if (!transaction) return null

  const amount = parseFloat(transaction.amount)
  const transactionDate = new Date(transaction.transactionDate)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Transaction</DialogTitle>
          <DialogDescription>
            Review and edit this imported transaction before approving it
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Transaction Info */}
          <div className="rounded-lg bg-navy/5 p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-navy/60">Amount</span>
              <span className={`font-semibold text-lg ${transaction.type === 'INCOME' ? 'text-meadow' : 'text-red-600'}`}>
                {transaction.type === 'INCOME' ? '+' : '-'}${amount.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-navy/60">Date</span>
              <span className="text-sm text-navy">
                {transactionDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            {transaction.isImported && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-navy/60">Source</span>
                <Badge variant="outline" className="text-xs">
                  {transaction.importSource}
                </Badge>
              </div>
            )}
          </div>

          {/* AI Category Suggestion */}
          {transaction.categoryConfidence && (
            <div className="rounded-lg bg-meadow/5 border border-meadow/20 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-navy">AI Category Suggestion</span>
                {getConfidenceBadge(transaction.categoryConfidence)}
              </div>
              <p className="text-sm text-navy/70">
                {transaction.category.heading} → {transaction.category.name}
              </p>
            </div>
          )}

          {/* Editable Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="vendor">
                Vendor <span className="text-red-500">*</span>
              </Label>
              <Input
                id="vendor"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="Enter vendor name"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description (optional)"
                rows={3}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category">
                Category <span className="text-red-500">*</span>
              </Label>
              {loadingCategories ? (
                <div className="mt-1 h-10 border rounded-md flex items-center px-3 text-sm text-muted-foreground">
                  Loading categories...
                </div>
              ) : (
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.heading} → {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            disabled={loading || !vendor.trim() || !categoryId}
            className="bg-meadow hover:bg-meadow/90 text-white"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 w-4 h-4" />
                Approve & Submit
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
